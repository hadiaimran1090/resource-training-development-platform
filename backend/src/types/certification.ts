export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface Certification {
  id: number;
  resource_id: number;
  name: string;
  issuing_body?: string | null;
  date_earned: string;
  certificate_url: string;
  verification_status: VerificationStatus;
  verified_by?: number | null;
  verified_by_name?: string | null;
  resource_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCertificationInput {
  name: string;
  issuing_body?: string;
  date_earned: string;
  certificate_url?: string;
}

export interface VerifyCertificationInput {
  verification_status: 'verified' | 'rejected';
}
