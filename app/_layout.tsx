import { AuthProvider, useAuth } from "@/context/authContext";
import { ToastConfig } from "@/utils/toast/toastConfig";
import { registerForPushNotifications } from "@/api/services/pushNotifications";
import { sseService } from "@/api/services/sseService";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import Toast from "react-native-toast-message";
import { AppThemeProvider, useAppTheme } from "@/theme";
import "../global.css";

const RootLayoutNav = React.memo(function RootLayoutNav() {
  const { authState } = useAuth();
  const queryClient = useQueryClient();
  const { isDark, theme } = useAppTheme();

  useEffect(() => {
    if (authState?.success !== true) return;

    let subscription: { remove: () => void } | undefined;
    registerForPushNotifications()
      .then((registered) => {
        subscription = registered;
      })
      .catch((error) => {
        if (__DEV__) console.warn("Push notification registration failed", error);
      });

    return () => subscription?.remove();
  }, [authState?.success]);

  useEffect(() => {
    if (authState?.success !== true) {
      sseService.disconnect();
      queryClient.clear();
      return;
    }
    void sseService.connect();
    const unsubscribe = sseService.onNotification(() => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });
    return () => {
      unsubscribe();
      sseService.disconnect();
    };
  }, [authState?.success, queryClient]);

  if (authState?.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
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
    <AppThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <RootLayoutNav />
          <Toast config={ToastConfig} />
        </QueryClientProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}
