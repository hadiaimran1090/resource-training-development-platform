import React, { useState, useEffect } from 'react';
import { interviewApi } from '../../api/interviewApi';
import type { Interview } from '../../api/interviewApi';
import { resourceApi } from '../../api/resourceApi';
import {
  History,
  Video,
  XCircle,
  Clock,
  Star,
  MessageSquare,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const ResourceInterviewHistoryPage: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const profile = await resourceApi.getMyProfile();
        const data = await interviewApi.getInterviewsByResource(profile.id);
        setInterviews(data);
      } catch (err: any) {
        console.error('Failed to load interview history:', err);
        setError(err.response?.data?.error || 'Failed to load interview history.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  const renderResultBadge = (result: string) => {
    switch (result) {
      case 'selected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Selected
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
            <Clock className="w-3.5 h-3.5" /> Pending Result
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <History className="w-6 h-6 text-indigo-600" />
          My Interview History
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Read-only history of client, mock, technical, and behavioral interviews logged by your Regional Lead and Mentor.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Interview History Cards / Table */}
      <div className="space-y-4">
        {interviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
            <Video className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No interview records found.</p>
            <p className="text-xs text-slate-400 mt-1">Mock and client interviews logged for you will appear here.</p>
          </div>
        ) : (
          interviews.map((interview) => (
            <div
              key={interview.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-extrabold text-[10px] uppercase tracking-wide border border-blue-100">
                      {interview.interview_type} Interview
                    </span>
                    {interview.client_name && (
                      <span className="text-xs font-bold text-slate-700">Client: {interview.client_name}</span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Role Profile: {interview.role_profile_name || 'General Engineering'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Date: {new Date(interview.interview_date).toLocaleString()}
                  </p>
                </div>
                <div>{renderResultBadge(interview.result)}</div>
              </div>

              {/* Feedback Section */}
              {interview.feedback ? (
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                      Feedback from {interview.feedback.given_by_name || 'Evaluator'}
                    </h4>
                    {interview.feedback.overall_rating !== null && interview.feedback.overall_rating !== undefined && (
                      <span className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-0.5 rounded-full font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {interview.feedback.overall_rating} / 5.0
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {interview.feedback.technical_gaps && (
                      <div className="bg-white p-3 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wider">
                          Technical Gaps
                        </span>
                        <p className="text-slate-600">{interview.feedback.technical_gaps}</p>
                      </div>
                    )}

                    {interview.feedback.communication_gaps && (
                      <div className="bg-white p-3 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wider">
                          Communication Gaps
                        </span>
                        <p className="text-slate-600">{interview.feedback.communication_gaps}</p>
                      </div>
                    )}

                    {interview.feedback.recommendations && (
                      <div className="bg-white p-3 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wider">
                          Recommendations
                        </span>
                        <p className="text-slate-600">{interview.feedback.recommendations}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No feedback added for this interview yet.</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
