import React, { useState, useEffect } from 'react';
import type { ResourceProfile, Assignment } from '../../api/resourceApi';
import { resourceApi } from '../../api/resourceApi';
import { useAuth } from '../../context/AuthContext';
import { ProfileModal } from '../../components/profile/ProfileModal';
import {
  Briefcase,
  Award,
  Globe,
  Building,
  Clock,
  CheckCircle2,
  Calendar,
  FolderGit2,
  Loader2,
  AlertCircle,
  Pencil,
  Camera,
  UserCheck,
} from 'lucide-react';

export const ResourceProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ResourceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile Modal State (Password & Avatar edit)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Status Change Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'assigned' | 'bench' | 'training'>('bench');

  // Assignment End Date Modal State
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [endDate, setEndDate] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await resourceApi.getMyProfile();
      setProfile(data);
      if (data) {
        setSelectedStatus(data.current_status);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching resource profile:', err);
      setError('Could not load resource profile data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await resourceApi.updateMyProfile({
        current_status: selectedStatus,
      });
      setIsStatusModalOpen(false);
      fetchProfile();
    } catch (err: any) {
      alert('Failed to update status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditAssignment = (asg: Assignment) => {
    setEditingAssignment(asg);
    setEndDate(asg.end_date ? asg.end_date.split('T')[0] : '');
  };

  const handleSaveAssignmentEndDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment || !endDate) return;

    try {
      setSubmitting(true);
      await resourceApi.updateMyProfile({
        assignment_id: editingAssignment.id,
        end_date: endDate,
      });
      setEditingAssignment(null);
      fetchProfile();
    } catch (err: any) {
      alert('Failed to update assignment end date.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs font-semibold">Loading your resource profile...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 space-y-3">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="font-extrabold text-slate-800 text-base">Resource Profile Shell</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Welcome <span className="font-bold text-slate-800">{user?.name}</span>. Your engineering resource profile details are connected with your primary account.
        </p>
      </div>
    );
  }

  const avatarUrl = profile.profile_image_url || user?.profileImageUrl;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 flex items-start justify-between">
          <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider">
            Engineering Resource Profile
          </span>
        </div>

        <div className="px-8 pb-8 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 -mt-14">
          <div className="flex items-end gap-5">
            {/* Big Profile Avatar Box with Camera Edit Sign */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-blue-600 text-white font-extrabold text-3xl flex items-center justify-center border-4 border-white shadow-lg shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={profile.user_name} className="w-full h-full object-cover" />
                ) : (
                  profile.user_name.charAt(0)
                )}
              </div>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 text-white border-2 border-white shadow-md flex items-center justify-center hover:bg-blue-700 transition-transform active:scale-95 cursor-pointer"
                title="Edit Profile Image & Password"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{profile.user_name}</h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {profile.user_email} • Employee ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{profile.employee_id}</code>
              </p>
            </div>
          </div>

          {/* Clickable Status Badge with Edit Icon */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStatusModalOpen(true)}
              className={`px-3.5 py-2 rounded-full text-xs font-extrabold flex items-center gap-2 border shadow-xs transition-all hover:scale-105 cursor-pointer ${
                profile.current_status === 'assigned'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                  : profile.current_status === 'training'
                  ? 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100'
                  : 'bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100'
              }`}
              title="Click to Edit Status (Assigned / Bench / Training)"
            >
              {profile.current_status === 'assigned' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>ASSIGNED TO PROJECT</span>
                </>
              ) : profile.current_status === 'training' ? (
                <>
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>IN TRAINING</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>AVAILABLE ON BENCH</span>
                </>
              )}
              <Pencil className="w-3.5 h-3.5 text-current opacity-70 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Designation Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
            <Briefcase className="w-4 h-4" />
            <span>CURRENT DESIGNATION</span>
          </div>
          <p className="text-base font-extrabold text-slate-900">{profile.designation}</p>
          <p className="text-xs text-slate-400 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>{profile.experience_years} Years Experience</span>
          </p>
        </div>

        {/* Region Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs">
            <Globe className="w-4 h-4" />
            <span>OPERATIONAL REGION</span>
          </div>
          <p className="text-base font-extrabold text-slate-900">{profile.region_name || 'APAC Region'}</p>
          <p className="text-xs text-slate-400 font-semibold">Lead: {profile.regional_lead_name || 'Rohan Regional Lead'}</p>
        </div>

        {/* Practice Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
            <Building className="w-4 h-4" />
            <span>TECHNICAL PRACTICE</span>
          </div>
          <p className="text-base font-extrabold text-slate-900">{profile.practice_name || 'Software Engineering'}</p>
          <p className="text-xs text-slate-400 font-semibold">Core Practice Group</p>
        </div>
      </div>

      {/* Project Assignments Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Project Assignments & Client History</h3>
              <p className="text-xs text-slate-400 font-medium">Track assigned client projects, start date, and end date.</p>
            </div>
          </div>
        </div>

        {profile.assignments && profile.assignments.length > 0 ? (
          <div className="space-y-3">
            {profile.assignments.map((asg) => (
              <div
                key={asg.id}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-200 transition-colors"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{asg.client_name}</h4>
                  <p className="text-xs text-slate-500 font-medium">{asg.project_name || 'Core Development Track'}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Start: {asg.start_date ? new Date(asg.start_date).toLocaleDateString() : 'N/A'}</span>
                  </div>

                  {/* Inline End Date with Edit Icon right beside it */}
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-slate-800 font-bold shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>End: {asg.end_date ? new Date(asg.end_date).toLocaleDateString() : 'Not Set'}</span>
                    <button
                      onClick={() => handleOpenEditAssignment(asg)}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer ml-1"
                      title="Edit Assignment End Date"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      asg.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {asg.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs font-medium">
            No active or past project assignments found.
          </div>
        )}
      </div>

      {/* Profile Modal (Avatar & Password Edit) */}
      {isProfileModalOpen && (
        <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      )}

      {/* Resource Status Edit Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-base text-slate-900">Change Resource Status</h3>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Employment Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as 'assigned' | 'bench' | 'training')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="bench">Available on Bench</option>
                  <option value="assigned">Assigned to Project</option>
                  <option value="training">In Training Track</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Selecting <strong>Available on Bench</strong> allows you to be deployed to new projects.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment End Date Edit Modal */}
      {editingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-base text-slate-900">
                Edit End Date ({editingAssignment.client_name})
              </h3>
            </div>

            <form onSubmit={handleSaveAssignmentEndDate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Project Assignment End Date *</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-[11px] text-slate-500 italic mt-1">
                  Note: Setting an end date that has passed or is today will complete this assignment and automatically return your status to <strong>Available on Bench</strong>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save End Date</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
