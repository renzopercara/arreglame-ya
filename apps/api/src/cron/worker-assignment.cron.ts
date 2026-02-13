import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { IServiceRequestRepository } from '../infrastructure/persistence/service-request.repository.interface';
import { PrismaServiceRequestRepository } from '../infrastructure/persistence/prisma-service-request.repository';
import { WorkerFinderService } from '../infrastructure/assignment/worker-finder.service';
import { Location } from '../domain/value-objects/location.vo';
import { ServiceRequestEntity } from '../domain/entities/service-request.entity';

/**
 * Worker Assignment Cron Job
 * Handles worker timeout and reassignment
 * Runs every minute to check for expired offers
 */
@Injectable()
export class WorkerAssignmentCron {
  private readonly logger = new Logger(WorkerAssignmentCron.name);
  private isRunning = false;
  private readonly maxAssignmentAttempts = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: PrismaServiceRequestRepository,
    private readonly workerFinder: WorkerFinderService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleWorkerTimeouts(): Promise<void> {
    // Prevent concurrent executions (idempotency protection)
    if (this.isRunning) {
      this.logger.debug('Previous execution still running, skipping');
      return;
    }

    this.isRunning = true;

    try {
      this.logger.log('Checking for worker assignment timeouts...');

      const expiredRequests =
        await this.repository.findWithExpiredWorkerTimeout();

      if (expiredRequests.length === 0) {
        this.logger.debug('No expired worker assignments found');
        return;
      }

      this.logger.log(
        `Found ${expiredRequests.length} expired worker assignments`,
      );

      for (const request of expiredRequests) {
        try {
          await this.handleExpiredRequest(request);
        } catch (error) {
          this.logger.error(
            `Error handling expired request ${request.id}: ${error.message}`,
            error.stack,
          );
          // Continue processing other requests
        }
      }

      this.logger.log('Worker timeout check completed');
    } catch (error) {
      this.logger.error('Error in worker assignment cron', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Handle a single expired request
   */
  private async handleExpiredRequest(request: ServiceRequestEntity): Promise<void> {
    this.logger.log(
      `Processing expired request ${request.id} (attempt ${request.assignmentAttempts})`,
    );

    // Check if max attempts reached
    if (request.assignmentAttempts >= this.maxAssignmentAttempts) {
      this.logger.warn(
        `Request ${request.id} exceeded max attempts, marking as EXPIRED`,
      );
      request.expire();
      await this.repository.save(request);
      return;
    }

    // Try to reassign to next worker
    try {
      // Get workers already tried (we'd need to track this in metadata or a separate table)
      // For now, we'll just try to find the next best worker
      const nextWorker = await this.workerFinder.findNextWorker(
        request.location,
        [request.workerId], // Exclude current worker
        50, // 50km radius
      );

      if (!nextWorker) {
        this.logger.warn(
          `No more workers available for request ${request.id}, marking as EXPIRED`,
        );
        request.expire();
        await this.repository.save(request);
        return;
      }

      // Reassign to next worker
      request.reassignAfterTimeout();
      request.offerToWorker(nextWorker.id, 15); // 15 minutes timeout

      await this.repository.save(request);

      this.logger.log(
        `Request ${request.id} reassigned to worker ${nextWorker.id}`,
      );

      // TODO: Send notification to new worker
    } catch (error) {
      this.logger.error(
        `Failed to reassign request ${request.id}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Manual trigger for testing
   */
  async triggerManually(): Promise<void> {
    this.logger.log('Manual trigger of worker assignment cron');
    await this.handleWorkerTimeouts();
  }
}
