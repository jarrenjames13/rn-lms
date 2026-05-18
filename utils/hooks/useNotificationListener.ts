import { useEffect } from 'react';
import { notificationService, NotificationData } from '@/api/services/notificationService';

export const useNotificationListener = (
  callback: (data: NotificationData) => void,
  deps: any[] = []
) => {
  useEffect(() => {
    const unsubscribe = notificationService.subscribe(callback);
    return unsubscribe;
  }, deps);
};
