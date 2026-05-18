import { useEffect, useState, useCallback } from 'react';
import { notificationService, NotificationData } from '@/api/services/notificationService';

export const useSSENotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const connect = async () => {
      try {
        await notificationService.connect();
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to connect to notifications:', error);
      }
    };

    connect();

    const unsubscribe = notificationService.subscribe((data) => {
      setNotifications((prev) => [data, ...prev].slice(0, 50));
    });

    return () => {
      unsubscribe();
      notificationService.disconnect();
      setIsConnected(false);
    };
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  return { notifications, unreadCount, isConnected, clearAll };
};
