import React from 'react';
import { View, Text } from 'react-native';
import { useSSENotifications } from '@/utils/hooks/useSSENotifications';

interface NotificationBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showZero?: boolean;
}

export function NotificationBadge({ size = 'medium', showZero = false }: NotificationBadgeProps) {
  const { unreadCount } = useSSENotifications();

  if (unreadCount === 0 && !showZero) return null;

  const sizeClasses = {
    small: 'w-4 h-4 text-[10px]',
    medium: 'w-5 h-5 text-xs',
    large: 'w-6 h-6 text-sm',
  };

  return (
    <View className={`${sizeClasses[size]} bg-red-500 rounded-full items-center justify-center`}>
      <Text className="text-white font-bold">
        {unreadCount > 99 ? '99+' : unreadCount}
      </Text>
    </View>
  );
}

// Usage in tab bar:
// <TabBarIcon name="bell" />
// <NotificationBadge size="small" />
