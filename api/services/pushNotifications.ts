import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { postData } from "@/utils/fetcher";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<
  Notifications.Subscription | undefined
> {
  if (Platform.OS === "web") return undefined;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return undefined;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6D4C9B",
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  await postData("/notifications/devices", {
    token: token.data,
    platform: Platform.OS,
  });

  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    // The notification payload is intentionally kept available for the router
    // layer to consume when notification deep-linking is added.
    if (__DEV__) console.debug("Notification opened", data);
  });
}
