# État du projet Assiba

_Dernière mise à jour : 2026-06-16_

## Architecture

- **Backend** : Node.js / Vercel serverless — `https://assiba.vercel.app`
- **Mobile** : React Native / Expo SDK 56 — dev build Android (APK installé)
- **DB** : Prisma Postgres (`db.prisma.io`)
- **VAPI** : assistant vocal qui déclenche le webhook après chaque appel manqué

---

## Ce qui fonctionne ✓

- Webhook VAPI (`/api/vapi-webhook`) reçoit les appels, insère en DB, retourne `{"ok":true}`
- DB : tables `missed_calls` et `push_tokens` opérationnelles
- API `/api/calls` (GET + PATCH) et `/api/register-push-token` (POST) fonctionnent
- Dev build Android lancé via `npx expo start --dev-client` (Expo Go incompatible SDK 56)
- FCM token enregistré en DB via `getDevicePushTokenAsync()`
- Firebase Admin SDK (imports ESM natifs `firebase-admin/app` + `firebase-admin/messaging`) ✓
- **Notifications push reçues sur l'appareil** ✓
- L'app mobile affiche la liste des appels manqués et les marque comme lus

---

## Flux complet validé

```
Appel → VAPI → POST /api/vapi-webhook → INSERT missed_calls → FCM via Firebase Admin → notification Android ✓
```

---

## Prochaines étapes possibles

- Écran de détail d'un appel (résumé complet + bouton "Rappeler")
- Vrai appel test sur le numéro VAPI pour valider l'agent vocal end-to-end
- Badge non-lu sur l'icône de l'app
- Gestion de la notification en tap (ouvrir l'écran de détail directement)

---

## Branche git

`claude/ecstatic-carson-hw04hy`
