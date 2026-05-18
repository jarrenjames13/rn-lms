import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { notificationService, NotificationData } from '@/api/services/notificationService';
import { useAuth } from './authContext';

interface NotificationContextType {
  notifications: NotificationData[];
  unreadCount: number;
  markAsRead: (id: number) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    if (!user) return;

    notificationService.connect();

    const unsubscribe = notificationService.subscribe((data) => {
      setNotifications((prev) => [data, ...prev].slice(0, 50));
    });

    return () => {
      unsubscribe();
      notificationService.disconnect();
    };
  }, [user]);

  const markAsRead = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
