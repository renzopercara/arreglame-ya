
import React, { useEffect } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications.ts';
import { AppNotification } from '../types.ts';

interface PushControllerProps {
  userId: string;
  onNotificationReceived: (n: AppNotification) => void;
}

export const PushController: React.FC<PushControllerProps> = ({ userId, onNotificationReceived }) => {
  const { initPush, lastMessage } = usePushNotifications(userId);

  useEffect(() => {
    if (userId) {
      initPush();
    }
  }, [userId, initPush]);

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

  return null;
};
