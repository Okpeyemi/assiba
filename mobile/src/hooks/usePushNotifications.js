import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { registerPushToken } from "../api/client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications(onNotification) {
  const listenerRef = useRef(null);

  useEffect(() => {
    registerForPush();
    listenerRef.current =
      Notifications.addNotificationReceivedListener(onNotification);

    return () => listenerRef.current?.remove();
  }, []);
}

async function registerForPush() {
  if (!Device.isDevice) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      sound: true,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return;

  const { data: token } = await Notifications.getDevicePushTokenAsync();

  console.log("[Push] FCM token:", token?.substring(0, 20) + "...");
  await registerPushToken(token)
    .then(() => console.log("[Push] Token enregistré en DB ✓"))
    .catch((e) => console.error("[Push] Échec enregistrement:", e.message));
}
