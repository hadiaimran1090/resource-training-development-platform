import React, { useState, useEffect } from 'react';
import { codingChallengeApi, type CodingSubmission } from '../../api/codingChallengeApi';
import {
  Code,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Terminal,
  AlertCircle,
  X,
  Send,
} from 'lucide-react';

export const MentorCodingReviewPage: React.FC = () => {
  const [queue, setQueue] = useState<CodingSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Review Modal State
  const [activeReview, setActiveReview] = useState<CodingSubmission | null>(null);
  const [testPassCount, setTestPassCount] = useState<number>(0);
  const [totalTestsInput, setTotalTestsInput] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await codingChallengeApi.getReviewQueue();
      setQueue(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch review queue.';
      setError(msg);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (submission: CodingSubmission) => {
    setActiveReview(submission);
    let total = submission.total_tests || 0;
    if (total === 0 && submission.test_cases) {
      if (Array.isArray(submission.test_cases)) {
        total = submission.test_cases.length;
      } else if (typeof submission.test_cases === 'string') {
        try {
          const parsed = JSON.parse(submission.test_cases);
          total = parsed.length;
        } catch {
          total = 1;
        }
      }
    }
    if (total === 0) total = 1;

    setTotalTestsInput(total);
    setTestPassCount(total);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReview) return;

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const result = await codingChallengeApi.reviewSubmission(activeReview.id, {
        test_pass_count: testPassCount,
        total_tests: totalTestsInput,
      });

      setSuccessMsg(`Review submitted successfully! Score: ${result.score}%, Status: ${result.status.toUpperCase()}`);
      setActiveReview(null);
      fetchQueue();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit review.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Preview score calculation
  const calculatedScore =
    totalTestsInput > 0
      ? Number(((testPassCount / totalTestsInput) * 100).toFixed(2))
      : 0;
  const isPassed = testPassCount === totalTestsInput && totalTestsInput > 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase">
            <UserCheck className="w-4 h-4" />
            <span>Mentorship & Evaluation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Coding Submissions Review Queue</h1>
          <p className="text-slate-300 text-xs max-w-2xl">
            Assess resource code submissions, evaluate test case compliance, and grade performance.
          </p>
        </div>

        <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-200 shrink-0 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Pending Reviews: {queue.length}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
          Loading review queue...
        </div>
      ) : queue.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <p className="text-slate-700 font-bold text-base">All caught up!</p>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            There are currently no pending coding submissions requiring mentor review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-900 text-white uppercase">
                    {sub.language}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Pending Review</span>
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">{sub.challenge_title}</h3>
                  <p className="text-xs text-blue-600 font-medium">
                    Resource: <strong className="text-slate-900">{sub.resource_name}</strong> ({sub.resource_email})
                  </p>
                </div>

                <div className="text-[11px] text-slate-400">
                  Submitted on {new Date(sub.submission_date).toLocaleDateString()} at{' '}
                  {new Date(sub.submission_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleOpenReview(sub)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Code className="w-4 h-4" />
                  <span>Review Code & Grade</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {activeReview && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[82vh]">
            <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-400" />
                <div>
                  <h2 className="font-bold text-base">Reviewing: {activeReview.challenge_title}</h2>
                  <span className="text-[10px] text-slate-400">
                    Resource: {activeReview.resource_name} ({activeReview.language})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveReview(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-4 overflow-y-auto custom-scrollbar space-y-4 flex-1">
              {/* Challenge Description & Reference Test Cases */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Problem Description</h4>
                  <p className="text-slate-700 text-xs leading-relaxed mt-1">
                    {activeReview.challenge_description}
                  </p>
                </div>

                {/* Reference Test Cases */}
                {activeReview.test_cases && (
                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700">Expected Test Cases Reference:</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(Array.isArray(activeReview.test_cases)
                        ? activeReview.test_cases
                        : typeof activeReview.test_cases === 'string'
                        ? JSON.parse(activeReview.test_cases || '[]')
                        : []
                      ).map((tc: any, i: number) => (
                        <div key={i} className="text-[11px] font-mono bg-white p-2 rounded-lg border border-slate-200 space-y-0.5">
                          <div><span className="text-slate-400">Input:</span> <strong className="text-slate-800">{tc.input}</strong></div>
                          <div><span className="text-slate-400">Expected:</span> <strong className="text-emerald-700">{tc.expected_output}</strong></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submitted Code View */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  <span>Submitted Code ({activeReview.language})</span>
                </label>
                <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-48 leading-relaxed custom-scrollbar shadow-inner">
                  {activeReview.submitted_code}
                </pre>
              </div>

              {/* Grading Input Controls */}
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200 space-y-3">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Evaluation & Grading</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tests Passed <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={totalTestsInput}
                      required
                      value={testPassCount}
                      onChange={(e) => setTestPassCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Total Test Cases <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={totalTestsInput}
                      onChange={(e) => setTotalTestsInput(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                    />
                  </div>
                </div>

                {/* Auto Calculated Result Preview */}
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600">Calculated Score:</span>
                    <span className="text-base font-extrabold text-slate-900">{calculatedScore}%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">Final Status:</span>
                    {isPassed ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>PASSED</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        <span>FAILED</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveReview(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting Review...' : 'Save & Complete Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
