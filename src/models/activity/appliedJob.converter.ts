import { Timestamp, QueryDocumentSnapshot, SnapshotOptions } from "firebase/firestore";
import type { AppliedJob } from "./AppliedJob";

export const appliedJobConverter = {
  toFirestore(a: Omit<AppliedJob, "id" | "createdAt"> & { createdAt: Date }) {
    return {
      userId: a.userId,
      jobId: a.jobId,
      createdAt: Timestamp.fromDate(a.createdAt),
    };
  },
  fromFirestore(snap: QueryDocumentSnapshot, options: SnapshotOptions): AppliedJob {
    const d = snap.data(options) as any;
    return {
      id: snap.id,
      userId: d.userId,
      jobId: d.jobId,
      createdAt: (d.createdAt?.toDate?.() ?? new Date(0)) as Date,
    };
  },
};
