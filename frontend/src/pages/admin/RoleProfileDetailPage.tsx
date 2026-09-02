import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { skillApi } from '../../api/skillApi';
import type { RoleProfile, RoleProfileSkill, Skill } from '../../types/skill';
import {
  UserPlus,
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Target,
} from 'lucide-react';

export const RoleProfileDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [roleProfile, setRoleProfile] = useState<RoleProfile | null>(null);
  const [skillsCatalog, setSkillsCatalog] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State for Adding/Editing Required Skill
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<RoleProfileSkill | null>(null);
  const [formSkillId, setFormSkillId] = useState<number | ''>('');
  const [formRequiredLevel, setFormRequiredLevel] = useState<number>(3.0);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [profileData, catalogData] = await Promise.all([
        skillApi.getRoleProfileById(Number(id)),
        skillApi.getSkills(),
      ]);
      setRoleProfile(profileData);
      setSkillsCatalog(catalogData);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load role profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleOpenAddModal = () => {
    setEditingSkill(null);
    const existingSkillIds = new Set((roleProfile?.skills || []).map((s) => s.skill_id));
    const available = skillsCatalog.filter((s) => !existingSkillIds.has(s.id));
    setFormSkillId(available.length > 0 ? available[0].id : '');
    setFormRequiredLevel(3.0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rps: RoleProfileSkill) => {
    setEditingSkill(rps);
    setFormSkillId(rps.skill_id);
    setFormRequiredLevel(rps.required_level);
    setIsModalOpen(true);
  };

  const handleSaveRoleSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleProfile || !formSkillId) {
      setError('Please select a skill.');
      return;
    }

    setFormSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await skillApi.addRoleProfileSkill(roleProfile.id, {
        skill_id: Number(formSkillId),
        required_level: Number(formRequiredLevel),
      });
      setSuccessMsg('Role profile required skill updated successfully.');
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save required skill.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteRoleSkill = async (skillId: number, skillName?: string) => {
    if (!roleProfile) return;
    if (!window.confirm(`Are you sure you want to remove '${skillName || 'this skill'}' from ${roleProfile.name}?`)) {
      return;
    }

    setError(null);
    setSuccessMsg(null);

    try {
      await skillApi.deleteRoleProfileSkill(roleProfile.id, skillId);
      setSuccessMsg('Skill requirement removed.');
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to remove skill requirement.');
    }
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

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 text-xs font-medium">
        Loading role profile benchmark details...
      </div>
    );
  }

  if (!roleProfile) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Role Profile Not Found</h2>
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-bold text-blue-600 hover:underline"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Role Profiles</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">{roleProfile.name}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {roleProfile.description || 'No description available for this role profile.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Required Skill</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Required Skills Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            Benchmark Required Skills (Total: {(roleProfile.skills || []).length})
          </h2>
        </div>

        {(roleProfile.skills || []).length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium flex flex-col items-center justify-center gap-2">
            <BookOpen className="w-8 h-8 text-slate-300" />
            <span>No required skills assigned to this role profile yet. Click &quot;Add Required Skill&quot; above.</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Skill Name</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6 text-center">Required Target Level</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(roleProfile.skills || []).map((rps) => (
                <tr key={rps.skill_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-bold text-slate-900">{rps.skill_name}</td>
                  <td className="py-3.5 px-6">{getCategoryBadge(rps.category || 'technical')}</td>
                  <td className="py-3.5 px-6 text-center font-extrabold text-blue-700">
                    <span className="bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                      {rps.required_level.toFixed(1)} / 5.0
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(rps)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                        title="Edit Required Level"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoleSkill(rps.skill_id, rps.skill_name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                        title="Remove Skill Requirement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                {editingSkill ? 'Edit Required Skill Benchmark' : 'Add Required Skill to Profile'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveRoleSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Skill
                </label>
                {editingSkill ? (
                  <input
                    type="text"
                    disabled
                    value={editingSkill.skill_name || ''}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  />
                ) : (
                  <select
                    value={formSkillId}
                    onChange={(e) => setFormSkillId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select skill from catalog...</option>
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
                  <span>Required Proficiency Benchmark Level (0.0 – 5.0)</span>
                  <span className="text-blue-600 font-extrabold">{formRequiredLevel.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="5.0"
                  step="0.5"
                  value={formRequiredLevel}
                  onChange={(e) => setFormRequiredLevel(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-1 mt-1">
                  <span>0.0 (None)</span>
                  <span>3.0 (Mid-level)</span>
                  <span>5.0 (Expert Lead)</span>
                </div>
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
                  {formSubmitting ? 'Saving...' : 'Save Skill Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
