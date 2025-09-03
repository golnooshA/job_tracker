export type JobType = 'Full Time' | 'Part Time' | 'Contract' | 'Internship' | 'Temporary' | 'Freelance';

export interface Job {
  id: string;                 
  categoryId: number;
  companyAbout: string;
  companyId: number;
  description: string;
  jobLink: string;
  jobType: JobType;
  location: string;
  publishedDate: Date;      
  role: string;
  skills: string[];
}
