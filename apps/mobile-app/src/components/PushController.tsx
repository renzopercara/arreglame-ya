
import React, { useEffect } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { AppNotification } from '../types';

interface PushControllerProps {
  userId: string;
  onNotificationReceived: (n: AppNotification) => void;
}

/**
 * Este componente invisible se encarga de inicializar el sistema Push
 * cuando el usuario se loguea, y puentea los mensajes nativos
 * hacia el sistema de notificaciones de la UI (AppNotification).
 */
export const PushController: React.FC<PushControllerProps> = ({ userId, onNotificationReceived }) => {
  const { initPush, lastMessage } = usePushNotifications(userId);

  // Inicializar al montar si hay usuario
  useEffect(() => {
    if (userId) {
      initPush();
    }
  }, [userId]);

  // Reaccionar a mensajes entrantes
  useEffect(() => {
    if (lastMessage) {
      onNotificationReceived({
        id: lastMessage.id,
        toUserId: userId,
        title: lastMessage.title,
        message: lastMessage.body,
        type: 'info',
        timestamp: Date.now()
      });
    }
  }, [lastMessage, userId, onNotificationReceived]);

  return null; // Componente lógico, sin UI
};
