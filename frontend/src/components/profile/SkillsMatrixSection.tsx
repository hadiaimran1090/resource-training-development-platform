import React, { useEffect, useState } from 'react';
import { skillApi } from '../../api/skillApi';
import type { ResourceSkill, Skill, RoleProfile, SkillGapItem } from '../../types/skill';
import { useAuth } from '../../context/AuthContext';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Lock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Target,
  Sparkles,
} from 'lucide-react';

interface SkillsMatrixSectionProps {
  resourceId: number;
  resourceUserId: number;
  resourceRegionId?: number | null;
}

export const SkillsMatrixSection: React.FC<SkillsMatrixSectionProps> = ({
  resourceId,
  resourceUserId,
  resourceRegionId,
}) => {
  const { user } = useAuth();
  const [skillsMatrix, setSkillsMatrix] = useState<ResourceSkill[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<Skill[]>([]);
  const [roleProfiles, setRoleProfiles] = useState<(RoleProfile & { skill_count: number })[]>([]);
  const [selectedRoleProfileId, setSelectedRoleProfileId] = useState<number | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<SkillGapItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ResourceSkill | null>(null);
  const [formSkillId, setFormSkillId] = useState<number | ''>('');
  const [formCurrentLevel, setFormCurrentLevel] = useState<number>(3.0);
  const [formTargetLevel, setFormTargetLevel] = useState<number | ''>(4.0);
  const [formSource, setFormSource] = useState<string>('self');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const userRoles = user?.roles || (user?.role ? [user.role] : []);
  const isResourceUser = user?.id === resourceUserId;
  const isAdminOrTrainingManager = userRoles.some((r) =>
    ['System Administrator', 'Training Manager'].includes(r)
  );
  const isRegionalLead = userRoles.includes('Regional Lead') && user?.regionId === resourceRegionId;
  const isMentor = userRoles.includes('Mentor');

  const canEditAnySource = isAdminOrTrainingManager || isRegionalLead || isMentor;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [matrixData, catalogData, profilesData] = await Promise.all([
        skillApi.getResourceSkills(resourceId),
        skillApi.getSkills(),
        skillApi.getRoleProfiles(),
      ]);
      setSkillsMatrix(matrixData);
      setSkillsCatalog(catalogData);
      setRoleProfiles(profilesData);

      // Fetch initial gap analysis
      const gapData = await skillApi.getSkillGap(
        resourceId,
        selectedRoleProfileId || undefined
      );
      setGapAnalysis(gapData);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load skills matrix data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [resourceId]);

  const handleRoleProfileChange = async (profileIdStr: string) => {
    const profileId = profileIdStr ? Number(profileIdStr) : null;
    setSelectedRoleProfileId(profileId);
    try {
      const gapData = await skillApi.getSkillGap(resourceId, profileId || undefined);
      setGapAnalysis(gapData);
    } catch (err: any) {
      setError('Failed to calculate skill gap.');
    }
  };

  const handleOpenAddModal = () => {
    setEditingEntry(null);
    // Find first unadded skill from catalog if available
    const addedIds = new Set(skillsMatrix.map((s) => s.skill_id));
    const available = skillsCatalog.filter((s) => !addedIds.has(s.id));
    setFormSkillId(available.length > 0 ? available[0].id : '');
    setFormCurrentLevel(3.0);
    setFormTargetLevel(4.0);
    setFormSource(isResourceUser && !canEditAnySource ? 'self' : 'self');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry: ResourceSkill) => {
    setEditingEntry(entry);
    setFormSkillId(entry.skill_id);
    setFormCurrentLevel(entry.current_level);
    setFormTargetLevel(entry.target_level !== null ? entry.target_level : '');
    setFormSource(entry.source);
    setIsModalOpen(true);
  };

  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSkillId) {
      setError('Please select a skill.');
      return;
    }

    setFormSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (editingEntry) {
        // Update existing entry
        await skillApi.updateResourceSkill(resourceId, Number(formSkillId), {
          current_level: Number(formCurrentLevel),
          target_level: formTargetLevel !== '' ? Number(formTargetLevel) : null,
          source: formSource,
        });
        setSuccessMsg('Skill entry updated successfully.');
      } else {
        // Add new entry
        await skillApi.addResourceSkill(resourceId, {
          skill_id: Number(formSkillId),
          current_level: Number(formCurrentLevel),
          target_level: formTargetLevel !== '' ? Number(formTargetLevel) : null,
          source: formSource,
        });
        setSuccessMsg('Skill added to matrix successfully.');
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save skill entry.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteSkill = async (skillId: number, skillName?: string) => {
    if (!window.confirm(`Are you sure you want to remove '${skillName || 'this skill'}' from your skills matrix?`)) {
      return;
    }

    try {
      await skillApi.deleteResourceSkill(resourceId, skillId);
      setSuccessMsg('Skill entry removed.');
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete skill entry.');
    }
  };

  const getSourceBadge = (source: string) => {
    const map: Record<string, { label: string; color: string }> = {
      self: { label: 'Self Assessed', color: 'bg-slate-100 text-slate-700 border-slate-200' },
      assessment: { label: 'Exam / Test', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      coding: { label: 'Coding Lab', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      mentor: { label: 'Mentor Verified', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      interview: { label: 'Interview Eval', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      training: { label: 'Training Track', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    };
    const item = map[source] || { label: source, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${item.color}`}>
        {item.label}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const map: Record<string, { label: string; color: string }> = {
      technical: { label: 'Technical', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
      secondary: { label: 'Secondary', color: 'bg-violet-50 text-violet-700 border-violet-200' },
      soft: { label: 'Soft Skill', color: 'bg-pink-50 text-pink-700 border-pink-200' },
    };
    const item = map[category] || { label: category, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${item.color}`}>
        {item.label}
      </span>
    );
  };

  const renderGapBadge = (gapItem: SkillGapItem) => {
    const gap = gapItem.gap;
    if (!gapItem.has_entry) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5" />
          Missing Skill ({gapItem.required_level} Req)
        </span>
      );
    }

    if (gap > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <TrendingUp className="w-3.5 h-3.5" />
          +{gap.toFixed(1)} Gap
        </span>
      );
    }

    if (gap === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Target Met
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
        <Sparkles className="w-3.5 h-3.5" />
        Surpassed ({Math.abs(gap).toFixed(1)})
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Skills Matrix & Competency Profile
            </h2>
            <p className="text-xs text-slate-500">
              Live proficiency levels, target scores, and role profile gap analysis
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 md:ml-auto">
          {/* Target Role Filter Dropdown */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <Target className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Compare Target:</span>
            <select
              value={selectedRoleProfileId || ''}
              onChange={(e) => handleRoleProfileChange(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent border-none focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="">Personal Targets (Self Matrix)</option>
              {roleProfiles.map((rp) => (
                <option key={rp.id} value={rp.id}>
                  Role: {rp.name} ({rp.skill_count} skills)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadData}
            title="Refresh Matrix"
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3.5 py-2 font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Skill</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Skills Matrix Table */}
      <div className="p-6 overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium">
            Loading skills matrix...
          </div>
        ) : gapAnalysis.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium flex flex-col items-center justify-center gap-2">
            <Award className="w-8 h-8 text-slate-300" />
            <span>No skill entries added yet. Click &quot;Add Skill&quot; to populate your skills matrix.</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Skill Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Current Level</th>
                <th className="py-3 px-4 text-center">
                  {selectedRoleProfileId ? 'Required Level' : 'Target Level'}
                </th>
                <th className="py-3 px-4 text-center">Live Gap</th>
                <th className="py-3 px-4">Verification Source</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gapAnalysis.map((item) => {
                const matrixRow = skillsMatrix.find((m) => m.skill_id === item.skill_id);
                const canModifyRow =
                  matrixRow &&
                  (canEditAnySource || (isResourceUser && matrixRow.source === 'self'));

                return (
                  <tr
                    key={item.skill_id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !item.has_entry ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {item.skill_name}
                      {!item.has_entry && (
                        <span className="ml-2 text-[10px] font-semibold text-rose-500 uppercase tracking-tight">
                          (Role Req)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getCategoryBadge(item.category)}</td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-800">
                      <div className="flex items-center justify-center gap-1">
                        <span>{item.current_level.toFixed(1)}</span>
                        <span className="text-slate-400 text-[10px] font-normal">/ 5.0</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-600">
                      {item.required_level !== undefined ? (
                        <span>{item.required_level.toFixed(1)} / 5.0</span>
                      ) : item.target_level !== null && item.target_level !== undefined ? (
                        <span>{item.target_level.toFixed(1)} / 5.0</span>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">{renderGapBadge(item)}</td>
                    <td className="py-3.5 px-4">
                      {item.source ? getSourceBadge(item.source) : <span className="text-slate-400 text-[11px]">—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {matrixRow ? (
                        canModifyRow ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditModal(matrixRow)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                              title="Edit Skill Entry"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSkill(matrixRow.skill_id, matrixRow.skill_name)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                              title="Remove Skill Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 text-slate-400" title="Source locked (Read-only for Resource user)">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        )
                      ) : (
                        <button
                          onClick={() => {
                            setEditingEntry(null);
                            setFormSkillId(item.skill_id);
                            setFormCurrentLevel(0);
                            setFormTargetLevel(item.required_level || 3.0);
                            setFormSource('self');
                            setIsModalOpen(true);
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                        >
                          + Add Entry
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                {editingEntry ? 'Edit Skill Proficiency Entry' : 'Add Skill to Matrix'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Skill
                </label>
                {editingEntry ? (
                  <input
                    type="text"
                    disabled
                    value={editingEntry.skill_name || ''}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  />
                ) : (
                  <select
                    value={formSkillId}
                    onChange={(e) => setFormSkillId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select a skill from catalog...</option>
                    {skillsCatalog.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Current Proficiency Level (0.0 – 5.0)</span>
                  <span className="text-blue-600 font-extrabold">{formCurrentLevel.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="5.0"
                  step="0.5"
                  value={formCurrentLevel}
                  onChange={(e) => setFormCurrentLevel(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-1 mt-1">
                  <span>0.0 (None)</span>
                  <span>2.5 (Intermediate)</span>
                  <span>5.0 (Expert)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Target Goal Level (0.0 – 5.0)</span>
                  <span className="text-purple-600 font-extrabold">
                    {formTargetLevel !== '' ? Number(formTargetLevel).toFixed(1) : 'None'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="5.0"
                  step="0.5"
                  value={formTargetLevel !== '' ? formTargetLevel : 0.0}
                  onChange={(e) => setFormTargetLevel(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Verification Source
                </label>
                <select
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  disabled={isResourceUser && !canEditAnySource}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="self">Self Assessed (Personal Rating)</option>
                  <option value="assessment">Assessment Exam</option>
                  <option value="coding">Coding Challenge</option>
                  <option value="mentor">Mentor Evaluation</option>
                  <option value="interview">Mock Interview</option>
                  <option value="training">Training Track</option>
                </select>
                {isResourceUser && !canEditAnySource && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Resources can only save entries with source &apos;self&apos;.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : 'Save Skill Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
