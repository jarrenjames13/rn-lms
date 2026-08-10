import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { deleteData, postData } from "@/utils/fetcher";

const PUSH_TOKEN_ID_KEY = "push_notification_token_id";
export const NOTIFICATION_CHANNEL_ID = "lms-default";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

type PushNotificationHandlers = {
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationOpened?: (response: Notifications.NotificationResponse) => void;
};

type PushNotificationRegistration = {
  remove: () => void;
};

const registerExpoToken = async (projectId: string) => {
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await postData<{ id: number }>("/notifications/devices", {
        token: token.data,
        platform: Platform.OS,
      });
      await SecureStore.setItemAsync(PUSH_TOKEN_ID_KEY, String(response.data.id));
      return;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status || attempt === 3) {
        throw new Error(
          status
            ? `Push token registration failed with HTTP ${status}: ${error?.response?.data?.detail ?? error.message}`
            : `Push token registration could not reach the API after ${attempt} attempts: ${error?.message ?? "Network error"}`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
};

export const deactivatePushNotifications = async (notifyServer = true) => {
  if (Platform.OS === "web") return;
  const tokenId = await SecureStore.getItemAsync(PUSH_TOKEN_ID_KEY);
  if (notifyServer && tokenId) {
    try {
      await deleteData(`/notifications/devices/${tokenId}`);
    } catch (error) {
      console.warn("Unable to deactivate server push token", error);
    }
  }
  await SecureStore.deleteItemAsync(PUSH_TOKEN_ID_KEY);
  try {
    await Notifications.unregisterForNotificationsAsync();
  } catch (error) {
    if (__DEV__) console.warn("Unable to unregister local push notifications", error);
  }
};

export async function registerForPushNotifications(
  handlers: PushNotificationHandlers = {},
): Promise<PushNotificationRegistration | undefined> {
  if (Platform.OS === "web") return undefined;

  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    handlers.onNotificationReceived?.(notification);
  });
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    handlers.onNotificationOpened?.(response);
  });
  let tokenSubscription: Notifications.Subscription | undefined;

  try {
    const lastResponse = await Notifications.getLastNotificationResponseAsync();
    if (lastResponse) {
      handlers.onNotificationOpened?.(lastResponse);
      await Notifications.clearLastNotificationResponseAsync();
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: "LMS Notifications",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#6D4C9B",
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status === "granted") {
      const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        throw new Error("Expo project ID is missing; push notifications cannot be registered.");
      }
      await registerExpoToken(projectId);
      tokenSubscription = Notifications.addPushTokenListener(() => {
        void registerExpoToken(projectId).catch((error) => {
          console.warn("Push token refresh registration failed", error);
        });
      });
    }
  } catch (error) {
    console.warn("Push notification setup failed", error);
  }

  return {
    remove: () => {
      receivedSubscription.remove();
      responseSubscription.remove();
      tokenSubscription?.remove();
    },
  };
}
