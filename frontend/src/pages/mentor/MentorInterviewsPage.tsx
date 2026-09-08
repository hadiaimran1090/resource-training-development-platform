import React, { useState, useEffect } from 'react';
import { interviewApi } from '../../api/interviewApi';
import type { Interview, InterviewType, InterviewResult } from '../../api/interviewApi';
import { resourceApi } from '../../api/resourceApi';
import type { ResourceProfile } from '../../api/resourceApi';
import { apiClient } from '../../api/apiClient';
import {
  Video,
  Plus,
  MessageSquare,
  Star,
  CheckCircle2,
  User,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const MentorInterviewsPage: React.FC = () => {
  const [resources, setResources] = useState<ResourceProfile[]>([]);
  const [roleProfiles, setRoleProfiles] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal States
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  // Log Form State
  const [resourceIdInput, setResourceIdInput] = useState<number>(0);
  const [clientName, setClientName] = useState('');
  const [roleProfileId, setRoleProfileId] = useState<number>(0);
  const [interviewType, setInterviewType] = useState<InterviewType>('mock');
  const [interviewDate, setInterviewDate] = useState(new Date().toISOString().substring(0, 16));
  const [result, setResult] = useState<InterviewResult>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feedback Form State
  const [technicalGaps, setTechnicalGaps] = useState('');
  const [communicationGaps, setCommunicationGaps] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [overallRating, setOverallRating] = useState<number>(3.0);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [resList, rpResponse] = await Promise.all([
        resourceApi.getResources(),
        apiClient.get('/role-profiles'),
      ]);
      setResources(resList);
      const rpList = Array.isArray(rpResponse.data) ? rpResponse.data : (rpResponse.data?.data || []);
      setRoleProfiles(rpList);

      if (resList.length > 0) {
        setSelectedResourceId(resList[0].id);
        setResourceIdInput(resList[0].id);
        const intList = await interviewApi.getInterviewsByResource(resList[0].id);
        setInterviews(intList);
      }
      if (rpList.length > 0) {
        setRoleProfileId(rpList[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load mentor interview data:', err);
      setError(err.response?.data?.error || 'Failed to load resources/interviews.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleResourceChange = async (resId: number) => {
    try {
      setSelectedResourceId(resId);
      setIsLoading(true);
      const data = await interviewApi.getInterviewsByResource(resId);
      setInterviews(data);
    } catch (err: any) {
      console.error('Failed to fetch interviews:', err);
      setError(err.response?.data?.error || 'Failed to fetch interviews.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogInterviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceIdInput) {
      setError('Please select a resource.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await interviewApi.createInterview({
        resource_id: resourceIdInput,
        client_name: clientName.trim() || undefined,
        role_profile_id: roleProfileId || undefined,
        interview_type: interviewType,
        interview_date: new Date(interviewDate).toISOString(),
        result,
      });

      setSuccessMsg('Interview record logged successfully.');
      setIsLogModalOpen(false);
      setClientName('');
      handleResourceChange(resourceIdInput);
    } catch (err: any) {
      console.error('Error logging interview:', err);
      setError(err.response?.data?.error || 'Failed to log interview record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await interviewApi.addFeedback(selectedInterview.id, {
        technical_gaps: technicalGaps.trim() || undefined,
        communication_gaps: communicationGaps.trim() || undefined,
        recommendations: recommendations.trim() || undefined,
        overall_rating: overallRating,
      });

      setSuccessMsg('Interview feedback submitted successfully.');
      setIsFeedbackModalOpen(false);
      setSelectedInterview(null);
      if (selectedResourceId) handleResourceChange(selectedResourceId);
    } catch (err: any) {
      console.error('Error adding feedback:', err);
      setError(err.response?.data?.error || 'Failed to submit interview feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openFeedbackModal = (interview: Interview) => {
    setSelectedInterview(interview);
    setTechnicalGaps(interview.feedback?.technical_gaps || '');
    setCommunicationGaps(interview.feedback?.communication_gaps || '');
    setRecommendations(interview.feedback?.recommendations || '');
    setOverallRating(interview.feedback?.overall_rating || 3.0);
    setIsFeedbackModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Video className="w-6 h-6 text-indigo-600" />
            Interview Logging & Feedback Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Log client/mock interviews and record 1:1 evaluation feedback for assigned mentees or regional resources.
          </p>
        </div>

        <button
          onClick={() => setIsLogModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-xs hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Log New Interview
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
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Resource Selector & Interview List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" /> Select Resource to View Interviews:
          </label>
          <select
            value={selectedResourceId || ''}
            onChange={(e) => handleResourceChange(Number(e.target.value))}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.user_name} ({r.designation} • {r.region_name || 'APAC'})
              </option>
            ))}
          </select>
        </div>

        {/* Interviews List */}
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : interviews.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Video className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No interviews logged for this resource.</p>
            <p className="text-xs text-slate-400 mt-1">Click "Log New Interview" to create the first record.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => (
              <div
                key={interview.id}
                className="bg-slate-50/50 rounded-xl border border-slate-200/80 p-5 space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-extrabold text-[10px] uppercase">
                        {interview.interview_type} Interview
                      </span>
                      {interview.client_name && (
                        <span className="text-xs font-bold text-slate-800">Client: {interview.client_name}</span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      Role Profile: {interview.role_profile_name || 'General Engineering'}
                    </p>
                    <p className="text-xs text-slate-400">
                      Date: {new Date(interview.interview_date).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold capitalize">Result: {interview.result}</span>
                    <button
                      onClick={() => openFeedbackModal(interview)}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-xs hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {interview.feedback ? 'Edit Feedback' : 'Add Feedback'}
                    </button>
                  </div>
                </div>

                {/* Feedback preview */}
                {interview.feedback ? (
                  <div className="bg-white rounded-lg p-3 border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between items-center text-slate-700 font-bold">
                      <span>Evaluator Feedback (Rating: {interview.feedback.overall_rating || 'N/A'}/5.0)</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        by {interview.feedback.given_by_name}
                      </span>
                    </div>
                    {interview.feedback.technical_gaps && (
                      <p className="text-slate-600">
                        <span className="font-bold text-slate-800">Technical Gaps:</span> {interview.feedback.technical_gaps}
                      </p>
                    )}
                    {interview.feedback.recommendations && (
                      <p className="text-slate-600">
                        <span className="font-bold text-slate-800">Recommendations:</span> {interview.feedback.recommendations}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No feedback entered yet for this interview.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Interview Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-600" /> Log Interview Record
              </h3>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogInterviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Resource *</label>
                <select
                  value={resourceIdInput}
                  onChange={(e) => setResourceIdInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                >
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.user_name} ({r.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Interview Type *</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value as InterviewType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                >
                  <option value="mock">Mock Interview</option>
                  <option value="client">Client Interview</option>
                  <option value="technical">Technical Assessment Interview</option>
                  <option value="behavioral">Behavioral / Soft Skills</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Client Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty for mock interviews"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Profile Target</label>
                <select
                  value={roleProfileId}
                  onChange={(e) => setRoleProfileId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                >
                  {roleProfiles.map((rp) => (
                    <option key={rp.id} value={rp.id}>
                      {rp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Interview Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Result Status *</label>
                <select
                  value={result}
                  onChange={(e) => setResult(e.target.value as InterviewResult)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                >
                  <option value="pending">Pending</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Log Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Feedback Modal */}
      {isFeedbackModalOpen && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" /> Add Interview Feedback
              </h3>
              <button
                onClick={() => setIsFeedbackModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFeedbackSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Technical Gaps Identified</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Weak on System Design, needs practice with indexing..."
                  value={technicalGaps}
                  onChange={(e) => setTechnicalGaps(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Communication & Soft Skills Gaps</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Needs clearer explanation of architectural choices..."
                  value={communicationGaps}
                  onChange={(e) => setCommunicationGaps(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Recommendations & Next Steps</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Complete System Design module and re-attempt mock..."
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Overall Rating (0.0 to 5.0) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.0"
                  max="5.0"
                  required
                  value={overallRating}
                  onChange={(e) => setOverallRating(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                  Save Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
