import { useAuth } from "@/context/authContext";
import { showToast } from "@/utils/toast/toast";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
  const [externalId, setExternalId] = useState("");
  const [password, setPassword] = useState("");
  const { onLogin, authState } = useAuth();

  const handleLogin = async () => {  // ← Make sure 'async' is here
    console.log("Attempting login with External ID:", externalId);

    // Validation
    if (!externalId.trim() || !password.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in both External ID and Password'
      });
      return;
    }
    console.log("External ID and Password provided.");

    if (!/^\d+$/.test(externalId)) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'External ID must contain numbers only'
      });
      return;
    }
    console.log("External ID format is valid.");

    if (password.length < 6) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Password must be at least 6 characters long'
      });
      return;
    }
    console.log("Password length is valid.");
    // Call the login function from context
    try {
      console.log("Calling onLogin from context...");
      if (onLogin) {
        await onLogin({
          external_id: externalId,
          password: password
        });
        console.log("onLogin call completed.");
      }
    } catch (error) {
      console.log("Login error:", error);
      showToast({
        type: 'error',
        title: 'Login Failed',
        message: 'An unexpected error occurred. Please try again.'
      });
    }
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
        editable={!authState?.isLoading}
        className="w-full p-3 border border-gray-300 rounded-lg bg-white mb-4"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!authState?.isLoading}
        className="w-full p-3 border border-gray-300 rounded-lg bg-white mb-6"
      />

      <Pressable
        onPress={handleLogin}
        disabled={authState?.isLoading}
        className={`px-4 py-3 rounded-lg ${
          authState?.isLoading ? 'bg-blue-300' : 'bg-blue-500 active:bg-blue-600'
        }`}
      >
        {authState?.isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-lg">Login</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}