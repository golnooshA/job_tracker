export type Job = {
  id: string;
  company: string;
  companyLogoText?: string;
  title: string;
  city: string;
  country: string;
  type: 'Full Time' | 'Part Time' | 'Contract' | 'Internship';
  summary: string;
  postedAt: string;  
  bookmarked?: boolean;
};

export type Category = {
  key: string;
  label: string;
  icon: React.ReactNode;
};


