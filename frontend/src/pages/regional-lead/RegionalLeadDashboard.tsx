import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import {
  Users,
  Armchair,
  Clock,
  GraduationCap,
  BadgeCheck,
  AlertTriangle,
  FileText,
  Check,
  X,
  ChevronDown,
  BookOpen,
  ArrowRight,
  Target,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  getDevelopmentPlans,
  approveDevelopmentPlan,
  rejectDevelopmentPlan,
  type DevelopmentPlan,
} from '../../api/developmentPlanApi';
import { useAuth } from '../../context/AuthContext';

const benchVolumeData = [
  { month: 'Mar', volume: 18 },
  { month: 'Apr', volume: 24 },
  { month: 'May', volume: 30 },
  { month: 'Jun', volume: 27 },
  { month: 'Jul', volume: 38 },
  { month: 'Aug', volume: 32 },
];

const benchCompData = [
  { name: 'New to Bench', value: 12, percentage: '38%', color: '#004ac6' },
  { name: 'In Development', value: 8, percentage: '25%', color: '#645efb' },
  { name: 'Needs Attention', value: 4, percentage: '12%', color: '#bc4800' },
  { name: 'Critical Aging', value: 6, percentage: '19%', color: '#ba1a1a' },
  { name: 'Escalation', value: 2, percentage: '6%', color: '#737686' },
];

export const RegionalLeadDashboard: React.FC = () => {
  const { user } = useAuth();
  const [pendingPlans, setPendingPlans] = useState<DevelopmentPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadPendingPlans();
  }, []);

  const loadPendingPlans = async () => {
    try {
      setLoadingPlans(true);
      const res = await getDevelopmentPlans();
      const all: DevelopmentPlan[] = res.data || [];
      setPendingPlans(all.filter((p) => p.approval_status === 'pending'));
    } catch (err) {
      console.error('Failed to load pending development plans:', err);
    } fontFinally: {
      setLoadingPlans(false);
    }
  };

  const handleApprove = async (planId: number) => {
    try {
      setProcessingId(planId);
      await approveDevelopmentPlan(planId);
      await loadPendingPlans();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to approve plan.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (planId: number) => {
    try {
      setProcessingId(planId);
      await rejectDevelopmentPlan(planId);
      await loadPendingPlans();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to reject plan.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <PageHeader
          onExport={() => alert('Exporting Regional Ops Report...')}
        />
        <div className="flex items-center gap-3 shrink-0 mb-4 md:mb-0">
          <Link
            to="/regional-lead/development-plans"
            className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs transition-all flex items-center gap-2"
          >
            <Target className="w-4 h-4 text-blue-600" />
            <span>Development Plans</span>
          </Link>
          <Link
            to="/regional-lead/training-assignments"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Training Assignments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards (6 columns) */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Resources"
          value="128"
          icon={Users}
          trend={{ text: '+4 this month', type: 'positive' }}
        />
        <StatCard
          title="On Bench"
          value="32"
          icon={Armchair}
          trend={{ text: 'Stable', type: 'neutral' }}
        />
        <StatCard
          title="Avg Bench Tenure"
          value="21"
          unit="Days"
          icon={Clock}
          trend={{ text: '+2 days vs prev', type: 'negative' }}
        />
        <StatCard
          title="Training Comp."
          value="74%"
          icon={GraduationCap}
          subtitle="On schedule"
        />
        <StatCard
          title="Interview Ready"
          value="18"
          icon={BadgeCheck}
          trend={{ text: 'Available now', type: 'positive' }}
        />
        <div className="bg-gradient-to-br from-rose-50 to-white rounded-xl p-5 border border-rose-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>At Risk</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 my-1">6</div>
          <span className="text-[11px] font-bold text-rose-600">Requires Action</span>
        </div>
      </section>

      {/* Main Grid Top Row */}
      <section className="grid grid-cols-12 gap-6">
        {/* Left Column (Span 8) Line Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Bench Volume & Aging Trends</h2>
              <p className="text-xs text-slate-400 mt-0.5">6-Month historical view</p>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center gap-2 cursor-pointer">
              <span>Last 6 Months</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          <div className="h-[260px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={benchVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 45]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#004ac6"
                  strokeWidth={2.5}
                  dot={{ fill: '#004ac6', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 mt-4 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#004ac6] rounded-full" />
              <span className="text-slate-600">Total Bench Volume</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-slate-400 rounded-full" />
              <span className="text-slate-600">Target Threshold (25)</span>
            </div>
          </div>
        </div>

        {/* Right Column (Span 4) Donut Chart */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 flex flex-col items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 mb-4 w-full text-left">
            Bench Composition
          </h2>

          <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={benchCompData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {benchCompData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-slate-900 leading-none">32</span>
              <span className="text-xs font-semibold text-slate-400 mt-1">Total</span>
            </div>
          </div>

          <div className="mt-4 w-full space-y-2 text-xs font-semibold">
            {benchCompData.map((item) => (
              <div key={item.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-700">{item.name}</span>
                </div>
                <span className="text-slate-900 font-bold">
                  {item.value} ({item.percentage})
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Grid Bottom Row */}
      <section className="grid grid-cols-12 gap-6">
        {/* Left Column (Span 8) At-Risk Table */}
        <div id="at-risk" className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              At-Risk Resources (Aging &gt; 45 Days)
            </h2>
            <Link to="/regional-lead/resources" className="text-blue-600 hover:underline text-xs font-semibold">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Core Skills</th>
                  <th className="py-3 px-4">Bench Days</th>
                  <th className="py-3 px-4">Readiness</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                      AS
                    </div>
                    <div>
                      <div>Alex Sterling</div>
                      <div className="text-[10px] text-slate-400 font-normal">Sr. Cloud Engineer</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500">AWS, Terraform, Python</td>
                  <td className="py-3 px-4 font-bold text-rose-600">52</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-semibold text-[10px]">
                      Low
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link to="/regional-lead/resources" className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                      <FileText className="w-4 h-4 inline" />
                    </Link>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px]">
                      MJ
                    </div>
                    <div>
                      <div>Maria Jenkins</div>
                      <div className="text-[10px] text-slate-400 font-normal">Data Analyst</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500">SQL, Tableau, R</td>
                  <td className="py-3 px-4 font-bold text-rose-600">48</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold text-[10px]">
                      Medium
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link to="/regional-lead/resources" className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                      <FileText className="w-4 h-4 inline" />
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (Span 4) Dev Plans & Training Tracks */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Pending Dev Plans */}
          <div id="dev-plans" className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                Pending Dev Plans
              </h2>
              {pendingPlans.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                  {pendingPlans.length} Pending
                </span>
              )}
            </div>

            {loadingPlans ? (
              <p className="text-xs text-slate-400">Loading plans...</p>
            ) : pendingPlans.length > 0 ? (
              <div className="space-y-3">
                {pendingPlans.slice(0, 3).map((p) => {
                  const isSelf = user?.resourceId === p.resource_id || user?.id === p.created_by;

                  return (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{p.resource_name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{p.target_role_profile_name}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleApprove(p.id)}
                          disabled={processingId === p.id || isSelf}
                          title={isSelf ? 'Self-approval block: You cannot approve your own development plan.' : 'Approve Plan'}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(p.id)}
                          disabled={processingId === p.id || isSelf}
                          title={isSelf ? 'Self-approval block: You cannot reject your own development plan.' : 'Reject Plan'}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-2">No pending development plans requiring approval.</p>
            )}

            <Link
              to="/regional-lead/development-plans"
              className="block w-full text-center text-xs font-bold text-blue-600 hover:underline"
            >
              Review All ({pendingPlans.length})
            </Link>
          </div>

          {/* Training Tracks Blue Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold">Training Tracks</h2>
                <p className="text-[11px] text-blue-100">Quarterly progress</p>
              </div>
              <Link
                to="/regional-lead/training-assignments"
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/20 transition-all flex items-center gap-1 shrink-0"
              >
                <span>Assignments</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Cloud Architecture</span>
                  <span>85%</span>
                </div>
                <div className="w-full bg-blue-800/60 rounded-full h-1.5">
                  <div className="bg-white h-1.5 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Data Science Basics</span>
                  <span>60%</span>
                </div>
                <div className="w-full bg-blue-800/60 rounded-full h-1.5">
                  <div className="bg-white h-1.5 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
