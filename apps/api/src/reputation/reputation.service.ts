
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';

interface RatingsByCategory {
  [categoryId: string]: {
    categoryName: string;
    averageRating: number;
    totalReviews: number;
  };
}

interface ReputationScores {
  globalRating: number;
  totalJobsAsWorker: number;
  ratingsByCategory: RatingsByCategory;
  ratingAsClient: number;
  totalReviewsAsClient: number;
  acceptanceRate: number;
  cancellationRate: number;
}

export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    private prisma: PrismaService,
    private configService: AppConfigService
  ) {}

  /**
   * Procesa una acción para el trabajador y actualiza su plan si corresponde.
   */
  async processAction(workerId: string, actionKey: string): Promise<void> {
    const pointsDelta = await this.configService.getReputationPoints(actionKey);
    const worker = await (this.prisma as any).workerProfile.findUnique({ where: { id: workerId } });
    if (!worker) return;

    const newPoints = Math.max(0, worker.reputationPoints + pointsDelta);
    
    // Determine new plan with Hysteresis (10% grace for downgrades)
    const newPlanConfig = await this.configService.determineBestPlan(newPoints, 'WORKER');
    const newPlanCode = newPlanConfig.code;
    const currentPlanCode = worker.currentPlan;

    await (this.prisma as any).workerProfile.update({
        where: { id: workerId },
        data: {
            reputationPoints: newPoints,
            currentPlan: newPlanCode,
        }
    });

    this.logAndAuditReputation(worker.name, 'WORKER', actionKey, pointsDelta, currentPlanCode, newPlanCode);
  }

  /**
   * Procesa una acción para el cliente y actualiza su plan si corresponde.
   */
  async processClientAction(clientId: string, actionKey: string): Promise<void> {
      const pointsDelta = await this.configService.getReputationPoints(actionKey);
      const client = await (this.prisma as any).clientProfile.findUnique({ where: { id: clientId } });
      if (!client) return;

      const newPoints = Math.max(0, client.reputationPoints + pointsDelta);
      const newPlanConfig = await this.configService.determineBestPlan(newPoints, 'CLIENT');
      const newPlanCode = newPlanConfig.code;
      const currentPlanCode = client.currentPlan;

      await (this.prisma as any).clientProfile.update({
          where: { id: clientId },
          data: {
              reputationPoints: newPoints,
              currentPlan: newPlanCode
          }
      });

      this.logAndAuditReputation(client.name, 'CLIENT', actionKey, pointsDelta, currentPlanCode, newPlanCode);
  }

  /**
   * Maneja el impacto en reputación tras resolver una disputa.
   */
  async resolveDisputeReputation(jobId: string, resolution: string): Promise<void> {
      const job = await (this.prisma as any).serviceRequest.findUnique({ 
          where: { id: jobId },
          include: { worker: true, client: true }
      });
      if (!job) return;

      switch(resolution) {
          case 'FULL_REFUND': // Culpa del trabajador
              await this.processAction(job.workerId, 'DISPUTE_LOST_WORKER_FAULT');
              break;
          case 'FULL_PAYMENT': // Intento de fraude del cliente o trabajo ok
              await this.processClientAction(job.clientId, 'DISPUTE_INVALID_CLIENT_REPORT');
              await this.processAction(job.workerId, 'DISPUTE_WON_WORKER');
              break;
          case 'PARTIAL_REFUND': // Fallas leves en ambos o falta de acuerdo
              await this.processAction(job.workerId, 'DISPUTE_LOST_WORKER_FAULT');
              // Penalización menor amortizada
              break;
      }
  }

  // ============================================
  // RATING CALCULATION (Multi-Identity System)
  // ============================================

  /**
   * Calculate comprehensive reputation scores for a worker
   * Includes global rating, category-specific ratings, and client rating
   */
  async calculateWorkerReputation(workerId: string): Promise<ReputationScores> {
    // Get worker profile
    const worker = await this.prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: {
        user: true,
        reviewsReceived: {
          include: {
            category: true,
          },
        },
        serviceRequests: {
          where: {
            status: { in: ['COMPLETED', 'CANCELLED'] },
          },
        },
      },
    });

    if (!worker) {
      throw new Error('Worker profile not found');
    }

    // Calculate global rating as worker
    const reviewsAsWorker = worker.reviewsReceived || [];
    const globalRating = this.calculateAverageRating(
      reviewsAsWorker.map(r => r.rating)
    );

    // Calculate ratings by category
    const ratingsByCategory: RatingsByCategory = {};
    
    for (const review of reviewsAsWorker) {
      if (review.categoryId && review.category) {
        if (!ratingsByCategory[review.categoryId]) {
          ratingsByCategory[review.categoryId] = {
            categoryName: review.category.name,
            averageRating: 0,
            totalReviews: 0,
          };
        }
      }
    }

    // Calculate average for each category
    for (const categoryId in ratingsByCategory) {
      const categoryReviews = reviewsAsWorker.filter(
        r => r.categoryId === categoryId
      );
      ratingsByCategory[categoryId].averageRating = this.calculateAverageRating(
        categoryReviews.map(r => r.rating)
      );
      ratingsByCategory[categoryId].totalReviews = categoryReviews.length;
    }

    // Get reviews given by this user (as client)
    const reviewsAsClient = await this.prisma.review.findMany({
      where: {
        authorId: workerId,
      },
    });

    const ratingAsClient = this.calculateAverageRating(
      reviewsAsClient.map(r => r.rating)
    );

    // Calculate performance metrics
    const totalJobsOffered = worker.serviceRequests.length;
    const acceptedJobs = worker.serviceRequests.filter(
      sr => ['ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(sr.status)
    ).length;
    const cancelledJobs = worker.serviceRequests.filter(
      sr => sr.status === 'CANCELLED'
    ).length;

    const acceptanceRate = totalJobsOffered > 0 
      ? acceptedJobs / totalJobsOffered 
      : 1.0;
    
    const cancellationRate = totalJobsOffered > 0
      ? cancelledJobs / totalJobsOffered
      : 0.0;

    return {
      globalRating,
      totalJobsAsWorker: worker.totalJobs,
      ratingsByCategory,
      ratingAsClient,
      totalReviewsAsClient: reviewsAsClient.length,
      acceptanceRate,
      cancellationRate,
    };
  }

  /**
   * Update worker profile with calculated reputation scores
   */
  async updateWorkerReputationScores(workerId: string): Promise<void> {
    const scores = await this.calculateWorkerReputation(workerId);

    await this.prisma.workerProfile.update({
      where: { id: workerId },
      data: {
        rating: scores.globalRating,
        acceptanceRate: scores.acceptanceRate,
        cancellationRate: scores.cancellationRate,
      },
    });
  }

  /**
   * Calculate rating for a specific category and worker
   */
  async getWorkerRatingForCategory(
    workerId: string,
    categoryId: string
  ): Promise<{ averageRating: number; totalReviews: number }> {
    const reviews = await this.prisma.review.findMany({
      where: {
        targetId: workerId,
        categoryId: categoryId,
      },
    });

    return {
      averageRating: this.calculateAverageRating(reviews.map(r => r.rating)),
      totalReviews: reviews.length,
    };
  }

  /**
   * Calculate client rating (reviews they've given)
   */
  async getClientRating(userId: string): Promise<{
    averageRating: number;
    totalReviews: number;
  }> {
    // Get worker profile to access reviews given
    const worker = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });

    if (!worker) {
      return { averageRating: 5.0, totalReviews: 0 };
    }

    const reviewsAsClient = await this.prisma.review.findMany({
      where: {
        authorId: worker.id,
      },
    });

    return {
      averageRating: this.calculateAverageRating(
        reviewsAsClient.map(r => r.rating)
      ),
      totalReviews: reviewsAsClient.length,
    };
  }

  /**
   * Trigger reputation recalculation when a new review is created
   */
  async onReviewCreated(reviewId: string): Promise<void> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return;
    }

    // Update target worker's reputation
    await this.updateWorkerReputationScores(review.targetId);
  }

  /**
   * Helper: Calculate average rating from array of ratings
   */
  private calculateAverageRating(ratings: number[]): number {
    if (ratings.length === 0) {
      return 5.0; // Default rating for new users
    }

    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal
  }

  private logAndAuditReputation(name: string, role: string, action: string, delta: number, oldPlan: string, newPlan: string) {
      const sign = delta >= 0 ? '+' : '';
      this.logger.log(`[Reputation Audit] ${role} ${name}: Action ${action} (${sign}${delta} pts). Plan: ${oldPlan} -> ${newPlan}`);
      
      if (newPlan !== oldPlan) {
          // Trigger PUSH NOTIFICATION for Tier change logic here
          this.logger.log(`🎉 NOTIFICATION: ${name} is now ${newPlan}!`);
      }
  }
}
