// src/services/activity.ts
import { auth, db } from "../lib/firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

/** اگر کاربر لاگین نباشه خطا می‌ده (جلوی نوشتن/خواندن اشتباهی رو می‌گیره) */
function uidOrThrow(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return uid;
}

const key = (userId: string, jobId: string) => `${userId}_${jobId}`;

/* ---------------- Applied ---------------- */
export async function applyToJob(jobId: string) {
  const uid = uidOrThrow();
  const ref = doc(db, "applied_jobs", key(uid, jobId));
  await setDoc(
    ref,
    { userId: uid, jobId, createdAt: serverTimestamp() },
    { merge: true }
  );
}

export async function unapplyJob(jobId: string) {
  const uid = uidOrThrow();
  await deleteDoc(doc(db, "applied_jobs", key(uid, jobId)));
}

export async function isApplied(jobId: string): Promise<boolean> {
  const uid = uidOrThrow();
  const snap = await getDoc(doc(db, "applied_jobs", key(uid, jobId)));
  return snap.exists();
}

/* ---------------- Bookmarks ---------------- */
export async function bookmarkJob(jobId: string) {
  const uid = uidOrThrow();
  const ref = doc(db, "bookmarked_jobs", key(uid, jobId));
  await setDoc(
    ref,
    { userId: uid, jobId, createdAt: serverTimestamp() },
    { merge: true }
  );
}

export async function unbookmarkJob(jobId: string) {
  const uid = uidOrThrow();
  await deleteDoc(doc(db, "bookmarked_jobs", key(uid, jobId)));
}

export async function isBookmarked(jobId: string): Promise<boolean> {
  const uid = uidOrThrow();
  const snap = await getDoc(doc(db, "bookmarked_jobs", key(uid, jobId)));
  return snap.exists();
}
