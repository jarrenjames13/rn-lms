import React from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useCombinedNotifications } from '@/utils/hooks/useCombinedNotifications';
import { postData } from '@/utils/fetcher';
import Toast from 'react-native-toast-message';

export default function NotificationScreen() {
  const { notifications, unreadCount, isConnected, isLoading, refetch } = useCombinedNotifications();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await postData('/notifications/mark-read', { notification_ids: [notificationId] });
      refetch();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to mark as read' });
    }
  };

  const markAllAsRead = async () => {
    try {
      await postData('/notifications/mark-all-read', {});
      refetch();
      Toast.show({ type: 'success', text1: 'All marked as read' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to mark all as read' });
    }
  };

  const renderNotification = ({ item }: any) => {
    const isUnread = !item.is_read;
    
    return (
      <TouchableOpacity
        onPress={() => markAsRead(item.notification_id)}
        className={`p-4 border-b border-gray-200 ${isUnread ? 'bg-blue-50' : 'bg-white'}`}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              {isUnread && <View className="w-2 h-2 bg-blue-500 rounded-full" />}
              <Text className="font-semibold text-base">
                {item.type === 'reply' ? '💬 New Reply' : '❤️ New Reaction'}
              </Text>
            </View>
            <Text className="text-gray-600 mt-1">
              {item.data?.message || 'Someone interacted with your content'}
            </Text>
            <Text className="text-gray-400 text-xs mt-2">
              {new Date(item.created_at || item.timestamp).toLocaleString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="p-4 border-b border-gray-200 bg-white">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold">Notifications</Text>
            <View className="flex-row items-center gap-2 mt-1">
              <Text className="text-gray-600">{unreadCount} unread</Text>
              <View className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            </View>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              className="bg-blue-500 px-4 py-2 rounded"
            >
              <Text className="text-white font-semibold">Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notifications List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-400 text-lg">No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.notification_id.toString()}
          renderItem={renderNotification}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}
