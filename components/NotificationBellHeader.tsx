import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSSENotifications } from '@/utils/hooks/useSSENotifications';

export function NotificationBellHeader() {
  const router = useRouter();
  const { unreadCount } = useSSENotifications();

  return (
    <TouchableOpacity
      onPress={() => router.push('/notifications')}
      className="relative"
    >
      <Ionicons name="notifications-outline" size={28} color="#374151" />
      {unreadCount > 0 && (
        <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
          <Text className="text-white text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
