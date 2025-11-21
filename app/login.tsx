import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
  const [externalId, setExternalId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
  if (!externalId.trim() || !password.trim()) {
    Alert.alert("Error", "Please fill in both External ID and Password");
    return;
  }
  if (!/^\d+$/.test(externalId)) {
      Alert.alert("Error", "External ID must contain numbers only");
      return;
    }

  if (password.length < 6) {
    Alert.alert("Error", "Password must be at least 6 characters long");
    return;
  }

    // Construct JSON payload
    const payload = {
      external_id: externalId,
      password: password,
    };

    // Log payload (for demonstration)
    console.log("Login payload:", payload);

    // Optional alert
    Alert.alert("Login Payload", JSON.stringify(payload));

    // send payload to backend (example URL)
  };

  return (
    <SafeAreaView
      className="flex-1 justify-center items-center bg-gray-100 px-5"
    >
      <Text className="text-2xl font-bold text-violet-500 mb-8">
        LEARNING MANAGEMENT SYSTEM
      </Text>

      <TextInput
        placeholder="External ID"
        value={externalId}
        onChangeText={setExternalId}
        keyboardType="numeric"
        className="w-full p-3 border border-gray-300 rounded-lg bg-white mb-4"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="w-full p-3 border border-gray-300 rounded-lg bg-white mb-6"
      />

      <Pressable
        onPress={handleLogin}
        className="bg-blue-500 px-4 py-3 rounded-lg hover:bg-blue-600"
      >
        <Text className="text-white font-bold text-lg">Login</Text>
      </Pressable>
    </SafeAreaView>
  );
}
