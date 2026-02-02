
import { useEffect, useState, useCallback } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { NotificationAdapter, IPushMessage } from '../lib/adapters/notifications';
import { REGISTER_DEVICE_TOKEN } from '../graphql/queries';
import { Capacitor } from '@capacitor/core';

interface UsePushNotificationsResult {
  token: string | null;
  lastMessage: IPushMessage | null;
  permission: 'granted' | 'denied' | 'default';
  initPush: () => Promise<void>;
}

export const usePushNotifications = (userId?: string): UsePushNotificationsResult => {
  const [token, setToken] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<IPushMessage | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const client = useApolloClient();
  const [registerDeviceToken] = useMutation(REGISTER_DEVICE_TOKEN);

  const initPush = useCallback(async () => {
    try {
      const granted = await NotificationAdapter.requestPermission();
      setPermission(granted ? 'granted' : 'denied');

      if (granted) {
        // Configure listeners before registration
        NotificationAdapter.onRegistration(async (deviceToken) => {
          console.log('[Push] Token received:', deviceToken);
          setToken(deviceToken);
          
          if (userId) {
            try {
              // Determine platform
              const platform = Capacitor.isNativePlatform()
                ? Capacitor.getPlatform()
                : 'web';
              
              // Register token with backend
              await registerDeviceToken({
                variables: {
                  token: deviceToken,
                  platform,
                },
              });
              console.log(`[Backend] Device token registered for user ${userId}`);
            } catch (error) {
              console.error('[Backend] Failed to register token:', error);
            }
          }
        });

        NotificationAdapter.onRegistrationError((err) => {
          console.error('[Push] Registration failed:', err);
          setPermission('denied');
        });

        NotificationAdapter.onMessageReceived((msg) => {
          console.log('[Push] Message received:', msg);
          setLastMessage(msg);
          
          // Refetch dashboard data when notification received
          client.refetchQueries({
            include: ['GetProDashboard'],
          });
        });

        NotificationAdapter.onActionPerformed((action) => {
          console.log('[Push] Action performed:', action);
          // Navigate based on notification data
          // This can be handled in the component using this hook
        });

        // Start registration
        await NotificationAdapter.register();
      }
    } catch (e) {
      console.error('[Push] Init failed:', e);
      setPermission('denied');
    }
  }, [userId, registerDeviceToken, client]);

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      NotificationAdapter.removeAllListeners();
    };
  }, []);

  return { token, lastMessage, permission, initPush };
};
