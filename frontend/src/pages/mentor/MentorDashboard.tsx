import React from 'react';
import { StatCard } from '../../components/ui/StatCard';
import {
  Users,
  Code,
  Video,
  MessageSquare,
  Terminal,
  Star,
  Calendar,
  Lightbulb,
  Sparkles,
  AlertTriangle,
  Check
} from 'lucide-react';

export const MentorDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back, Mentor</h1>
        <p className="text-xs text-slate-500 mt-1">Here's what's happening with your mentees today.</p>
      </div>

      {/* KPI Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="ASSIGNED MENTEES"
          value="12"
          icon={Users}
          trend={{ text: '+2 this month', type: 'positive' }}
        />
        <StatCard
          title="PENDING REVIEWS"
          value="5"
          icon={Code}
          trend={{ text: '3 overdue', type: 'negative' }}
        />
        <StatCard
          title="MOCK INTERVIEWS"
          value="3"
          icon={Video}
          subtitle="Next: Tomorrow 2 PM"
        />
        <StatCard
          title="FEEDBACK GIVEN"
          value="48"
          icon={MessageSquare}
          trend={{ text: '95% completion rate', type: 'positive' }}
        />
      </section>

      {/* Workspace Grid */}
      <section className="grid grid-cols-12 gap-6">
        {/* Left Column (Span 8) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Coding Review Queue */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-600" />
                Coding Review Queue
              </h2>
              <button className="text-blue-600 hover:text-blue-700 text-xs font-semibold">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4">Challenge</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                        SJ
                      </div>
                      Sarah Jenkins
                    </td>
                    <td className="py-3 px-4 text-slate-500">API Rate Limiting</td>
                    <td className="py-3 px-4 text-slate-400">2 hrs ago</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-semibold text-[10px]">
                        Failing Tests (2/15)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-3 py-1 bg-blue-600 text-white rounded-md font-semibold text-[11px] hover:bg-blue-700 transition-colors shadow-2xs">
                        Review
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                        MJ
                      </div>
                      Marcus Johnson
                    </td>
                    <td className="py-3 px-4 text-slate-500">Data Pipeline Refactor</td>
                    <td className="py-3 px-4 text-slate-400">5 hrs ago</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
                        Pending Review
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-3 py-1 bg-blue-600 text-white rounded-md font-semibold text-[11px] hover:bg-blue-700 transition-colors shadow-2xs">
                        Review
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
                        DC
                      </div>
                      David Chen
                    </td>
                    <td className="py-3 px-4 text-slate-500">Auth Middleware</td>
                    <td className="py-3 px-4 text-slate-400">Yesterday</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
                        Pending Review
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-3 py-1 border border-slate-200 text-slate-700 rounded-md font-semibold text-[11px] hover:bg-slate-50 transition-colors">
                        View
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Priority Mentees */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                Priority Mentees
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mentee 1 */}
              <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                      ER
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Elena Rodriguez</h3>
                      <p className="text-[11px] text-slate-400">Frontend Track • Week 4</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-[10px]">
                    Needs Help
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-500">Readiness Score</span>
                    <span className="text-blue-600">72%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '72%' }} />
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap text-[10px] font-semibold text-slate-600">
                  <span className="px-2 py-1 bg-slate-50 rounded border border-slate-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500" /> React Hooks
                  </span>
                  <span className="px-2 py-1 bg-slate-50 rounded border border-slate-200">
                    State Mgt
                  </span>
                </div>
              </div>

              {/* Mentee 2 */}
              <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                      JW
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">James Wu</h3>
                      <p className="text-[11px] text-slate-400">Backend Track • Week 6</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-[10px]">
                    On Track
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-500">Readiness Score</span>
                    <span className="text-emerald-600">88%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '88%' }} />
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap text-[10px] font-semibold text-slate-600">
                  <span className="px-2 py-1 bg-slate-50 rounded border border-slate-200 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> SQL Optimization
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Span 4) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Upcoming Mocks Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Upcoming Mocks
            </h2>

            <div className="space-y-3">
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase">Today, 2:00 PM</span>
                <p className="text-xs font-bold text-slate-900">System Design: Twitter</p>
                <p className="text-[11px] text-slate-500">with Elena R.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 opacity-80">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Tomorrow, 10:00 AM</span>
                <p className="text-xs font-bold text-slate-900">Algo: Graph Traversal</p>
                <p className="text-[11px] text-slate-500">with David C.</p>
              </div>
            </div>

            <button className="w-full py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 transition-colors">
              Schedule New
            </button>
          </div>

          {/* AI Recommendations */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              AI Recommendations
            </h2>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Based on recent code reviews across your mentee cohort.
            </p>

            <div className="space-y-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Assign "Advanced React Patterns"
                </div>
                <p className="text-[11px] text-slate-500">
                  3 mentees struggled with context rendering this week.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
