import { DomainEvent } from '../events/domain-events';
import {
  ServiceRequestCreatedEvent,
  ServiceRequestAnalyzedEvent,
  WorkerOfferedEvent,
  WorkerAcceptedEvent,
  WorkStartedEvent,
  WorkCompletedEvent,
  ServiceRequestCancelledEvent,
  ServiceRequestExpiredEvent,
  PayoutReleasedEvent,
} from '../events/domain-events';
import { Money } from '../value-objects/money.vo';
import { Location } from '../value-objects/location.vo';
import { StartVerificationCode } from '../value-objects/verification-code.vo';
import { CommissionBreakdown } from '../value-objects/commission-breakdown.vo';
import { AiEstimation } from '../value-objects/ai-estimation.vo';

/**
 * Service Request Status Enum
 */
export enum ServiceRequestStatus {
  PENDING = 'PENDING',
  ANALYZING = 'ANALYZING',
  OFFERING = 'OFFERING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  DISPUTED = 'DISPUTED',
}

/**
 * ServiceRequest Aggregate Root
 * Encapsulates all business logic for service requests
 */
export class ServiceRequestEntity {
  private domainEvents: DomainEvent[] = [];

  constructor(
    public readonly id: string,
    public status: ServiceRequestStatus,
    public readonly clientId: string,
    public workerId: string | null,
    public readonly location: Location,
    public readonly pricing: CommissionBreakdown,
    public verificationCode: StartVerificationCode | null,
    public version: number,
    public assignmentAttempts: number,
    public workerTimeoutAt: Date | null,
    public scheduledAt: Date | null,
    public completedAt: Date | null,
    public disputeDeadlineAt: Date | null,
    public payoutReleasedAt: Date | null,
    public readonly createdAt: Date,
    public aiEstimation: AiEstimation | null = null,
  ) {}

  /**
   * Factory method to create new service request
   */
  static create(
    id: string,
    clientId: string,
    location: Location,
    pricing: CommissionBreakdown,
    scheduledAt: Date | null = null,
  ): ServiceRequestEntity {
    const entity = new ServiceRequestEntity(
      id,
      ServiceRequestStatus.PENDING,
      clientId,
      null,
      location,
      pricing,
      null,
      1,
      0,
      null,
      scheduledAt,
      null,
      null,
      null,
      new Date(),
      null,
    );

    entity.addDomainEvent(
      new ServiceRequestCreatedEvent(
        id,
        clientId,
        pricing.total.amount,
      ),
    );

    return entity;
  }

  /**
   * Analyze the request with AI
   */
  analyze(estimation: AiEstimation): void {
    this.assertStatus(ServiceRequestStatus.PENDING);

    this.aiEstimation = estimation;
    this.status = ServiceRequestStatus.ANALYZING;

    this.addDomainEvent(
      new ServiceRequestAnalyzedEvent(
        this.id,
        estimation.estimatedHours,
        estimation.difficultyScore,
      ),
    );
  }

  /**
   * Offer request to a worker
   */
  offerToWorker(
    workerId: string,
    timeoutMinutes: number = 15,
  ): void {
    this.assertStatus(ServiceRequestStatus.ANALYZING);

    this.workerId = workerId;
    this.status = ServiceRequestStatus.OFFERING;
    this.workerTimeoutAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);
    this.assignmentAttempts++;

    this.addDomainEvent(
      new WorkerOfferedEvent(this.id, workerId, this.workerTimeoutAt),
    );
  }

  /**
   * Worker accepts the request (with optimistic locking)
   */
  accept(workerId: string, expectedVersion: number): void {
    // Optimistic locking check
    if (this.version !== expectedVersion) {
      throw new Error(
        `Concurrency conflict: expected version ${expectedVersion}, got ${this.version}`,
      );
    }

    this.assertStatus(ServiceRequestStatus.OFFERING);

    if (this.workerId !== workerId) {
      throw new Error(
        `Worker ${workerId} cannot accept request offered to ${this.workerId}`,
      );
    }

    // Check if offer has timed out
    if (this.workerTimeoutAt && new Date() > this.workerTimeoutAt) {
      throw new Error('Worker offer has expired');
    }

    this.status = ServiceRequestStatus.ASSIGNED;
    this.verificationCode = StartVerificationCode.generate();
    this.version++;

    this.addDomainEvent(new WorkerAcceptedEvent(this.id, workerId));
  }

  /**
   * Start work with verification code
   */
  startWork(submittedCode: string): void {
    this.assertStatus(ServiceRequestStatus.ASSIGNED);

    if (!this.verificationCode) {
      throw new Error('No verification code set');
    }

    if (!this.verificationCode.matches(submittedCode)) {
      throw new Error('Invalid verification code');
    }

    if (!this.workerId) {
      throw new Error('No worker assigned');
    }

    this.status = ServiceRequestStatus.IN_PROGRESS;

    this.addDomainEvent(new WorkStartedEvent(this.id, this.workerId));
  }

  /**
   * Complete the work
   */
  completeWork(autoReleaseHours: number = 72): void {
    this.assertStatus(ServiceRequestStatus.IN_PROGRESS);

    if (!this.workerId) {
      throw new Error('No worker assigned');
    }

    const now = new Date();
    this.completedAt = now;
    this.disputeDeadlineAt = new Date(
      now.getTime() + autoReleaseHours * 60 * 60 * 1000,
    );
    this.status = ServiceRequestStatus.COMPLETED;

    this.addDomainEvent(
      new WorkCompletedEvent(this.id, this.workerId, now),
    );
  }

  /**
   * Cancel the request with policy
   */
  cancel(
    reason: string,
    penaltyBreakdown: CommissionBreakdown,
  ): void {
    // Cannot cancel if already completed or disputed
    if ([ServiceRequestStatus.COMPLETED, ServiceRequestStatus.DISPUTED].includes(this.status)) {
      throw new Error(`Cannot cancel request in ${this.status} status`);
    }

    this.status = ServiceRequestStatus.CANCELLED;

    this.addDomainEvent(
      new ServiceRequestCancelledEvent(
        this.id,
        reason,
        penaltyBreakdown.platformCommission.amount,
      ),
    );
  }

  /**
   * Expire the request (max assignment attempts reached)
   */
  expire(): void {
    if (
      ![ServiceRequestStatus.OFFERING, ServiceRequestStatus.ANALYZING].includes(
        this.status,
      )
    ) {
      throw new Error(`Cannot expire request in ${this.status} status`);
    }

    this.status = ServiceRequestStatus.EXPIRED;

    this.addDomainEvent(
      new ServiceRequestExpiredEvent(this.id, this.assignmentAttempts),
    );
  }

  /**
   * Release payout to worker
   */
  releasePayout(): void {
    this.assertStatus(ServiceRequestStatus.COMPLETED);

    if (!this.disputeDeadlineAt) {
      throw new Error('No dispute deadline set');
    }

    if (new Date() < this.disputeDeadlineAt) {
      throw new Error('Cannot release payout before dispute deadline');
    }

    if (this.payoutReleasedAt) {
      throw new Error('Payout already released');
    }

    if (!this.workerId) {
      throw new Error('No worker assigned');
    }

    this.payoutReleasedAt = new Date();

    this.addDomainEvent(
      new PayoutReleasedEvent(
        this.id,
        this.workerId,
        this.pricing.workerNet.amount,
      ),
    );
  }

  /**
   * Check if worker offer has timed out
   */
  hasWorkerTimedOut(): boolean {
    return (
      this.status === ServiceRequestStatus.OFFERING &&
      this.workerTimeoutAt !== null &&
      new Date() > this.workerTimeoutAt
    );
  }

  /**
   * Reassign to next worker (after timeout)
   */
  reassignAfterTimeout(): void {
    if (!this.hasWorkerTimedOut()) {
      throw new Error('Worker has not timed out');
    }

    // Reset for next attempt
    this.workerId = null;
    this.workerTimeoutAt = null;
    this.status = ServiceRequestStatus.ANALYZING;
  }

  /**
   * Check if payout should be released
   */
  shouldReleasePayout(): boolean {
    return (
      this.status === ServiceRequestStatus.COMPLETED &&
      this.disputeDeadlineAt !== null &&
      new Date() >= this.disputeDeadlineAt &&
      this.payoutReleasedAt === null
    );
  }

  /**
   * Get all domain events
   */
  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  /**
   * Clear domain events
   */
  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  private addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  private assertStatus(expectedStatus: ServiceRequestStatus): void {
    if (this.status !== expectedStatus) {
      throw new Error(
        `Invalid state transition: expected ${expectedStatus}, got ${this.status}`,
      );
    }
  }
}
