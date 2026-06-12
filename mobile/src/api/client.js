const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export async function fetchCalls() {
  const res = await fetch(`${BASE_URL}/api/calls`);
  if (!res.ok) throw new Error("Failed to fetch calls");
  return res.json();
}

export async function markCallRead(id) {
  const res = await fetch(`${BASE_URL}/api/calls?id=${id}`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to mark call as read");
}

export async function registerPushToken(token) {
  const res = await fetch(`${BASE_URL}/api/register-push-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error("Failed to register push token");
}
