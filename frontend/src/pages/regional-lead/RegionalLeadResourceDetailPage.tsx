import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Briefcase, Loader2, MapPin, Target, Plus, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';
import { resourceApi, type ResourceProfile } from '../../api/resourceApi';
import { SkillsMatrixSection } from '../../components/profile/SkillsMatrixSection';
import { ReadinessScoreCard } from '../../components/readiness/ReadinessScoreCard';
import { getReadinessScoreHistory } from '../../api/readinessScoreApi';
import type { ReadinessScore } from '../../api/readinessScoreApi';
import { getResourceDevelopmentPlan, approveDevelopmentPlan, rejectDevelopmentPlan } from '../../api/developmentPlanApi';
import type { DevelopmentPlan } from '../../api/developmentPlanApi';
import { DevelopmentPlanBuilderModal } from '../../components/development-plans/DevelopmentPlanBuilderModal';
import { useAuth } from '../../context/AuthContext';

export const RegionalLeadResourceDetailPage: React.FC = () => {
  const { resourceId } = useParams();
  const { user } = useAuth();
  const [resource, setResource] = useState<ResourceProfile | null>(null);
  const [readinessScore, setReadinessScore] = useState<ReadinessScore | null>(null);
  const [readinessHistory, setReadinessHistory] = useState<ReadinessScore[]>([]);
  const [plan, setPlan] = useState<DevelopmentPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!resourceId) return;
    loadResourceData(Number(resourceId));
  }, [resourceId]);

  const loadResourceData = async (resId: number) => {
    try {
      const [resData, scoreData, planData] = await Promise.all([
        resourceApi.getResourceById(resId),
        getReadinessScoreHistory(resId),
        getResourceDevelopmentPlan(resId),
      ]);
      setResource(resData);
      setReadinessHistory(scoreData.data?.history || []);
      setReadinessScore(scoreData.data?.latest || null);
      setPlan(planData.data || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load resource details.');
    }
  };

  const handleApprove = async () => {
    if (!plan) return;
    try {
      setIsProcessing(true);
      setActionError(null);
      await approveDevelopmentPlan(plan.id);
      await loadResourceData(Number(resourceId));
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to approve development plan.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!plan) return;
    try {
      setIsProcessing(true);
      setActionError(null);
      await rejectDevelopmentPlan(plan.id);
      await loadResourceData(Number(resourceId));
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to reject development plan.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (error) return <div className="p-8 text-center text-rose-600 text-sm font-semibold"><AlertCircle className="w-5 h-5 inline mr-2" />{error}</div>;
  if (!resource) return <div className="py-20 text-center text-slate-500 text-xs"><Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />Loading resource profile...</div>;

  const isSelf = user?.resourceId === resource.id || user?.id === resource.user_id;

  return (
    <div className="space-y-6">
      <Link to="/regional-lead/resources" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> Back to Resources
      </Link>

      {/* Header Profile Card */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl overflow-hidden border border-blue-100 shadow-sm">
            {resource.profile_image_url ? (
              <img src={resource.profile_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              resource.user_name.charAt(0)
            )}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">{resource.user_name}</h1>
            <p className="text-xs text-slate-500">{resource.employee_id} · {resource.user_email}</p>
            <div className="flex gap-3 mt-2 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-semibold"><Briefcase className="w-3.5 h-3.5 text-blue-600" />{resource.designation}</span>
              <span className="flex items-center gap-1 font-semibold"><MapPin className="w-3.5 h-3.5 text-blue-600" />{resource.region_name || 'No region'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsBuilderOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-sm shadow-blue-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Development Plan
        </button>
      </div>

      {/* Readiness Score Engine Card */}
      <ReadinessScoreCard
        score={readinessScore}
        resourceId={resource.id}
        canRecalculate={true}
        history={readinessHistory}
        onScoreUpdated={(newScore) => {
          setReadinessScore(newScore);
          setReadinessHistory((prev) => [newScore, ...prev]);
        }}
      />

      {/* Development Plan Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Development Plan Status
            </h2>
            <p className="text-xs text-slate-500">
              Target role profile learning roadmap and approval workflow
            </p>
          </div>

          {plan && (
            <div className="flex items-center gap-3">
              {plan.approval_status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleApprove}
                    disabled={isProcessing || isSelf}
                    title={isSelf ? 'Self-approval block: You cannot approve your own development plan.' : ''}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 flex items-center gap-1 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve Plan
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isProcessing || isSelf}
                    title={isSelf ? 'Self-approval block: You cannot reject your own development plan.' : ''}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50 flex items-center gap-1 shadow-xs"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject Plan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {actionError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-semibold">
            <ShieldAlert className="w-4 h-4 shrink-0" /> {actionError}
          </div>
        )}

        {isSelf && plan?.approval_status === 'pending' && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-semibold">
            <ShieldAlert className="w-4 h-4 shrink-0" /> Self-approval block active: Another Regional Lead or Admin must approve your development plan.
          </div>
        )}

        {plan ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <div>Target Profile: <span className="text-slate-900 font-bold">{plan.target_role_profile_name}</span></div>
              <div>Timeline: <span className="font-mono text-slate-800 font-semibold">{new Date(plan.start_date).toLocaleDateString()} — {new Date(plan.end_date).toLocaleDateString()}</span></div>
              <div>Status: <span className="font-mono uppercase font-bold text-blue-600">{plan.approval_status}</span></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {plan.items?.map((item) => (
                <div key={item.id || item.week_number} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-blue-600 mb-1">
                    <span>Week {item.week_number}</span>
                    {item.training_track_name && (
                      <span className="text-emerald-700 font-sans font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{item.training_track_name}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-900 font-bold">{item.focus_area}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
            No active development plan. Click "Create Development Plan" to build one for this resource.
          </div>
        )}
      </div>

      <SkillsMatrixSection resourceId={resource.id} resourceUserId={resource.user_id} />

      <DevelopmentPlanBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        presetResourceId={resource.id}
        onPlanCreated={() => loadResourceData(resource.id)}
      />
    </div>
  );
};
