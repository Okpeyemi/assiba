# État du projet Assiba

## Décision en cours
Les **notifications push sont en pause** — le système de base fonctionne mais la livraison FCM bloque encore (voir détails ci-dessous). On passe à autre chose.

---

## Architecture

- **Backend** : Node.js / Vercel serverless — `https://assiba.vercel.app`
- **Mobile** : React Native / Expo SDK 54 — dev build Android (APK installé)
- **DB** : Prisma Postgres (`db.prisma.io`)
- **VAPI** : assistant vocal qui déclenche le webhook après chaque appel manqué

---

## Ce qui fonctionne ✓

- Webhook VAPI (`/api/vapi-webhook`) reçoit les appels, insère en DB, retourne `{"ok":true}`
- DB : tables `missed_calls` et `push_tokens` opérationnelles
- API `/api/calls` (GET + PATCH) et `/api/register-push-token` (POST) fonctionnent
- Dev build Android installé, Firebase initialisé, FCM token brut enregistré en DB
- L'app mobile affiche les appels manqués et les marque comme lus

---

## Push notifications — EN PAUSE ✗

### Historique des tentatives
1. **Expo Go** → notifications reçues dans Expo Go (pas dans l'app) car token Expo Go en DB
2. **Dev build** → `expo-notifications` crash : "Default FirebaseApp not initialized" → ajout `google-services.json` + rebuild → résolu
3. **Expo push service** → erreur `InvalidCredentials` : Expo ne trouvait pas les credentials FCM → switché sur Firebase Admin SDK direct
4. **Firebase Admin SDK** → variable `FIREBASE_SERVICE_ACCOUNT_B64` ajoutée dans Vercel → dernier test retournait `{"ok":false,"error":"Cannot read properties of undefined (reading 'apps')"}` → corrigé (require CJS fixé dans commit `9cfd1ea`) mais **pas encore retesté**

### Prochaine étape si on reprend
Relancer le test webhook et vérifier que `_pushDebug` retourne `{"ok":true,"messageId":"..."}` :
```bash
cd backend && WEBHOOK_URL=https://assiba.vercel.app \
VAPI_WEBHOOK_SECRET=adf447c7843b16223bf5ce21767482106396d997774ba6e759bb244dabc39ec4 \
node vapi/test-webhook.js
```

### Fichiers clés
- `backend/api/vapi-webhook.js` — webhook avec Firebase Admin SDK
- `mobile/src/hooks/usePushNotifications.js` — utilise `getDevicePushTokenAsync()` (FCM token brut)
- `mobile/google-services.json` — config Firebase client Android
- Env Vercel : `FIREBASE_SERVICE_ACCOUNT_B64` (clé service account base64)

---

## Branche git
`claude/ecstatic-carson-hw04hy`
