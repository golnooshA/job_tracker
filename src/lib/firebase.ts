import { initializeApp, getApps, getApp } from "firebase/app";
import { Platform } from "react-native";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  browserLocalPersistence,
  setPersistence,
  type Auth,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
} from "@env";

import type { Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
};

// --- App (single instance) ---
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// --- Firestore ---
export const db = getFirestore(app);

// --- Auth with proper persistence ---
let _auth: Auth;
if (Platform.OS === "web") {
  _auth = getAuth(app);
  setPersistence(_auth, browserLocalPersistence).catch(() => {});
} else {
  _auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}
export const auth = _auth;

// --- Analytics (web-only, dynamic import) ---
export let analytics: Analytics | null = null;
if (Platform.OS === "web") {
  (async () => {
    const mod = await import("firebase/analytics");
    if (await mod.isSupported()) {
      analytics = mod.getAnalytics(app);
    }
  })().catch(() => {});
}
