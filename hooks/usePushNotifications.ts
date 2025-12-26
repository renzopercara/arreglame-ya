
import { useEffect, useState } from 'react';
import { NotificationAdapter, IPushMessage } from '../lib/adapters/notifications.ts';

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

  const initPush = async () => {
    try {
      const granted = await NotificationAdapter.requestPermission();
      setPermission(granted ? 'granted' : 'denied');
      if (granted) {
        NotificationAdapter.onRegistration((t) => setToken(t));
        NotificationAdapter.onMessageReceived((msg) => setLastMessage(msg));
        await NotificationAdapter.register();
      }
    } catch (e) {
      console.error('[Push] Init failed:', e);
    }
  };

  return { token, lastMessage, permission, initPush };
};
