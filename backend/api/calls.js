import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { rows } = await sql`
      SELECT * FROM missed_calls
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return res.status(200).json(rows);
  }

  if (req.method === "PATCH") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing id" });

    await sql`
      UPDATE missed_calls SET read_at = NOW() WHERE id = ${id}
    `;
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
