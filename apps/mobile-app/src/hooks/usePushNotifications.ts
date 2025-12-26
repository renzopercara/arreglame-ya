
import { useEffect, useState } from 'react';
import { NotificationAdapter, IPushMessage } from '../lib/adapters/notifications';

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
        // 1. Configurar Listeners antes de registrar
        NotificationAdapter.onRegistration((token) => {
          console.log('[Push] Token received:', token);
          setToken(token);
          if (userId) {
             // AquÃƒÂ­ llamarÃƒÂ­amos al backend para guardar el token
             // saveDeviceToken(userId, token);
             console.log(`[Backend] Token guardado para usuario ${userId}`);
          }
        });

        NotificationAdapter.onRegistrationError((err) => {
          console.error('[Push] Registration failed:', err);
        });

        NotificationAdapter.onMessageReceived((msg) => {
          console.log('[Push] Message received:', msg);
          setLastMessage(msg);
        });

        NotificationAdapter.onActionPerformed((action) => {
          console.log('[Push] Action performed:', action);
          // Navegar a la pantalla correspondiente segÃƒÂºn action.notification.data.jobId
        });

        // 2. Iniciar registro
        await NotificationAdapter.register();
      }
    } catch (e) {
      console.error('[Push] Init failed:', e);
    }
  };

  // Limpiar listeners al desmontar
  useEffect(() => {
    return () => {
      NotificationAdapter.removeAllListeners();
    };
  }, []);

  return { token, lastMessage, permission, initPush };
};
