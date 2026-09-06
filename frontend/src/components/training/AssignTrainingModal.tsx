import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  Code,
  FileCheck,
  Video,
  FileText,
  AlertCircle,
  Loader2,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { resourceApi, type ResourceProfile } from '../../api/resourceApi';
import { trainingCatalogApi } from '../../api/trainingCatalogApi';
import { trainingAssignmentApi } from '../../api/trainingAssignmentApi';
import type { TrainingTrack } from '../../types/trainingCatalog';
import type { TrainingAssignment, DailyActivity } from '../../types/trainingAssignment';

interface AssignTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId?: number;
  resourceName?: string;
  resourceRegion?: string;
  targetRole?: string;
  onSuccess?: () => void;
}

export const AssignTrainingModal: React.FC<AssignTrainingModalProps> = ({
  isOpen,
  onClose,
  resourceId,
  resourceName,
  resourceRegion,
  targetRole,
  onSuccess,
}) => {
  const { user } = useAuth();
  const userRoles = user?.roles || (user?.role ? [user.role] : []);

  const [tracks, setTracks] = useState<TrainingTrack[]>([]);
  const [resourcesList, setResourcesList] = useState<ResourceProfile[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<number>(resourceId || 0);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<ResourceProfile | null>(null);

  // Assignment preview state (step 2)
  const [createdAssignment, setCreatedAssignment] = useState<TrainingAssignment | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTracks();
      fetchResources();
      setCreatedAssignment(null);
      setErrorMessage(null);
      setStartDate(new Date().toISOString().split('T')[0]);
      resourceApi.getMyProfile().then(setMyProfile).catch(() => setMyProfile(null));
    }
  }, [isOpen, resourceId]);

  const userRegionId = user?.regionId || myProfile?.region_id;

  const fetchResources = async () => {
    try {
      const list = await resourceApi.getResources();
      // Deduplicate by resource id
      const uniqueMap = new Map<number, ResourceProfile>();
      list.forEach((r) => uniqueMap.set(r.id, r));
      const uniqueList = Array.from(uniqueMap.values());

      const isSystemAdmin = userRoles.includes('System Administrator');
      const isPracticeLead = userRoles.includes('Practice Lead');

      // Regional Leads should only see resources in their region
      const filteredList = (isSystemAdmin || isPracticeLead)
        ? uniqueList
        : uniqueList.filter((r) => !userRegionId || r.region_id === userRegionId);

      setResourcesList(filteredList);
      if (filteredList.length > 0) {
        if (resourceId && filteredList.some((r) => r.id === resourceId)) {
          setSelectedResourceId(resourceId);
        } else {
          setSelectedResourceId(filteredList[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load resources', err);
    }
  };

  const selectedResourceObj = resourcesList.find((r) => r.id === selectedResourceId);
  const activeResourceName = selectedResourceObj?.user_name || resourceName || 'Selected Resource';
  const activeResourceRegion = selectedResourceObj?.region_name || resourceRegion;

  const isSelfAssignment = myProfile
    ? selectedResourceObj
      ? selectedResourceObj.id === myProfile.id || selectedResourceObj.user_id === myProfile.user_id
      : myProfile.id === selectedResourceId
    : false;

  const fetchTracks = async () => {
    try {
      setIsLoading(true);
      const data = await trainingCatalogApi.getTracks();
      setTracks(data);
      if (data.length > 0) {
        setSelectedTrackId(data[0].id.toString());
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to load training tracks.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResourceId || !selectedTrackId || !startDate) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const result = await trainingAssignmentApi.createAssignment({
        resource_id: selectedResourceId,
        track_id: Number(selectedTrackId),
        start_date: startDate,
      });

      setCreatedAssignment(result);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || 'Failed to assign training track. Please check permissions.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveImmediately = async () => {
    if (!createdAssignment) return;
    try {
      setIsApproving(true);
      setErrorMessage(null);
      const updated = await trainingAssignmentApi.approveAssignment(createdAssignment.id);
      setCreatedAssignment(updated);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || 'Failed to approve training assignment.'
      );
    } finally {
      setIsApproving(false);
    }
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight">
                {createdAssignment ? 'Assignment Preview & Day Plan' : 'Assign Training Track'}
              </h2>
              <p className="text-xs text-blue-200/80">
                Resource: <span className="font-semibold text-white">{activeResourceName}</span>
                {activeResourceRegion && ` (${activeResourceRegion})`}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (createdAssignment && onSuccess) onSuccess();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSelfAssignment && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
            <span>You cannot manage your own training assignment — ask another Regional Lead, Practice Lead, or Admin.</span>
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Content */}
        {!createdAssignment ? (
          /* Step 1: Form */
          <form onSubmit={handleCreateAssignment} className="p-6 space-y-5">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span>Loading available tracks catalog...</span>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Select Resource <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedResourceId}
                    onChange={(e) => setSelectedResourceId(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  >
                    <option value={0} disabled>Select a resource...</option>
                    {resourcesList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.user_name || r.user_email || `Resource #${r.id}`} ({r.region_name || 'No Region'}) {r.employee_id ? `- EMP: ${r.employee_id}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Select Training Track <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedTrackId}
                    onChange={(e) => setSelectedTrackId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  >
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.duration_days} Days)
                      </option>
                    ))}
                  </select>
                  {targetRole && (
                    <p className="text-[11px] text-blue-600 font-medium">
                      Suggested based on target role: {targetRole}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Assignment Start Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-blue-950">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    Auto-Generation Protocol
                  </div>
                  Daily activities will be immediately generated for each catalog module in the selected track. Activities remain pending and locked for the resource until approved.
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedTrackId || isSelfAssignment}
                    title={isSelfAssignment ? 'You cannot manage your own training assignment — ask another Regional Lead, Practice Lead, or Admin.' : undefined}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating Activities...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate & Preview Plan</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        ) : (
          /* Step 2: Preview & Immediate Approve */
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>
                  Status: {createdAssignment.approval_status.toUpperCase()} (
                  {createdAssignment.daily_activities?.length || 0} Daily Activities Auto-Generated)
                </span>
              </div>
              {createdAssignment.approval_status === 'approved' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Approved & Active
                </span>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Day-by-Day Learning Activities Plan
              </h3>
              <div className="max-h-64 overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl divide-y divide-slate-100">
                {createdAssignment.daily_activities?.map((act: DailyActivity) => (
                  <div
                    key={act.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-extrabold text-slate-700 text-[10px]">
                        Day {act.day_number}
                      </span>
                      <div className="flex items-center gap-2">
                        {getActivityIcon(act.activity_type)}
                        <span className="font-semibold text-slate-800">{act.description}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold capitalize">
                      {act.activity_type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (onSuccess) onSuccess();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Keep Pending & Close
              </button>

              {createdAssignment.approval_status === 'pending' ? (
                <button
                  type="button"
                  onClick={handleApproveImmediately}
                  disabled={isApproving || isSelfAssignment}
                  title={isSelfAssignment ? 'You cannot manage your own training assignment — ask another Regional Lead, Practice Lead, or Admin.' : undefined}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Approving Assignment...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Approve & Activate Now</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (onSuccess) onSuccess();
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
