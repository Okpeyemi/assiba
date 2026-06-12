/**
 * Crée (ou met à jour) l'assistant VAPI et le lie au numéro de téléphone.
 *
 * Usage :
 *   VAPI_API_KEY=xxx \
 *   VAPI_PHONE_NUMBER_ID=yyy \
 *   WEBHOOK_URL=https://your-project.vercel.app \
 *   VAPI_WEBHOOK_SECRET=secret \
 *   OWNER_NAME="Jean Dupont" \
 *   node vapi/setup.js
 *
 * Idempotent : si VAPI_ASSISTANT_ID est défini, met à jour l'assistant existant.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VAPI_BASE = "https://api.vapi.ai";
const API_KEY = process.env.VAPI_API_KEY;
const PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;
const EXISTING_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.VAPI_WEBHOOK_SECRET;
const OWNER_NAME = process.env.OWNER_NAME ?? "votre correspondant";

if (!API_KEY) throw new Error("VAPI_API_KEY is required");
if (!PHONE_NUMBER_ID) throw new Error("VAPI_PHONE_NUMBER_ID is required");
if (!WEBHOOK_URL) throw new Error("WEBHOOK_URL is required (e.g. https://your-project.vercel.app)");
if (!WEBHOOK_SECRET) throw new Error("VAPI_WEBHOOK_SECRET is required");

const assistantConfig = JSON.parse(
  readFileSync(path.join(__dirname, "assistant.json"), "utf8")
);

// Injecter le nom du propriétaire et le webhook dynamiquement
assistantConfig.metadata = { owner_name: OWNER_NAME };
assistantConfig.model.systemPrompt = assistantConfig.model.systemPrompt
  .replaceAll("{{owner_name}}", OWNER_NAME);
assistantConfig.firstMessage = assistantConfig.firstMessage
  .replaceAll("{{owner_name}}", OWNER_NAME);
assistantConfig.endCallMessage = assistantConfig.endCallMessage
  .replaceAll("{{owner_name}}", OWNER_NAME);

assistantConfig.serverUrl = `${WEBHOOK_URL}/api/vapi-webhook`;
assistantConfig.serverUrlSecret = WEBHOOK_SECRET;

async function vapi(method, urlPath, body) {
  const res = await fetch(`${VAPI_BASE}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `VAPI ${method} ${urlPath} → ${res.status}: ${JSON.stringify(data)}`
    );
  }
  return data;
}

async function main() {
  // 1. Créer ou mettre à jour l'assistant
  let assistant;
  if (EXISTING_ASSISTANT_ID) {
    console.log(`Mise à jour de l'assistant ${EXISTING_ASSISTANT_ID}…`);
    assistant = await vapi("PATCH", `/assistant/${EXISTING_ASSISTANT_ID}`, assistantConfig);
  } else {
    console.log("Création de l'assistant…");
    assistant = await vapi("POST", "/assistant", assistantConfig);
  }
  console.log(`✓ Assistant créé/mis à jour : ${assistant.id}`);
  console.log(`  Webhook : ${assistant.serverUrl}`);

  // 2. Lier l'assistant au numéro de téléphone
  console.log(`\nLiaison au numéro ${PHONE_NUMBER_ID}…`);
  const phone = await vapi("PATCH", `/phone-number/${PHONE_NUMBER_ID}`, {
    assistantId: assistant.id,
  });
  console.log(`✓ Numéro ${phone.number ?? PHONE_NUMBER_ID} lié à l'assistant`);

  console.log("\n========================================================");
  console.log("Ajoutez cette variable dans Vercel (si pas déjà fait) :");
  console.log(`  VAPI_ASSISTANT_ID=${assistant.id}`);
  console.log("========================================================\n");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
