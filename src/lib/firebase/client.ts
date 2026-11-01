"use client";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

/**
 * 브라우저용 Firebase 설정 — 공개 가능한 값이지만 코드에 하드코딩하지 않고 환경변수로 받는다.
 * authDomain 은 앱 도메인으로 두고 /__/auth 를 Firebase로 프록시한다 (iOS Safari 로그인 안정성, next.config.mjs 참고).
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function firebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(config);
}

export function clientAuth(): Auth {
  return getAuth(firebaseApp());
}

let db: Firestore | null = null;

/**
 * 휴대폰에 데이터를 저장해 두는 캐시를 켠다 — 앱을 열면 저장된 화면을 바로 보여주고
 * 서버의 최신 내용으로 곧바로 바꾼다. (사생활 보호 모드 등 저장소가 막히면 일반 모드)
 */
export function clientDb(): Firestore {
  if (db) return db;
  const app = firebaseApp();
  try {
    db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch {
    db = getFirestore(app);
  }
  return db;
}
