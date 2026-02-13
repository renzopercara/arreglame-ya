import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { IServiceRequestRepository } from '../infrastructure/persistence/service-request.repository.interface';
import { PrismaServiceRequestRepository } from '../infrastructure/persistence/prisma-service-request.repository';

/**
 * Payout Release Cron Job
 * Automatically releases payouts after dispute deadline
 * Runs every hour to check for completed jobs ready for payout
 */
@Injectable()
export class PayoutReleaseCron {
  private readonly logger = new Logger(PayoutReleaseCron.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: PrismaServiceRequestRepository,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async releaseReadyPayouts(): Promise<void> {
    // Prevent concurrent executions (idempotency protection)
    if (this.isRunning) {
      this.logger.debug('Previous execution still running, skipping');
      return;
    }

    this.isRunning = true;

    try {
      this.logger.log('Checking for payouts ready to release...');

      const readyRequests = await this.repository.findReadyForPayoutRelease();

      if (readyRequests.length === 0) {
        this.logger.debug('No payouts ready for release');
        return;
      }

      this.logger.log(
        `Found ${readyRequests.length} payouts ready for release`,
      );

      let successCount = 0;
      let failureCount = 0;

      for (const request of readyRequests) {
        try {
          await this.releasePayoutForRequest(request);
          successCount++;
        } catch (error) {
          this.logger.error(
            `Error releasing payout for request ${request.id}: ${error.message}`,
            error.stack,
          );
          failureCount++;
          // Continue processing other requests
        }
      }

      this.logger.log(
        `Payout release completed: ${successCount} successful, ${failureCount} failed`,
      );
    } catch (error) {
      this.logger.error('Error in payout release cron', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Release payout for a single request
   */
  private async releasePayoutForRequest(request: any): Promise<void> {
    this.logger.log(`Releasing payout for request ${request.id}`);

    // Release payout (domain logic handles validation)
    request.releasePayout();

    // Save with events
    await this.repository.save(request);

    // TODO: Integrate with actual payout system (Mercado Pago, etc.)
    // For now, we just mark it as released
    // await this.payoutService.transfer(
    //   request.workerId,
    //   request.pricing.workerNet.amount
    // );

    this.logger.log(
      `Payout released for request ${request.id}: ${request.pricing.workerNet.amount} ${request.pricing.workerNet.currency}`,
    );
  }

  /**
   * Manual trigger for testing
   */
  async triggerManually(): Promise<void> {
    this.logger.log('Manual trigger of payout release cron');
    await this.releaseReadyPayouts();
  }

  /**
   * Get statistics about pending payouts
   */
  async getPayoutStats(): Promise<{
    pendingCount: number;
    totalAmount: number;
  }> {
    const readyRequests = await this.repository.findReadyForPayoutRelease();

    const totalAmount = readyRequests.reduce((sum, req) => {
      return sum + req.pricing.workerNet.amount;
    }, 0);

    return {
      pendingCount: readyRequests.length,
      totalAmount,
    };
  }
}
