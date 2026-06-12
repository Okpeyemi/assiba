/**
 * Called once from the mobile app after Expo grants push permissions.
 * For MVP with a single user we store the token as a Vercel env var record
 * in the DB so the webhook handler can read it without redeployment.
 */
import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.body ?? {};
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Missing token" });
  }

  await sql`
    INSERT INTO push_tokens (token) VALUES (${token})
    ON CONFLICT (token) DO UPDATE SET updated_at = NOW()
  `;

  return res.status(200).json({ ok: true });
}
