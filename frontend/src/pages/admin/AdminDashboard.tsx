import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../components/ui/StatCard';
import {
  Users,
  UserCheck,
  Globe,
  Building,
  AlertTriangle,
  Filter,
  ArrowRight,
  Loader2,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { userApi, type DashboardStatsData } from '../../api/userApi';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await userApi.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load dashboard statistics from server.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold">Loading live system statistics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-6 flex flex-col items-center text-center gap-3 max-w-lg mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <div>
          <h3 className="font-bold text-base">Error Loading Dashboard</h3>
          <p className="text-xs mt-1 text-rose-600">{error || 'Could not fetch database metrics.'}</p>
        </div>
        <button
          onClick={fetchDashboardStats}
          className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try Again
        </button>
      </div>
    );
  }

  const totalUsersDisplay = stats.totalUsers >= 1000 
    ? `${(stats.totalUsers / 1000).toFixed(1)}k` 
    : stats.totalUsers.toString();

  return (
    <div className="space-y-6">
      {/* KPI Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend={{ text: `${stats.activeUsers} active accounts`, type: 'positive' }}
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers.toLocaleString()}
          icon={UserCheck}
          trend={{ text: `${stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total`, type: 'positive' }}
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          title="Active Regions"
          value={stats.activeRegions.toString()}
          icon={Globe}
          subtitle="Click to Manage Regions"
          onClick={() => navigate('/admin/regions')}
        />
        <StatCard
          title="Active Practices"
          value={stats.activePractices.toString()}
          icon={Building}
          subtitle="Click to Manage Practices"
          onClick={() => navigate('/admin/practices')}
        />
        <div className="col-span-2 md:col-span-4 lg:col-span-1 bg-gradient-to-br from-rose-50 to-white rounded-xl p-5 border border-rose-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>System Alerts</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 my-1">
            {stats.systemAlertsCount} {stats.systemAlertsCount === 1 ? 'Alert' : 'Alerts'}
          </div>
          <button 
            onClick={() => navigate('/admin/training-catalog')}
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
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
            <h2 className="text-base font-bold text-slate-900 mb-6">User Distribution (Practices)</h2>

            {stats.userDistribution.length > 0 ? (
              <>
                <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.userDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {stats.userDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold text-slate-900 leading-none">{totalUsersDisplay}</span>
                    <span className="text-xs font-semibold text-slate-400 mt-1">Users</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs font-semibold">
                  {stats.userDistribution.map((dist, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: dist.color }} />
                        <span className="text-slate-700">{dist.name}</span>
                      </div>
                      <span className="text-slate-900 font-bold">{dist.percentage}% ({dist.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-xs text-slate-400 py-8">
                No distribution data available yet.
              </div>
            )}
          </div>

          {/* Quick Management */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Quick Management</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/admin/regions')}
                className="p-4 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <Globe className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-semibold">Manage Regions</span>
              </button>
              <button
                onClick={() => navigate('/admin/practices')}
                className="p-4 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <Building className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-semibold">Manage Practices</span>
              </button>
              <button
                onClick={() => navigate('/admin/resources')}
                className="p-4 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-semibold">Resources</span>
              </button>
              <button
                onClick={() => navigate('/admin/users')}
                className="p-4 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <UserCheck className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-semibold">User Accounts</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (Span 8) Audit Log */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Activity / Audit Log</h2>
              <p className="text-xs text-slate-400 mt-0.5">Live system events & operations from database.</p>
            </div>
            <button 
              aria-label="Refresh Audit Log" 
              onClick={fetchDashboardStats}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {stats.recentActivities.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                    <th className="py-3 px-6">User</th>
                    <th className="py-3 px-6">Action</th>
                    <th className="py-3 px-6">Entity / Details</th>
                    <th className="py-3 px-6">Time</th>
                    <th className="py-3 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {stats.recentActivities.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                          {act.userInitials}
                        </div>
                        {act.userName}
                      </td>
                      <td className="py-3.5 px-6 font-medium">{act.action}</td>
                      <td className="py-3.5 px-6 font-medium text-slate-500">{act.entity}</td>
                      <td className="py-3.5 px-6 text-slate-400 whitespace-nowrap">{act.time}</td>
                      <td className="py-3.5 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> {act.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No recent activity logs recorded in database.
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 flex justify-center">
            <button 
              onClick={() => navigate('/admin/audit-log')}
              className="text-blue-600 hover:underline font-semibold text-xs cursor-pointer"
            >
              View Full Log
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
