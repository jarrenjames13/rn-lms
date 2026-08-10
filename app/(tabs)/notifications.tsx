import { getData, patchData } from "@/utils/fetcher";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type NotificationItem = {
  id: number;
  type: string;
  actor_name: string;
  reaction_type?: string | null;
  is_read: boolean;
  created_at: string;
  course_id?: number;
};

type NotificationResponse = {
  notifications: NotificationItem[];
  unread_count: number;
};

export default function Notifications() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await getData<NotificationResponse>("/notifications?page=1&per_page=50")).data,
    staleTime: 30_000,
  });

  const markAllRead = async () => {
    await patchData("/notifications/read-all");
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F7F5]">
      <View className="px-6 pt-4 pb-4 flex-row items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          onPress={() => router.replace("/(tabs)")}
          className="w-10 h-10 rounded-full bg-white border border-[#E8E2E9] items-center justify-center mr-3"
        >
          <Ionicons name="arrow-back" size={19} color="#6D4C9B" />
        </Pressable>
        <View>
          <Text className="text-3xl font-bold text-[#2D2633]">Notifications</Text>
          <Text className="text-sm text-[#756C7D] mt-1">Stay close to your learning progress</Text>
        </View>
        <View className="flex-1" />
        {!!data?.unread_count && (
          <Pressable onPress={markAllRead} accessibilityRole="button" accessibilityLabel="Mark all notifications as read">
            <Text className="text-sm font-semibold text-[#6D4C9B]">Mark all read</Text>
          </Pressable>
        )}
      </View>
      {isLoading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#6D4C9B" size="large" /></View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-8"><Ionicons name="cloud-offline-outline" size={48} color="#B8AFC0" /><Text className="text-[#756C7D] text-center mt-3">Notifications could not be loaded.</Text><Pressable onPress={() => refetch()} className="mt-4 bg-[#6D4C9B] rounded-xl px-5 py-3"><Text className="text-white font-semibold">Try again</Text></Pressable></View>
      ) : (
        <FlatList
          data={data?.notifications ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 20, paddingTop: 8, flexGrow: 1 }}
          ListEmptyComponent={<View className="flex-1 items-center justify-center py-20"><MaterialCommunityIcons name="bell-check-outline" size={56} color="#B8AFC0" /><Text className="text-lg font-bold text-[#2D2633] mt-4">All caught up</Text><Text className="text-sm text-[#756C7D] mt-1">You have no new notifications.</Text></View>}
          renderItem={({ item }) => (
            <View className={`bg-white rounded-2xl border border-[#E8E2E9] p-4 mb-3 ${item.is_read ? "opacity-70" : ""}`}>
              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-xl bg-[#F3EEFA] items-center justify-center mr-3"><Ionicons name={item.type === "reaction" ? "heart-outline" : "chatbubble-ellipses-outline"} size={20} color="#6D4C9B" /></View>
                <View className="flex-1"><Text className="text-sm text-[#2D2633]"><Text className="font-bold">{item.actor_name}</Text>{item.type === "reaction" ? " reacted to your comment." : " replied to your comment."}</Text><Text className="text-xs text-[#8A8190] mt-2">{new Date(item.created_at).toLocaleString()}</Text></View>
                {!item.is_read && <View className="w-2.5 h-2.5 rounded-full bg-[#B42318] mt-1" />}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
