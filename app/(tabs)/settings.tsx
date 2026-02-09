import { useAuth } from "@/context/authContext";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
  const { onLogout, authState } = useAuth();

  const user = authState?.user;

  const handleLogout = async () => {
    try {
      await onLogout?.();
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  if (authState?.isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-8 bg-white">
          <View className="flex-row items-center mb-2">
            <View className="w-12 h-12 bg-red-600 rounded-full items-center justify-center mr-4">
              <Ionicons name="settings" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-3xl font-bold text-gray-900">Settings</Text>
              <Text className="text-sm text-gray-500 mt-1">
                Manage your account
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 py-4">
          {/* Profile Card */}
          <View className="mb-6">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              Profile Information
            </Text>

            {user ? (
              <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* User Avatar Section */}
                <View className="bg-purple-50 p-6 border-b border-gray-100">
                  <View className="items-center">
                    <View className="w-20 h-20 bg-red-600 rounded-full items-center justify-center mb-3 shadow-lg">
                      <Text className="text-white text-3xl font-bold">
                        {user.full_name?.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text className="text-xl font-bold text-gray-900">
                      {user.full_name}
                    </Text>
                    <View className="flex-row items-center mt-2 bg-white px-4 py-2 rounded-full">
                      <MaterialIcons
                        name="verified-user"
                        size={16}
                        color="#9333EA"
                      />
                      <Text className="text-sm font-medium text-purple-700 ml-2">
                        {user.role}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* User Details */}
                <View className="p-4">
                  <View className="py-4 border-b border-gray-100">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="person" size={16} color="#9CA3AF" />
                      <Text className="text-xs font-medium text-gray-500 ml-2">
                        FULL NAME
                      </Text>
                    </View>
                    <Text className="text-base font-semibold text-gray-900 ml-6">
                      {user.full_name}
                    </Text>
                  </View>

                  <View className="py-4 border-b border-gray-100">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="finger-print" size={16} color="#9CA3AF" />
                      <Text className="text-xs font-medium text-gray-500 ml-2">
                        USER ID
                      </Text>
                    </View>
                    <Text className="text-base text-gray-700 font-mono ml-6">
                      {user.external_id}
                    </Text>
                  </View>

                  <View className="py-4">
                    <View className="flex-row items-center mb-2">
                      <FontAwesome5
                        name="user-shield"
                        size={14}
                        color="#9CA3AF"
                      />
                      <Text className="text-xs font-medium text-gray-500 ml-2">
                        ROLE
                      </Text>
                    </View>
                    <View className="flex-row items-center ml-6">
                      <View className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                      <Text className="text-base font-semibold text-gray-900 capitalize">
                        {user.role}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View className="bg-white rounded-2xl p-8 items-center border border-gray-100">
                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Ionicons
                    name="person-circle-outline"
                    size={40}
                    color="#9CA3AF"
                  />
                </View>
                <Text className="text-base font-medium text-gray-500">
                  No user data available
                </Text>
                <Text className="text-sm text-gray-400 mt-1">
                  Please log in to view your profile
                </Text>
              </View>
            )}
          </View>

          {/* Actions Section */}
          <View className="mb-6">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              Account Actions
            </Text>

            <Pressable
              onPress={handleLogout}
              className="bg-red-600 active:bg-red-700 rounded-2xl py-4 px-6 shadow-lg"
              style={({ pressed }) => [
                {
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  opacity: pressed ? 0.95 : 1,
                },
              ]}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
                <Text className="text-white text-lg font-bold ml-2">
                  Sign Out
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Footer Info */}
          <View className="items-center py-6">
            <Text className="text-xs text-gray-400">Version 1.0.0</Text>
            <Text className="text-xs text-gray-400 mt-1">
              © 2026 All rights reserved
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
