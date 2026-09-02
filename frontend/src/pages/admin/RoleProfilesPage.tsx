import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { skillApi } from '../../api/skillApi';
import type { RoleProfile } from '../../types/skill';
import {
  UserPlus,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export const RoleProfilesPage: React.FC = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<(RoleProfile & { skill_count: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<RoleProfile | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const loadProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await skillApi.getRoleProfiles();
      setProfiles(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load role profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProfile(null);
    setFormName('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e: React.MouseEvent, profile: RoleProfile) => {
    e.stopPropagation();
    setEditingProfile(profile);
    setFormName(profile.name);
    setFormDescription(profile.description || '');
    setIsModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('Role profile name is required.');
      return;
    }

    setFormSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (editingProfile) {
        await skillApi.updateRoleProfile(editingProfile.id, {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
        });
        setSuccessMsg(`Role profile '${formName.trim()}' updated.`);
      } else {
        await skillApi.createRoleProfile({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
        });
        setSuccessMsg(`Role profile '${formName.trim()}' created successfully.`);
      }

      setIsModalOpen(false);
      await loadProfiles();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save role profile.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteProfile = async (e: React.MouseEvent, profile: RoleProfile) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete role profile '${profile.name}'?`)) {
      return;
    }

    setError(null);
    setSuccessMsg(null);

    try {
      await skillApi.deleteRoleProfile(profile.id);
      setSuccessMsg(`Role profile '${profile.name}' deleted.`);
      await loadProfiles();
    } catch (err: any) {
      setError(err?.response?.data?.message || `Cannot delete role profile '${profile.name}'.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-blue-600" />
            Role Profiles Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Define target role benchmarks and required skill proficiency levels across the enterprise
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Role Profile</span>
        </button>
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

      {/* Profiles Grid / List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs font-medium">
          Loading role profiles...
        </div>
      ) : profiles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs font-medium flex flex-col items-center justify-center gap-3">
          <UserPlus className="w-10 h-10 text-slate-300" />
          <span>No role profiles created yet. Click &quot;Create Role Profile&quot; to define your first benchmark role.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => navigate(`/admin/role-profiles/${profile.id}`)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                    {profile.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEditModal(e, profile)}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                      title="Edit Profile Name/Description"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteProfile(e, profile)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                      title="Delete Role Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                  {profile.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  <BookOpen className="w-3.5 h-3.5" />
                  {profile.skill_count} Required Skills
                </span>

                <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Manage Skills
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                {editingProfile ? 'Edit Role Profile' : 'Create Role Profile'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Role Profile Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Stack Java Engineer, Cloud DevOps Specialist"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe the expectations and scope for this role profile..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
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
                  {formSubmitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
