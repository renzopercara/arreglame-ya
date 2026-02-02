# PRO Dashboard Implementation - ArreglaMe-Ya

## Overview

This document describes the complete implementation of the PRO Dashboard with real-time push notifications, error handling, and optimistic UI updates for the ArreglaMe-Ya platform.

## Architecture

### Backend (NestJS + Prisma + GraphQL)

#### 1. Database Schema (`apps/api/prisma/schema.prisma`)

**DeviceToken Model**
```prisma
model DeviceToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  platform  String   // "ios", "android", "web"
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### 2. NotificationService (`apps/api/src/notifications/notifications.service.ts`)

**Key Features:**
- Firebase Admin SDK integration (placeholder for easy provider swap)
- Device token management
- Push notification sending to specific users
- Professional job notification system

**Main Methods:**
- `registerDeviceToken(userId, token, platform)`: Register a device for push notifications
- `getActiveDeviceTokens(userId)`: Get all active devices for a user
- `sendPushNotificationToUser(userId, title, body, data)`: Send push to user's devices
- `notifyProfessionalAboutNewJob(professionalId, jobData)`: Specialized method for job notifications

#### 3. GraphQL Mutations

**registerDeviceToken**
```graphql
mutation RegisterDeviceToken($token: String!, $platform: String) {
  registerDeviceToken(token: $token, platform: $platform)
}
```

**updateWorkerStatus**
```graphql
mutation UpdateWorkerStatus($status: String!) {
  updateWorkerStatus(status: $status) {
    id
    workerStatus
  }
}
```

### Frontend (Next.js 14 + Apollo Client + Capacitor)

#### 1. Enhanced Push Notifications Hook (`apps/mobile-app/src/hooks/usePushNotifications.ts`)

**Integration Features:**
- Automatic device token registration with backend
- Apollo Client cache refetch on notification received
- Platform detection (iOS, Android, Web)
- Error handling with permission state tracking

**Usage:**
```typescript
const { token, lastMessage, permission, initPush } = usePushNotifications(user?.id);

useEffect(() => {
  if (user?.id) {
    initPush();
  }
}, [user?.id, initPush]);
```

#### 2. Permission Banner Component (`apps/mobile-app/src/components/PushPermissionBanner.tsx`)

**Purpose:**
- Warn professionals about denied notification permissions
- Explain the impact on job opportunities
- Dismissible with persistent state

**Features:**
- Clear, user-friendly messaging
- Lucide icons for visual communication
- Tailwind styling consistent with app design

#### 3. Error Boundary (`apps/mobile-app/src/app/pro/error.tsx`)

**Capabilities:**
- Graceful error handling for PRO routes
- Apollo Store clearing on retry
- User-friendly error messages
- Development mode error details

**Key Features:**
- Retry mechanism with cache clearing
- Fallback navigation to home
- Visual consistency with app theme

#### 4. Loading Skeleton (`apps/mobile-app/src/app/pro/loading.tsx`)

**Design:**
- Mirrors actual dashboard structure
- Animated pulse effect
- Three metric cards skeleton
- Job cards skeleton (3 items)
- No jarring layout shifts

#### 5. PRO Dashboard Page (`apps/mobile-app/src/app/pro/home/page.tsx`)

**Enhanced Features:**

1. **Push Notification Integration**
   - Initializes on component mount
   - Registers device token with backend
   - Listens for new job notifications
   - Auto-refetches dashboard data

2. **Online/Offline Toggle**
   - Optimistic Apollo updates
   - Immediate UI feedback
   - GraphQL mutation with error handling
   - Rollback on failure

3. **Permission Handling**
   - Shows banner when permissions denied
   - Dismissible but persistent warning
   - Clear impact messaging

4. **Error Resilience**
   - Error boundary catches failures
   - Retry with cache clearing
   - No session disruption

## Data Flow

### Push Notification Flow

```
1. User opens PRO Dashboard
   ↓
2. usePushNotifications.initPush() called
   ↓
3. Capacitor requests native permissions
   ↓
4. On granted: Register with platform (FCM/APNS)
   ↓
5. Receive device token
   ↓
6. Send token to backend via GraphQL mutation
   ↓
7. Backend stores in DeviceToken table
   ↓
8. New job created matching professional criteria
   ↓
9. Backend calls notifyProfessionalAboutNewJob()
   ↓
10. NotificationService resolves active device tokens
    ↓
11. Firebase Admin SDK sends push notification
    ↓
12. Professional receives notification
    ↓
13. Hook triggers Apollo Client refetch
    ↓
14. Dashboard updates with new data
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

### Native Permissions (Manual Setup Required)

#### Android (`android/app/src/main/AndroidManifest.xml`)
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

#### iOS (`ios/App/App/Info.plist`)
```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

### Firebase Setup (Production)

1. Initialize Firebase Admin SDK in NotificationService
2. Add Firebase credentials to environment variables
3. Update FirebasePushProvider with actual implementation
4. Configure FCM server key for Android
5. Upload APNS certificate for iOS

## Testing

### Push Notifications

**Local Testing (Web):**
```javascript
// In browser console
window.simulatePush('Nuevo Trabajo', 'Plomería - María González (2.3km)', {
  type: 'NEW_JOB',
  jobId: '123',
  deeplink: '/worker/jobs/123'
});
```

**Native Testing:**
- Use Firebase Console to send test notifications
- Verify token is stored in database
- Check notification appears in device tray
- Confirm dashboard refetches data

### Error Boundaries

1. Throw error in PRO dashboard component
2. Verify error boundary catches and displays
3. Test retry mechanism
4. Confirm cache is cleared on retry

### Loading States

1. Add artificial delay to GraphQL query
2. Verify skeleton loader appears
3. Confirm smooth transition to actual content
4. Check no layout shift occurs

## Security Considerations

1. **Device Token Privacy**: Tokens are user-specific and deleted on account deletion (Cascade)
2. **Mutation Authentication**: All mutations require valid JWT token
3. **Status Validation**: Worker status values are validated before database update
4. **Permission Handling**: App gracefully handles denied permissions without breaking UX

## Performance

- **Optimistic Updates**: Immediate UI feedback before server response
- **Selective Refetch**: Only refetches `GetProDashboard` query, not entire cache
- **Efficient Queries**: Dashboard query fetches only required fields
- **Skeleton Loading**: Reduces perceived load time

## Scalability

- **Provider Abstraction**: Easy to swap Firebase for OneSignal, Pusher, etc.
- **Batch Notifications**: NotificationService can send to multiple tokens at once
- **Token Management**: Active flag allows disabling tokens without deletion
- **Platform Agnostic**: Works on iOS, Android, and Web

## Known Limitations

1. Firebase Admin SDK is placeholder - requires production setup
2. Job matching logic not implemented (will need to be added)
3. Geolocation integration mentioned but not fully implemented
4. No notification history UI (data stored in Notification model)

## Future Enhancements

1. **Rich Notifications**: Add images, actions, and deep links
2. **Notification Preferences**: Let professionals choose notification types
3. **Silent Updates**: Background data sync without user notification
4. **Analytics**: Track notification open rates and conversion
5. **A/B Testing**: Test different notification copy for engagement

## Maintenance

### Adding New Notification Types

1. Add type to NotificationService
2. Create specialized method (like `notifyProfessionalAboutNewJob`)
3. Add notification template
4. Update frontend to handle notification action

### Updating Firebase Configuration

1. Update environment variables
2. Replace FirebasePushProvider implementation
3. Test with Firebase Console
4. Deploy to production

## Conclusion

The PRO Dashboard implementation provides a production-ready, scalable foundation for real-time professional notifications. The architecture follows best practices for separation of concerns, error handling, and user experience.
