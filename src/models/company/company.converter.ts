import {
  QueryDocumentSnapshot,
  SnapshotOptions,
  FirestoreDataConverter,
} from 'firebase/firestore';
import { Company } from './Company';

export const companyConverter: FirestoreDataConverter<Company> = {
  toFirestore(company: Company) {
    return {
      name: company.name,
      about: company.about,
      location: company.location,
      logoUrl: company.logoUrl,
      size: company.size,
      specialization: company.specialization,
      facility: company.facility,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Company {
    const data = snapshot.data(options)!;
    return {
      id: snapshot.id,
      name: data.name,
      about: data.about,
      location: data.location,
      logoUrl: data.logoUrl,
      size: data.size,
      specialization: data.specialization,
      facility: data.facility,
    };
  },
};
