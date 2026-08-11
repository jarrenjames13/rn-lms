import {
  createNotificationsOptions,
  markAllNotificationsRead,
  markNotificationsRead,
  notificationsQueryKey,
  type NotificationItem,
  type NotificationResponse,
} from "@/api/QueryOptions/notificationsOptions";
import { AppHeader, AppScreen, Card, IconButton, StateView } from "@/components/ui";
import { useCourseStore } from "@/store/useCourseStore";
import { useAppTheme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

export default function Notifications() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();
  const { selectCourse } = useCourseStore();
  const { data, isLoading, isError, refetch } = useQuery(createNotificationsOptions());

  const markReadMutation = useMutation({
    scope: { id: "notification-read-state" },
    mutationFn: markNotificationsRead,
    onMutate: async (notificationIds) => {
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey });
      const previous = queryClient.getQueryData<NotificationResponse>(notificationsQueryKey);
      const ids = new Set(notificationIds);
      queryClient.setQueryData<NotificationResponse>(notificationsQueryKey, (current) => {
        if (!current) return current;
        const newlyRead = current.notifications.filter((item) => ids.has(item.id) && !item.is_read).length;
        return {
          ...current,
          unread_count: Math.max(0, current.unread_count - newlyRead),
          notifications: current.notifications.map((item) =>
            ids.has(item.id) ? { ...item, is_read: true } : item,
          ),
        };
      });
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationsQueryKey, context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationsQueryKey }),
  });

  const markAllMutation = useMutation({
    scope: { id: "notification-read-state" },
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey });
      const previous = queryClient.getQueryData<NotificationResponse>(notificationsQueryKey);
      queryClient.setQueryData<NotificationResponse>(notificationsQueryKey, (current) =>
        current
          ? {
              ...current,
              unread_count: 0,
              notifications: current.notifications.map((item) => ({ ...item, is_read: true })),
            }
          : current,
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationsQueryKey, context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationsQueryKey }),
  });

  const openNotification = (item: NotificationItem) => {
    if (!item.is_read) markReadMutation.mutate([item.id]);
    if (item.course_id && item.instance_id) {
      selectCourse(item.course_id, item.instance_id);
      router.push("/(course_tabs)/overview");
    }
  };

  if (isLoading) {
    return <AppScreen><StateView icon="notifications-outline" title="Loading updates" message="Checking your course activity." /></AppScreen>;
  }
  if (isError) {
    return <AppScreen><StateView icon="cloud-offline-outline" title="Updates unavailable" message="Notifications could not be loaded. Check your connection and try again." actionLabel="Try again" onAction={() => void refetch()} /></AppScreen>;
  }

  return (
    <AppScreen>
      <FlatList
        data={data?.notifications ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={(
          <AppHeader
            eyebrow="LEARNING ACTIVITY"
            title="Notifications"
            subtitle="Updates from your courses and discussions."
            action={(
              <View style={styles.headerActions}>
                <IconButton icon="arrow-back" label="Back to Home" onPress={() => router.replace("/(tabs)")} />
                {data?.unread_count ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Mark all notifications as read"
                    disabled={markAllMutation.isPending}
                    onPress={() => markAllMutation.mutate()}
                  >
                    <Text style={[styles.markRead, { color: theme.primary }]}>Mark all read</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          />
        )}
        ListEmptyComponent={<StateView icon="checkmark-done-outline" title="All caught up" message="You have no course activity yet." />}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.actor_name} ${item.type}${item.is_read ? "" : ", unread"}`}
            onPress={() => openNotification(item)}
          >
            <Card style={[styles.notification, item.is_read && styles.read]}>
              <View style={[styles.typeIcon, { backgroundColor: item.type === "reaction" ? theme.surfaceAccent : theme.surfaceMuted }]}>
                <Ionicons name={item.type === "reaction" ? "heart-outline" : "chatbubble-ellipses-outline"} size={20} color={item.type === "reaction" ? theme.school : theme.primary} />
              </View>
              <View style={styles.copy}>
                <Text style={[styles.message, { color: theme.text }]}>
                  <Text style={styles.actor}>{item.actor_name}</Text>
                  {item.type === "reaction" ? " reacted to your comment." : " replied to your comment."}
                </Text>
                <Text style={[styles.date, { color: theme.textMuted }]}>{new Date(item.created_at).toLocaleString()}</Text>
              </View>
              {!item.is_read ? <View accessibilityLabel="Unread" style={[styles.unread, { backgroundColor: theme.school }]} /> : null}
            </Card>
          </Pressable>
        )}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 36, flexGrow: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  markRead: { fontSize: 12, fontWeight: "800", maxWidth: 74, textAlign: "right" },
  notification: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  read: { opacity: 0.68 },
  typeIcon: { width: 42, height: 42, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  copy: { flex: 1 },
  message: { fontSize: 14, lineHeight: 20 },
  actor: { fontWeight: "800" },
  date: { fontSize: 12, marginTop: 6 },
  unread: { width: 9, height: 9, borderRadius: 5, marginTop: 4 },
});
