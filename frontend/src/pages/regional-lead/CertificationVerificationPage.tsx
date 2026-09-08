import React, { useState, useEffect } from 'react';
import { certificationApi } from '../../api/certificationApi';
import type { Certification } from '../../api/certificationApi';
import {
  Award,
  CheckCircle,
  XCircle,
  ExternalLink,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const CertificationVerificationPage: React.FC = () => {
  const [pendingCerts, setPendingCerts] = useState<Certification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchPendingQueue = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await certificationApi.getPendingCertificationsQueue();
      setPendingCerts(data);
    } catch (err: any) {
      console.error('Failed to load pending certifications:', err);
      setError(err.response?.data?.error || 'Failed to load pending certifications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingQueue();
  }, []);

  const handleVerifyAction = async (id: number, status: 'verified' | 'rejected') => {
    try {
      setProcessingId(id);
      setError(null);
      await certificationApi.verifyCertification(id, status);
      setSuccessMsg(`Certification has been marked as ${status}.`);
      fetchPendingQueue();
    } catch (err: any) {
      console.error('Error verifying certification:', err);
      setError(err.response?.data?.error || `Failed to ${status} certification.`);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <Award className="w-6 h-6 text-amber-500" />
          Pending Certifications Queue
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review and verify or reject pending certifications uploaded by resources in your region.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2 font-semibold">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Queue List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800">Pending Certifications ({pendingCerts.length})</h2>
        </div>

        {pendingCerts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-60" />
            <p className="text-sm font-semibold text-slate-600">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1">There are no pending certifications awaiting verification in your region.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                  <th className="py-3.5 px-5">Resource</th>
                  <th className="py-3.5 px-5">Certification Name</th>
                  <th className="py-3.5 px-5">Issuing Body</th>
                  <th className="py-3.5 px-5">Date Earned</th>
                  <th className="py-3.5 px-5">Proof Document</th>
                  <th className="py-3.5 px-5 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {pendingCerts.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {cert.resource_name?.substring(0, 2).toUpperCase() || 'RS'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{cert.resource_name || 'Engineering Resource'}</p>
                          <p className="text-[11px] text-slate-400">{cert.resource_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-900">{cert.name}</td>
                    <td className="py-4 px-5 text-slate-600">{cert.issuing_body || '—'}</td>
                    <td className="py-4 px-5 text-slate-500">
                      {new Date(cert.date_earned).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-5">
                      {cert.certificate_url && (
                        <a
                          href={cert.certificate_url.startsWith('http') ? cert.certificate_url : `http://localhost:5000${cert.certificate_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold hover:underline"
                        >
                          View Document <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right space-x-2">
                      <button
                        onClick={() => handleVerifyAction(cert.id, 'verified')}
                        disabled={processingId === cert.id}
                        className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-2xs text-xs inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Verify
                      </button>

                      <button
                        onClick={() => handleVerifyAction(cert.id, 'rejected')}
                        disabled={processingId === cert.id}
                        className="px-3 py-1.5 border border-rose-200 text-rose-600 font-bold rounded-lg hover:bg-rose-50 transition-colors text-xs inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
