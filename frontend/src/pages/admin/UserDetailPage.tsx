import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { UserDetail } from '../../api/userApi';
import { userApi } from '../../api/userApi';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Briefcase,
  Globe,
  Calendar,
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  History,
} from 'lucide-react';

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('bench');

  const fetchUserDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await userApi.getUserById(Number(id));
      setUser(data);
      setSelectedStatus(data.currentStatus || 'bench');
    } catch (err: any) {
      console.error('Fetch user detail error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetail();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!user) return;
    try {
      setStatusUpdating(true);
      await userApi.updateUser(user.id, { currentStatus: newStatus });
      await fetchUserDetail();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to update resource status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs font-semibold">Loading user profile...</span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">{error || 'User profile not found.'}</h2>
        <button
          onClick={() => navigate('/admin/users')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold text-xs inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Users</span>
        </button>
      </div>
    );
  }

  const roles = user.roles || (user.role ? [user.role] : []);
  const benchRecords = user.benchRecords || [];

  return (
    <div className="space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/users')}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-2 transition shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to User Management</span>
        </button>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xl shadow-md border-2 border-white shrink-0">
              {user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                user.name.charAt(0)
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">{user.name}</h1>
                <code className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold border border-blue-200/60">
                  {user.employeeId}
                </code>
                {user.status === 'active' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Active Account
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
                    <XCircle className="w-3.5 h-3.5 text-slate-400" />
                    Inactive Account
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 font-medium flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {user.email}
                </span>
                {user.phoneNumber && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {user.phoneNumber}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Role Badges */}
          <div className="flex flex-wrap gap-1.5">
            {roles.map((role) => (
              <span
                key={role}
                className="px-3 py-1 rounded-xl text-xs font-extrabold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Card 1: Org Alignment */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Organization & Region</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Assigned Region:</span>
              <span className="font-bold text-slate-800">{user.region || 'Unassigned'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Assigned Practice:</span>
              <span className="font-bold text-slate-800">{user.practice || 'Unassigned'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Joining Date:</span>
              <span className="font-bold text-slate-800">
                {user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Info Card 2: Professional Profile */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span>Resource Details</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Designation:</span>
              <span className="font-bold text-slate-800">{user.designation || 'Engineering Professional'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Experience:</span>
              <span className="font-bold text-slate-800">{user.experienceYears || 1.0} Years</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Total Bench Time:</span>
              <span className="font-extrabold text-blue-600">{user.maxBenchDays || 0} Days</span>
            </div>
          </div>
        </div>

        {/* Info Card 3: Admin Status Management */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Manage Resource Status</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Employment Track Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  handleStatusChange(e.target.value);
                }}
                disabled={statusUpdating}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="bench">Available on Bench</option>
                <option value="assigned">Assigned to Client Project</option>
                <option value="training">Active in Training Track</option>
              </select>
            </div>

            {statusUpdating && (
              <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Updating status & recording bench history...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bench History Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-base text-slate-900">Dynamic Bench History Timeline</h3>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-700">
            Total: {user.maxBenchDays || 0} Days
          </span>
        </div>

        {benchRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-100">
            No bench history periods recorded for this user account.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benchRecords.map((record) => (
              <div
                key={record.id}
                className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-start justify-between gap-3 text-xs hover:border-blue-300 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      {new Date(record.startDate).toLocaleDateString()} —{' '}
                      {record.endDate ? new Date(record.endDate).toLocaleDateString() : 'Present (Active Bench)'}
                    </span>
                  </div>
                  <p className="text-slate-500 font-medium">Bench period</p>
                </div>

                <div className="shrink-0 text-right">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800">
                    {record.durationDays} Days
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
