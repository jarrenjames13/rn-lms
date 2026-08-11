import { AuthProvider, useAuth } from "@/context/authContext";
import { useToastConfig } from "@/utils/toast/toastConfig";
import { registerForPushNotifications } from "@/api/services/pushNotifications";
import { sseService } from "@/api/services/sseService";
import {
  createNotificationsOptions,
  notificationsQueryKey,
  type NotificationResponse,
} from "@/api/QueryOptions/notificationsOptions";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, usePathname, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { AppThemeProvider, useAppTheme } from "@/theme";
import { useExamStore } from "@/store/useExamStore";
import { useQuizStore } from "@/store/useQuizStore";
import { NativeUpdateProvider } from "@/components/NativeVersionGate";
import "../global.css";

const RootLayoutNav = React.memo(function RootLayoutNav() {
  const { authState } = useAuth();
  const queryClient = useQueryClient();
  const { isDark, theme } = useAppTheme();
  const router = useRouter();
  const pathname = usePathname();
  const quizAttemptStatus = useQuizStore((state) => state.status);
  const quizAttemptHydrated = useQuizStore((state) => state.hasHydrated);
  const examAttemptStatus = useExamStore((state) => state.status);
  const examAttemptHydrated = useExamStore((state) => state.hasHydrated);
  const seenNotificationIdsRef = useRef(new Map<number, number>());
  const { data: notificationData } = useQuery({
    ...createNotificationsOptions(),
    enabled: authState?.success === true,
  });

  useEffect(() => {
    if (authState?.success !== true) return;

    let subscription: { remove: () => void } | undefined;
    let cancelled = false;
    registerForPushNotifications({
      onNotificationReceived: () => {
        void queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
      },
      onNotificationOpened: () => {
        router.push("/(tabs)/notifications");
      },
    })
      .then((registered) => {
        if (cancelled) registered?.remove();
        else subscription = registered;
      })
      .catch((error) => {
        console.warn("Push notification registration failed", error);
      });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [authState?.success, queryClient, router]);

  useEffect(() => {
    if (authState?.success !== true) {
      seenNotificationIdsRef.current.clear();
      sseService.disconnect();
      queryClient.clear();
      return;
    }
    void sseService.connect();
    const unsubscribe = sseService.onNotification((event) => {
      const now = Date.now();
      const lastSeenAt = seenNotificationIdsRef.current.get(event.notification_id) ?? 0;
      seenNotificationIdsRef.current.set(event.notification_id, now);
      if (now - lastSeenAt > 5_000) {
        queryClient.setQueryData<NotificationResponse>(notificationsQueryKey, (current) => {
          if (!current) return current;
          const existing = current.notifications.find((item) => item.id === event.notification_id);
          if (existing && !existing.is_read) return current;
          return { ...current, unread_count: current.unread_count + 1 };
        });
      }
      void queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
    });
    return () => {
      unsubscribe();
      sseService.disconnect();
    };
  }, [authState?.success, queryClient]);

  useEffect(() => {
    const badgeCount = authState?.success === true ? notificationData?.unread_count ?? 0 : 0;
    void Notifications.setBadgeCountAsync(badgeCount).catch((error) => {
      if (__DEV__) console.warn("Unable to update app notification badge", error);
    });
  }, [authState?.success, notificationData?.unread_count]);

  useEffect(() => {
    if (
      authState?.success !== true ||
      !quizAttemptHydrated ||
      !examAttemptHydrated
    ) return;

    const recoveryStatuses = ["submitting", "submitted", "recovery_error"];
    if (recoveryStatuses.includes(examAttemptStatus) && pathname !== "/exam_taking") {
      router.replace("/exam_taking");
    } else if (recoveryStatuses.includes(quizAttemptStatus) && pathname !== "/quiz_taking") {
      router.replace("/quiz_taking");
    }
  }, [
    authState?.success,
    examAttemptHydrated,
    examAttemptStatus,
    pathname,
    quizAttemptHydrated,
    quizAttemptStatus,
    router,
  ]);

  if (authState?.isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.canvas,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={theme.canvas}
        translucent={false}
      />
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
            options={{
              gestureEnabled: false,
              headerShown: false,
              title: "Take Quiz",
            }}
          />
          <Stack.Screen
            name="exam_taking"
            options={{
              gestureEnabled: false,
              headerShown: false,
              title: "Take Exam",
            }}
          />
        </Stack.Protected>
      </Stack>
    </>
  );
});

function ThemeToast() {
  const config = useToastConfig();
  return <Toast config={config} />;
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <NativeUpdateProvider>
              <RootLayoutNav />
              <ThemeToast />
            </NativeUpdateProvider>
          </QueryClientProvider>
        </AuthProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
