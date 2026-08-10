import { AppHeader, AppScreen, Card, IconButton, StateView } from "@/components/ui";
import { useAppTheme } from "@/theme";
import { getData, patchData } from "@/utils/fetcher";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

type NotificationItem = { id: number; type: string; actor_name: string; reaction_type?: string | null; is_read: boolean; created_at: string; course_id?: number };
type NotificationResponse = { notifications: NotificationItem[]; unread_count: number };

export default function Notifications() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useAppTheme();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({ queryKey: ["notifications"], queryFn: async () => (await getData<NotificationResponse>("/notifications?page=1&per_page=50")).data, staleTime: 30_000 });
  const markAllRead = async () => { await patchData("/notifications/read-all"); await queryClient.invalidateQueries({ queryKey: ["notifications"] }); };

  if (isLoading) return <AppScreen><StateView icon="notifications-outline" title="Loading updates" message="Checking your course activity." /></AppScreen>;
  if (isError) return <AppScreen><StateView icon="cloud-offline-outline" title="Updates unavailable" message="Notifications could not be loaded. Check your connection and try again." actionLabel="Try again" onAction={() => void refetch()} /></AppScreen>;

  return <AppScreen>
    <FlatList
      data={data?.notifications ?? []}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<AppHeader eyebrow="LEARNING ACTIVITY" title="Notifications" subtitle="Updates from your courses and discussions." action={<View style={styles.headerActions}><IconButton icon="arrow-back" label="Back to Home" onPress={() => router.replace("/(tabs)")} />{data?.unread_count ? <Pressable accessibilityRole="button" accessibilityLabel="Mark all notifications as read" disabled={isFetching} onPress={() => void markAllRead()}><Text style={[styles.markRead, { color: theme.primary }]}>Mark all read</Text></Pressable> : null}</View>} />}
      ListEmptyComponent={<StateView icon="checkmark-done-outline" title="All caught up" message="You have no new course activity." />}
      renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`${item.actor_name} ${item.type}`} onPress={() => item.course_id ? router.push("/(course_tabs)/overview") : undefined}><Card style={[styles.notification, item.is_read && styles.read]}><View style={[styles.typeIcon, { backgroundColor: item.type === "reaction" ? theme.surfaceAccent : theme.surfaceMuted }]}><Ionicons name={item.type === "reaction" ? "heart-outline" : "chatbubble-ellipses-outline"} size={20} color={item.type === "reaction" ? theme.school : theme.primary} /></View><View style={styles.copy}><Text style={[styles.message, { color: theme.text }]}><Text style={styles.actor}>{item.actor_name}</Text>{item.type === "reaction" ? " reacted to your comment." : " replied to your comment."}</Text><Text style={[styles.date, { color: theme.textMuted }]}>{new Date(item.created_at).toLocaleString()}</Text></View>{!item.is_read ? <View accessibilityLabel="Unread" style={[styles.unread, { backgroundColor: theme.school }]} /> : null}</Card></Pressable>}
    />
  </AppScreen>;
}

const styles = StyleSheet.create({ content: { padding: 20, paddingBottom: 36, flexGrow: 1 }, headerActions: { flexDirection: "row", alignItems: "center", gap: 10 }, markRead: { fontSize: 12, fontWeight: "800", maxWidth: 74, textAlign: "right" }, notification: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 }, read: { opacity: 0.68 }, typeIcon: { width: 42, height: 42, borderRadius: 14, justifyContent: "center", alignItems: "center" }, copy: { flex: 1 }, message: { fontSize: 14, lineHeight: 20 }, actor: { fontWeight: "800" }, date: { fontSize: 12, marginTop: 6 }, unread: { width: 9, height: 9, borderRadius: 5, marginTop: 4 },
});
