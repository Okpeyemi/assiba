/**
 * Simule un webhook VAPI end-of-call-report vers ton backend déployé.
 *
 * Usage :
 *   WEBHOOK_URL=https://ton-projet.vercel.app \
 *   VAPI_WEBHOOK_SECRET=ton-secret \
 *   node vapi/test-webhook.js
 */

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const SECRET = process.env.VAPI_WEBHOOK_SECRET;

if (!WEBHOOK_URL) throw new Error("WEBHOOK_URL is required");
if (!SECRET) throw new Error("VAPI_WEBHOOK_SECRET is required");

const payload = {
  message: {
    type: "end-of-call-report",
    call: {
      id: `test-call-${Date.now()}`,
      phoneNumberId: "test-phone-number-id",
      startedAt: new Date(Date.now() - 90_000).toISOString(),
      endedAt: new Date().toISOString(),
      endedReason: "customer-ended-call",
      customer: {
        number: "+33612345678",
      },
    },
    analysis: {
      summary:
        "Marie Dupont a appelé pour demander un devis pour une rénovation de salle de bain. Elle souhaite être rappelée en urgence avant 17h aujourd'hui.",
      structuredData: {
        callerName: "Marie Dupont",
        reason: "Demande de devis pour rénovation salle de bain",
        urgency: "high",
        callbackNumber: "+33612345678",
      },
    },
  },
};

async function main() {
  const url = `${WEBHOOK_URL}/api/vapi-webhook`;
  console.log(`POST ${url}`);
  console.log("Payload :", JSON.stringify(payload, null, 2));
  console.log("---");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vapi-secret": SECRET,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.text();
  console.log(`Status : ${res.status}`);
  console.log(`Réponse : ${body}`);

  if (res.ok) {
    console.log("\n✓ Webhook OK — vérifie que l'appel apparaît en DB et que la notification push a été envoyée.");
  } else {
    console.error("\n✗ Erreur — voir les logs Vercel pour le détail.");
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
