import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Pool } = require("pg");
import { z } from "zod";

const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

const VapiWebhookSchema = z.object({
  message: z.object({
    type: z.string(),
    call: z.object({
      id: z.string(),
      phoneNumberId: z.string().optional(),
      startedAt: z.string().optional(),
      endedAt: z.string().optional(),
      endedReason: z.string().optional(),
      customer: z.object({ number: z.string().optional() }).optional(),
    }),
    analysis: z
      .object({
        summary: z.string().optional(),
        structuredData: z
          .object({
            callerName: z.string().optional(),
            reason: z.string().optional(),
            urgency: z.enum(["low", "medium", "high"]).optional(),
            callbackNumber: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  }),
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const secret = req.headers["x-vapi-secret"];
    if (secret !== process.env.VAPI_WEBHOOK_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parsed = VapiWebhookSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const { message } = parsed.data;

    if (message.type !== "end-of-call-report") {
      return res.status(200).json({ received: true });
    }

    const { call, analysis } = message;
    const structured = analysis?.structuredData ?? {};

    const { rows } = await pool.query(
      `INSERT INTO missed_calls (
        vapi_call_id, caller_number, caller_name, reason, urgency,
        callback_number, summary, started_at, ended_at, ended_reason
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (vapi_call_id) DO NOTHING
      RETURNING id`,
      [
        call.id,
        call.customer?.number ?? null,
        structured.callerName ?? null,
        structured.reason ?? null,
        structured.urgency ?? "medium",
        structured.callbackNumber ?? call.customer?.number ?? null,
        analysis?.summary ?? null,
        call.startedAt ?? null,
        call.endedAt ?? null,
        call.endedReason ?? null,
      ]
    );

    const callId = rows[0]?.id;

    const tokenRow = await pool.query("SELECT token FROM push_tokens ORDER BY updated_at DESC LIMIT 1");
    const pushToken = tokenRow.rows[0]?.token;
    let pushTickets = null;
    if (pushToken) {
      const { default: Expo } = await import("expo-server-sdk");
      if (Expo.isExpoPushToken(pushToken)) {
        const expo = new Expo();
        const urgencyEmoji = { low: "📞", medium: "📲", high: "🚨" };
        const emoji = urgencyEmoji[structured.urgency ?? "medium"];
        const chunks = expo.chunkPushNotifications([
          {
            to: pushToken,
            sound: "default",
            title: `${emoji} Appel manqué — ${structured.callerName ?? call.customer?.number ?? "Inconnu"}`,
            body: structured.reason ?? analysis?.summary ?? "Nouvelle demande",
            data: { callId },
            priority: structured.urgency === "high" ? "high" : "normal",
          },
        ]);
        pushTickets = [];
        for (const chunk of chunks) {
          const tickets = await expo.sendPushNotificationsAsync(chunk).catch((e) => {
            console.error("PUSH_SEND_ERROR:", e.message);
            return [];
          });
          pushTickets.push(...tickets);
        }
      }
    }

    return res.status(200).json({ ok: true, callId, _pushDebug: pushTickets });
  } catch (err) {
    console.error("WEBHOOK_ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
