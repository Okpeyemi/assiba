import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.body ?? {};
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Missing token" });
  }

  await pool.query(
    "INSERT INTO push_tokens (token) VALUES ($1) ON CONFLICT (token) DO UPDATE SET updated_at = NOW()",
    [token]
  );

  return res.status(200).json({ ok: true });
}
