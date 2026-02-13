import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Location } from '../../domain/value-objects/location.vo';
import { AssignmentScore } from '../../domain/value-objects/assignment-score.vo';

export interface WorkerCandidate {
  id: string;
  name: string;
  rating: number;
  location: Location;
  score: AssignmentScore;
}

/**
 * Worker Finder Service
 * Implements intelligent worker assignment based on distance and rating
 */
@Injectable()
export class WorkerFinderService {
  private readonly logger = new Logger(WorkerFinderService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find and rank workers for a service request
   * Uses 40% distance, 60% rating weighting
   */
  async findBestWorkers(
    requestLocation: Location,
    maxRadiusKm: number = 50,
    limit: number = 10,
    cityId?: string,
  ): Promise<WorkerCandidate[]> {
    this.logger.log(
      `Finding workers within ${maxRadiusKm}km of ${requestLocation.toString()}`,
    );

    const maxRadiusMeters = maxRadiusKm * 1000;

    // Fetch available workers
    const workers = await this.prisma.workerProfile.findMany({
      where: {
        status: 'ONLINE',
        latitude: { not: null },
        longitude: { not: null },
        cityId: cityId ? cityId : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      take: 200, // Get more candidates than needed for filtering
    });

    if (workers.length === 0) {
      this.logger.warn('No available workers found');
      return [];
    }

    this.logger.log(`Found ${workers.length} potential workers`);

    // Calculate scores for each worker
    const candidates: WorkerCandidate[] = [];

    for (const worker of workers) {
      if (worker.latitude === null || worker.longitude === null) {
        continue;
      }

      const workerLocation = Location.from(worker.latitude, worker.longitude);
      const distanceMeters = requestLocation.distanceTo(workerLocation);

      // Skip workers outside radius
      if (distanceMeters > maxRadiusMeters) {
        continue;
      }

      // Calculate assignment score
      const score = AssignmentScore.calculate(
        distanceMeters,
        maxRadiusMeters,
        worker.rating,
        5, // Max rating
      );

      candidates.push({
        id: worker.id,
        name: worker.name,
        rating: worker.rating,
        location: workerLocation,
        score,
      });
    }

    // Sort by total score (descending)
    candidates.sort((a, b) => b.score.totalScore - a.score.totalScore);

    // Log top candidates
    const topCandidates = candidates.slice(0, 5);
    this.logger.log(`Top ${topCandidates.length} candidates:`);
    topCandidates.forEach((candidate, index) => {
      this.logger.log(
        `  ${index + 1}. ${candidate.name} - Score: ${candidate.score.totalScore.toFixed(3)} ` +
          `(Distance: ${(candidate.score.distanceMeters / 1000).toFixed(1)}km, Rating: ${candidate.rating})`,
      );
    });

    return candidates.slice(0, limit);
  }

  /**
   * Find next best worker excluding already tried workers
   */
  async findNextWorker(
    requestLocation: Location,
    excludeWorkerIds: string[],
    maxRadiusKm: number = 50,
    cityId?: string,
  ): Promise<WorkerCandidate | null> {
    const candidates = await this.findBestWorkers(
      requestLocation,
      maxRadiusKm,
      10,
      cityId,
    );

    // Find first candidate not in exclude list
    const nextWorker = candidates.find(
      (c) => !excludeWorkerIds.includes(c.id),
    );

    if (nextWorker) {
      this.logger.log(
        `Next worker: ${nextWorker.name} (${nextWorker.id})`,
      );
    } else {
      this.logger.warn('No more workers available in radius');
    }

    return nextWorker || null;
  }

  /**
   * Get worker by ID with location
   */
  async getWorkerById(workerId: string): Promise<WorkerCandidate | null> {
    const worker = await this.prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (
      !worker ||
      worker.latitude === null ||
      worker.longitude === null
    ) {
      return null;
    }

    const location = Location.from(worker.latitude, worker.longitude);

    // Create a basic score (this is just for info, not for ranking)
    const score = AssignmentScore.calculate(0, 1, worker.rating, 5);

    return {
      id: worker.id,
      name: worker.name,
      rating: worker.rating,
      location,
      score,
    };
  }
}
