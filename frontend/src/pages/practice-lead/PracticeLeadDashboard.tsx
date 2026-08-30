import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import {
  Users,
  GraduationCap,
  Award,
  Mic,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Regional Comparison Bar Chart Data
const regionalData = [
  { region: 'APAC', total: 700, bench: 210 },
  { region: 'KSA', total: 530, bench: 212 },
  { region: 'UAE', total: 410, bench: 82 },
  { region: 'VSI', total: 780, bench: 195 },
];

// Bench Health Donut Chart Data
const benchHealthData = [
  { name: '0-30 Days', value: 235, percentage: '55%', color: '#004ac6' },
  { name: '31-60 Days', value: 128, percentage: '30%', color: '#e2e8f0' },
  { name: '>60 Days', value: 65, percentage: '15%', color: '#bc4800' },
];

export const PracticeLeadDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        dateFilterText="Last 30 Days"
        onExport={() => alert('Exporting Practice Lead Report...')}
      />

      {/* KPI Cards (5 columns) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Bench Resources"
          value="428"
          icon={Users}
          trend={{ text: '-12% vs last month', type: 'positive' }}
        />
        <StatCard
          title="Overall Training"
          value="84%"
          icon={GraduationCap}
          trend={{ text: '+3% vs last month', type: 'positive' }}
        />
        <StatCard
          title="Avg Readiness Score"
          value="4.2"
          icon={Award}
          trend={{ text: '+0.1 vs last month', type: 'positive' }}
        />
        <StatCard
          title="Interview Ready Rate"
          value="68%"
          icon={Mic}
          trend={{ text: '-2% vs last month', type: 'negative' }}
        />
        <StatCard
          title="Critical Resources"
          value="24"
          icon={AlertTriangle}
          subtitle="At risk of churn (>90 days on bench)"
        />
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-12 gap-6">
        {/* Left Column: Regional Comparison (Span 8) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 flex flex-col justify-between">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Regional Comparison (Total vs Bench)
          </h2>

          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="region" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 1000]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="total" name="Total Resources" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="bench" name="On Bench" fill="#004ac6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 mt-4 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-200 rounded-sm" />
              <span className="text-slate-600">Total Resources</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#004ac6] rounded-sm" />
              <span className="text-slate-600">On Bench</span>
            </div>
          </div>
        </div>

        {/* Right Column: Bench Health Donut (Span 4) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 flex flex-col items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 mb-6 w-full text-left">
            Bench Health (Days on Bench)
          </h2>

          <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={benchHealthData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {benchHealthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-slate-900 leading-none">428</span>
              <span className="text-xs font-semibold text-slate-400 mt-1">Total Bench</span>
            </div>
          </div>

          <div className="mt-6 w-full space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#004ac6] rounded-sm" />
                <span className="text-slate-700 font-medium">0-30 Days</span>
              </div>
              <span className="font-bold text-slate-900">55% (235)</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-200 rounded-sm" />
                <span className="text-slate-700 font-medium">31-60 Days</span>
              </div>
              <span className="font-bold text-slate-900">30% (128)</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#bc4800] rounded-sm" />
                <span className="text-slate-700 font-medium">&gt;60 Days</span>
              </div>
              <span className="font-bold text-[#bc4800]">15% (65)</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
