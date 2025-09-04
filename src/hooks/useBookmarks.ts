// src/hooks/useBookmarks.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

export function useBookmarks() {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // sync with auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return unsub;
  }, []);

  // subscribe to only this user's bookmarks
  useEffect(() => {
    if (!uid) {
      setIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, "bookmarked_jobs"), where("userId", "==", uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next = new Set<string>();
        snap.forEach((d) => {
          const jobId = String(d.get("jobId") ?? "");
          if (jobId) next.add(jobId);
        });
        setIds(next);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [uid]);

  const isBookmarked = useCallback((jobId: string) => ids.has(jobId), [ids]);

  /** نوشتن مستقیم روی فایراستورد (اگر کاربر لاگین نباشه no-op) */
  const toggleBookmark = useCallback(
    async (jobId: string, next: boolean) => {
      if (!uid) return;
      const ref = doc(db, "bookmarked_jobs", `${uid}_${jobId}`);
      if (next) {
        await setDoc(ref, { userId: uid, jobId, createdAt: serverTimestamp() }, { merge: true });
      } else {
        await deleteDoc(ref);
      }
    },
    [uid]
  );

  return useMemo(
    () => ({ bookmarkedIds: ids, isBookmarked, toggleBookmark, loading, uid }),
    [ids, isBookmarked, toggleBookmark, loading, uid]
  );
}
