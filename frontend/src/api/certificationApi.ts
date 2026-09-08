import { apiClient } from './apiClient';

export interface Certification {
  id: number;
  resource_id: number;
  name: string;
  issuing_body?: string | null;
  date_earned: string;
  certificate_url: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_by?: number | null;
  verified_by_name?: string | null;
  resource_name?: string | null;
  resource_email?: string | null;
  designation?: string | null;
  region_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadCertificationPayload {
  name: string;
  issuing_body?: string;
  date_earned: string;
  certificate_url?: string;
  certificateFile?: File;
}

export const certificationApi = {
  getCertificationsByResource: async (resourceId: number): Promise<Certification[]> => {
    const response = await apiClient.get(`/resources/${resourceId}/certifications`);
    return response.data;
  },

  getPendingCertificationsQueue: async (): Promise<Certification[]> => {
    const response = await apiClient.get('/certifications/pending-queue');
    return response.data;
  },

  uploadCertification: async (
    resourceId: number,
    payload: UploadCertificationPayload
  ): Promise<Certification> => {
    if (payload.certificateFile) {
      const formData = new FormData();
      formData.append('name', payload.name);
      if (payload.issuing_body) formData.append('issuing_body', payload.issuing_body);
      formData.append('date_earned', payload.date_earned);
      formData.append('certificate', payload.certificateFile);

      const response = await apiClient.post(`/resources/${resourceId}/certifications`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } else {
      const response = await apiClient.post(`/resources/${resourceId}/certifications`, {
        name: payload.name,
        issuing_body: payload.issuing_body,
        date_earned: payload.date_earned,
        certificate_url: payload.certificate_url || '/uploads/certificates/sample.pdf',
      });
      return response.data;
    }
  },

  verifyCertification: async (
    id: number,
    verification_status: 'verified' | 'rejected'
  ): Promise<Certification> => {
    const response = await apiClient.put(`/certifications/${id}/verify`, { verification_status });
    return response.data;
  },

  deleteCertification: async (id: number): Promise<void> => {
    await apiClient.delete(`/certifications/${id}`);
  },
};
