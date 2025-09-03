import {
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
  FirestoreDataConverter,
} from 'firebase/firestore';
import { Job, JobType } from '../job/job';

export const jobConverter: FirestoreDataConverter<Job> = {
  toFirestore(job: Job) {
    return {
      categoryId: job.categoryId,
      companyAbout: job.companyAbout,
      companyId: job.companyId,
      description: job.description,
      jobLink: job.jobLink,
      jobType: job.jobType,
      location: job.location,
      publishedDate: Timestamp.fromDate(job.publishedDate),
      role: job.role,
      skills: job.skills,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Job {
    const data = snapshot.data(options)!;
    return {
      id: snapshot.id,
      categoryId: data.categoryId,
      companyAbout: data.companyAbout,
      companyId: data.companyId,
      description: data.description,
      jobLink: data.jobLink,
      jobType: data.jobType as JobType,
      location: data.location,
      publishedDate: (data.publishedDate as Timestamp).toDate(),
      role: data.role,
      skills: data.skills ?? [],
    };
  },
};
