import { getData, patchData } from "@/utils/fetcher";
import { queryOptions } from "@tanstack/react-query";

export type NotificationItem = {
  id: number;
  type: string;
  actor_name: string;
  reaction_type?: string | null;
  is_read: boolean;
  created_at: string;
  course_id?: number;
  instance_id?: number;
  module_id?: number;
};

export type NotificationResponse = {
  notifications: NotificationItem[];
  unread_count: number;
};

export const notificationsQueryKey = ["notifications"] as const;

export const createNotificationsOptions = () =>
  queryOptions({
    queryKey: notificationsQueryKey,
    queryFn: async () =>
      (await getData<NotificationResponse>("/notifications?page=1&per_page=50")).data,
    staleTime: 30_000,
  });

export const markNotificationsRead = (notificationIds: number[]) =>
  patchData("/notifications/read", { notification_ids: notificationIds });

export const markAllNotificationsRead = () =>
  patchData("/notifications/read-all");
