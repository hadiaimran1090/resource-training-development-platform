import React from 'react';
import { StatCard } from '../../components/ui/StatCard';
import {
  GitBranch,
  BookOpen,
  Layers,
  FileCheck,
  Terminal,
  PieChart,
  PlusCircle,
  Code,
  Cloud,
  Database,
  ChevronRight,
  Filter,
  Sparkles
} from 'lucide-react';

export const TrainingManagerDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Training Manager Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage tracks, monitor performance, and oversee learning objectives.
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm whitespace-nowrap">
          <PlusCircle className="w-4 h-4" />
          Create Training Track
        </button>
      </div>

      {/* KPI Cards (6 columns) */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Tracks"
          value="24"
          icon={GitBranch}
          trend={{ text: '+2 this month', type: 'positive' }}
        />
        <StatCard
          title="Programs"
          value="156"
          icon={BookOpen}
          trend={{ text: '+12% vs last qtr', type: 'positive' }}
        />
        <StatCard
          title="Modules"
          value="842"
          icon={Layers}
          subtitle="Active content"
        />
        <StatCard
          title="Assessments"
          value="320"
          icon={FileCheck}
          subtitle="Across all tracks"
        />
        <StatCard
          title="Challenges"
          value="115"
          icon={Terminal}
          trend={{ text: '+5 recently added', type: 'positive' }}
        />
        <div className="bg-blue-600 text-white rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-blue-100 font-semibold text-xs">
            <span>Avg Completion</span>
            <PieChart className="w-4 h-4 text-blue-200" />
          </div>
          <div className="text-2xl font-extrabold text-white my-1">78%</div>
          <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
            +3.4% YoY
          </div>
        </div>
      </section>

      {/* Main Bento Grid Row 1 */}
      <section className="grid grid-cols-12 gap-6">
        {/* Training Catalog Overview (Span 8) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-slate-900">Training Catalog Overview</h2>
            <button className="text-xs font-bold text-blue-600 hover:underline">View Hierarchy</button>
          </div>

          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 min-h-[220px] flex flex-col justify-center items-center relative overflow-hidden">
            <div className="flex items-center gap-6 z-10">
              <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm w-36 text-center">
                <div className="text-xs font-bold text-blue-600">Frontend Dev</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">3 Tracks</div>
              </div>
              <div className="w-8 h-px bg-slate-300" />
              <div className="flex flex-col gap-2">
                <div className="bg-white p-2 rounded border border-slate-200 shadow-sm w-32 text-center text-xs font-semibold text-slate-700">
                  React Basics
                </div>
                <div className="bg-white p-2 rounded border border-slate-200 shadow-sm w-32 text-center text-xs font-semibold text-slate-700">
                  Adv State
                </div>
              </div>
            </div>

            <div className="w-px h-6 bg-slate-300 my-3" />

            <div className="flex items-center gap-6 z-10">
              <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm w-36 text-center">
                <div className="text-xs font-bold text-purple-600">Backend Eng</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">5 Tracks</div>
              </div>
              <div className="w-8 h-px bg-slate-300" />
              <div className="flex flex-col gap-2">
                <div className="bg-white p-2 rounded border border-slate-200 shadow-sm w-32 text-center text-xs font-semibold text-slate-700">
                  Node.js API
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Performance (Span 4) */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 flex flex-col justify-between">
          <h2 className="text-base font-bold text-slate-900 mb-4">Assessment Performance</h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Global Pass Rate</span>
                <span className="text-slate-900 font-bold">82%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '82%' }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[11px] text-slate-400 font-medium mb-1">Avg Score</div>
                <div className="text-xl font-extrabold text-slate-900">86.4</div>
              </div>
              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                <div className="text-[11px] text-rose-600 font-medium mb-1">Failed Attempts</div>
                <div className="text-xl font-extrabold text-rose-700">124</div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs flex items-start gap-2 leading-relaxed">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                "Cloud Arch" assessment has a 45% fail rate. Review module clarity.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Bento Grid Row 2 */}
      <section className="grid grid-cols-12 gap-6">
        {/* Completion by Track (Span 6) */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
          <h2 className="text-base font-bold text-slate-900 mb-6">Completion by Track</h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700">Full Stack Bootcamp</span>
                <span className="text-slate-900 font-bold">92%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700">DevOps Essentials</span>
                <span className="text-slate-900 font-bold">75%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700">Data Engineering V2</span>
                <span className="text-slate-900 font-bold">60%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-700">UI/UX Foundations</span>
                <span className="text-slate-900 font-bold">45%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-slate-400 h-2.5 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Popular Tracks (Span 6) */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
          <h2 className="text-base font-bold text-slate-900 mb-6">Popular Tracks</h2>

          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Full Stack Bootcamp</h3>
                  <p className="text-[11px] text-slate-400 font-medium">450 active enrollees</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>

            <div className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">AWS Cloud Architect</h3>
                  <p className="text-[11px] text-slate-400 font-medium">320 active enrollees</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>

            <div className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Data Eng V2</h3>
                  <p className="text-[11px] text-slate-400 font-medium">280 active enrollees</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Bento Grid Row 3 Recent Activity Table */}
      <section className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900">Recent Content Activity</h2>
          <button aria-label="Filter" className="text-slate-400 hover:text-slate-600">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                <th className="py-3 px-6">Content Name</th>
                <th className="py-3 px-6">Type</th>
                <th className="py-3 px-6">Last Updated</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-6 font-semibold text-slate-900">React Hooks Deep Dive</td>
                <td className="py-3.5 px-6 text-slate-400">Module</td>
                <td className="py-3.5 px-6 text-slate-400">Today, 10:30 AM</td>
                <td className="py-3.5 px-6">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                    Published
                  </span>
                </td>
                <td className="py-3.5 px-6">
                  <button className="text-blue-600 font-semibold text-xs hover:underline">Edit</button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-6 font-semibold text-slate-900">Q3 Coding Challenge</td>
                <td className="py-3.5 px-6 text-slate-400">Challenge</td>
                <td className="py-3.5 px-6 text-slate-400">Yesterday, 4:15 PM</td>
                <td className="py-3.5 px-6">
                  <span className="px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold text-[10px] border border-amber-200">
                    Draft
                  </span>
                </td>
                <td className="py-3.5 px-6">
                  <button className="text-blue-600 font-semibold text-xs hover:underline">Edit</button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-6 font-semibold text-slate-900">Mid-Level Cloud Arch</td>
                <td className="py-3.5 px-6 text-slate-400">Assessment</td>
                <td className="py-3.5 px-6 text-slate-400">Oct 12, 2023</td>
                <td className="py-3.5 px-6">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                    Published
                  </span>
                </td>
                <td className="py-3.5 px-6">
                  <button className="text-blue-600 font-semibold text-xs hover:underline">Edit</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
