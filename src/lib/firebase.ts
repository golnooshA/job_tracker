import { initializeApp, getApps, getApp } from "firebase/app";
import { Platform } from "react-native";
import { getFirestore } from "firebase/firestore";

import { isSupported, getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAOvJSZQ0rtCHYlTmGESK4yZJTKYgsC-d4",
  authDomain: "job-tracker-58689.firebaseapp.com",
  projectId: "job-tracker-58689",
  storageBucket: "job-tracker-58689.firebasestorage.app",
  messagingSenderId: "197165158987",
  appId: "1:197165158987:web:83e01b946271c2736cb3ce",
  measurementId: "G-G76ZWBHFQK"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

export let analytics: any = null;
if (Platform.OS === "web") {
  isSupported().then((yes) => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  });
}
