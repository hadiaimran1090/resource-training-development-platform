import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Eye,
  User,
  ShieldAlert,
  Loader2,
  AlertCircle,
  FileCheck,
  Code,
  Video,
  FileText,
  X,
  Edit3,
  Trash2,
} from 'lucide-react';
import { trainingAssignmentApi } from '../../api/trainingAssignmentApi';
import { trainingCatalogApi } from '../../api/trainingCatalogApi';
import { resourceApi } from '../../api/resourceApi';
import type { ResourceProfile } from '../../api/resourceApi';
import { useAuth } from '../../context/AuthContext';
import type { TrainingAssignment } from '../../types/trainingAssignment';
import type { TrainingTrack } from '../../types/trainingCatalog';
import { AssignTrainingModal } from '../../components/training/AssignTrainingModal';

export const TrainingAssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const userRoles = user?.roles || (user?.role ? [user.role] : []);
  const canManageAssignments = userRoles.includes('Regional Lead') || userRoles.includes('System Administrator');

  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [resources, setResources] = useState<ResourceProfile[]>([]);
  const [tracks, setTracks] = useState<TrainingTrack[]>([]);
  const [myProfile, setMyProfile] = useState<ResourceProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal & Drawer states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [selectedResourceForAssign, setSelectedResourceForAssign] = useState<ResourceProfile | null>(null);
  const [selectedAssignmentDetail, setSelectedAssignmentDetail] = useState<TrainingAssignment | null>(null);

  // Edit Modal state
  const [editingAssignment, setEditingAssignment] = useState<TrainingAssignment | null>(null);
  const [editTrackId, setEditTrackId] = useState<number>(0);
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [isEditingLoading, setIsEditingLoading] = useState<boolean>(false);

  // Loading state for single approve/reject action
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
    resourceApi.getMyProfile().then(setMyProfile).catch(() => setMyProfile(null));
    trainingCatalogApi.getTracks().then(setTracks).catch(() => setTracks([]));
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [asgData, resData] = await Promise.all([
        trainingAssignmentApi.getAssignments(),
        canManageAssignments ? resourceApi.getResources() : Promise.resolve([]),
      ]);
      setAssignments(asgData);
      setResources(resData);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load training assignments.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setActionLoadingId(id);
      await trainingAssignmentApi.approveAssignment(id);
      await fetchData();
      if (selectedAssignmentDetail?.id === id) {
        const updated = await trainingAssignmentApi.getAssignmentById(id);
        setSelectedAssignmentDetail(updated);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to approve assignment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: number) => {
    try {
      setActionLoadingId(id);
      await trainingAssignmentApi.rejectAssignment(id);
      await fetchData();
      if (selectedAssignmentDetail?.id === id) {
        const updated = await trainingAssignmentApi.getAssignmentById(id);
        setSelectedAssignmentDetail(updated);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to reject assignment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this pending training assignment?')) return;
    try {
      setActionLoadingId(id);
      await trainingAssignmentApi.deleteAssignment(id);
      await fetchData();
      if (selectedAssignmentDetail?.id === id) {
        setSelectedAssignmentDetail(null);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete assignment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openEditModal = (asg: TrainingAssignment) => {
    setEditingAssignment(asg);
    setEditTrackId(asg.track_id);
    setEditStartDate(asg.start_date ? asg.start_date.split('T')[0] : new Date().toISOString().split('T')[0]);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;
    try {
      setIsEditingLoading(true);
      await trainingAssignmentApi.updateAssignment(editingAssignment.id, {
        track_id: editTrackId,
        start_date: editStartDate,
      });
      setEditingAssignment(null);
      await fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update assignment.');
    } finally {
      setIsEditingLoading(false);
    }
  };

  const openAssignModalForFirstResource = () => {
    if (resources.length > 0) {
      setSelectedResourceForAssign(resources[0]);
    } else {
      setSelectedResourceForAssign({ id: 1, user_name: 'Selected Resource' } as any);
    }
    setIsAssignModalOpen(true);
  };

  const openDetailDrawer = async (assignment: TrainingAssignment) => {
    try {
      const fullDetail = await trainingAssignmentApi.getAssignmentById(assignment.id);
      setSelectedAssignmentDetail(fullDetail);
    } catch (err) {
      setSelectedAssignmentDetail(assignment);
    }
  };

  // Filtered assignments
  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      (a.resource_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.track_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.resource_employee_id || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'pending') return a.approval_status === 'pending';
    if (activeTab === 'in_progress') return a.status === 'in_progress' && a.approval_status === 'approved';
    if (activeTab === 'completed') return a.status === 'completed';
    if (activeTab === 'rejected') return a.approval_status === 'rejected';
    return true;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assessment':
        return <FileCheck className="w-4 h-4 text-purple-600" />;
      case 'coding':
      case 'poc':
        return <Code className="w-4 h-4 text-blue-600" />;
      case 'mock_interview':
      case 'mentor_session':
        return <Video className="w-4 h-4 text-amber-600" />;
      case 'reading':
      case 'documentation':
        return <FileText className="w-4 h-4 text-slate-600" />;
      default:
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getApprovalBadge = (approvalStatus: string) => {
    switch (approvalStatus) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Review
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            Assigned
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Training Assignments Management</h1>
          <p className="text-xs text-blue-200/80 max-w-xl">
            Assign training tracks to regional resources, review auto-generated daily activity plans, and govern workflow approvals.
          </p>
        </div>

        {canManageAssignments && (
          <div className="flex items-center gap-3">
            <button
              onClick={openAssignModalForFirstResource}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Training Track</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Assignments' },
              { id: 'pending', label: 'Pending Approval' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'completed', label: 'Completed' },
              { id: 'rejected', label: 'Rejected' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              placeholder="Search by resource, track, EMP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Assignments List / Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span>Loading training assignments...</span>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">No Assignments Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No training assignments match your filter criteria or search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssignments.map((asg) => {
            const total = asg.total_activities || 0;
            const completed = asg.completed_activities || 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const isSelfAssignment =
              (myProfile && asg.resource_id === myProfile.id) ||
              (user?.id && asg.resource_user_id === user.id);

            return (
              <div
                key={asg.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1">
                        {asg.track_name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>{asg.resource_name}</span>
                        {asg.resource_employee_id && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                            {asg.resource_employee_id}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {getApprovalBadge(asg.approval_status)}
                      {getStatusBadge(asg.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Start Date
                      </span>
                      <span className="font-bold text-slate-800">
                        {new Date(asg.start_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Assigned By
                      </span>
                      <span className="font-bold text-slate-800 truncate block">
                        {asg.assigned_by_name || 'Regional Lead'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-500">Activities Progress</span>
                      <span className="text-slate-800">
                        {completed} / {total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openDetailDrawer(asg)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Plan</span>
                  </button>

                  {canManageAssignments && (
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {isSelfAssignment ? (
                        <div
                          className="px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs flex items-center gap-1 cursor-not-allowed"
                          title="You cannot manage your own training assignment — ask another Regional Lead, Practice Lead, or Admin."
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Self-Assignment</span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => openEditModal(asg)}
                            disabled={actionLoadingId === asg.id}
                            title="Edit Assignment"
                            className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(asg.id)}
                            disabled={actionLoadingId === asg.id}
                            title="Delete Assignment"
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                          {asg.approval_status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleReject(asg.id)}
                                disabled={actionLoadingId === asg.id}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Reject</span>
                              </button>
                              <button
                                onClick={() => handleApprove(asg.id)}
                                disabled={actionLoadingId === asg.id}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
                              >
                                {actionLoadingId === asg.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                <span>Approve</span>
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assignment Selection Modal for quick creation */}
      <AssignTrainingModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedResourceForAssign(null);
        }}
        resourceId={selectedResourceForAssign?.id}
        resourceName={selectedResourceForAssign?.user_name || undefined}
        resourceRegion={selectedResourceForAssign?.region_name || undefined}
        onSuccess={fetchData}
      />

      {/* Edit Assignment Modal */}
      {editingAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-base">Edit Training Assignment</h2>
                <p className="text-xs text-slate-300">Resource: {editingAssignment.resource_name}</p>
              </div>
              <button
                onClick={() => setEditingAssignment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Training Track</label>
                <select
                  value={editTrackId}
                  onChange={(e) => setEditTrackId(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.duration_days} Days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Start Date</label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAssignment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditingLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isEditingLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal / Drawer */}
      {selectedAssignmentDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-base">{selectedAssignmentDetail.track_name}</h2>
                <p className="text-xs text-slate-400">
                  Assigned to <span className="text-white font-semibold">{selectedAssignmentDetail.resource_name}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedAssignmentDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Start Date</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedAssignmentDetail.start_date).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Status</span>
                  {getStatusBadge(selectedAssignmentDetail.status)}
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Approval</span>
                  {getApprovalBadge(selectedAssignmentDetail.approval_status)}
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Assigned By</span>
                  <span className="font-bold text-slate-800">
                    {selectedAssignmentDetail.assigned_by_name || 'Regional Lead'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Full Day-by-Day Activity Schedule
                </h3>
                <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {selectedAssignmentDetail.daily_activities?.map((act) => (
                    <div key={act.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-extrabold text-slate-700 text-[10px]">
                          Day {act.day_number}
                        </span>
                        <div className="flex items-center gap-2">
                          {getActivityIcon(act.activity_type)}
                          <span className="font-semibold text-slate-800">{act.description}</span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          act.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {act.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div>
                {canManageAssignments && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const asg = selectedAssignmentDetail;
                        setSelectedAssignmentDetail(null);
                        openEditModal(asg);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit Assignment</span>
                    </button>
                    <button
                      onClick={() => {
                        const id = selectedAssignmentDetail.id;
                        setSelectedAssignmentDetail(null);
                        handleDelete(id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete Assignment</span>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedAssignmentDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
