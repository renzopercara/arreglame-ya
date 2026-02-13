# Enterprise Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                       │
│              (Mobile App, Web, API Consumers)                    │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API GATEWAY                             │
│                    (GraphQL / REST Endpoints)                    │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐   │
│  │ CreateRequest    │  │ AcceptRequest    │  │ StartWork  │   │
│  │   UseCase        │  │   UseCase        │  │  UseCase   │   │
│  └──────────────────┘  └──────────────────┘  └────────────┘   │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ CompleteWork     │  │ CancelRequest    │                    │
│  │   UseCase        │  │   UseCase        │                    │
│  └──────────────────┘  └──────────────────┘                    │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DOMAIN LAYER                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │           ServiceRequestEntity (Aggregate Root)       │      │
│  │  ┌────────────────────────────────────────────────┐  │      │
│  │  │        STATE MACHINE                            │  │      │
│  │  │  PENDING → ANALYZING → OFFERING → ASSIGNED     │  │      │
│  │  │          → IN_PROGRESS → COMPLETED             │  │      │
│  │  └────────────────────────────────────────────────┘  │      │
│  │                                                        │      │
│  │  Methods:                                             │      │
│  │  - analyze()        - offerToWorker()                │      │
│  │  - accept()         - startWork()                    │      │
│  │  - completeWork()   - cancel()                       │      │
│  │  - expire()         - releasePayout()                │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Value        │  │   Policies   │  │   Events     │         │
│  │ Objects      │  │              │  │              │         │
│  │              │  │              │  │              │         │
│  │ • Money      │  │ • Cancel     │  │ • Created    │         │
│  │ • Location   │  │   Policy     │  │ • Analyzed   │         │
│  │ • Code       │  │ • Commission │  │ • Offered    │         │
│  │ • Breakdown  │  │ • Estimation │  │ • Accepted   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              Pricing Services                         │      │
│  │  ┌──────────────┐          ┌──────────────┐         │      │
│  │  │   Gemini AI  │ Fallback │  Rule-Based  │         │      │
│  │  │   Pricing    │────────► │   Pricing    │         │      │
│  │  └──────────────┘          └──────────────┘         │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │          Worker Assignment Service                    │      │
│  │  - Haversine distance calculation                    │      │
│  │  - Score: 40% distance + 60% rating                  │      │
│  │  - Returns ranked worker list                        │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              Repository                               │      │
│  │  - Optimistic locking (version field)                │      │
│  │  - Outbox pattern for events                         │      │
│  │  - Idempotency checks                                │      │
│  └──────────────────────────────────────────────────────┘      │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PERSISTENCE LAYER                           │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐   │
│  │ ServiceRequest   │  │  OutboxEvent     │  │ SystemCfg  │   │
│  │ (with version)   │  │  (events)        │  │ (config)   │   │
│  └──────────────────┘  └──────────────────┘  └────────────┘   │
│                                                                  │
│                     PostgreSQL Database                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      BACKGROUND JOBS                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  WorkerAssignmentCron (Every Minute)                 │      │
│  │  - Find expired OFFERING requests                    │      │
│  │  - Reassign to next worker                           │      │
│  │  - Expire after max attempts                         │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  PayoutReleaseCron (Every Hour)                      │      │
│  │  - Find COMPLETED past dispute deadline             │      │
│  │  - Release payout automatically                      │      │
│  └──────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Service Request Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. CLIENT CREATES REQUEST                                        │
│    POST /createRequest                                           │
│    ↓                                                             │
│    CreateRequestUseCase                                          │
│    ↓                                                             │
│    • GeminiPricing estimates (or fallback)                      │
│    • EstimationPolicy validates                                  │
│    • CommissionPolicy calculates breakdown                       │
│    • ServiceRequestEntity.create()                              │
│    • Repository.save() → Database + OutboxEvent                 │
│    ↓                                                             │
│    Status: PENDING → ANALYZING                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 2. SYSTEM OFFERS TO WORKER                                       │
│    WorkerFinderService finds best workers                        │
│    ↓                                                             │
│    ServiceRequestEntity.offerToWorker(workerId)                 │
│    ↓                                                             │
│    • Sets workerTimeoutAt = now + 15 minutes                    │
│    • Increments assignmentAttempts                              │
│    • Emits WorkerOfferedEvent                                   │
│    ↓                                                             │
│    Status: ANALYZING → OFFERING                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 3. WORKER ACCEPTS                                                │
│    POST /acceptRequest                                           │
│    ↓                                                             │
│    AcceptRequestUseCase(requestId, workerId, version)           │
│    ↓                                                             │
│    ServiceRequestEntity.accept(workerId, expectedVersion)       │
│    ↓                                                             │
│    • Checks version (optimistic locking)                        │
│    • Validates timeout not expired                              │
│    • Generates verification code                                │
│    • Emits WorkerAcceptedEvent                                  │
│    ↓                                                             │
│    Status: OFFERING → ASSIGNED                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 4. WORKER STARTS WORK                                            │
│    POST /startWork                                               │
│    ↓                                                             │
│    StartWorkUseCase(requestId, workerId, code)                  │
│    ↓                                                             │
│    ServiceRequestEntity.startWork(submittedCode)                │
│    ↓                                                             │
│    • Validates verification code                                │
│    • Emits WorkStartedEvent                                     │
│    ↓                                                             │
│    Status: ASSIGNED → IN_PROGRESS                                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 5. WORKER COMPLETES                                              │
│    POST /completeWork                                            │
│    ↓                                                             │
│    CompleteWorkUseCase(requestId)                               │
│    ↓                                                             │
│    ServiceRequestEntity.completeWork()                          │
│    ↓                                                             │
│    • Sets completedAt                                           │
│    • Sets disputeDeadlineAt = now + 72h                         │
│    • Emits WorkCompletedEvent                                   │
│    ↓                                                             │
│    Status: IN_PROGRESS → COMPLETED                               │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ 6. PAYOUT AUTO-RELEASE (72h later)                              │
│    PayoutReleaseCron triggers                                   │
│    ↓                                                             │
│    Finds COMPLETED past disputeDeadlineAt                       │
│    ↓                                                             │
│    ServiceRequestEntity.releasePayout()                         │
│    ↓                                                             │
│    • Validates deadline passed                                  │
│    • Sets payoutReleasedAt                                      │
│    • Emits PayoutReleasedEvent                                  │
│    ↓                                                             │
│    Worker receives payment                                       │
└──────────────────────────────────────────────────────────────────┘
```

## Concurrency Control

```
Two Workers Try to Accept Same Request:

Worker A                    Worker B
   │                           │
   ├─── GET request (v1) ──────┤
   │                           │
   ├─── accept(v1) ────────────┤
   │                           │
   ▼                           ▼
Repository                 Repository
   │                           │
   ├─ version matches ✅       │
   ├─ save with v2             │
   │                           ├─ version mismatch ❌
   │                           ├─ throw ConcurrencyException
   │                           │
   ▼                           ▼
SUCCESS                    409 CONFLICT
Worker A assigned          "Another worker accepted"
```

## Event Flow

```
Domain Event Emission:

1. Entity changes state
   ↓
2. Entity.addDomainEvent(event)
   ↓
3. Repository.save(entity)
   ↓
4. Save to OutboxEvent table
   ↓
5. Clear entity events
   ↓
6. [Future] Event Processor reads outbox
   ↓
7. [Future] Publish to Kafka/RabbitMQ
   ↓
8. [Future] Consumers react to events
```

## Technology Stack

```
┌──────────────────────────────────────┐
│         Presentation Layer           │
│  • GraphQL (Apollo)                  │
│  • REST APIs                         │
│  • WebSocket (Subscriptions)        │
└──────────────────────────────────────┘
                 │
┌──────────────────────────────────────┐
│         Application Layer            │
│  • NestJS Framework                  │
│  • TypeScript                        │
│  • Use Cases Pattern                 │
└──────────────────────────────────────┘
                 │
┌──────────────────────────────────────┐
│          Domain Layer                │
│  • Pure TypeScript                   │
│  • Zero dependencies                 │
│  • SOLID principles                  │
└──────────────────────────────────────┘
                 │
┌──────────────────────────────────────┐
│      Infrastructure Layer            │
│  • Prisma ORM                        │
│  • Google Gemini API                 │
│  • NestJS Schedule (Cron)           │
└──────────────────────────────────────┘
                 │
┌──────────────────────────────────────┐
│         Persistence                  │
│  • PostgreSQL 14+                    │
│  • PostGIS extension                 │
└──────────────────────────────────────┘
```

---

**Last Updated**: February 13, 2026
**Version**: 1.0.0
