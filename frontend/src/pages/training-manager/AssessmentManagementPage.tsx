import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { assessmentApi } from '../../api/assessmentApi';
import type {
  Assessment,
  AssessmentWithQuestions,
  AssessmentType,
  QuestionType,
  CreateQuestionInput,
  AssessmentAttempt,
} from '../../types/assessment';
import {
  ClipboardCheck,
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ListChecks,
  ToggleLeft,
  FileQuestion,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  Award,
  Target,
  Hash,
  ArrowLeft,
} from 'lucide-react';

const ASSESSMENT_TYPES: { value: AssessmentType; label: string; badgeStyle: string }[] = [
  { value: 'knowledge', label: 'Knowledge', badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'technical', label: 'Technical', badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'interview', label: 'Interview', badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'certification_prep', label: 'Certification Prep', badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

const QUESTION_TYPES: { value: QuestionType; label: string; icon: React.ReactNode }[] = [
  { value: 'mcq', label: 'Multiple Choice', icon: <ListChecks className="w-4 h-4" /> },
  { value: 'true_false', label: 'True / False', icon: <ToggleLeft className="w-4 h-4" /> },
  { value: 'short_answer', label: 'Short Answer', icon: <FileQuestion className="w-4 h-4" /> },
];

export const AssessmentManagementPage: React.FC = () => {
  const { user } = useAuth();
  const userRoles = user?.roles || (user?.role ? [user.role] : []);
  const canManage = userRoles.some((r) =>
    ['Training Manager', 'Regional Lead'].includes(r)
  );

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');

  // Assessment modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<AssessmentWithQuestions | null>(null);
  const [assessmentForm, setAssessmentForm] = useState({
    name: '',
    type: 'knowledge' as AssessmentType,
    passing_score: 70,
    related_module_id: '',
  });
  const [questionsForm, setQuestionsForm] = useState<CreateQuestionInput[]>([]);

  // Detail view
  const [viewingAssessment, setViewingAssessment] = useState<AssessmentWithQuestions | null>(null);
  const [viewingAttempts, setViewingAttempts] = useState<AssessmentAttempt[] | null>(null);
  const [showAttempts, setShowAttempts] = useState(false);

  useEffect(() => {
    loadAssessments();
  }, [filterType]);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await assessmentApi.getAll(filterType || undefined);
      setAssessments(data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load assessments.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleOpenModal = async (assessment?: Assessment) => {
    if (assessment) {
      try {
        const full = await assessmentApi.getById(assessment.id);
        setEditingAssessment(full);
        setAssessmentForm({
          name: full.name,
          type: full.type,
          passing_score: full.passing_score,
          related_module_id: full.related_module_id ? String(full.related_module_id) : '',
        });
        setQuestionsForm(
          full.questions.map((q) => ({
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options,
            correct_answer: q.correct_answer,
            marks: q.marks,
            sequence_order: q.sequence_order,
          }))
        );
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Failed to load assessment details.');
        return;
      }
    } else {
      setEditingAssessment(null);
      setAssessmentForm({
        name: '',
        type: 'knowledge',
        passing_score: 70,
        related_module_id: '',
      });
      setQuestionsForm([]);
    }
    setIsModalOpen(true);
  };

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentForm.name.trim()) {
      setErrorMsg('Assessment name is required.');
      return;
    }
    if (questionsForm.length === 0) {
      setErrorMsg('At least one question is required.');
      return;
    }

    try {
      setErrorMsg(null);
      if (editingAssessment) {
        await assessmentApi.update(editingAssessment.id, {
          name: assessmentForm.name.trim(),
          type: assessmentForm.type,
          passing_score: Number(assessmentForm.passing_score),
          related_module_id: assessmentForm.related_module_id ? Number(assessmentForm.related_module_id) : null,
        });

        const existingIds = editingAssessment.questions.map((q) => q.id);
        const keptQuestionIndices = new Set<number>();

        for (let i = 0; i < questionsForm.length; i++) {
          const q = questionsForm[i];
          if (i < editingAssessment.questions.length) {
            await assessmentApi.updateQuestion(editingAssessment.questions[i].id, {
              question_text: q.question_text,
              question_type: q.question_type,
              options: q.options,
              correct_answer: q.correct_answer,
              marks: q.marks,
              sequence_order: i + 1,
            });
            keptQuestionIndices.add(i);
          } else {
            await assessmentApi.addQuestion(editingAssessment.id, {
              ...q,
              sequence_order: i + 1,
            });
          }
        }

        for (let i = questionsForm.length; i < existingIds.length; i++) {
          await assessmentApi.deleteQuestion(existingIds[i]);
        }

        showSuccess(`Assessment "${assessmentForm.name}" updated successfully.`);
      } else {
        await assessmentApi.create({
          name: assessmentForm.name.trim(),
          type: assessmentForm.type,
          passing_score: Number(assessmentForm.passing_score),
          related_module_id: assessmentForm.related_module_id ? Number(assessmentForm.related_module_id) : null,
          questions: questionsForm.map((q, i) => ({ ...q, sequence_order: i + 1 })),
        });
        showSuccess(`Assessment "${assessmentForm.name}" created successfully.`);
      }

      setIsModalOpen(false);
      loadAssessments();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save assessment.');
    }
  };

  const handleDeleteAssessment = async (assessment: Assessment) => {
    if (!window.confirm(`Are you sure you want to delete "${assessment.name}"? This cannot be undone.`)) return;
    try {
      await assessmentApi.delete(assessment.id);
      showSuccess(`Assessment "${assessment.name}" deleted.`);
      loadAssessments();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to delete assessment.');
    }
  };

  const handleViewAssessment = async (assessment: Assessment) => {
    try {
      const full = await assessmentApi.getById(assessment.id);
      setViewingAssessment(full);
      setShowAttempts(false);
      setViewingAttempts(null);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load assessment details.');
    }
  };

  const handleViewAttempts = async (assessmentId: number) => {
    try {
      const attempts = await assessmentApi.getAssessmentAttempts(assessmentId);
      setViewingAttempts(attempts);
      setShowAttempts(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load attempts.');
    }
  };

  const addQuestion = () => {
    setQuestionsForm([
      ...questionsForm,
      {
        question_text: '',
        question_type: 'mcq',
        options: ['', '', '', ''],
        correct_answer: '',
        marks: 1,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestionsForm(questionsForm.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questionsForm];
    (updated[index] as any)[field] = value;

    if (field === 'question_type') {
      if (value === 'mcq') {
        updated[index].options = ['', '', '', ''];
        updated[index].correct_answer = '';
      } else if (value === 'true_false') {
        updated[index].options = ['True', 'False'];
        updated[index].correct_answer = '';
      } else {
        updated[index].options = null;
        updated[index].correct_answer = '';
      }
    }

    setQuestionsForm(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questionsForm];
    const options = [...(updated[questionIndex].options || [])];
    options[optionIndex] = value;
    updated[questionIndex].options = options;
    setQuestionsForm(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questionsForm];
    updated[questionIndex].options = [...(updated[questionIndex].options || []), ''];
    setQuestionsForm(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questionsForm];
    const options = [...(updated[questionIndex].options || [])];
    options.splice(optionIndex, 1);
    updated[questionIndex].options = options;
    setQuestionsForm(updated);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questionsForm.length) return;
    const updated = [...questionsForm];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setQuestionsForm(updated);
  };

  const filteredAssessments = assessments.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeInfo = (type: string) =>
    ASSESSMENT_TYPES.find((t) => t.value === type) || ASSESSMENT_TYPES[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900">Assessment Engine</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Create, manage, and evaluate skills assessments and quizzes across training tracks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManage && !viewingAssessment && (
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> New Assessment
            </button>
          )}
          {viewingAssessment && (
            <button
              onClick={() => {
                setViewingAssessment(null);
                setViewingAttempts(null);
                setShowAttempts(false);
              }}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessments
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
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

      {/* Detail View */}
      {viewingAssessment ? (
        <div className="space-y-6">
          {/* Assessment Header Info Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-extrabold text-slate-900">{viewingAssessment.name}</h2>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      getTypeInfo(viewingAssessment.type).badgeStyle
                    }`}
                  >
                    {getTypeInfo(viewingAssessment.type).label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Created by <strong className="text-slate-700">{viewingAssessment.creator_name || 'System Admin'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (showAttempts) {
                      setShowAttempts(false);
                    } else {
                      handleViewAttempts(viewingAssessment.id);
                    }
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
                    showAttempts
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" /> {showAttempts ? 'View Questions' : 'View Attempts Log'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Hash className="w-4 h-4 text-purple-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Questions</span>
                </div>
                <span className="text-lg font-extrabold text-slate-900">{viewingAssessment.questions.length}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Target className="w-4 h-4 text-amber-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Passing Score</span>
                </div>
                <span className="text-lg font-extrabold text-slate-900">{viewingAssessment.passing_score}%</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Marks</span>
                </div>
                <span className="text-lg font-extrabold text-slate-900">
                  {viewingAssessment.questions.reduce((sum, q) => sum + Number(q.marks), 0)}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Type</span>
                </div>
                <span className="text-sm font-extrabold text-slate-900 capitalize">{viewingAssessment.type}</span>
              </div>
            </div>
          </div>

          {/* Questions List View */}
          {!showAttempts && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Questions ({viewingAssessment.questions.length})</h3>

              <div className="space-y-3">
                {viewingAssessment.questions.map((q, i) => (
                  <div key={q.id} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {i + 1}
                      </span>
                      <div className="space-y-2 flex-1">
                        <p className="text-xs font-bold text-slate-900 leading-relaxed">{q.question_text}</p>
                        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
                          <span>Type: <strong className="text-slate-800 capitalize">{q.question_type.replace('_', ' ')}</strong></span>
                          <span>Marks: <strong className="text-slate-800">{q.marks}</strong></span>
                        </div>

                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {(Array.isArray(q.options) ? q.options : []).map((opt: string, oi: number) => {
                              const isCorrect = opt.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
                              return (
                                <div
                                  key={oi}
                                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border ${
                                    isCorrect
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-white text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {isCorrect ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                                  )}
                                  <span className="truncate">{opt}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {q.question_type === 'short_answer' && (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Correct Answer: {q.correct_answer}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attempts List View */}
          {showAttempts && viewingAttempts && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
                Recorded Attempts ({viewingAttempts.length})
              </div>
              {viewingAttempts.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-medium">
                  No resource attempt records found for this assessment yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {viewingAttempts.map((att) => (
                    <div key={att.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            att.passed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : att.completed_at
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {att.passed ? <CheckCircle2 className="w-4 h-4" /> : att.completed_at ? <XCircle className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{att.resource_name || 'Resource'}</p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {att.completed_at ? `Completed: ${new Date(att.completed_at).toLocaleString()}` : 'In Progress'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {att.score !== null && (
                          <span
                            className={`text-sm font-extrabold ${
                              att.passed ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {att.score}%
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            att.passed
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : att.completed_at
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {att.passed ? 'PASSED' : att.completed_at ? 'FAILED' : 'IN PROGRESS'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* List View */
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500">Category:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="">All Types</option>
                {ASSESSMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-slate-500 bg-white rounded-xl border border-slate-200/80 shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-xs font-semibold">Loading assessments...</p>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col items-center gap-2">
              <ClipboardCheck className="w-8 h-8 opacity-40 text-purple-600" />
              <p>No assessments found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAssessments.map((a) => {
                const typeInfo = getTypeInfo(a.type);
                return (
                  <div
                    key={a.id}
                    onClick={() => handleViewAssessment(a)}
                    className="bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-purple-200 transition-all p-5 flex flex-col justify-between cursor-pointer space-y-4 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                            <ClipboardCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                              {a.name}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border mt-1 ${typeInfo.badgeStyle}`}>
                              {typeInfo.label}
                            </span>
                          </div>
                        </div>

                        {canManage && (
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenModal(a)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Assessment"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAssessment(a)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Assessment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Questions</p>
                        <p className="text-sm font-extrabold text-slate-800">{a.question_count ?? a.total_questions}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Pass Score</p>
                        <p className="text-sm font-extrabold text-slate-800">{a.passing_score}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Attempts</p>
                        <p className="text-sm font-extrabold text-slate-800">{a.attempt_count ?? 0}</p>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 font-medium pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span>By {a.creator_name || 'System Admin'}</span>
                      <span>{a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base font-extrabold text-slate-900">
                {editingAssessment ? 'Edit Assessment' : 'Create Assessment'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssessment}>
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assessment Name *</label>
                    <input
                      type="text"
                      required
                      value={assessmentForm.name}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, name: e.target.value })}
                      placeholder="e.g. AWS Core Infrastructure Assessment"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Type *</label>
                      <select
                        value={assessmentForm.type}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, type: e.target.value as AssessmentType })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      >
                        {ASSESSMENT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Passing Score (%) *</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={assessmentForm.passing_score}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, passing_score: Number(e.target.value) })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Questions Builder */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-slate-900">Questions ({questionsForm.length})</h3>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-purple-200"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Question
                    </button>
                  </div>

                  <div className="space-y-4">
                    {questionsForm.map((q, qi) => (
                      <div key={qi} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-700">Question {qi + 1}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveQuestion(qi, 'up')}
                              disabled={qi === 0}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveQuestion(qi, 'down')}
                              disabled={qi === questionsForm.length - 1}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeQuestion(qi)}
                              className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer ml-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <textarea
                          placeholder="Enter question statement..."
                          value={q.question_text}
                          onChange={(e) => updateQuestion(qi, 'question_text', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Type</label>
                            <select
                              value={q.question_type}
                              onChange={(e) => updateQuestion(qi, 'question_type', e.target.value as QuestionType)}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                            >
                              {QUESTION_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Correct Answer</label>
                            {q.question_type === 'true_false' ? (
                              <select
                                value={q.correct_answer}
                                onChange={(e) => updateQuestion(qi, 'correct_answer', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                              >
                                <option value="">Select...</option>
                                <option value="True">True</option>
                                <option value="False">False</option>
                              </select>
                            ) : q.question_type === 'mcq' ? (
                              <select
                                value={q.correct_answer}
                                onChange={(e) => updateQuestion(qi, 'correct_answer', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                              >
                                <option value="">Select correct option...</option>
                                {(q.options || []).filter(Boolean).map((opt, oi) => (
                                  <option key={oi} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                placeholder="Expected answer"
                                value={q.correct_answer}
                                onChange={(e) => updateQuestion(qi, 'correct_answer', e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                              />
                            )}
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Marks</label>
                            <input
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={q.marks ?? 1}
                              onChange={(e) => updateQuestion(qi, 'marks', Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                            />
                          </div>
                        </div>

                        {q.question_type === 'mcq' && (
                          <div className="space-y-2 pt-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">MCQ Options</label>
                            <div className="space-y-1.5">
                              {(q.options || []).map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-400 w-4">{String.fromCharCode(65 + oi)}.</span>
                                  <input
                                    type="text"
                                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                    value={opt}
                                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                                  />
                                  {(q.options || []).length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => removeOption(qi, oi)}
                                      className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addOption(qi)}
                                className="text-[11px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer pt-1"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Option
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {questionsForm.length === 0 && (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                        Click "Add Question" above to start building questions for this assessment.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {editingAssessment ? 'Update Assessment' : 'Create Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
