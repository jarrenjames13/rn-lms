import { AuthProvider, useAuth } from "@/context/authContext";
import { ToastConfig } from "@/utils/toast/toastConfig";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import Toast from "react-native-toast-message";

import "../global.css";

function RootLayoutNav() {
  const { authState, onLogout } = useAuth();

  // Show loading screen while checking auth
  if (authState?.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <React.Fragment>
      <StatusBar style="auto" />
      <Stack>
        {/* Public routes - accessible when NOT authenticated */}
        <Stack.Protected guard={authState?.success !== true}>
          <Stack.Screen
            name="login"
            options={{
              headerShown: false,
            }}
          />
        </Stack.Protected>

        {/* Protected routes - accessible when authenticated */}
        <Stack.Protected guard={authState?.success === true}>
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              title: "LMS",
            }}
          />
        </Stack.Protected>
      </Stack>

    </React.Fragment>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
      <Toast config={ToastConfig} />
    </AuthProvider>
  );
}