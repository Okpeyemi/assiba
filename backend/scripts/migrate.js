import { sql } from "@vercel/postgres";

async function migrate() {
  console.log("Running migrations...");

  await sql`
    CREATE TABLE IF NOT EXISTS missed_calls (
      id            SERIAL PRIMARY KEY,
      vapi_call_id  TEXT UNIQUE NOT NULL,
      caller_number TEXT,
      caller_name   TEXT,
      reason        TEXT,
      urgency       TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
      callback_number TEXT,
      summary       TEXT,
      started_at    TIMESTAMPTZ,
      ended_at      TIMESTAMPTZ,
      ended_reason  TEXT,
      read_at       TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_missed_calls_created_at
      ON missed_calls (created_at DESC)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS push_tokens (
      id         SERIAL PRIMARY KEY,
      token      TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  console.log("Migrations complete.");
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
