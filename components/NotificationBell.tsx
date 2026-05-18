import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useNotifications } from '@/context/NotificationContext';
import Toast from 'react-native-toast-message';
import { useNotificationListener } from '@/utils/hooks/useNotificationListener';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();

  useNotificationListener((data) => {
    Toast.show({
      type: 'info',
      text1: 'New Notification',
      text2: data.type === 'reply' ? 'Someone replied to your comment' : 'New reaction',
    });
  }, []);

  return (
    <View className="flex-1 bg-white">
      <View className="p-4 border-b border-gray-200">
        <Text className="text-xl font-bold">Notifications ({unreadCount})</Text>
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.notification_id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => markAsRead(item.notification_id)}
            className={`p-4 border-b border-gray-100 ${!(item as any).is_read ? 'bg-blue-50' : ''}`}
          >
            <Text className="font-semibold">{item.type}</Text>
            <Text className="text-gray-600 text-sm">{new Date(item.timestamp).toLocaleString()}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
