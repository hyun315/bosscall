// api/send-push.js
// Tiny serverless function that sends a real FCM push notification.
// This runs on Vercel (free tier is plenty) so we never need Firebase's
// paid Blaze plan / Cloud Functions just to trigger a push.
//
// Requires these Vercel Environment Variables (from your Firebase service
// account JSON):
//   FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY

const admin = require("firebase-admin");

function getAdminApp() {
  if (admin.apps.length) return admin.apps[0];
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

module.exports = async (req, res) => {
  // Basic CORS so the app (any origin, since it may be opened from a
  // wa.me redirect flow etc.) can call this.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }

  try {
    const { token, title, body, url } = req.body || {};
    if (!token || !title) {
      res.status(400).json({ error: "token and title are required" });
      return;
    }

    getAdminApp();

    await admin.messaging().send({
      token,
      notification: { title, body: body || "" },
      webpush: {
        fcmOptions: { link: url || "/" },
      },
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("send-push failed", err);
    res.status(500).json({ error: String(err) });
  }
};
