/**
 * Base Domain Event
 * All domain events should extend this
 */
export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;

  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string,
  ) {
    this.occurredOn = new Date();
    this.eventId = `${eventType}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  abstract toJSON(): Record<string, any>;
}

/**
 * ServiceRequestCreated Event
 */
export class ServiceRequestCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly clientId: string,
    public readonly totalAmount: number,
  ) {
    super(aggregateId, 'ServiceRequestCreated');
  }

  toJSON() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      occurredOn: this.occurredOn.toISOString(),
      payload: {
        clientId: this.clientId,
        totalAmount: this.totalAmount,
      },
    };
  }
}

/**
 * ServiceRequestAnalyzed Event
 */
export class ServiceRequestAnalyzedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly estimatedHours: number,
    public readonly difficultyScore: number,
  ) {
    super(aggregateId, 'ServiceRequestAnalyzed');
  }

  toJSON() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      occurredOn: this.occurredOn.toISOString(),
      payload: {
        estimatedHours: this.estimatedHours,
        difficultyScore: this.difficultyScore,
      },
    };
  }
}

/**
 * WorkerOffered Event
 */
export class WorkerOfferedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly workerId: string,
    public readonly timeoutAt: Date,
  ) {
    super(aggregateId, 'WorkerOffered');
  }

  toJSON() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      occurredOn: this.occurredOn.toISOString(),
      payload: {
        workerId: this.workerId,
        timeoutAt: this.timeoutAt.toISOString(),
      },
    };
  }
}

/**
 * WorkerAccepted Event
 */
export class WorkerAcceptedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly workerId: string,
  ) {
    super(aggregateId, 'WorkerAccepted');
  }

  toJSON() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      occurredOn: this.occurredOn.toISOString(),
      payload: {
        workerId: this.workerId,
      },
    };
  }
}

/**
 * WorkStarted Event
 */
export class WorkStartedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly workerId: string,
  ) {
    super(aggregateId, 'WorkStarted');
  }

  toJSON() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      occurredOn: this.occurredOn.toISOString(),
      payload: {
        workerId: this.workerId,
      },
    };
  }
}

/**
 * WorkCompleted Event
 */
export class WorkCompletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly workerId: string,
    public readonly completedAt: Date,
  ) {
    super(aggregateId, 'WorkCompleted');
  }

  toJSON() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      occurredOn: this.occurredOn.toISOString(),
      payload: {
        workerId: this.workerId,
        completedAt: this.completedAt.toISOString(),
      },
    };
  }
}

/**
 * ServiceRequestCancelled Event
 */
export class ServiceRequestCancelledEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly reason: string,
    public readonly penaltyAmount: number,
  ) {
    super(aggregateId, 'ServiceRequestCancelled');
  }

  toJSON() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      occurredOn: this.occurredOn.toISOString(),
      payload: {
        reason: this.reason,
        penaltyAmount: this.penaltyAmount,
      },
    };
  }
}

/**
 * ServiceRequestExpired Event
 */
export class ServiceRequestExpiredEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly attemptsMade: number,
  ) {
    super(aggregateId, 'ServiceRequestExpired');
  }

  toJSON() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      occurredOn: this.occurredOn.toISOString(),
      payload: {
        attemptsMade: this.attemptsMade,
      },
    };
  }
}

/**
 * PayoutReleased Event
 */
export class PayoutReleasedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly workerId: string,
    public readonly amount: number,
  ) {
    super(aggregateId, 'PayoutReleased');
  }

  toJSON() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      occurredOn: this.occurredOn.toISOString(),
      payload: {
        workerId: this.workerId,
        amount: this.amount,
      },
    };
  }
}
