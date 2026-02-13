# Enterprise Marketplace Architecture

## Overview

This document describes the enterprise-grade architecture implemented for the Arreglame Ya marketplace platform. The architecture follows Domain-Driven Design (DDD), Clean Architecture, and Event-Driven Design principles to create a scalable, maintainable, and production-ready system.

## Architecture Layers

### 1. Domain Layer (`src/domain/`)

The core business logic, independent of any framework or infrastructure.

#### Value Objects (`domain/value-objects/`)

Immutable objects that represent concepts without identity:

- **Money**: Monetary values with currency support
- **Location**: Geographic coordinates with distance calculations
- **AiEstimation**: AI-generated price estimation data
- **StartVerificationCode**: 4-digit PIN for service start
- **CommissionBreakdown**: Price breakdown (total, worker net, platform commission)
- **AssignmentScore**: Worker ranking score

#### Entities (`domain/entities/`)

Objects with identity and lifecycle:

- **ServiceRequestEntity**: Aggregate root managing service request state machine
  - States: PENDING → ANALYZING → OFFERING → ASSIGNED → IN_PROGRESS → COMPLETED
  - Also: CANCELLED, EXPIRED, DISPUTED
  - Enforces state transitions and business rules
  - Emits domain events for all state changes

#### Domain Events (`domain/events/`)

Events representing things that happened in the domain:

- ServiceRequestCreatedEvent
- ServiceRequestAnalyzedEvent
- WorkerOfferedEvent
- WorkerAcceptedEvent
- WorkStartedEvent
- WorkCompletedEvent
- ServiceRequestCancelledEvent
- ServiceRequestExpiredEvent
- PayoutReleasedEvent

#### Policies (`domain/policies/`)

Business rules and calculations:

- **CancellationPolicy**: Calculates cancellation fees based on timing
  - Free if > 24h before scheduled time
  - 30% penalty if late cancellation
  - 50% penalty if in progress
- **CommissionPolicy**: Calculates platform commission (default 25%)
- **EstimationPolicy**: Converts AI estimates to pricing

### 2. Application Layer (`src/application/`)

Use cases orchestrating domain objects:

- **CreateRequestUseCase**: Create service request with AI pricing
- **AcceptRequestUseCase**: Worker accepts request (with optimistic locking)
- **StartWorkUseCase**: Start work with PIN verification
- **CompleteWorkUseCase**: Mark work as complete
- **CancelRequestUseCase**: Cancel with policy-based fees

### 3. Infrastructure Layer (`src/infrastructure/`)

Technical implementations:

#### Pricing (`infrastructure/pricing/`)

- **GeminiPricingEngine**: AI pricing using Google Gemini
- **RuleBasedPricingEngine**: Fallback pricing using business rules
- **PricingService**: Automatic fallback strategy

#### Assignment (`infrastructure/assignment/`)

- **WorkerFinderService**: Intelligent worker matching
  - Haversine distance calculation
  - Scoring: 40% distance + 60% rating
  - Returns ranked list of candidates

#### Persistence (`infrastructure/persistence/`)

- **PrismaServiceRequestRepository**: Database operations
  - Optimistic locking (version field)
  - Outbox pattern for events
  - Idempotency support

### 4. Background Jobs (`src/cron/`)

Scheduled tasks:

- **WorkerAssignmentCron**: Handles worker timeouts (runs every minute)
  - Finds OFFERING requests with expired timeout
  - Reassigns to next best worker
  - Marks as EXPIRED after max attempts (3)
- **PayoutReleaseCron**: Releases payouts (runs every hour)
  - Finds COMPLETED requests past dispute deadline
  - Automatically releases payment to worker

## Key Features

### 1. Idempotency

- Service creation accepts `idempotencyKey`
- Duplicate requests return existing entity
- Prevents double-charging

### 2. Concurrency Control

- Optimistic locking using `version` field
- Worker acceptance checks version to prevent race conditions
- Returns 409 Conflict if version mismatch

### 3. State Machine

Strict state transitions enforced by domain entity:

```
PENDING → analyze() → ANALYZING
ANALYZING → offerToWorker() → OFFERING
OFFERING → accept() → ASSIGNED
ASSIGNED → startWork() → IN_PROGRESS
IN_PROGRESS → completeWork() → COMPLETED
COMPLETED → releasePayout() → [payout released]

Any state → cancel() → CANCELLED
OFFERING → expire() → EXPIRED
```

### 4. Event-Driven Architecture

- Domain events emitted for all state changes
- Stored in OutboxEvent table
- Ready for event bus integration (Kafka, etc.)

### 5. Observability

- Structured logging at all layers
- Logger.log() for info
- Logger.warn() for warnings
- Logger.error() for errors with stack traces

### 6. Anti-Fraud

- Verification code required to start work
- Cannot complete without starting
- Cannot start without accepting
- Cannot accept expired offers

### 7. Cancellation Policy

Time-based cancellation fees:

- Free: > 24h before scheduled time
- 30% penalty: < 24h before scheduled
- 50% penalty: during IN_PROGRESS
- Free: during PENDING/ANALYZING (early stages)

## Configuration

System configuration stored in SystemConfig table:

| Key | Default | Description |
|-----|---------|-------------|
| cancelation_window_hours | 24 | Hours for free cancellation |
| penalty_fee_percentage | 0.30 | Late cancellation penalty |
| commission_percentage | 0.25 | Platform commission |
| worker_timeout_minutes | 15 | Worker acceptance timeout |
| auto_release_hours | 72 | Payout auto-release after completion |
| max_assignment_attempts | 3 | Max worker reassignments |

## Database Schema

### ServiceRequest (Enhanced)

New fields:
- `version`: Optimistic locking
- `verificationCode`: 4-digit PIN
- `totalAmount`, `workerPayout`, `platformCommission`: Explicit pricing
- `assignmentAttempts`: Track reassignment count
- `workerTimeoutAt`: When current offer expires
- `scheduledAt`: Scheduled start time
- `disputeDeadlineAt`: Deadline for disputes
- `payoutReleasedAt`: When payout was released
- `idempotencyKey`: Prevent duplicates
- `cityId`: Multi-city support

### SystemConfig

Key-value configuration:
- `key`: Unique identifier
- `value`: Configuration value
- `type`: STRING, INT, FLOAT, BOOLEAN, JSON
- `description`: Human-readable description

### OutboxEvent

Event storage for outbox pattern:
- `aggregateId`: ID of domain object
- `type`: Event type name
- `payload`: JSON event data
- `processed`: Whether event was published
- `processedAt`: When event was processed

## Usage Examples

### Creating a Service Request

```typescript
const result = await createRequestUseCase.execute({
  clientId: 'client-123',
  latitude: -34.6037,
  longitude: -58.3816,
  imageBase64: '...',
  description: 'Corte de pasto',
  squareMeters: 100,
  scheduledAt: new Date('2026-02-15T10:00:00Z'),
  idempotencyKey: 'unique-key-123',
});
```

### Worker Accepting Request

```typescript
await acceptRequestUseCase.execute(
  'req-123',
  'worker-456',
  1 // expected version
);
```

### Starting Work

```typescript
await startWorkUseCase.execute(
  'req-123',
  'worker-456',
  '1234' // verification code
);
```

### Cancelling Request

```typescript
const result = await cancelRequestUseCase.execute(
  'req-123',
  'Cliente cambió de opinión'
);
// Returns: { penaltyAmount: 750, refundAmount: 2250 }
```

## Deployment Considerations

### Environment Variables

Required:
- `DATABASE_URL`: PostgreSQL connection string
- `API_KEY` or `GEMINI_API_KEY`: Google Gemini API key (optional, falls back to rule-based)

Optional:
- `NODE_ENV`: 'production' | 'development' | 'test'

### Scaling

**Horizontal Scaling Ready:**
- Stateless services
- Database-backed state
- Optimistic locking for concurrency
- Cron jobs use idempotency protection

**Multi-City Support:**
- `cityId` field on ServiceRequest and WorkerProfile
- Can shard by city in the future

**Event Bus Ready:**
- Outbox pattern implemented
- Events stored in database
- Ready to add event processor/publisher

### Monitoring

Recommended metrics:
- Request creation rate
- Worker acceptance rate
- Assignment timeout rate
- Payout release rate
- Concurrency conflicts
- AI pricing failures (Gemini vs fallback usage)

## Future Enhancements

1. **Redis Queue**: Replace in-memory timeout with distributed queue
2. **Kafka Events**: Publish outbox events to Kafka
3. **Circuit Breaker**: Protect Gemini API calls
4. **Saga Pattern**: Coordinate payment transactions
5. **Feature Flags**: Dynamic pricing algorithms
6. **Sharding**: Database sharding by cityId
7. **Horizontal Scaling**: Add load balancer and multiple instances
8. **Metrics**: Prometheus/Grafana integration

## Testing Strategy

### Unit Tests

Test each component in isolation:
- Value Objects: Immutability, validation
- Policies: Business rule calculations
- Entities: State transitions, event emission

### Integration Tests

Test use cases with real database:
- Create request end-to-end
- Worker acceptance with concurrency
- Cancellation with various timings

### E2E Tests

Test complete workflows:
- Client creates → Worker accepts → Work starts → Completes → Payout releases
- Timeout scenarios
- Cancellation scenarios

## Architecture Principles

1. **Separation of Concerns**: Clear layer boundaries
2. **Dependency Inversion**: Domain depends on nothing
3. **Single Responsibility**: Each class has one reason to change
4. **Open/Closed**: Open for extension, closed for modification
5. **Liskov Substitution**: Multiple pricing engines implement same interface
6. **Interface Segregation**: Small, focused interfaces
7. **DRY**: Business logic in one place (domain)

## Migration Path

For existing deployments:

1. Deploy schema changes (add new fields)
2. Run migration to populate defaults
3. Deploy new code (backward compatible)
4. Update clients to use new status values
5. Enable cron jobs
6. Monitor event outbox
7. Add event processor when ready

## Support

For questions or issues, refer to:
- Architecture diagrams in `/docs`
- API documentation at `/graphql` (playground)
- Codebase comments and JSDoc

---

**Last Updated**: 2026-02-13
**Version**: 1.0.0
**Author**: ArreglaMe Ya Engineering Team
