// Push notifications are handled natively in Kotlin via FCM.
// This hook is a no-op placeholder — token registration happens
// in the Android native layer and calls /api/register-push-token directly.
export function usePushNotifications(_onNotification) {}
