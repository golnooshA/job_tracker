// src/services/firestore.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase"; // ✅ fixed path

// Models & converters
import { Job } from "../models/job/Job";
import { jobConverter } from "../models/job/job.converter";
import { Company } from "../models/company/Company";
import { companyConverter } from "../models/company/company.converter";

// ---------- Optional simple docs ----------
export type PromoDoc = { uri: string };

// If you still keep categories in Firestore, keep this type.
// (If you moved to constants, you can delete getCategories below.)
export type CategoryDoc = { key: string; label: string; iconName: string };

// ───────────────────────────────────────────────────────────────────────────────
// Promos
// ───────────────────────────────────────────────────────────────────────────────
export const subscribePromos = (cb: (items: PromoDoc[]) => void) => {
  const q = query(collection(db, "promos"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as PromoDoc));
  });
};

// ───────────────────────────────────────────────────────────────────────────────
// Categories  (Remove if you now use constants/categories.ts as source of truth.)
// ───────────────────────────────────────────────────────────────────────────────
export const getCategories = async (): Promise<CategoryDoc[]> => {
  const snap = await getDocs(collection(db, "categories"));
  return snap.docs.map((d) => d.data() as CategoryDoc);
};

// ───────────────────────────────────────────────────────────────────────────────
// Jobs (typed via converter, latest first)
// ───────────────────────────────────────────────────────────────────────────────
export const subscribeRecentJobs = (cb: (items: Job[]) => void, take = 10) => {
  const q = query(
    collection(db, "jobs").withConverter(jobConverter),
    orderBy("publishedDate", "desc"),
    limit(take)
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as Job));
  });
};

export const getJobsByCategory = async (categoryId: number): Promise<Job[]> => {
  const q = query(
    collection(db, "jobs").withConverter(jobConverter),
    where("categoryId", "==", categoryId),
    orderBy("publishedDate", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Job);
};

export const getJobsByCompanyId = async (companyId: number): Promise<Job[]> => {
  const q = query(
    collection(db, "jobs").withConverter(jobConverter),
    where("companyId", "==", companyId),
    orderBy("publishedDate", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Job);
};

// ───────────────────────────────────────────────────────────────────────────────
// Companies (typed via converter)
// ───────────────────────────────────────────────────────────────────────────────
export const getCompanies = async (): Promise<Company[]> => {
  const snap = await getDocs(
    collection(db, "companies").withConverter(companyConverter)
  );
  return snap.docs.map((d) => d.data() as Company);
};

// Fetch by document id (recommended, aligns with how you're reading in screens)
export const getCompanyById = async (id: string): Promise<Company | null> => {
  const s = await getDoc(
    doc(db, "companies", id).withConverter(companyConverter)
  );
  return s.exists() ? (s.data() as Company) : null;
};

// Optional: query by name if your doc id is not the name
export const getCompanyByName = async (
  name: string
): Promise<Company | null> => {
  const q = query(
    collection(db, "companies").withConverter(companyConverter),
    where("name", "==", name)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : (snap.docs[0].data() as Company);
};
