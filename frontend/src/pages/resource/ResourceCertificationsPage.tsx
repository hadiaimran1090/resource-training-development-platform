import React, { useState, useEffect } from 'react';
import { certificationApi } from '../../api/certificationApi';
import type { Certification } from '../../api/certificationApi';
import { resourceApi } from '../../api/resourceApi';
import {
  Award,
  Upload,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export const ResourceCertificationsPage: React.FC = () => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [resourceId, setResourceId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [issuingBody, setIssuingBody] = useState('');
  const [dateEarned, setDateEarned] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCertifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const profile = await resourceApi.getMyProfile();
      setResourceId(profile.id);
      const data = await certificationApi.getCertificationsByResource(profile.id);
      setCertifications(data);
    } catch (err: any) {
      console.error('Failed to load certifications:', err);
      setError(err.response?.data?.error || 'Failed to load certifications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCertifications();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceId) return;

    if (!name.trim() || !dateEarned) {
      setError('Please provide certification name and date earned.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await certificationApi.uploadCertification(resourceId, {
        name: name.trim(),
        issuing_body: issuingBody.trim() || undefined,
        date_earned: dateEarned,
        certificateFile: file || undefined,
      });

      setSuccessMsg('Certification uploaded successfully and pending verification.');
      setIsModalOpen(false);
      setName('');
      setIssuingBody('');
      setFile(null);
      fetchCertifications();
    } catch (err: any) {
      console.error('Error uploading certification:', err);
      setError(err.response?.data?.error || 'Failed to upload certification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this pending certification upload?')) return;
    try {
      setError(null);
      await certificationApi.deleteCertification(id);
      setSuccessMsg('Pending certification deleted.');
      fetchCertifications();
    } catch (err: any) {
      console.error('Error deleting certification:', err);
      setError(err.response?.data?.error || 'Failed to delete certification.');
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Pending Verification
          </span>
        );
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Award className="w-6 h-6 text-blue-600" />
            My Certifications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload and manage your industry certifications. Verified certifications enhance your readiness score.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-xs hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Upload Certification
        </button>
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

      {/* Certifications List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800">Uploaded Certifications ({certifications.length})</h2>
        </div>

        {certifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Award className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No certifications uploaded yet.</p>
            <p className="text-xs text-slate-400 mt-1">Click "Upload Certification" to submit your first certificate.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                  <th className="py-3.5 px-5">Certification Name</th>
                  <th className="py-3.5 px-5">Issuing Organization</th>
                  <th className="py-3.5 px-5">Date Earned</th>
                  <th className="py-3.5 px-5">Verification Status</th>
                  <th className="py-3.5 px-5">Verified By</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {certifications.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-900 flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      {cert.name}
                    </td>
                    <td className="py-4 px-5 text-slate-600">{cert.issuing_body || '—'}</td>
                    <td className="py-4 px-5 text-slate-500">
                      {new Date(cert.date_earned).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-5">{renderStatusBadge(cert.verification_status)}</td>
                    <td className="py-4 px-5 text-slate-500">
                      {cert.verified_by_name ? cert.verified_by_name : '—'}
                    </td>
                    <td className="py-4 px-5 text-right space-x-2">
                      {cert.certificate_url && (
                        <a
                          href={cert.certificate_url.startsWith('http') ? cert.certificate_url : `http://localhost:5000${cert.certificate_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold hover:underline"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      {cert.verification_status === 'pending' ? (
                        <button
                          onClick={() => handleDelete(cert.id)}
                          className="px-2.5 py-1 text-rose-600 hover:text-rose-700 font-bold hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete pending certification"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" /> Upload Certification
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Certification Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Certified Cloud Practitioner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Issuing Body / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon Web Services, Microsoft, Google"
                  value={issuingBody}
                  onChange={(e) => setIssuingBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Date Earned *</label>
                <input
                  type="date"
                  required
                  value={dateEarned}
                  onChange={(e) => setDateEarned(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Certificate File (PDF or Image)</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
