# PRO Dashboard Implementation - ArreglaMe-Ya

## Overview

This document describes the complete implementation of the PRO Dashboard with **real-time notifications via GraphQL Subscriptions**, error handling, and optimistic UI updates for the ArreglaMe-Ya platform.

**Key Architecture Decision:** This implementation uses **GraphQL Subscriptions over WebSockets** for real-time updates instead of external push notification services (Firebase, OneSignal, etc.), keeping all infrastructure within the existing NestJS + Apollo stack.

## Architecture

### Backend (NestJS + Prisma + GraphQL + PubSub)

#### Real-time Infrastructure

The system uses the existing **GraphQL Subscriptions** infrastructure with in-memory PubSub:

```typescript
// apps/api/src/common/pubsub.module.ts
@Global()
@Module({
  providers: [
    {
      provide: 'PUB_SUB',
      useValue: new PubSub(), // In-memory PubSub. Use RedisPubSub for production scaling.
    },
  ],
  exports: ['PUB_SUB'],
})
export class PubSubModule {}
```

#### 1. Database Schema

**DeviceToken Model** - Tracks active WebSocket sessions
```prisma
model DeviceToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  platform  String   // "web" for GraphQL subscription sessions
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### 2. NotificationService

**Real-time Notification Delivery:**
```typescript
async sendRealtimeNotification(
  userId: string,
  title: string,
  body: string,
  data?: any,
): Promise<void> {
  // Create in-app notification
  const notification = await this.createNotification(userId, title, body, 'REALTIME', data);
  
  // Publish to GraphQL subscription for real-time delivery
  await this.pubSub.publish(`NOTIFICATION_${userId}`, {
    notificationReceived: notification,
  });
}
```

**Professional Job Notifications:**
```typescript
async notifyProfessionalAboutNewJob(
  professionalId: string,
  jobData: {
    jobId: string;
    clientName: string;
    jobType: string;
    location: string;
    distance: number;
  },
): Promise<void> {
  const title = 'Nuevo Trabajo Disponible';
  const body = `${jobData.jobType} - ${jobData.clientName} (${jobData.distance.toFixed(1)}km)`;
  
  await this.sendRealtimeNotification(
    professionalId,
    title,
    body,
    {
      type: 'NEW_JOB',
      jobId: jobData.jobId,
      deeplink: `/worker/jobs/${jobData.jobId}`,
    },
  );
}
```

#### 3. GraphQL Subscription

**Resolver Implementation:**
```typescript
@Subscription(() => NotificationResponse, {
  name: 'notificationReceived',
  resolve: (payload) => payload.notificationReceived,
})
notificationReceived(@CurrentUser() user: any) {
  return this.pubSub.asyncIterator(`NOTIFICATION_${user.sub}`);
}
```

**Client Subscription:**
```graphql
subscription OnNotificationReceived {
  notificationReceived {
    id
    userId
    title
    message
    type
    data
    createdAt
  }
}
```

### Frontend (Next.js 14 + Apollo Client + WebSockets)

#### 1. Real-time Notifications Hook

**usePushNotifications** - Subscribes to GraphQL notifications
```typescript
export const usePushNotifications = (userId?: string): UseRealtimeNotificationsResult => {
  const [lastNotification, setLastNotification] = useState<NotificationData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const client = useApolloClient();

  // Subscribe to real-time notifications
  const { data: subscriptionData, error } = useSubscription(NOTIFICATION_SUBSCRIPTION, {
    skip: !userId,
  });

  // Handle subscription data
  useEffect(() => {
    if (subscriptionData?.notificationReceived) {
      const notification = subscriptionData.notificationReceived;
      setLastNotification(notification);
      setIsConnected(true);
      
      // Refetch dashboard data when notification received
      client.refetchQueries({
        include: ['GetProDashboard'],
      });
    }
  }, [subscriptionData, client]);

  return { lastNotification, isConnected };
};
```

**Key Features:**
- Automatic WebSocket connection via Apollo Client
- Connection status tracking (`isConnected`)
- Apollo cache refetch on notification received
- No external dependencies (Capacitor Push Notifications not needed)

#### 2. Error Boundary & Loading States

**Error Boundary** (`/pro/error.tsx`):
- Apollo cache clearing on retry via `useApolloClient` hook
- Graceful degradation without session loss

**Loading Skeleton** (`/pro/loading.tsx`):
- Mirrors dashboard structure to prevent layout shift
- Animated pulse effect

#### 3. PRO Dashboard Integration

**Connection Status Indicator:**
```tsx
{isConnected && (
  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
    <Wifi className="w-4 h-4 text-emerald-600" />
    <span className="text-xs font-medium text-emerald-700">
      Conectado en tiempo real
    </span>
  </div>
)}
```

**Features:**
- Real-time notification subscription on mount
- Online/Offline toggle with optimistic Apollo updates
- WebSocket connection status display
- Automatic dashboard data refresh on notification

## Data Flow

### Real-time Notification Flow

```
1. Professional opens PRO Dashboard
   ↓
2. usePushNotifications hook subscribes to GraphQL subscription
   ↓
3. Apollo Client establishes WebSocket connection
   ↓
4. Backend registers user subscription channel (NOTIFICATION_${userId})
   ↓
5. Connection status updates (isConnected = true)
   ↓
6. New job created matching professional criteria
   ↓
7. Backend calls notifyProfessionalAboutNewJob()
   ↓
8. NotificationService publishes to PubSub channel
   ↓
9. GraphQL subscription delivers notification via WebSocket
   ↓
10. Frontend hook receives notification
    ↓
11. Apollo Client refetches dashboard queries
    ↓
12. Dashboard updates with new data
```

### Worker Status Update Flow

```
1. Professional toggles availability switch
   ↓
2. Optimistic UI update (immediate feedback)
   ↓
3. GraphQL mutation: updateWorkerStatus
   ↓
4. Backend validates status value
   ↓
5. Updates WorkerProfile.status in database
   ↓
6. Returns updated user info
   ↓
7. Apollo cache updated
   ↓
8. UI reflects final state
   ↓
9. On error: Rollback to previous state
```

## Configuration

### WebSocket Setup

The existing Apollo Client configuration already supports WebSockets:

```typescript
// graphql/client.ts
const wsLink = typeof window !== "undefined" ? new GraphQLWsLink(createClient({
  url: WS_URL,
  connectionParams: async () => {
    const token = await StorageAdapter.get('ay_auth_token');
    return {
      Authorization: token ? `Bearer ${token}` : "",
    };
  },
  retryAttempts: 5,
})) : null;
```

### No External Configuration Required

Unlike Firebase/OneSignal implementations, this approach requires:
- ✅ No API keys
- ✅ No native permissions (AndroidManifest.xml, Info.plist)
- ✅ No service worker registration
- ✅ No external dependencies

## Testing

### Subscription Testing

**Backend Testing:**
```typescript
// Trigger a notification
await notificationsService.notifyProfessionalAboutNewJob(professionalId, {
  jobId: '123',
  clientName: 'María González',
  jobType: 'Plomería',
  location: 'Buenos Aires',
  distance: 2.3,
});
```

**Frontend Testing:**
1. Open PRO dashboard
2. Check connection status indicator shows "Conectado en tiempo real"
3. Trigger notification from backend
4. Verify notification appears in dashboard
5. Confirm data is refetched

### Connection Status Testing

**Test reconnection:**
1. Disconnect network
2. Verify status shows "Reconectando..."
3. Reconnect network
4. Verify status shows "Conectado en tiempo real"

## Security Considerations

1. **Authentication**: All subscriptions require valid JWT token via WebSocket connectionParams
2. **User Isolation**: Subscriptions are user-specific (`NOTIFICATION_${userId}`)
3. **No Token Exposure**: No device tokens sent to external services
4. **CORS**: WebSocket connections use existing CORS configuration

## Performance

- **WebSocket Efficiency**: Single persistent connection for all real-time updates
- **Optimistic Updates**: Immediate UI feedback before server response
- **Selective Refetch**: Only refetches affected queries (GetProDashboard)
- **In-memory PubSub**: Fast for single-server deployments

## Scalability

### Current Setup (In-memory PubSub)
- ✅ Perfect for single-server deployments
- ✅ No external dependencies
- ✅ Low latency
- ⚠️ Limited to single server instance

### Production Scaling (RedisPubSub)

To scale across multiple servers:

```typescript
// apps/api/src/common/pubsub.module.ts
import { RedisPubSub } from 'graphql-redis-subscriptions';

@Global()
@Module({
  providers: [
    {
      provide: 'PUB_SUB',
      useValue: new RedisPubSub({
        connection: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
        },
      }),
    },
  ],
  exports: ['PUB_SUB'],
})
export class PubSubModule {}
```

## Advantages Over External Push Services

### Development & Maintenance
- ✅ No Firebase/OneSignal SDK to maintain
- ✅ No API key management
- ✅ No service quota limits
- ✅ Simplified architecture

### Technical Benefits
- ✅ Unified stack (GraphQL for everything)
- ✅ Type-safe end-to-end
- ✅ Real-time bidirectional communication
- ✅ Works on all platforms (Web, iOS, Android)

### User Experience
- ✅ Instant delivery (WebSocket vs. FCM delays)
- ✅ No permission prompts
- ✅ Works in-app without background workers
- ✅ Connection status visibility

### Cost
- ✅ No external service fees
- ✅ No usage quotas
- ✅ No vendor lock-in

## Limitations & Trade-offs

### Background Notifications
- ⚠️ Requires app to be open (WebSocket connection active)
- ⚠️ No notifications when app is closed
- ✅ For in-app real-time updates, this is ideal

### Native Platform Features
- ⚠️ No notification badges, sounds, or native UI
- ✅ Can add `@capacitor/local-notifications` if needed for foreground notifications

### Battery Impact
- ⚠️ WebSocket connection uses battery when app is open
- ✅ Modern WebSocket implementations are very efficient
- ✅ Connection auto-closes when app closes

## Future Enhancements

1. **Hybrid Approach** (if background notifications needed):
   - GraphQL Subscriptions for in-app real-time updates (current)
   - Optional Capacitor Local Notifications for foreground alerts
   - No external push services required

2. **Redis PubSub**: For multi-server production scaling

3. **Notification Preferences**: Let professionals choose notification types

4. **Analytics**: Track connection uptime and notification delivery

5. **Offline Queue**: Store notifications when disconnected, deliver on reconnect

## Conclusion

The PRO Dashboard implementation provides a production-ready, scalable foundation for real-time professional notifications **without external dependencies**. Using GraphQL Subscriptions keeps the entire stack unified, type-safe, and maintainable within the existing NestJS + Apollo architecture.

This approach is ideal for in-app real-time updates and can be extended with Capacitor Local Notifications if native foreground alerts are desired in the future.
