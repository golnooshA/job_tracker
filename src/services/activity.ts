import {
  getFirestore, doc, setDoc, deleteDoc, getDoc,
  collection, onSnapshot, query, where, orderBy
} from "firebase/firestore";
import { app } from "../lib/firebase";

const db = getFirestore(app);

export function getUserId(): string {

  return "1"; // TEMP: must match what ActivityScreen queries
}

const key = (userId: string, jobId: string) => `${userId}_${jobId}`;

export async function applyToJob(jobId: string) {
  const userId = getUserId();
  await setDoc(doc(db, "applied_jobs", key(userId, jobId)), {
    userId,
    jobId,
    createdAt: new Date(), // ok; you can switch to serverTimestamp()
  }, { merge: true });
}

export async function unapplyJob(jobId: string) {
  const userId = getUserId();
  await deleteDoc(doc(db, "applied_jobs", key(userId, jobId)));
}

export async function bookmarkJob(jobId: string) {
  const userId = getUserId();
  await setDoc(doc(db, "bookmarked_jobs", key(userId, jobId)), {
    userId,
    jobId,
    createdAt: new Date(),
  }, { merge: true });
}

export async function unbookmarkJob(jobId: string) {
  const userId = getUserId();
  await deleteDoc(doc(db, "bookmarked_jobs", key(userId, jobId)));
}

export async function isBookmarked(jobId: string) {
  const userId = getUserId();
  const snap = await getDoc(doc(db, "bookmarked_jobs", key(userId, jobId)));
  return snap.exists();
}

export async function isApplied(jobId: string) {
  const userId = getUserId();
  const snap = await getDoc(doc(db, "applied_jobs", key(userId, jobId)));
  return snap.exists();
}
