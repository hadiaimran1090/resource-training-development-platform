import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import {
  Users,
  Armchair,
  Rocket,
  Award,
  MessageSquare,
  PlaneTakeoff,
  Lightbulb,
  MoreVertical
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
  Cell
} from 'recharts';

// Mock Data for Line Chart (Bench Trends)
const benchTrendData = [
  { month: 'Mar', bench: 1000, deployed: 1800 },
  { month: 'Apr', bench: 1100, deployed: 1700 },
  { month: 'May', bench: 1400, deployed: 1900 },
  { month: 'Jun', bench: 1300, deployed: 1600 },
  { month: 'Jul', bench: 1600, deployed: 1700 },
  { month: 'Aug', bench: 1500, deployed: 2000 },
  { month: 'Sep', bench: 1800, deployed: 2100 },
];

// Mock Data for Readiness Donut Chart
const readinessData = [
  { name: 'Ready', value: 894, percentage: '48%', color: '#004ac6' },
  { name: 'Almost', value: 552, percentage: '30%', color: '#b4c5ff' },
  { name: 'Dev Needed', value: 258, percentage: '14%', color: '#ffb596' },
  { name: 'High Risk', value: 138, percentage: '8%', color: '#ba1a1a' },
];

export const ManagementDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="Read-Only View"
        dateFilterText="Q3 2026 (To Date)"
      />

      {/* KPI Cards Section */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Workforce"
          value="12.4k"
          icon={Users}
          trend={{ text: '+2.1% YTD', type: 'positive' }}
        />
        <StatCard
          title="Total Bench"
          value="1,842"
          icon={Armchair}
          trend={{ text: '+5.4% QoQ', type: 'negative' }}
        />
        <StatCard
          title="Deployment Ready"
          value="894"
          icon={Rocket}
          subtitle="48.5% of Bench"
          highlighted
        />
        <StatCard
          title="Avg Readiness"
          value="8.2"
          unit="/10"
          icon={Award}
          trend={{ text: 'On Target', type: 'positive' }}
        />
        <StatCard
          title="Interview Success"
          value="64%"
          icon={MessageSquare}
          trend={{ text: '+2% vs Last Mo', type: 'positive' }}
        />
        <StatCard
          title="Deployment Rate"
          value="42/wk"
          icon={PlaneTakeoff}
          trend={{ text: 'Stable', type: 'neutral' }}
        />
      </section>

      {/* Main Bento Grid */}
      <section className="grid grid-cols-12 gap-6">
        {/* Left Column (Span 8) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* Bench Trends Line Chart */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Bench Population Trends</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  6-Month Rolling Average vs Active Deployments
                </p>
              </div>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-[#004ac6]" /> Bench
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-[#645efb]" /> Deployed
                </span>
              </div>
            </div>

            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={benchTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `${val / 1000}k`}
                  />
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
                    dataKey="bench"
                    stroke="#004ac6"
                    strokeWidth={2.5}
                    dot={{ fill: '#004ac6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="deployed"
                    stroke="#645efb"
                    strokeWidth={2.5}
                    dot={{ fill: '#645efb', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lower Row: Regional Readiness & Interview Funnel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Regional Readiness Progress Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
              <h2 className="text-base font-bold text-slate-900 mb-5">Regional Readiness</h2>
              <div className="space-y-4">
                {[
                  { region: 'North America', percentage: 88, color: 'bg-[#004ac6]' },
                  { region: 'EMEA', percentage: 76, color: 'bg-[#004ac6]/80' },
                  { region: 'APAC', percentage: 62, color: 'bg-[#004ac6]/60' },
                  { region: 'LATAM', percentage: 45, color: 'bg-[#004ac6]/40' },
                ].map((item) => (
                  <div key={item.region}>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-700">{item.region}</span>
                      <span className="text-blue-700 font-bold">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interview Funnel Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-slate-900">Interview Funnel</h2>
                <button aria-label="Options" className="text-slate-400 hover:text-slate-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4 flex-1 flex flex-col justify-center">
                {/* Stage 1 */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                    1
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-700 font-medium">Scheduled</span>
                      <span className="font-bold text-slate-900">450</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-slate-400 h-1.5 rounded-full w-full" />
                    </div>
                  </div>
                </div>
                {/* Stage 2 */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-700 font-medium">Completed</span>
                      <span className="font-bold text-slate-900">380</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-blue-500/60 h-1.5 rounded-full" style={{ width: '84%' }} />
                    </div>
                  </div>
                </div>
                {/* Stage 3 */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-xs">
                    3
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-blue-700 font-bold">Passed</span>
                      <span className="text-blue-700 font-bold">245</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '64%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Span 4) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Readiness Distribution Donut Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
            <h2 className="text-base font-bold text-slate-900 mb-6">Readiness Distribution</h2>
            <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={readinessData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {readinessData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-slate-900 leading-none">1.8k</span>
                <span className="text-xs font-semibold text-slate-400 mt-1">Total Bench</span>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              {readinessData.map((item) => (
                <div key={item.name} className="flex items-start gap-2">
                  <div
                    className="w-3 h-3 rounded-sm mt-0.5 shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{item.name}</div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {item.percentage} ({item.value})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Insights Card (Glassmorphism styling) */}
          <div className="rounded-xl p-[1px] bg-gradient-to-br from-blue-400/30 to-indigo-500/10 shadow-sm relative overflow-hidden flex-1 min-h-[220px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="bg-white/80 backdrop-blur-md w-full h-full rounded-[11px] p-6 relative z-10 flex flex-col border border-white/60">
              <div className="flex items-center gap-2 mb-4 text-blue-600 font-bold text-sm">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                <h3>Strategic Insights</h3>
              </div>
              <div className="space-y-3 flex-1">
                <div className="bg-white/70 rounded-lg p-3 border border-white/80 text-xs text-slate-600 leading-relaxed shadow-2xs">
                  <strong className="text-slate-900 font-semibold">Bottleneck Alert:</strong> LATAM region
                  readiness lags by 17% against global average. Suggest redirecting Training Mgr bandwidth.
                </div>
                <div className="bg-white/70 rounded-lg p-3 border border-white/80 text-xs text-slate-600 leading-relaxed shadow-2xs">
                  <strong className="text-slate-900 font-semibold">Positive Trend:</strong> Engineering bench
                  duration decreased to 14 days (down from 22 days in Q2).
                </div>
              </div>
              <button className="mt-4 w-full py-2 text-blue-600 font-semibold text-xs hover:bg-white/60 rounded-md transition-colors border border-transparent hover:border-white/50 text-center">
                View Full Analysis &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
