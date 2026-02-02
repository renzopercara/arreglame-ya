
import { useEffect, useState, useCallback } from 'react';
import { useApolloClient, useMutation, useSubscription } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { REGISTER_DEVICE_TOKEN } from '../graphql/queries';

// GraphQL Subscription for real-time notifications
const NOTIFICATION_SUBSCRIPTION = gql`
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
`;

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  data?: any;
}

interface UseRealtimeNotificationsResult {
  lastNotification: NotificationData | null;
  isConnected: boolean;
}

/**
 * Hook for real-time notifications via GraphQL Subscriptions
 * Replaces push notifications with WebSocket-based updates
 */
export const usePushNotifications = (userId?: string): UseRealtimeNotificationsResult => {
  const [lastNotification, setLastNotification] = useState<NotificationData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const client = useApolloClient();
  const [registerDeviceToken] = useMutation(REGISTER_DEVICE_TOKEN);

  // Subscribe to real-time notifications
  const { data: subscriptionData, error } = useSubscription(NOTIFICATION_SUBSCRIPTION, {
    skip: !userId,
    onComplete: () => {
      console.log('[Subscription] Notification subscription completed');
    },
    onError: (error) => {
      console.error('[Subscription] Error:', error);
      setIsConnected(false);
    },
  });

  // Handle subscription data
  useEffect(() => {
    if (subscriptionData?.notificationReceived) {
      const notification = subscriptionData.notificationReceived;
      console.log('[Subscription] Notification received:', notification);
      setLastNotification(notification);
      setIsConnected(true);
      
      // Refetch dashboard data when notification received
      client.refetchQueries({
        include: ['GetProDashboard'],
      });
    }
  }, [subscriptionData, client]);

  // Handle subscription errors
  useEffect(() => {
    if (error) {
      console.error('[Subscription] Connection error:', error);
      setIsConnected(false);
    }
  }, [error]);

  // Register device/session token on mount
  useEffect(() => {
    if (userId) {
      const registerSession = async () => {
        try {
          // Generate a session token (simple timestamp-based for web)
          const sessionToken = `web-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          await registerDeviceToken({
            variables: {
              token: sessionToken,
              platform: 'web',
            },
          });
          
          console.log('[Session] Registered with backend');
          setIsConnected(true);
        } catch (error) {
          console.error('[Session] Failed to register:', error);
        }
      };
      
      registerSession();
    }
  }, [userId, registerDeviceToken]);

  return { 
    lastNotification, 
    isConnected,
  };
};
