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
  if (!Device.isDevice) {
    console.warn("[Push] Skipped: not a physical device");
    return;
  }

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

  if (finalStatus !== "granted") {
    console.warn("[Push] Permission refusée");
    return;
  }

  const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
  if (!projectId) {
    console.error("[Push] EXPO_PUBLIC_PROJECT_ID manquant dans .env");
    return;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  console.log("[Push] Token obtenu :", token);
  await registerPushToken(token)
    .then(() => console.log("[Push] Token enregistré en DB ✓"))
    .catch((e) => console.error("[Push] Échec enregistrement :", e.message));
}
