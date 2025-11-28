import { useAuth } from "@/context/authContext";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
interface User {
  user_id: number;
  external_id: string;
  full_name: string;
  role: string;
}

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
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex py-4 px-6 mt-4 bg-gray-100 ">
      <View className="mb-6">
        <Text className="text-3xl font-bold text-black py-4 rounded-full px-3">
          Settings
        </Text>
      </View>
      <View className="mb-6">
        <Text className="text-xl font-bold text-gray-800 mb-8 bg-white py-6 px-3 rounded-xl">
          User Information
        </Text>
        {user ? (
          <>
            <View className="bg-white rounded-xl shadow-md mb-7">
              <Text className="text-lg px-4 py-7 text-gray-600">
                Full Name: {user.full_name}
              </Text>
              <Text className="text-lg px-4 py-7 text-gray-600">
                External ID: {user.external_id}
              </Text>
              <Text className="text-lg px-4 py-7 text-gray-600">
                Role: {user.role}
              </Text>
            </View>
          </>
        ) : (
          <Text className="text-base">No user data available.</Text>
        )}
      </View>
      <View className="flex justify-start mt-">
        <Pressable
          onPress={handleLogout}
          className="bg-red-500 active:bg-red-600 rounded-xl py-4 px-6 items-center"
        >
          <Text className="text-white text-lg font-semibold">Logout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
