# Enterprise Architecture Migration Guide

## Overview

This guide helps you migrate the existing Arreglame Ya marketplace to the new enterprise architecture with minimal downtime.

## Prerequisites

- Access to production database
- Database backup completed
- Node.js 20+ installed
- Access to environment variables

## Migration Steps

### Phase 1: Database Migration (30 minutes)

#### 1.1 Backup Database

```bash
# Create backup before migration
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 1.2 Run Prisma Migration

```bash
cd apps/api

# Generate Prisma client with new schema
npm run prisma:generate

# Create migration
npx prisma migrate dev --name enterprise_architecture

# Or for production
npx prisma migrate deploy
```

#### 1.3 Run Seed for Configuration

```bash
# Add system configuration
npm run prisma:seed
```

This will add:
- System configuration (timeouts, fees, etc.)
- Sample difficulty multipliers
- Sample extra multipliers

### Phase 2: Code Deployment (15 minutes)

#### 2.1 Install Dependencies

```bash
cd apps/api
npm install --legacy-peer-deps
```

#### 2.2 Build Application

```bash
npm run build
```

#### 2.3 Environment Variables

Ensure these are set:

```bash
# Required
DATABASE_URL=postgresql://...
NODE_ENV=production

# Optional (for AI pricing)
API_KEY=your-gemini-api-key
# or
GEMINI_API_KEY=your-gemini-api-key

# Optional (for monitoring)
LOG_LEVEL=info
```

#### 2.4 Start Application

```bash
# Production mode
npm run start:prod

# Or with PM2
pm2 start dist/main.js --name arreglame-ya-api
```

### Phase 3: Verification (10 minutes)

#### 3.1 Health Check

```bash
curl http://localhost:3000/health
```

Expected: `{ "status": "ok" }`

#### 3.2 Verify Cron Jobs

Check logs for:
```
[WorkerAssignmentCron] Checking for worker assignment timeouts...
[PayoutReleaseCron] Checking for payouts ready to release...
```

#### 3.3 Test Key Flows

1. **Create Service Request**
```graphql
mutation {
  estimateJob(input: {
    image: "base64...",
    description: "Corte de pasto",
    squareMeters: 100
  }) {
    price {
      total
      workerNet
      platformFee
    }
  }
}
```

2. **Worker Assignment** (manual test with existing workers)

3. **Check Event Outbox**
```sql
SELECT * FROM outbox_events 
WHERE processed = false 
LIMIT 10;
```

### Phase 4: Gradual Rollout (Recommended)

#### 4.1 Feature Flags (Optional)

If you have feature flags:
- Enable new architecture for 10% of requests
- Monitor errors and performance
- Gradually increase to 100%

#### 4.2 A/B Testing

Run old and new architecture in parallel:
- Route some clients to new endpoint
- Compare metrics
- Switch completely when confident

## Data Migration

### Existing ServiceRequests

The new schema is backward compatible. Existing requests will work with defaults:

- `status` maps to existing JobStatus values
- `version` starts at 1 for existing records
- `assignmentAttempts` defaults to 0
- Other new fields are nullable

#### Optional: Backfill Data

```sql
-- Add version to existing requests
UPDATE service_requests 
SET version = 1 
WHERE version IS NULL;

-- Set default city for existing requests
UPDATE service_requests 
SET "cityId" = 'default' 
WHERE "cityId" IS NULL;

-- Backfill worker locations for assignment
UPDATE worker_profiles 
SET "cityId" = 'buenos-aires',
    "lastActiveAt" = NOW()
WHERE "cityId" IS NULL;
```

## Rollback Plan

If issues occur during migration:

### 1. Stop New Application

```bash
pm2 stop arreglame-ya-api
# or
kill <process-id>
```

### 2. Restore Database

```bash
# Drop new tables if needed
psql $DATABASE_URL -c "DROP TABLE IF EXISTS outbox_events;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS system_config;"

# Restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

### 3. Revert Code

```bash
git revert HEAD
npm run build
npm run start:prod
```

## Monitoring After Migration

### Key Metrics

Monitor these in your observability platform:

1. **Request Metrics**
   - Service request creation rate
   - Average time to worker assignment
   - Worker acceptance rate

2. **Error Rates**
   - Concurrency conflicts (should be rare)
   - AI pricing failures (monitor fallback usage)
   - Cron job failures

3. **Performance**
   - Database query performance
   - Worker finder response time
   - Event outbox processing lag

### Log Queries

```bash
# Check for errors
grep "ERROR" logs/app.log | tail -50

# Check cron execution
grep "WorkerAssignmentCron" logs/app.log | tail -20
grep "PayoutReleaseCron" logs/app.log | tail -20

# Check AI pricing
grep "Gemini" logs/app.log | tail -20
grep "RuleBasedPricingEngine" logs/app.log | tail -20
```

### Database Queries

```sql
-- Check event outbox processing
SELECT 
  type,
  processed,
  COUNT(*) as count
FROM outbox_events
GROUP BY type, processed;

-- Check request distribution by status
SELECT 
  status,
  COUNT(*) as count
FROM service_requests
GROUP BY status
ORDER BY count DESC;

-- Check assignment timeout issues
SELECT COUNT(*) 
FROM service_requests
WHERE status = 'OFFERING'
  AND "workerTimeoutAt" < NOW();
```

## Configuration Tuning

After deployment, you may want to adjust configuration:

```sql
-- Adjust worker timeout (minutes)
UPDATE system_config 
SET value = '20' 
WHERE key = 'worker_timeout_minutes';

-- Adjust cancellation window (hours)
UPDATE system_config 
SET value = '48' 
WHERE key = 'cancellation_window_hours';

-- Adjust platform commission (0.0 to 1.0)
UPDATE system_config 
SET value = '0.20' 
WHERE key = 'commission_percentage';
```

Restart application after configuration changes.

## Performance Optimization

### Database Indexes

The migration adds these indexes. Verify they were created:

```sql
-- Check indexes
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('service_requests', 'worker_profiles', 'outbox_events')
ORDER BY tablename, indexname;
```

### Cron Job Tuning

If cron jobs are too slow:

```typescript
// In worker-assignment.cron.ts or payout-release.cron.ts
// Adjust cron schedule

// Every minute (default)
@Cron(CronExpression.EVERY_MINUTE)

// Every 30 seconds (more aggressive)
@Cron('*/30 * * * * *')

// Every 5 minutes (less aggressive)
@Cron('*/5 * * * *')
```

### Event Processing

If outbox events accumulate:

1. Add separate event processor service
2. Process events in batches
3. Publish to message queue (Kafka, RabbitMQ)

## Troubleshooting

### Issue: Cron jobs not running

**Check:**
```typescript
// Verify ScheduleModule is imported
imports: [
  ScheduleModule.forRoot(),
  // ...
]
```

**Solution:** Restart application

### Issue: Concurrency conflicts frequent

**Check:** Database transaction isolation level

**Solution:** This is expected under high load. The system handles it gracefully.

### Issue: Gemini API failures

**Check:** API key is set and valid

**Fallback:** System automatically uses rule-based pricing

**Monitor:**
```bash
grep "RuleBasedPricingEngine" logs/app.log | wc -l
```

### Issue: Worker assignment timeouts

**Check:**
1. Are workers actually online?
2. Is radius too small?
3. Is timeout too short?

**Solution:** Adjust configuration or investigate worker availability

## Support

For issues during migration:

1. Check logs first
2. Verify database migration completed
3. Check environment variables
4. Review [ENTERPRISE_ARCHITECTURE.md](./ENTERPRISE_ARCHITECTURE.md)
5. Contact engineering team

## Post-Migration Checklist

- [ ] Database migration completed
- [ ] Application deployed and running
- [ ] Health check passing
- [ ] Cron jobs executing
- [ ] Event outbox being populated
- [ ] No errors in logs
- [ ] Monitoring dashboards updated
- [ ] Team notified of changes
- [ ] Documentation updated
- [ ] Rollback plan tested (in staging)

---

**Last Updated**: 2026-02-13
**Version**: 1.0.0
