import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

/**
 * Firebase Admin — 서버(Vercel 함수)에서만 사용. Secret은 환경변수로만 받는다 (명세 §24, §34.4).
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (Vercel에 붙여넣을 때 줄바꿈은 \n 그대로 둬도 됨)
 */
function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`서버 환경변수 ${name} 가 설정되지 않았습니다.`);
  return v;
}

let app: App | undefined;

function adminApp(): App {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }
  app = initializeApp({
    credential: cert({
      projectId: requireEnv("FIREBASE_PROJECT_ID"),
      clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
  });
  return app;
}

let db: Firestore | undefined;

export function adminDb(): Firestore {
  if (!db) {
    db = getFirestore(adminApp());
    db.settings({ ignoreUndefinedProperties: true });
  }
  return db;
}

export function adminAuth() {
  return getAuth(adminApp());
}

export function adminMessaging() {
  return getMessaging(adminApp());
}
