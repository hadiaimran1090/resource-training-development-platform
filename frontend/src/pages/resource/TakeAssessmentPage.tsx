import React, { useState, useEffect } from 'react';
import { assessmentApi } from '../../api/assessmentApi';
import { resourceApi } from '../../api/resourceApi';
import type {
  Assessment,
  AssessmentWithQuestions,
  AssessmentAttempt,
  AttemptWithAnswers,
  SubmitAnswerInput,
} from '../../types/assessment';
import {
  ClipboardCheck,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Award,
  Target,
  Clock,
  Hash,
  Eye,
  X,
  Send,
  Lock,
} from 'lucide-react';

const ASSESSMENT_TYPE_BADGES: Record<string, string> = {
  knowledge: 'bg-blue-50 text-blue-700 border-blue-200',
  technical: 'bg-purple-50 text-purple-700 border-purple-200',
  interview: 'bg-amber-50 text-amber-700 border-amber-200',
  certification_prep: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const ASSESSMENT_TYPE_LABELS: Record<string, string> = {
  knowledge: 'Knowledge',
  technical: 'Technical',
  interview: 'Interview',
  certification_prep: 'Certification Prep',
};

export const TakeAssessmentPage: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [myAttempts, setMyAttempts] = useState<AssessmentAttempt[]>([]); // completed only — for log display
  const [allAttempts, setAllAttempts] = useState<AssessmentAttempt[]>([]);  // all attempts — for lock check
  const [resourceId, setResourceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState<AssessmentWithQuestions | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Results state
  const [result, setResult] = useState<AttemptWithAnswers | null>(null);
  const [viewingPastResult, setViewingPastResult] = useState<AttemptWithAnswers | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const profile = await resourceApi.getMyProfile();
      const resId = (profile as any)?.resource_id || profile?.id;
      setResourceId(resId);

      const [assessmentsData, attemptsData] = await Promise.all([
        assessmentApi.getAll(),
        resId ? assessmentApi.getMyAttempts(resId) : Promise.resolve([]),
      ]);

      setAssessments(assessmentsData);
      // Only show completed attempts in the log — filter out in-progress ones
      setMyAttempts(attemptsData.filter((att: any) => att.completed_at !== null));
      // Keep full list (incl. in-progress) for locking assessments
      setAllAttempts(attemptsData);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load assessments.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = async (assessment: Assessment) => {
    if (!resourceId) {
      setErrorMsg('Resource profile not found. Please contact administrator.');
      return;
    }

    // Double check client side if resource already attempted this assessment
    const existingAttempt = allAttempts.find((att) => att.assessment_id === assessment.id);
    if (existingAttempt) {
      setErrorMsg('You have already attempted this assessment. Re-attempts are not allowed.');
      return;
    }

    try {
      setErrorMsg(null);
      const full = await assessmentApi.getById(assessment.id);
      const attempt = await assessmentApi.startAttempt(assessment.id, resourceId);

      setActiveQuiz(full);
      setActiveAttemptId(attempt.id);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setResult(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to start assessment.');
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeAttemptId || !activeQuiz) return;

    const unanswered = activeQuiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      if (!window.confirm(`You have ${unanswered.length} unanswered question(s). Are you sure you want to submit?`)) return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const submitAnswers: SubmitAnswerInput[] = activeQuiz.questions
        .filter((q) => answers[q.id])
        .map((q) => ({
          question_id: q.id,
          given_answer: answers[q.id],
        }));

      const resultData = await assessmentApi.submitAttempt(activeAttemptId, submitAnswers);
      setResult(resultData);
      setActiveQuiz(null);
      setActiveAttemptId(null);

      if (resourceId) {
        const updatedAttempts = await assessmentApi.getMyAttempts(resourceId);
        setMyAttempts(updatedAttempts.filter((att: any) => att.completed_at !== null));
        setAllAttempts(updatedAttempts);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewPastResult = async (attemptId: number) => {
    try {
      setErrorMsg(null);
      const details = await assessmentApi.getAttemptDetails(attemptId);
      setViewingPastResult(details);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load attempt details.');
    }
  };

  // ==========================================
  // ACTIVE QUIZ INTERFACE
  // ==========================================
  if (activeQuiz && activeAttemptId) {
    const question = activeQuiz.questions[currentQuestionIndex];
    const totalQuestions = activeQuiz.questions.length;
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Quiz Header Bar */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">{activeQuiz.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Question {currentQuestionIndex + 1} of {totalQuestions} · {answeredCount} answered
            </p>
          </div>
          <div className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
            {answeredCount} / {totalQuestions} Answered
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-purple-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question Box */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-xs">
                {currentQuestionIndex + 1}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {question.marks} Mark{question.marks !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {question.question_type.replace('_', ' ')}
            </span>
          </div>

          <p className="text-sm font-bold text-slate-900 leading-relaxed">{question.question_text}</p>

          {/* Options */}
          {(question.question_type === 'mcq' || question.question_type === 'true_false') && (
            <div className="space-y-2.5 pt-2">
              {(question.options || (question.question_type === 'true_false' ? ['True', 'False'] : [])).map((opt: string, oi: number) => {
                const isSelected = answers[question.id] === opt;
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => setAnswers({ ...answers, [question.id]: opt })}
                    className={`w-full p-4 rounded-xl text-left border text-xs font-semibold transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-purple-50 text-purple-900 border-purple-500 ring-1 ring-purple-500/20'
                        : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className="flex-1">{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {question.question_type === 'short_answer' && (
            <div className="pt-2">
              <input
                type="text"
                placeholder="Type your answer here..."
                value={answers[question.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
          )}
        </div>

        {/* Question Navigator Dots */}
        <div className="flex flex-wrap gap-2 justify-center py-2">
          {activeQuiz.questions.map((q, qi) => (
            <button
              key={qi}
              type="button"
              onClick={() => setCurrentQuestionIndex(qi)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                qi === currentQuestionIndex
                  ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-500/30'
                  : answers[q.id]
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {qi + 1}
            </button>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          {currentQuestionIndex < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // RESULTS REVIEW INTERFACE
  // ==========================================
  const resultToShow = result || viewingPastResult;

  if (resultToShow) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => {
            setResult(null);
            setViewingPastResult(null);
          }}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Assessments
        </button>

        {/* Score Card */}
        <div
          className={`p-8 rounded-2xl border text-center space-y-3 shadow-sm ${
            resultToShow.passed
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/60 border-rose-200 text-rose-900'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-xs ${
              resultToShow.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
            }`}
          >
            {resultToShow.passed ? <Award className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>

          <h2 className="text-xl font-extrabold">{resultToShow.passed ? 'Assessment Passed!' : 'Assessment Not Passed'}</h2>
          <p className="text-xs font-semibold text-slate-600">{resultToShow.assessment_name}</p>

          <div className={`text-4xl font-extrabold ${resultToShow.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
            {resultToShow.score}%
          </div>
          <p className="text-xs font-medium text-slate-500">Passing score required: {resultToShow.passing_score}%</p>
        </div>

        {/* Detailed Answers Review */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Answer Review</h3>
          <div className="space-y-3">
            {resultToShow.answers.map((ans) => (
              <div
                key={ans.id}
                className={`p-4 rounded-xl border space-y-2 ${
                  ans.is_correct ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 ${
                      ans.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {ans.is_correct ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  </span>
                  <div className="space-y-1.5 flex-1">
                    <p className="text-xs font-bold text-slate-900 leading-relaxed">{ans.question_text}</p>
                    <div className="flex flex-wrap gap-4 text-xs font-medium">
                      <span>
                        Your answer:{' '}
                        <strong className={ans.is_correct ? 'text-emerald-700' : 'text-rose-700'}>
                          {ans.given_answer || '(no answer)'}
                        </strong>
                      </span>
                      {!ans.is_correct && (
                        <span>
                          Correct answer: <strong className="text-emerald-700">{ans.correct_answer}</strong>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 block pt-1">
                      Marks obtained: {ans.marks_obtained} / {ans.marks}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN LIST VIEW FOR RESOURCE
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">My Assessments</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete assigned technical and knowledge assessments to demonstrate deployment readiness.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-slate-500 bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-xs font-semibold">Loading available assessments...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Assessments Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Available Assessments ({assessments.length})</h3>
            </div>

            {assessments.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs font-medium bg-white rounded-xl border border-slate-200/80 shadow-sm">
                No assessments available at this time.
              </div>
            ) : (
              <div className="space-y-3">
                {assessments.map((a) => {
                  const badgeStyle = ASSESSMENT_TYPE_BADGES[a.type] || 'bg-purple-50 text-purple-700 border-purple-200';

                  // Check if resource has already attempted this assessment (use allAttempts including in-progress)
                  const existingAttempt = allAttempts.find((att) => att.assessment_id === a.id);
                  const isAttempted = Boolean(existingAttempt);

                  return (
                    <div
                      key={a.id}
                      className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{a.name}</h4>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeStyle}`}>
                              {ASSESSMENT_TYPE_LABELS[a.type] || a.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500 pt-1">
                            <span className="flex items-center gap-1">
                              <Hash className="w-3.5 h-3.5 text-slate-400" /> {a.question_count ?? a.total_questions} Questions
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="w-3.5 h-3.5 text-slate-400" /> {a.passing_score}% Pass Score
                            </span>
                          </div>
                        </div>

                        {/* Action / Single Attempt Logic */}
                        {isAttempted ? (
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                existingAttempt?.passed
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : existingAttempt?.completed_at
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              <Lock className="w-3 h-3" />
                              {existingAttempt?.passed
                                ? `Passed (${existingAttempt.score}%)`
                                : existingAttempt?.completed_at
                                ? `Failed (${existingAttempt.score}%)`
                                : 'In Progress'}
                            </span>

                            {existingAttempt?.completed_at && (
                              <button
                                onClick={() => handleViewPastResult(existingAttempt.id)}
                                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Result
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartAssessment(a)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                          >
                            <Play className="w-3.5 h-3.5" /> Start Assessment
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Attempts History Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">My Attempts Log ({myAttempts.length})</h3>
            </div>

            {myAttempts.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs font-medium bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col items-center gap-2">
                <Clock className="w-8 h-8 opacity-30 text-purple-600" />
                <p>You have not attempted any assessments yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myAttempts.map((att) => (
                  <div
                    key={att.id}
                    className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          att.passed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : att.completed_at
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {att.passed ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : att.completed_at ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{att.assessment_name}</h4>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {att.completed_at ? new Date(att.completed_at).toLocaleString() : 'Attempt In Progress'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {att.score !== null && (
                        <span className={`text-sm font-extrabold ${att.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {att.score}%
                        </span>
                      )}

                      {att.completed_at && (
                        <button
                          onClick={() => handleViewPastResult(att.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer border border-slate-200"
                          title="View Result Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
