import { useAuth } from "@/context/authContext";
import { showToast } from "@/utils/toast/toast";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
    if (!externalId.trim() || !password.trim()) {
      showToast({
        type: "error",
        title: "Missing information",
        message: "Please enter both your External ID and password.",
      });
      return;
    }

    try {
      await onLogin?.({
        external_id: externalId,
        password,
      });
    } catch (error: any) {
      showToast({
        type: "error",
        title: "Login failed",
        message: error.message || "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center px-6"
      >
        {/* App Title */}
        <View className="mb-10 items-center">
          <Text className="text-3xl font-extrabold text-violet-600">
            AURORA LMS
          </Text>
          <Text className="text-gray-500 mt-2 text-center">
            Sign in to continue learning
          </Text>
        </View>

        {/* Login Card */}
        <View className="bg-white rounded-2xl shadow-md px-6 py-8">
          {/* External ID */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              External ID
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-3 bg-gray-50">
              <Ionicons name="person-outline" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Enter your External ID"
                value={externalId}
                onChangeText={setExternalId}
                keyboardType="numeric"
                editable={!authState?.isLoading}
                className="flex-1 px-3 py-3 text-base text-gray-800"
              />
            </View>
          </View>

          {/* Password */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Password
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-3 bg-gray-50">
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!authState?.isLoading}
                className="flex-1 px-3 py-3 text-base text-gray-800"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                disabled={authState?.isLoading}
                hitSlop={10}
              >
                <AntDesign
                  name={showPassword ? "eye" : "eye-invisible"}
                  size={20}
                  color="#6B7280"
                />
              </Pressable>
            </View>
          </View>

          {/* Login Button */}
          <Pressable
            onPress={handleLogin}
            disabled={authState?.isLoading}
            className={`rounded-xl py-4 items-center ${
              authState?.isLoading
                ? "bg-red-300"
                : "bg-red-500 active:bg-red-600"
            }`}
          >
            {authState?.isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Sign In</Text>
            )}
          </Pressable>
        </View>

        {/* Footer */}
        <Text className="text-center text-gray-400 text-xs mt-6">
          © {new Date().getFullYear()} AURORA LMS
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
