'use client';

import { useQuery, useMutation } from '@apollo/client/react';
import {
  GET_NOTIFICATIONS,
  GET_UNREAD_COUNT,
  MARK_NOTIFICATION_AS_READ,
  MARK_ALL_AS_READ,
  DELETE_NOTIFICATION,
} from '@/graphql/queries';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  data?: any;
  createdAt: string;
}

export function useNotifications(limit: number = 20) {
  const { data, loading, error, refetch } = useQuery<{
    getNotifications: Notification[];
  }>(GET_NOTIFICATIONS, {
    variables: { limit },
    pollInterval: 30000, // Poll every 30 seconds
  });

  const { data: unreadData, refetch: refetchUnread } = useQuery<{
    getUnreadCount: { count: number };
  }>(GET_UNREAD_COUNT, {
    pollInterval: 30000,
  });

  const [markAsRead] = useMutation(MARK_NOTIFICATION_AS_READ, {
    onCompleted: () => {
      refetch();
      refetchUnread();
    },
  });

  const [markAllAsRead] = useMutation(MARK_ALL_AS_READ, {
    onCompleted: () => {
      refetch();
      refetchUnread();
    },
  });

  const [deleteNotification] = useMutation(DELETE_NOTIFICATION, {
    onCompleted: () => {
      refetch();
      refetchUnread();
    },
  });

  return {
    notifications: data?.getNotifications || [],
    unreadCount: unreadData?.getUnreadCount?.count || 0,
    loading,
    error,
    refetch,
    markAsRead: (notificationId: string) =>
      markAsRead({ variables: { notificationId } }),
    markAllAsRead: () => markAllAsRead(),
    deleteNotification: (notificationId: string) =>
      deleteNotification({ variables: { notificationId } }),
  };
}
