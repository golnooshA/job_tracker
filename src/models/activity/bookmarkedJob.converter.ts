import { Timestamp, QueryDocumentSnapshot, SnapshotOptions } from "firebase/firestore";
import type { BookmarkedJob } from "./BookmarkedJob";

export const bookmarkedJobConverter = {
  toFirestore(b: Omit<BookmarkedJob, "id" | "createdAt"> & { createdAt: Date }) {
    return {
      userId: b.userId,
      jobId: b.jobId,
      createdAt: Timestamp.fromDate(b.createdAt),
    };
  },
  fromFirestore(snap: QueryDocumentSnapshot, options: SnapshotOptions): BookmarkedJob {
    const d = snap.data(options) as any;
    return {
      id: snap.id,
      userId: d.userId,
      jobId: d.jobId,
      createdAt: (d.createdAt?.toDate?.() ?? new Date(0)) as Date,
    };
  },
};
