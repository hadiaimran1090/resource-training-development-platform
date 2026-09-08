import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { codingChallengeApi, type CodingChallenge, type TestCase } from '../../api/codingChallengeApi';
import { apiClient } from '../../api/apiClient';
import {
  Code,
  Plus,
  Trash2,
  Edit3,
  Terminal,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Search,
  BookOpen,
} from 'lucide-react';

interface RoleProfile {
  id: number;
  name?: string;
  role_title?: string;
}

const DIFFICULTY_LABELS: Record<number, { label: string; bg: string; text: string }> = {
  1: { label: '1 - Basic', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  2: { label: '2 - Intermediate', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  3: { label: '3 - Advanced', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
  4: { label: '4 - Real-world Problem', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
  5: { label: '5 - Architecture Challenge', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
};

export const CodingChallengeCatalogPage: React.FC = () => {
  const { user } = useAuth();
  const userRoles = user?.roles || (user?.role ? [user.role] : []);
  const isReadOnlyAdmin =
    userRoles.includes('System Administrator') &&
    !userRoles.includes('Regional Lead') &&
    !userRoles.includes('Training Manager');

  const [challenges, setChallenges] = useState<CodingChallenge[]>([]);
  const [roleProfiles, setRoleProfiles] = useState<RoleProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [filterLanguage, setFilterLanguage] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingChallenge, setEditingChallenge] = useState<CodingChallenge | null>(null);

  // Form state
  const [title, setTitle] = useState<string>('');
  const [language, setLanguage] = useState<string>('Java');
  const [difficultyLevel, setDifficultyLevel] = useState<number>(1);
  const [targetRoleProfileId, setTargetRoleProfileId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: '', expected_output: '' },
  ]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Delete modal confirmation
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchChallenges();
    fetchRoleProfiles();
  }, [filterLanguage, filterDifficulty]);

  const fetchChallenges = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (filterLanguage) params.language = filterLanguage;
      if (filterDifficulty) params.difficulty_level = filterDifficulty;

      const data = await codingChallengeApi.getAll(params);
      setChallenges(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error loading coding challenges';
      setError(msg);
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleProfiles = async () => {
    try {
      const res = await apiClient.get('/role-profiles');
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setRoleProfiles(list);
    } catch (err) {
      console.error('Error loading role profiles:', err);
      setRoleProfiles([]);
    }
  };

  const handleOpenCreate = () => {
    setEditingChallenge(null);
    setTitle('');
    setLanguage('Java');
    setDifficultyLevel(1);
    setTargetRoleProfileId('');
    setDescription('');
    setTestCases([{ input: '', expected_output: '' }]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (challenge: CodingChallenge) => {
    setEditingChallenge(challenge);
    setTitle(challenge.title);
    setLanguage(challenge.language);
    setDifficultyLevel(challenge.difficulty_level);
    setTargetRoleProfileId(challenge.target_role_profile_id ? String(challenge.target_role_profile_id) : '');
    setDescription(challenge.description);

    let parsedCases: TestCase[] = [];
    if (Array.isArray(challenge.test_cases)) {
      parsedCases = challenge.test_cases;
    } else if (typeof challenge.test_cases === 'string') {
      try {
        parsedCases = JSON.parse(challenge.test_cases);
      } catch {
        parsedCases = [{ input: '', expected_output: '' }];
      }
    }
    setTestCases(parsedCases.length > 0 ? parsedCases : [{ input: '', expected_output: '' }]);
    setIsModalOpen(true);
  };

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input: '', expected_output: '' }]);
  };

  const handleRemoveTestCase = (index: number) => {
    if (testCases.length <= 1) return;
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const handleTestCaseChange = (index: number, field: 'input' | 'expected_output', value: string) => {
    const updated = [...testCases];
    updated[index][field] = value;
    setTestCases(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    if (testCases.some((tc) => !tc.input.trim() && !tc.expected_output?.trim())) {
      setError('All test case rows must have input or expected output defined.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      title,
      language,
      difficulty_level: difficultyLevel,
      target_role_profile_id: targetRoleProfileId ? parseInt(targetRoleProfileId, 10) : null,
      description,
      test_cases: testCases,
    };

    try {
      if (editingChallenge) {
        await codingChallengeApi.update(editingChallenge.id, payload);
        setSuccessMsg('Challenge updated successfully!');
      } else {
        await codingChallengeApi.create(payload);
        setSuccessMsg('Challenge created successfully!');
      }
      setIsModalOpen(false);
      fetchChallenges();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save coding challenge.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    setSuccessMsg(null);

    try {
      await codingChallengeApi.delete(id);
      setSuccessMsg('Coding challenge deleted successfully.');
      setDeletingId(null);
      fetchChallenges();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete coding challenge.';
      setError(msg);
      setDeletingId(null);
    }
  };

  const filteredChallenges = challenges.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.language.toLowerCase().includes(q) ||
      (c.target_role_profile_name && c.target_role_profile_name.toLowerCase().includes(q)) ||
      c.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-6 rounded-2xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs tracking-wider uppercase">
            <Terminal className="w-4 h-4" />
            <span>Curriculum & Skill Assessment</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Coding Challenges Catalog</h1>
          <p className="text-slate-300 text-xs max-w-2xl">
            Design and manage coding benchmarks for technical role profiles. Filter challenges by language and difficulty level.
          </p>
        </div>

        {!isReadOnlyAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Challenge</span>
          </button>
        )}
      </div>

      {/* Alert Banner */}
      {isReadOnlyAdmin && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Read-Only Access:</strong> As System Administrator, you can view all challenges. Creation, editing, and deletion are managed by Regional Lead and Training Manager.
          </span>
        </div>
      )}

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

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by title, description or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

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
            <option value="">All Difficulties</option>
            <option value="1">1 - Basic</option>
            <option value="2">2 - Intermediate</option>
            <option value="3">3 - Advanced</option>
            <option value="4">4 - Real-world Problem</option>
            <option value="5">5 - Architecture Challenge</option>
          </select>
        </div>
      </div>

      {/* Challenges Grid / Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
          Loading coding challenges...
        </div>
      ) : filteredChallenges.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Code className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-slate-600 font-medium text-sm">No coding challenges found</p>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            {searchQuery || filterLanguage || filterDifficulty
              ? 'Try adjusting your search or filters to see more results.'
              : 'Get started by creating a new coding challenge for resource development.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredChallenges.map((challenge) => {
            const diffInfo = DIFFICULTY_LABELS[challenge.difficulty_level] || DIFFICULTY_LABELS[1];
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
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${diffInfo.bg} ${diffInfo.text}`}
                    >
                      {diffInfo.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1">{challenge.title}</h3>
                    {challenge.target_role_profile_name && (
                      <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1 mt-0.5">
                        <BookOpen className="w-3 h-3" />
                        <span>Target: {challenge.target_role_profile_name}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed">{challenge.description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>{challenge.submission_count || 0} Submissions</span>
                  </div>

                  {!isReadOnlyAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(challenge)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Challenge"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(challenge.id)}
                        className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Challenge"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 pt-20 pb-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[calc(100vh-6rem)] flex flex-col overflow-hidden">
            <div className="px-4 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-400" />
                <h2 className="font-bold text-base">
                  {editingChallenge ? 'Edit Coding Challenge' : 'Create New Coding Challenge'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 min-h-0 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Reverse a String"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Programming Language <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="Java">Java</option>
                    <option value="JavaScript">JavaScript</option>
                    <option value="Python">Python</option>
                    <option value="C#">C#</option>
                    <option value="Go">Go</option>
                    <option value="TypeScript">TypeScript</option>
                    <option value="C++">C++</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Difficulty Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={difficultyLevel}
                    onChange={(e) => setDifficultyLevel(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value={1}>1 - Basic</option>
                    <option value={2}>2 - Intermediate</option>
                    <option value={3}>3 - Advanced</option>
                    <option value={4}>4 - Real-world Problem</option>
                    <option value={5}>5 - Architecture Challenge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Role Profile (Optional)
                  </label>
                  <select
                    value={targetRoleProfileId}
                    onChange={(e) => setTargetRoleProfileId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- None (General Challenge) --</option>
                    {(roleProfiles || []).map((rp) => (
                      <option key={rp.id} value={rp.id}>
                        {rp.name || rp.role_title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description & Instructions <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the coding challenge task, constraints, input format, and return expectations..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              {/* Test Cases Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Test Cases Builder (Inputs & Expected Outputs)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTestCase}
                    className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>

                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {testCases.map((tc, idx) => (
                    <div key={idx} className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400 w-5">{idx + 1}.</span>
                      <input
                        type="text"
                        placeholder="Input (e.g. hello)"
                        value={tc.input}
                        onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Expected Output (e.g. olleh)"
                        value={tc.expected_output || ''}
                        onChange={(e) => handleTestCaseChange(idx, 'expected_output', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
                      />
                      {testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTestCase(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingChallenge ? 'Update Challenge' : 'Create Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete Challenge</h3>
                <p className="text-xs text-slate-500">This will permanently delete the challenge and all user submissions against it.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
