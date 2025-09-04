// src/lib/firebase.ts
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
// Use a type-only import to avoid bundling analytics on native
import type { Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "#############",
  authDomain: "#############",
  projectId: "#############",
  storageBucket: "#############",
  messagingSenderId: "#############",
  appId: "#############",
  measurementId: "#############",
};

// --- App (single instance) ---
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// --- Firestore ---
export const db = getFirestore(app);

// --- Auth with proper persistence ---
// On native (iOS/Android): use AsyncStorage persistence via initializeAuth
// On web: use default getAuth + local persistence
let _auth: Auth;

if (Platform.OS === "web") {
  _auth = getAuth(app);
  // Ensure persistence is local (so sessions survive reloads)
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
  // Dynamically import so native bundles don’t include analytics
  (async () => {
    const mod = await import("firebase/analytics");
    if (await mod.isSupported()) {
      analytics = mod.getAnalytics(app);
    }
  })().catch(() => {
    // ignore analytics failures
  });
}

