import React from 'react';
import { StatCard } from '../../components/ui/StatCard';
import {
  Calendar,
  CheckCircle2,
  Target,
  Code2,
  Circle,
  Clock,
  HelpCircle,
  Bell,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const readinessDonut = [
  { name: 'Completed', value: 72, color: '#004ac6' },
  { name: 'Remaining', value: 28, color: '#e2e8f0' },
];

export const ResourceDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Engineer Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, Alex. Here's your readiness overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button aria-label="Notifications" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full" />
          </button>
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
            A
          </div>
        </div>
      </div>

      {/* KPI Cards (4 columns) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Bench Day"
          value="18"
          icon={Calendar}
          subtitle="Days until projected deployment"
        />
        <StatCard
          title="Today's Progress"
          value="75%"
          icon={CheckCircle2}
          trend={{ text: 'Tasks completed', type: 'positive' }}
        />
        <StatCard
          title="Overall Readiness"
          value="72%"
          icon={Target}
          subtitle="Target: 85% for deployment"
        />
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-blue-100">Current Training Track</span>
            <Code2 className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Full Stack Dev</h2>
            <p className="text-xs text-blue-200 mt-1 font-medium">
              React / Node.js Specialization
            </p>
          </div>
        </div>
      </section>

      {/* Main Bento Grid Top Row */}
      <section className="grid grid-cols-12 gap-6">
        {/* Readiness Progress Donut Card (Span 4) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 flex flex-col items-center justify-between text-center">
          <h2 className="text-base font-bold text-slate-900 w-full text-left mb-4">
            Readiness Progress
          </h2>

          <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={readinessDonut}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  {readinessDonut.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-slate-900 leading-none">72%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                Score
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold my-3">
            <ArrowRight className="w-3.5 h-3.5" /> Almost Ready
          </div>

          <p className="text-xs text-slate-400 font-medium">
            Complete 2 more advanced modules to reach target readiness.
          </p>
        </div>

        {/* Skill Gap Analysis (Span 8) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-slate-900">Skill Gap Analysis</h2>
            <button className="text-xs font-bold text-blue-600 hover:underline">View Details</button>
          </div>

          <div className="space-y-5">
            {/* Skill 1 */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-800">React.js Advanced Patterns</span>
                <span className="text-slate-400">Current: 60% / Target: 80%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 relative overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>

            {/* Skill 2 */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-800">Node.js Microservices</span>
                <span className="text-slate-400">Current: 85% / Target: 85%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 relative overflow-hidden">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            {/* Skill 3 */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-800">System Design</span>
                <span className="text-slate-400">Current: 40% / Target: 70%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 relative overflow-hidden">
                <div className="bg-amber-600 h-2 rounded-full" style={{ width: '40%' }} />
              </div>
            </div>

            {/* Skill 4 */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-800">Cloud Architecture (AWS)</span>
                <span className="text-slate-400">Current: 55% / Target: 75%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 relative overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '55%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Bento Grid Bottom Row */}
      <section className="grid grid-cols-12 gap-6">
        {/* Today's Activities (Span 6) */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-slate-900">Today's Activities</h2>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">
              3 Remaining
            </span>
          </div>

          <ul className="space-y-3">
            <li className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors flex items-start gap-3 cursor-pointer">
              <Circle className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Complete Module: Advanced React Hooks
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  Est. 45 mins • Core Requirement
                </p>
              </div>
            </li>

            <li className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-400 line-through">Daily Standup</p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  Completed at 9:30 AM
                </p>
              </div>
            </li>

            <li className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors flex items-start gap-3 cursor-pointer">
              <Circle className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900">Peer Code Review Exercise</p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  Est. 60 mins • Mentorship Track
                </p>
              </div>
            </li>

            <li className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors flex items-start gap-3 cursor-pointer">
              <Circle className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900">Read: Systems Design Primer</p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  Est. 30 mins • Self-study
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Upcoming Assessments (Span 6) */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 mb-4">Upcoming Assessments</h2>

          <div className="space-y-3">
            <div className="p-4 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">System Architecture Quiz</h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 font-medium">
                    <Calendar className="w-3 h-3" /> Tomorrow, 2:00 PM
                  </p>
                </div>
              </div>
              <button className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded transition-colors whitespace-nowrap">
                View Details
              </button>
            </div>

            <div className="p-4 border border-blue-200 bg-blue-50/30 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Live Coding Challenge: Algorithms
                  </h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 font-medium">
                    <Clock className="w-3 h-3" /> Starts in 2 hours
                  </p>
                </div>
              </div>
              <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow-sm transition-colors whitespace-nowrap">
                Start Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
