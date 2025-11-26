import { useAuth } from "@/context/authContext";
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
interface User{
  user_id: number;
  external_id: string;
  full_name: string;
  role: string;
}

export default function Settings() {
    const { onLogout } = useAuth();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
          try {
            const userData = await SecureStore.getItemAsync('user');
            if (userData) {
              setUser(JSON.parse(userData));
            }
          } catch (error) {
            console.log("Error fetching user data:", error);
          }
        }
        fetchUser();
    }, []);

    const handleLogout = async () => {
        try {
            await onLogout?.();
        } catch (error) {
            console.log("Logout error:", error);
        }
    };

  return (
    <SafeAreaView
      className="flex py-4 px-6 mt-4 bg-gray-100 "
    >
      <View className="mb-6">
        <Text className="text-3xl font-bold text-black py-4 rounded-full px-3">
          Settings
        </Text>
      </View>
    <View className="mb-6">
      <Text className="text-xl font-bold text-gray-800 mb-8 bg-white py-6 px-3 rounded-xl">User Information</Text>
      {user ? (
        <>
        <View className="bg-white rounded-xl shadow-md mb-7">
          <Text className="text-lg px-4 py-7 text-gray-600">Full Name: {user.full_name}</Text>
            <Text className="text-lg px-4 py-7 text-gray-600">External ID: {user.external_id}</Text>
            <Text className="text-lg px-4 py-7 text-gray-600">Role: {user.role}</Text>
        </View>
        </>
      ) : (
        <Text className="text-base">No user data available.</Text>
      )}
    </View>
      <View className="flex justify-start mt-">
        <Pressable onPress={handleLogout} className="bg-red-500 rounded-xl py-4 px-6 items-center">
          <Text className="text-white text-lg font-semibold">Logout</Text>
        </Pressable>
      </View>
    </SafeAreaView>

  );
}
