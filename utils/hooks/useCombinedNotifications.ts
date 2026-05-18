import { useQuery } from '@tanstack/react-query';
import { getData } from '@/utils/fetcher';
import { useSSENotifications } from './useSSENotifications';

interface HistoricalNotification {
  notification_id: number;
  user_id: number;
  type: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

interface NotificationsResponse {
  notifications: HistoricalNotification[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export const useCombinedNotifications = (page = 1, perPage = 20) => {
  // Get real-time notifications via SSE
  const { notifications: realtimeNotifs, unreadCount, isConnected } = useSSENotifications();

  // Fetch historical notifications
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', page, perPage],
    queryFn: async () => {
      const response = await getData<NotificationsResponse>(
        '/notifications',
        { page, per_page: perPage }
      );
      return response.data;
    },
  });

  // Merge real-time with historical (deduplicate by ID)
  const allNotifications = [
    ...realtimeNotifs,
    ...(data?.notifications || []),
  ].filter((notif, index, self) =>
    index === self.findIndex((n) => n.notification_id === notif.notification_id)
  );

  return {
    notifications: allNotifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    refetch,
    pagination: data ? {
      total: data.total,
      page: data.page,
      perPage: data.per_page,
      totalPages: data.total_pages,
    } : null,
  };
};
