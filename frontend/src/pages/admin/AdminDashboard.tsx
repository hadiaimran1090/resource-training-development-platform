import React from 'react';
import { StatCard } from '../../components/ui/StatCard';
import {
  Users,
  UserCheck,
  Globe,
  Building,
  AlertTriangle,
  MapPin,
  Shield,
  FilePlus,
  RefreshCw,
  Filter,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const userDistData = [
  { name: 'Engineering', value: 45, color: '#004ac6' },
  { name: 'Consulting', value: 30, color: '#645efb' },
  { name: 'Management', value: 25, color: '#bc4800' },
];

export const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-end items-center gap-3 mb-2">
        <button className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2">
          Export Report
        </button>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-2">
          + Add User
        </button>
      </div>

      {/* KPI Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Users"
          value="12,450"
          icon={Users}
          trend={{ text: '+4.2% vs last mo', type: 'positive' }}
        />
        <StatCard
          title="Active Users"
          value="8,920"
          icon={UserCheck}
          trend={{ text: '+1.1%', type: 'positive' }}
        />
        <StatCard
          title="Active Regions"
          value="24"
          icon={Globe}
          subtitle="Global Coverage"
        />
        <StatCard
          title="Active Practices"
          value="18"
          icon={Building}
          subtitle="Across all regions"
        />
        <div className="col-span-2 md:col-span-4 lg:col-span-1 bg-gradient-to-br from-rose-50 to-white rounded-xl p-5 border border-rose-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>System Alerts</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 my-1">3 Critical</div>
          <button className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
            Review Alerts <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Main Grid */}
      <section className="grid grid-cols-12 gap-6">
        {/* Left Column (Span 4) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* User Distribution Donut */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
            <h2 className="text-base font-bold text-slate-900 mb-6">User Distribution</h2>

            <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userDistData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {userDistData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-slate-900 leading-none">12.4k</span>
                <span className="text-xs font-semibold text-slate-400 mt-1">Users</span>
              </div>
            </div>

            <div className="space-y-3 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#004ac6] rounded-sm" />
                  <span className="text-slate-700">Engineering</span>
                </div>
                <span className="text-slate-900 font-bold">45%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#645efb] rounded-sm" />
                  <span className="text-slate-700">Consulting</span>
                </div>
                <span className="text-slate-900 font-bold">30%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#bc4800] rounded-sm" />
                  <span className="text-slate-700">Management</span>
                </div>
                <span className="text-slate-900 font-bold">25%</span>
              </div>
            </div>
          </div>

          {/* Quick Management */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Quick Management</h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-700 hover:text-blue-600 transition-colors">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-semibold">New Region</span>
              </button>
              <button className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-700 hover:text-blue-600 transition-colors">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-semibold">New Role</span>
              </button>
              <button className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-700 hover:text-blue-600 transition-colors">
                <FilePlus className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-semibold">Add Skill</span>
              </button>
              <button className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-700 hover:text-blue-600 transition-colors">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-semibold">Backup</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (Span 8) Audit Log */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Activity / Audit Log</h2>
              <p className="text-xs text-slate-400 mt-0.5">System events from the last 24 hours.</p>
            </div>
            <button aria-label="Filter" className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                  <th className="py-3 px-6">User</th>
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">Entity</th>
                  <th className="py-3 px-6">Time</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px]">
                      SJ
                    </div>
                    Sarah Jenkins
                  </td>
                  <td className="py-3.5 px-6">Updated Permissions</td>
                  <td className="py-3.5 px-6 font-medium text-slate-500">Role: Sr. Engineer</td>
                  <td className="py-3.5 px-6 text-slate-400">10 mins ago</td>
                  <td className="py-3.5 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Success
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                      SYS
                    </div>
                    System Auto
                  </td>
                  <td className="py-3.5 px-6">Created Backup</td>
                  <td className="py-3.5 px-6 font-medium text-slate-500">Database: EU_West</td>
                  <td className="py-3.5 px-6 text-slate-400">1 hour ago</td>
                  <td className="py-3.5 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Success
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                      MC
                    </div>
                    Mike Chen
                  </td>
                  <td className="py-3.5 px-6">Failed Login Attempt</td>
                  <td className="py-3.5 px-6 font-medium text-slate-500">User Account</td>
                  <td className="py-3.5 px-6 text-slate-400">2 hours ago</td>
                  <td className="py-3.5 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600" /> Failed
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-[10px]">
                      AL
                    </div>
                    Anna Lee
                  </td>
                  <td className="py-3.5 px-6">Added New Region</td>
                  <td className="py-3.5 px-6 font-medium text-slate-500">Region: APAC-South</td>
                  <td className="py-3.5 px-6 text-slate-400">3 hours ago</td>
                  <td className="py-3.5 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Success
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px]">
                      SJ
                    </div>
                    Sarah Jenkins
                  </td>
                  <td className="py-3.5 px-6">Deleted User</td>
                  <td className="py-3.5 px-6 font-medium text-slate-500">User ID: 8992</td>
                  <td className="py-3.5 px-6 text-slate-400">5 hours ago</td>
                  <td className="py-3.5 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Pending
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                      SYS
                    </div>
                    System Auto
                  </td>
                  <td className="py-3.5 px-6">Sync Data</td>
                  <td className="py-3.5 px-6 font-medium text-slate-500">Active Directory</td>
                  <td className="py-3.5 px-6 text-slate-400">6 hours ago</td>
                  <td className="py-3.5 px-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Success
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 flex justify-center">
            <button className="text-blue-600 hover:underline font-semibold text-xs">
              View Full Log
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
