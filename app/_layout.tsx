import { AuthProvider, useAuth } from "@/context/authContext";
import { ToastConfig } from "@/utils/toast/toastConfig";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import Toast from "react-native-toast-message";
import "../global.css";

const RootLayoutNav = React.memo(function RootLayoutNav() {
  const { authState } = useAuth();

  if (authState?.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Protected guard={authState?.success !== true}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={authState?.success === true}>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false, title: "LMS" }}
          />
          <Stack.Screen
            name="(course_tabs)"
            options={{ headerShown: false, title: "Course" }}
          />
          <Stack.Screen
            name="quiz_taking"
            options={{ headerShown: false, title: "Take Quiz" }}
          />
          <Stack.Screen
            name="exam_taking"
            options={{ headerShown: false, title: "Take Exam" }}
          />
        </Stack.Protected>
      </Stack>
    </>
  );
});

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
        <Toast config={ToastConfig} />
      </QueryClientProvider>
    </AuthProvider>
  );
}
