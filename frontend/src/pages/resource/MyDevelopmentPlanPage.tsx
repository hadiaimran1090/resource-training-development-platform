import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { resourceApi } from '../../api/resourceApi';
import { getResourceDevelopmentPlan } from '../../api/developmentPlanApi';
import type { DevelopmentPlan } from '../../api/developmentPlanApi';
import { getReadinessScoreHistory, recalculateReadinessScore } from '../../api/readinessScoreApi';
import type { ReadinessScore } from '../../api/readinessScoreApi';
import { ReadinessScoreCard } from '../../components/readiness/ReadinessScoreCard';
import { Target, Calendar, CheckCircle2, Clock, AlertTriangle, Layers, BookOpen, ShieldCheck, Loader2, Info } from 'lucide-react';

export const MyDevelopmentPlanPage: React.FC = () => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<DevelopmentPlan | null>(null);
  const [rawPlan, setRawPlan] = useState<DevelopmentPlan | null>(null); // original plan regardless of approval
  const [readinessScore, setReadinessScore] = useState<ReadinessScore | null>(null);
  const [readinessHistory, setReadinessHistory] = useState<ReadinessScore[]>([]);
  const [resolvedResourceId, setResolvedResourceId] = useState<number | null>(user?.resourceId || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      let resId = user?.resourceId;
      if (!resId) {
        const profile = await resourceApi.getMyProfile();
        resId = profile.id;
        setResolvedResourceId(profile.id);
      }
      if (resId) {
        const [planRes, readinessRes] = await Promise.all([
          getResourceDevelopmentPlan(resId),
          getReadinessScoreHistory(resId),
        ]);
        const fetchedPlan: DevelopmentPlan | null = planRes.data || null;
        setRawPlan(fetchedPlan);
        // Only show plan to resource if it is approved/active or completed
        if (fetchedPlan && (fetchedPlan.approval_status === 'approved' || fetchedPlan.status === 'active' || fetchedPlan.status === 'completed')) {
          setPlan(fetchedPlan);
        } else {
          setPlan(null);
        }
        setReadinessHistory(readinessRes.data?.history || []);
        const latestScore = readinessRes.data?.latest || null;
        setReadinessScore(latestScore);
        // Auto-trigger recalculation if no score yet and we have a resource ID
        if (!latestScore && resId) {
          try {
            const recalcRes = await recalculateReadinessScore(resId);
            if (recalcRes?.data) setReadinessScore(recalcRes.data);
          } catch {
            // silently ignore recalc errors
          }
        }
      }
    } catch (err) {
      console.error('Failed to load my development plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const getApprovalBadge = (approvalStatus?: string) => {
    switch (approvalStatus) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Plan Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" /> Plan Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            My Development Plan & Readiness
          </h1>
          <p className="text-xs text-slate-500">
            Track your target role profile readiness and weekly learning objectives
          </p>
        </div>
      </div>

      {/* Deployment Readiness Widget */}
      <ReadinessScoreCard
        score={readinessScore}
        resourceId={resolvedResourceId || user?.resourceId}
        canRecalculate={false} // Resource read-only view
        history={readinessHistory}
      />

      {/* Development Plan Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Target Role Profile Plan
            </h2>
            <p className="text-xs text-slate-500">
              {plan?.target_role_profile_name ? (
                <>Target Role: <span className="text-blue-600 font-bold">{plan.target_role_profile_name}</span></>
              ) : (
                'Assigned development roadmap'
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {plan && getApprovalBadge(plan.approval_status)}
            {plan?.status && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono uppercase font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {plan.status}
              </span>
            )}
          </div>
        </div>

        {plan ? (
          <div className="space-y-6">
            {/* Metadata Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-blue-600" /> Target Profile
                </div>
                <div className="text-sm font-bold text-slate-900">{plan.target_role_profile_name}</div>
                {plan.target_role_profile_description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plan.target_role_profile_description}</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" /> Timeline
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {new Date(plan.start_date).toLocaleDateString()} — {new Date(plan.end_date).toLocaleDateString()}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">4-Week Structured Roadmap</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Ownership
                </div>
                <div className="text-xs text-slate-600">
                  Created by: <span className="text-slate-900 font-semibold">{plan.created_by_name}</span>
                </div>
                {plan.approved_by_name && (
                  <div className="text-xs text-slate-600 mt-1">
                    Approved by: <span className="text-emerald-700 font-semibold">{plan.approved_by_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Breakdown Grid */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" /> Weekly Implementation Breakdown
              </h3>

              {plan.items && plan.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plan.items.map((item) => (
                    <div
                      key={item.id || item.week_number}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:border-slate-300 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Week {item.week_number}
                          </span>
                        {item.training_track_name && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            {item.training_track_name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900 leading-relaxed">{item.focus_area}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
                  No weekly focus items added to this plan yet.
                </div>
              )}
            </div>
          </div>
        ) : rawPlan && rawPlan.approval_status === 'pending' ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Plan Pending Approval</h3>
            <p className="text-xs text-slate-500 max-w-md">
              Your development plan has been created and is currently awaiting approval from your Regional Lead or System Administrator.
              You will be notified once it is reviewed.
            </p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 mt-1">
              <Clock className="w-3.5 h-3.5" /> Awaiting Review
            </span>
          </div>
        ) : rawPlan && rawPlan.approval_status === 'rejected' ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Development Plan Rejected</h3>
            <p className="text-xs text-slate-500 max-w-md">
              Your development plan was reviewed and rejected. Your Regional Lead or Training Manager will create a revised plan for you.
            </p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 mt-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Plan Rejected
            </span>
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">No Development Plan Assigned</h3>
            <p className="text-xs text-slate-500 max-w-md">
              Your Regional Lead or Training Manager has not assigned a target role profile development plan to your account yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

