import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getDevelopmentPlans,
  approveDevelopmentPlan,
  rejectDevelopmentPlan,
  completeDevelopmentPlan,
  deleteDevelopmentPlan,
  type DevelopmentPlan,
} from '../../api/developmentPlanApi';
import { DevelopmentPlanBuilderModal } from '../../components/development-plans/DevelopmentPlanBuilderModal';
import {
  Target,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  User,
  Calendar,
  Layers,
  ShieldAlert,
  Trash2,
} from 'lucide-react';

export const RegionalLeadDevelopmentPlansPage: React.FC = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<DevelopmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'completed'>('pending');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDevelopmentPlans();
      setPlans(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load development plans.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (planId: number) => {
    try {
      setProcessingId(planId);
      setActionError(null);
      await approveDevelopmentPlan(planId);
      await loadPlans();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to approve development plan.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (planId: number) => {
    try {
      setProcessingId(planId);
      setActionError(null);
      await rejectDevelopmentPlan(planId);
      await loadPlans();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to reject development plan.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleComplete = async (planId: number) => {
    try {
      setProcessingId(planId);
      setActionError(null);
      await completeDevelopmentPlan(planId);
      await loadPlans();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to complete development plan.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (planId: number) => {
    if (!window.confirm('Are you sure you want to delete this development plan?')) return;
    try {
      setProcessingId(planId);
      setActionError(null);
      await deleteDevelopmentPlan(planId);
      await loadPlans();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to delete development plan.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesTab =
      activeTab === 'all'
        ? true
        : activeTab === 'pending'
        ? plan.approval_status === 'pending'
        : activeTab === 'active'
        ? plan.status === 'active' && plan.approval_status === 'approved'
        : plan.status === 'completed';

    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      plan.resource_name?.toLowerCase().includes(term) ||
      plan.target_role_profile_name?.toLowerCase().includes(term) ||
      plan.created_by_name?.toLowerCase().includes(term);

    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (approvalStatus: string, status: string) => {
    if (approvalStatus === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Approval
        </span>
      );
    }
    if (approvalStatus === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
        </span>
      );
    }
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active
      </span>
    );
  };

  const pendingCount = plans.filter((p) => p.approval_status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Development Plans Management</h1>
            <p className="text-xs text-slate-500">
              Review, approve, and build 4-week target role profile development plans for engineering resources.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsBuilderOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm shadow-blue-500/20 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Development Plan</span>
        </button>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-semibold">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          {actionError}
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Pending Review</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'active'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'completed'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'all'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Plans ({plans.length})
          </button>
        </div>

        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resource, target role, or creator..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Content Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            Loading development plans...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs font-semibold flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <Target className="w-8 h-8 text-slate-300 mb-1" />
            <p className="font-bold text-slate-700 text-sm">No development plans found</p>
            <p className="text-slate-400 max-w-sm">
              There are no development plans matching your current filter tab. Click "+ Create Development Plan" to build a new plan.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPlans.map((plan) => {
              const isSelf = user?.resourceId === plan.resource_id || user?.id === plan.created_by;

              return (
                <div key={plan.id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                        {plan.resource_name?.charAt(0) || 'R'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900">{plan.resource_name}</h3>
                          {getStatusBadge(plan.approval_status, plan.status)}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                          <span className="font-semibold text-blue-600">{plan.target_role_profile_name}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Calendar className="w-3 h-3" />
                            {new Date(plan.start_date).toLocaleDateString()} — {new Date(plan.end_date).toLocaleDateString()}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {plan.approval_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(plan.id)}
                            disabled={processingId === plan.id || isSelf}
                            title={isSelf ? 'Self-approval block: You cannot approve your own development plan.' : ''}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 flex items-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(plan.id)}
                            disabled={processingId === plan.id || isSelf}
                            title={isSelf ? 'Self-approval block: You cannot reject your own development plan.' : ''}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50 flex items-center gap-1 shadow-xs"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      )}
                      {plan.status === 'active' && plan.approval_status === 'approved' && (
                        <button
                          onClick={() => handleComplete(plan.id)}
                          disabled={processingId === plan.id}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 flex items-center gap-1 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(plan.id)}
                        disabled={processingId === plan.id}
                        title="Delete this development plan"
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 border border-slate-200 transition flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Delete
                      </button>
                    </div>
                  </div>

                  {/* Weekly breakdown */}
                  {plan.items && plan.items.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                      {plan.items.map((item) => (
                        <div key={item.id || item.week_number} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-blue-600 mb-0.5">
                            <span>W{item.week_number}</span>
                            {item.training_track_name && <span className="text-emerald-700 truncate max-w-[100px]">{item.training_track_name}</span>}
                          </div>
                          <p className="font-semibold text-slate-800 line-clamp-2 text-[11px]">{item.focus_area}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Created by: <strong className="text-slate-600">{plan.created_by_name}</strong></span>
                    {plan.approved_by_name && (
                      <span>Approved by: <strong className="text-emerald-700">{plan.approved_by_name}</strong></span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DevelopmentPlanBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onPlanCreated={loadPlans}
      />
    </div>
  );
};
