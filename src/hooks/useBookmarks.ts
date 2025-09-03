// src/hooks/useBookmarks.ts
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { app } from "../lib/firebase";

type UseBookmarksOpts = { userId?: string };
const DEFAULT_USER_ID = "1";

export function useBookmarks(opts?: UseBookmarksOpts) {
  const userId = opts?.userId ?? DEFAULT_USER_ID;
  const db = getFirestore(app);

  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // NOTE: No orderBy -> avoids composite index requirement
    const q = query(collection(db, "bookmarked_jobs"), where("userId", "==", userId));

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
  }, [db, userId]);

  const isBookmarked = useCallback((jobId: string) => ids.has(jobId), [ids]);

  const toggleBookmark = useCallback(
    async (jobId: string, next: boolean) => {
      const ref = doc(db, "bookmarked_jobs", `${userId}_${jobId}`);
      if (next) {
        await setDoc(ref, { userId, jobId, createdAt: serverTimestamp() });
      } else {
        await deleteDoc(ref);
      }
    },
    [db, userId]
  );

  return useMemo(
    () => ({ bookmarkedIds: ids, isBookmarked, toggleBookmark, loading }),
    [ids, isBookmarked, toggleBookmark, loading]
  );
}
