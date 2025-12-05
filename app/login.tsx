import { useAuth } from "@/context/authContext";
import { showToast } from "@/utils/toast/toast";
import { AntDesign } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [externalId, setExternalId] = useState("");
  const [password, setPassword] = useState("");
  const { onLogin, authState } = useAuth();

  const handleLogin = async () => {
    // Validation
    if (!externalId.trim() || !password.trim()) {
      showToast({
        type: "error",
        title: "Validation Error",
        message: "Please fill in both External ID and Password",
      });
      return;
    }

    try {
      if (onLogin) {
        await onLogin({
          external_id: externalId,
          password: password,
        });
      }
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Login Failed",
        message: error.message || "An unexpected error occurred during login.",
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-gray-100 px-5">
      <Text className="text-2xl font-bold text-red-700 mb-8 text-center">
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

      <View className="w-full relative mb-6">
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!authState?.isLoading}
          className="w-full p-3 pr-12 border border-gray-300 rounded-lg bg-white"
        />
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-3"
          disabled={authState?.isLoading}
        >
          <AntDesign
            name={showPassword ? "eye" : "eye-invisible"}
            size={20}
            color="gray"
          />
        </Pressable>
      </View>

      <Pressable
        onPress={handleLogin}
        disabled={authState?.isLoading}
        className={`w-full px-4 py-3 rounded-lg ${
          authState?.isLoading
            ? "bg-blue-300"
            : "bg-blue-500 active:bg-blue-600"
        }`}
      >
        {authState?.isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-lg text-center">
            Login
          </Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}
