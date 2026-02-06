# 💰 Financial Core System - Technical Documentation

## Overview

This document describes the implementation of an enterprise-grade financial system for the ArreglaMe Ya marketplace platform. The system implements double-entry bookkeeping, transaction snapshotting, complete idempotency, and automated debt management.

## Architecture Principles

### 1. Double-Entry Bookkeeping
- **Balance is NEVER stored directly** - it's always derived from the ledger
- Every transaction creates at least 2 ledger entries (debit + credit)
- `Sum(credits) - Sum(debits) = Balance`
- Guarantees financial integrity and audit trail

### 2. Transaction Snapshotting
- Commission rules are **frozen at transaction creation time (T0)**
- Future configuration changes don't affect past transactions
- Each transaction has an immutable `transaction_snapshot` record
- Enables accurate historical reporting

### 3. Complete Idempotency
- Webhook retries don't duplicate financial effects
- `eventId` and `externalReference` used as idempotency keys
- Safe to replay webhooks and API calls

### 4. Single Source of Truth
- Database is the authoritative source for all financial data
- Payment providers (Mercado Pago) are processors only
- All provider events are logged for audit

## Database Schema

### Core Tables

#### `payment_transactions`
Main record of payment attempts and completions.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Client making payment |
| professionalId | UUID | Professional receiving payment |
| status | TransactionStatus | PENDING, AUTHORIZED, PAID, FAILED, REFUNDED |
| paymentMethod | PaymentMethod | MP (Mercado Pago), CASH |
| amountTotal | Int | Total amount in centavos |
| externalReference | String (unique) | Idempotency key |
| createdAt | Timestamp | Transaction creation time |
| updatedAt | Timestamp | Last status update |

**Indexes**: `userId`, `professionalId`, `status`, `externalReference`, `createdAt`

#### `transaction_snapshots`
Immutable snapshot of commission rules at transaction time.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| transactionId | UUID (unique) | FK to payment_transactions |
| platformFeePercent | Int | Fee in basis points (500 = 5.00%) |
| serviceTaxPercent | Int | Tax in basis points |
| platformAmount | Int | Platform commission in centavos |
| professionalAmount | Int | Professional net in centavos |
| metadata | JSONB | Additional data (breakdown, rates) |
| createdAt | Timestamp | Snapshot creation time |

**One snapshot per transaction** - cannot be modified.

#### `ledger_entries`
Double-entry ledger for all financial movements.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| accountId | String | User ID or "PLATFORM" |
| transactionId | UUID | FK to payment_transactions (nullable) |
| walletId | UUID | FK to wallets (nullable) |
| debit | Int | Amount debited (centavos) |
| credit | Int | Amount credited (centavos) |
| balanceAfter | Int | Running balance after entry |
| description | String | Human-readable description |
| createdAt | Timestamp | Entry creation time |

**Balance invariant**: `balanceAfter = previousBalance + credit - debit`

**Indexes**: `accountId`, `transactionId`, `walletId`, `createdAt`

#### `payment_provider_logs`
Audit log of all payment provider events.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| transactionId | UUID | FK to payment_transactions |
| provider | PaymentProvider | MERCADOPAGO |
| eventId | String (unique) | Provider event ID (idempotency) |
| eventType | String | e.g., "payment.approved" |
| payload | JSONB | Full webhook payload |
| processedAt | Timestamp | When event was processed |

**Idempotency**: `eventId` is unique, prevents duplicate processing.

#### `Wallet` (Updated)
User wallet with balance and debt management.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID (unique) | User ID |
| currentBalance | Int | Current balance in centavos (derived) |
| debtLimit | Int | Max negative balance allowed (e.g., -50000) |
| status | String | ACTIVE, INACTIVE_DEBT |
| createdAt | Timestamp | Wallet creation |
| updatedAt | Timestamp | Last balance update |

**Status rules**:
- `ACTIVE`: Can receive new jobs
- `INACTIVE_DEBT`: Balance < debtLimit, blocked from jobs

## Services

### LedgerService
**Purpose**: Maintain double-entry ledger and derive balances.

**Key Methods**:
- `createEntries(entries[])` - Create balanced ledger entries
- `getAccountBalance(accountId)` - Calculate balance from ledger
- `recordPayment(...)` - Record MP payment (client → professional)
- `recordCashPayment(...)` - Record cash payment (creates debt)
- `recordRefund(...)` - Reverse payment entries
- `validateLedgerIntegrity()` - Check debits = credits

**Example: MP Payment Flow**
```typescript
// Client pays $1000, platform takes $100 commission
entries = [
  { accountId: clientId, debit: 1000, credit: 0 },      // Client pays
  { accountId: professionalId, debit: 0, credit: 900 }, // Professional receives net
  { accountId: 'PLATFORM', debit: 0, credit: 100 }      // Platform commission
]
// Total: debits (1000) = credits (900 + 100) ✓
```

### PaymentService
**Purpose**: Handle payment creation with strategy pattern.

**Key Methods**:
- `createPayment(input)` - Create transaction with snapshot
- `handlePaymentApproved(...)` - Process webhook approval
- `handlePaymentFailed(...)` - Process webhook failure
- `refundPayment(transactionId, reason)` - Issue refund

**Payment Methods**:
1. **Mercado Pago (MP)**:
   - Creates transaction in `PENDING` status
   - Returns MP preference (checkout URL)
   - Awaits webhook confirmation
   - On approval: creates ledger entries

2. **Cash**:
   - Creates transaction in `PAID` status immediately
   - Professional receives full amount in ledger
   - Platform commission is **debited** from professional
   - Can result in negative balance (debt)

**Snapshotting**:
```typescript
const snapshot = await tx.transactionSnapshot.create({
  transactionId: transaction.id,
  platformFeePercent: 500, // 5.00% at T0
  platformAmount: breakdown.platformFee,
  professionalAmount: breakdown.workerNetAmount,
  metadata: { breakdown, timestamp }
});
```

### CommissionService
**Purpose**: Calculate commissions with caching.

**Configuration**:
- Loads from `SystemSetting` table
- In-memory cache (5-minute TTL)
- Falls back to defaults if DB unavailable

**Key Methods**:
- `calculateCommissionBreakdown(baseAmount)` - From base to total
- `calculateFromTotalAmount(totalAmount)` - Reverse calculation
- `createSnapshot(totalAmount)` - Generate snapshot data
- `getCommissionRates()` - Get current rates for snapshotting

**Default Rates**:
- Platform Fee: 5%
- Service Tax: 0%
- Gateway Fee: 0%

### DebtManagementService
**Purpose**: Monitor and manage professional debt.

**Key Methods**:
- `getDebtStatus(userId)` - Check current debt
- `generateDebtPaymentLink(userId)` - Create MP payment link
- `processDebtPayment(...)` - Record debt payment in ledger
- `checkAllWalletsForDebt()` - Batch check for violations
- `setDebtLimit(userId, limit)` - Update debt limit

**Debt Flow**:
1. Professional accepts cash payment
2. Ledger records: Credit full amount, Debit commission
3. Balance may go negative (debt)
4. If `balance < debtLimit`: Wallet status → `INACTIVE_DEBT`
5. Professional blocked from new jobs
6. Professional pays debt via MP
7. Balance increases, status → `ACTIVE`

### WebhookService
**Purpose**: Process payment provider webhooks with state machine.

**State Machine**:
```
PENDING → [AUTHORIZED, PAID, FAILED, CANCELLED]
AUTHORIZED → [PAID, FAILED, CANCELLED]
PAID → [REFUNDED]
FAILED → [terminal]
CANCELLED → [terminal]
REFUNDED → [terminal]
```

**Idempotency**:
- Check `payment_provider_logs.eventId` for duplicates
- Log every webhook before processing
- Safe to receive same webhook multiple times

**Key Methods**:
- `processMercadoPagoWebhook(webhook)` - Main entry point
- `handlePaymentApproved(...)` - Delegate to PaymentService
- `handlePaymentFailed(...)` - Delegate to PaymentService

## API Endpoints

### REST API (PaymentController)

#### POST `/api/payments/create`
Create new payment.

**Request**:
```json
{
  "professionalId": "uuid",
  "paymentMethod": "MP" | "CASH",
  "totalAmount": 100000,
  "externalReference": "optional-idempotency-key"
}
```

**Response** (MP):
```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "status": "PENDING",
    "amount": 100000,
    "externalReference": "TXN-123",
    "paymentMethod": "MP"
  },
  "snapshot": {
    "platformFee": 5000,
    "professionalNet": 95000
  },
  "paymentData": {
    "preferenceId": "mp-pref-123",
    "initPoint": "https://mp.com/checkout/..."
  }
}
```

**Response** (Cash):
```json
{
  "success": true,
  "transaction": {
    "id": "uuid",
    "status": "PAID",
    "amount": 100000,
    "externalReference": "TXN-124",
    "paymentMethod": "CASH"
  },
  "snapshot": {
    "platformFee": 5000,
    "professionalNet": 95000
  }
}
```

#### GET `/api/payments/:reference`
Get payment details by external reference.

**Response**:
```json
{
  "success": true,
  "transaction": { ... },
  "snapshot": { ... },
  "ledger": [ ... ]
}
```

#### GET `/api/payments/user/history`
Get user's payment history (last 50).

#### POST `/api/payments/:id/refund`
Refund a payment.

**Request**:
```json
{
  "reason": "Service not delivered"
}
```

#### GET `/api/payments/debt/status`
Get current debt status for user.

**Response**:
```json
{
  "success": true,
  "debt": {
    "userId": "uuid",
    "currentBalance": -25000,
    "debtLimit": -50000,
    "debtAmount": 25000,
    "status": "ACTIVE",
    "canReceiveJobs": true
  }
}
```

#### POST `/api/payments/debt/pay`
Generate payment link to settle debt.

**Response**:
```json
{
  "success": true,
  "paymentLink": {
    "preferenceId": "mp-debt-123",
    "initPoint": "https://mp.com/checkout/...",
    "amount": 25000
  }
}
```

### Webhook Endpoint

#### POST `/webhooks/mercadopago`
Receive Mercado Pago webhook notifications.

**Payload Example**:
```json
{
  "type": "payment",
  "data": {
    "id": "mp-payment-123",
    "status": "approved",
    "status_detail": "accredited",
    "external_reference": "TXN-123",
    "transaction_amount": 1000.00
  }
}
```

**Response** (always 200 OK):
```json
{
  "status": "ok",
  "message": "Webhook processed successfully"
}
```

## Payment Flows

### Mercado Pago Payment Flow

```
1. Client clicks "Pay"
   ↓
2. Frontend calls POST /api/payments/create
   ↓
3. Backend creates:
   - payment_transaction (status: PENDING)
   - transaction_snapshot (commission rates frozen)
   - MP preference
   ↓
4. Frontend redirects to MP checkout (initPoint)
   ↓
5. Client completes payment in MP
   ↓
6. MP sends webhook to POST /webhooks/mercadopago
   ↓
7. Backend:
   - Validates idempotency (eventId)
   - Updates transaction status: PENDING → PAID
   - Creates ledger entries (client debit, professional credit, platform credit)
   - Updates wallet balances from ledger
   - Logs webhook event
   ↓
8. Professional sees balance increase
```

### Cash Payment Flow

```
1. Professional marks service as "Paid with Cash"
   ↓
2. Backend calls POST /api/payments/create (paymentMethod: CASH)
   ↓
3. Backend creates:
   - payment_transaction (status: PAID immediately)
   - transaction_snapshot
   - Ledger entries:
     * Credit professional (full amount)
     * Debit professional (commission)
     * Credit platform (commission)
   ↓
4. Professional balance may go negative (debt)
   ↓
5. If balance < debtLimit:
   - Wallet status → INACTIVE_DEBT
   - Professional blocked from new jobs
   ↓
6. Professional clicks "Pay Debt"
   ↓
7. Backend generates MP payment link
   ↓
8. Professional pays via MP
   ↓
9. Webhook updates ledger
   ↓
10. Balance increases, status → ACTIVE
```

### Refund Flow

```
1. Admin calls POST /api/payments/:id/refund
   ↓
2. Backend validates:
   - Transaction exists
   - Transaction status is PAID
   ↓
3. Backend:
   - Updates transaction status: PAID → REFUNDED
   - Creates reverse ledger entries
     * Credit client (money back)
     * Debit professional (money deducted)
     * Debit platform (commission returned)
   - Updates wallet balances from ledger
   ↓
4. Balances reflect refund
```

## Testing

### Idempotency Tests
```typescript
// Test: Duplicate webhook doesn't create duplicate ledger entries
test('Webhook idempotency', async () => {
  const webhook = { type: 'payment', data: { id: '123', status: 'approved', external_reference: 'TXN-1' } };
  
  await webhookService.processMercadoPagoWebhook(webhook);
  await webhookService.processMercadoPagoWebhook(webhook); // Replay
  
  const logs = await prisma.paymentProviderLog.findMany({ where: { eventId: 'MP-123-approved' } });
  expect(logs.length).toBe(1); // Only one log
  
  const entries = await prisma.ledgerEntry.findMany({ where: { transactionId: 'TXN-1' } });
  expect(entries.length).toBe(3); // Only 3 entries (not 6)
});
```

### Ledger Balance Tests
```typescript
// Test: Balance equals sum of ledger entries
test('Ledger balance derivation', async () => {
  const userId = 'user-123';
  
  // Create some transactions...
  await createPayment({ userId, amount: 100000 });
  await createPayment({ userId, amount: 50000 });
  
  const calculatedBalance = await ledgerService.getAccountBalance(userId);
  const latestBalance = await ledgerService.getLatestBalance(userId);
  
  expect(calculatedBalance).toBe(latestBalance); // Must match
});
```

### State Machine Tests
```typescript
// Test: Invalid transitions rejected
test('State machine validation', async () => {
  const transaction = await createTransaction({ status: 'PAID' });
  
  // Try invalid transition: PAID → PENDING
  await expect(
    updateTransactionStatus(transaction.id, 'PENDING')
  ).rejects.toThrow('Invalid state transition');
  
  // Valid transition: PAID → REFUNDED
  await expect(
    updateTransactionStatus(transaction.id, 'REFUNDED')
  ).resolves.not.toThrow();
});
```

## Monitoring & Debugging

### Ledger Integrity Check
```bash
# Run periodically (cron job)
curl -X POST http://localhost:3001/api/admin/ledger/validate
```

Expected response:
```json
{
  "isBalanced": true,
  "totalDebits": 1000000,
  "totalCredits": 1000000
}
```

If `isBalanced: false`, investigate immediately!

### Debt Report
```bash
# Get users with debt
curl http://localhost:3001/api/admin/debt/report
```

### Payment Provider Logs
```sql
-- View recent webhook events
SELECT * FROM payment_provider_logs 
ORDER BY processedAt DESC 
LIMIT 50;

-- Check for duplicate events
SELECT eventId, COUNT(*) 
FROM payment_provider_logs 
GROUP BY eventId 
HAVING COUNT(*) > 1;
```

## Configuration

### Commission Rates (Database)
```sql
-- Update platform fee to 6%
INSERT INTO "SystemSetting" (key, value, type) 
VALUES ('PLATFORM_FEE_PERCENTAGE', '0.06', 'FLOAT')
ON CONFLICT (key) DO UPDATE SET value = '0.06';
```

Cache will refresh within 5 minutes.

### Debt Limits
```sql
-- Set custom debt limit for user
UPDATE "Wallet" 
SET "debtLimit" = -100000 
WHERE "userId" = 'uuid';
```

## Security Considerations

1. **Webhook Validation**: TODO: Verify MP signature
2. **Authorization**: Users can only view their own transactions
3. **Admin Endpoints**: Refunds require admin role
4. **Rate Limiting**: Implement on payment creation endpoints
5. **Audit Trail**: All financial operations logged

## Future Enhancements

- [ ] Webhook signature validation
- [ ] Split payments (multiple professionals)
- [ ] Scheduled payouts
- [ ] Currency support (USD, EUR)
- [ ] Dispute handling
- [ ] Automated reconciliation with MP
- [ ] Real-time balance updates (WebSocket)
- [ ] Financial reports (revenue, commissions)

## Support

For questions or issues, contact the development team or consult the codebase:
- `apps/api/src/billing/` - Core services
- `apps/api/prisma/schema.prisma` - Database schema
- `apps/api/src/webhooks/` - Webhook handling
