import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSSENotifications } from '@/utils/hooks/useSSENotifications';
import { useNotificationListener } from '@/utils/hooks/useNotificationListener';

export default function NotificationDebug() {
  const { notifications, unreadCount, isConnected, clearAll } = useSSENotifications();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  useNotificationListener((data) => {
    addLog(`Received: ${data.type} (ID: ${data.notification_id})`);
  }, []);

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-4">SSE Debug Panel</Text>
      
      {/* Connection Status */}
      <View className="mb-4 p-4 bg-gray-100 rounded">
        <Text className="font-semibold">Connection Status</Text>
        <Text className={isConnected ? 'text-green-600' : 'text-red-600'}>
          {isConnected ? '✓ Connected' : '✗ Disconnected'}
        </Text>
      </View>

      {/* Stats */}
      <View className="mb-4 p-4 bg-gray-100 rounded">
        <Text className="font-semibold">Statistics</Text>
        <Text>Total Notifications: {notifications.length}</Text>
        <Text>Unread Count: {unreadCount}</Text>
      </View>

      {/* Actions */}
      <TouchableOpacity
        onPress={clearAll}
        className="bg-red-500 p-3 rounded mb-4"
      >
        <Text className="text-white text-center font-semibold">Clear All</Text>
      </TouchableOpacity>

      {/* Event Logs */}
      <View className="mb-4">
        <Text className="font-semibold mb-2">Event Log</Text>
        <View className="bg-black p-2 rounded">
          {logs.length === 0 ? (
            <Text className="text-gray-400">No events yet...</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} className="text-green-400 text-xs font-mono">
                {log}
              </Text>
            ))
          )}
        </View>
      </View>

      {/* Notifications List */}
      <View>
        <Text className="font-semibold mb-2">Notifications</Text>
        {notifications.length === 0 ? (
          <Text className="text-gray-500">No notifications</Text>
        ) : (
          notifications.map((notif) => (
            <View
              key={notif.notification_id}
              className="p-3 mb-2 bg-gray-50 rounded border border-gray-200"
            >
              <Text className="font-semibold">ID: {notif.notification_id}</Text>
              <Text>Type: {notif.type}</Text>
              <Text className="text-xs text-gray-500">{notif.timestamp}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
