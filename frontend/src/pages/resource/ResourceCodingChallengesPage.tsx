import React, { useState, useEffect } from 'react';
import { codingChallengeApi, type CodingChallenge, type CodingSubmission } from '../../api/codingChallengeApi';
import {
  Code,
  Terminal,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  History,
  FileCode,
  AlertCircle,
  X,
  Send,
  BookOpen,
  Filter,
} from 'lucide-react';

const DIFFICULTY_BADGES: Record<number, { label: string; bg: string; text: string }> = {
  1: { label: '1 - Basic', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  2: { label: '2 - Intermediate', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  3: { label: '3 - Advanced', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  4: { label: '4 - Real-world Problem', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
  5: { label: '5 - Architecture Challenge', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
};

export const ResourceCodingChallengesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');
  const [challenges, setChallenges] = useState<CodingChallenge[]>([]);
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterLanguage, setFilterLanguage] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');

  // Attempt Modal
  const [attemptChallenge, setAttemptChallenge] = useState<CodingChallenge | null>(null);
  const [attemptDetail, setAttemptDetail] = useState<CodingChallenge | null>(null);
  const [submittedCode, setSubmittedCode] = useState<string>('');
  const [attemptLoading, setAttemptLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // View Submitted Code Modal
  const [viewingSubmission, setViewingSubmission] = useState<CodingSubmission | null>(null);

  useEffect(() => {
    fetchChallenges();
    fetchMySubmissions();
  }, [filterLanguage, filterDifficulty]);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterLanguage) params.language = filterLanguage;
      if (filterDifficulty) params.difficulty_level = filterDifficulty;

      const data = await codingChallengeApi.getAll(params);
      setChallenges(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to load coding challenges';
      setError(msg);
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMySubmissions = async () => {
    try {
      const data = await codingChallengeApi.getMySubmissions();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setSubmissions([]);
    }
  };

  const handleOpenAttempt = async (challenge: CodingChallenge) => {
    setAttemptChallenge(challenge);
    setAttemptDetail(null);
    setSubmittedCode('');
    setSubmitSuccess(false);
    setAttemptLoading(true);
    setError(null);

    try {
      const data = await codingChallengeApi.getForAttempt(challenge.id);
      setAttemptDetail(data);

      const lang = data.language.toLowerCase();
      let defaultTemplate = `// Write your ${data.language} solution below:\n\n`;
      if (lang.includes('java')) {
        defaultTemplate = `public class Solution {\n    public static void main(String[] args) {\n        // Your solution code here\n    }\n}\n`;
      } else if (lang.includes('python')) {
        defaultTemplate = `# Write your Python solution here\ndef solution():\n    pass\n`;
      } else if (lang.includes('javascript') || lang.includes('typescript')) {
        defaultTemplate = `// Write your solution function here\nfunction solution() {\n    \n}\n`;
      }
      setSubmittedCode(defaultTemplate);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to load challenge attempt view';
      setError(msg);
    } finally {
      setAttemptLoading(false);
    }
  };

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attemptChallenge || !submittedCode.trim()) {
      setError('Submitted code cannot be empty.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await codingChallengeApi.submitSolution(attemptChallenge.id, submittedCode);
      setSubmitSuccess(true);
      fetchMySubmissions();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit solution.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase">
            <Terminal className="w-4 h-4" />
            <span>Developer Growth & Coding Practice</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Coding Challenges</h1>
          <p className="text-slate-300 text-xs max-w-2xl">
            Test your programming skills, build algorithm proficiency, and submit solutions for Mentor review.
          </p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 shrink-0">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'available'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Available Challenges</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>My Submissions ({submissions.length})</span>
          </button>
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

      {/* Tab 1: Available Challenges */}
      {activeTab === 'available' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filter Challenges:</span>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Languages</option>
                <option value="Java">Java</option>
                <option value="JavaScript">JavaScript</option>
                <option value="Python">Python</option>
                <option value="C#">C#</option>
                <option value="Go">Go</option>
                <option value="TypeScript">TypeScript</option>
                <option value="C++">C++</option>
              </select>

              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Difficulty Levels</option>
                <option value="1">1 - Basic</option>
                <option value="2">2 - Intermediate</option>
                <option value="3">3 - Advanced</option>
                <option value="4">4 - Real-world Problem</option>
                <option value="5">5 - Architecture Challenge</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
              Loading challenges...
            </div>
          ) : challenges.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <Code className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-600 font-medium text-sm">No coding challenges available</p>
              <p className="text-slate-400 text-xs">Check back later or adjust your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {challenges.map((challenge) => {
                const diffBadge = DIFFICULTY_BADGES[challenge.difficulty_level] || DIFFICULTY_BADGES[1];
                const hasSubmitted = submissions.some((s) => s.challenge_id === challenge.id);

                return (
                  <div
                    key={challenge.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white">
                          {challenge.language}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${diffBadge.bg} ${diffBadge.text}`}
                        >
                          {diffBadge.label}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 text-base line-clamp-1">{challenge.title}</h3>
                        {challenge.target_role_profile_name && (
                          <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1 mt-0.5">
                            <BookOpen className="w-3 h-3" />
                            <span>Role: {challenge.target_role_profile_name}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed">
                        {challenge.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      {hasSubmitted ? (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Submitted</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Not attempted yet</span>
                      )}

                      <button
                        onClick={() => handleOpenAttempt(challenge)}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Attempt</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Submissions History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <span>Coding Submissions Log</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500">{submissions.length} Total Submissions</span>
          </div>

          {submissions.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <FileCode className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-slate-600 text-xs font-medium">No submission history found</p>
              <p className="text-slate-400 text-[11px]">Select an available challenge above to make your first submission.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Challenge</th>
                    <th className="py-3 px-4">Language</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Test Pass Rate</th>
                    <th className="py-3 px-4 text-right">Score</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.map((sub) => {
                    const isPassed = sub.status === 'passed';
                    const isPending = sub.status === 'pending_review';

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{sub.challenge_title}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-white uppercase">
                            {sub.language}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(sub.submission_date).toLocaleDateString()} {new Date(sub.submission_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4">
                          {isPending ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Pending Review</span>
                            </span>
                          ) : isPassed ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Passed</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              <span>Failed</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {isPending ? '-' : `${sub.test_pass_count} / ${sub.total_tests}`}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {isPending ? '-' : `${sub.score}%`}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setViewingSubmission(sub)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            View Code
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Attempt Challenge Modal */}
      {attemptChallenge && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl my-6 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-400" />
                <div>
                  <h2 className="font-bold text-base">{attemptChallenge.title}</h2>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Language: {attemptChallenge.language}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setAttemptChallenge(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {attemptLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">Loading challenge workspace...</div>
            ) : submitSuccess ? (
              <div className="p-8 text-center space-y-4 my-auto">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="font-bold text-slate-900 text-lg">Submission Received!</h3>
                  <p className="text-slate-600 text-xs">
                    Your code submission for <strong>"{attemptChallenge.title}"</strong> has been sent for review. A Mentor will review your submission and calculate your score.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAttemptChallenge(null);
                    setActiveTab('history');
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                >
                  <History className="w-4 h-4" />
                  <span>View Submission History</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitCode} className="p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">
                {/* Description Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Problem Description</h4>
                  <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line">
                    {attemptDetail?.description || attemptChallenge.description}
                  </p>

                  {/* Sample Inputs (stripped expected_output!) */}
                  {attemptDetail?.test_cases && (Array.isArray(attemptDetail.test_cases) ? attemptDetail.test_cases : []).length > 0 && (
                    <div className="pt-2 border-t border-slate-200 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600">Sample Test Inputs:</span>
                      <div className="space-y-1">
                        {(Array.isArray(attemptDetail.test_cases) ? attemptDetail.test_cases : []).map((tc: any, i: number) => (
                          <div key={i} className="text-[11px] font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-800">
                            Sample {i + 1} Input: <span className="font-bold">{tc.input}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Code Editor Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Terminal className="w-4 h-4 text-blue-600" />
                      <span>Code Solution ({attemptChallenge.language})</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Type or paste your complete solution</span>
                  </div>

                  <textarea
                    rows={12}
                    required
                    value={submittedCode}
                    onChange={(e) => setSubmittedCode(e.target.value)}
                    placeholder={`Write your ${attemptChallenge.language} code here...`}
                    className="w-full p-4 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden leading-relaxed custom-scrollbar shadow-inner"
                  ></textarea>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 italic">
                    Submissions are evaluated by Mentors for accuracy and efficiency.
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAttemptChallenge(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !submittedCode.trim()}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submitting ? 'Submitting...' : 'Submit Code for Review'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* View Submitted Code Modal */}
      {viewingSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{viewingSubmission.challenge_title}</h3>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  {viewingSubmission.language} Solution
                </span>
              </div>
              <button
                onClick={() => setViewingSubmission(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Submitted Code:</label>
              <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-80 leading-relaxed custom-scrollbar">
                {viewingSubmission.submitted_code}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <span>Status: <strong className="uppercase text-slate-900">{viewingSubmission.status}</strong></span>
              <span>Score: <strong className="text-slate-900">{viewingSubmission.status === 'pending_review' ? 'Pending' : `${viewingSubmission.score}%`}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
