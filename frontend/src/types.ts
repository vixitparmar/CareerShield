export interface IngestedJobRecord {
  id: string | number;
  date: string;
  from: string;
  subject: string;
  body: string;
  companyName?: string;
  title?: string;
  groundTruthFraudulent?: boolean; // 1 = fake, 0 = real
  telecommuting?: boolean;
  hasCompanyLogo?: boolean;
  hasQuestions?: boolean;
}

export interface EmailItem extends IngestedJobRecord {
  company?: string;
  role?: string;
  status?: 'applied' | 'interview' | 'rejected' | 'offer' | 'scam';
  isScam?: boolean;
  scamReason?: string;
  confidence?: number;
  needsFollowUp?: boolean;
  daysElapsed?: number;
  followUpTemplate?: string;
  auditNotes?: string[];
  modelMatchGroundTruth?: boolean;
}

export interface DatasetMetrics {
  totalRecords: number;
  activePipelines: number;
  stalledApplications: number;
  scamsNeutralized: number;
  validationAccuracy: number | null;
  hasGroundTruthLabels: boolean;
}
