import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { UserDetail } from '../../api/userApi';
import { userApi } from '../../api/userApi';
import { SkillsMatrixSection } from '../../components/profile/SkillsMatrixSection';
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
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileCheck,
  Gauge,
} from 'lucide-react';

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('bench');
  const [expandedBenchId, setExpandedBenchId] = useState<number | null>(null);

  const fetchUserDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await userApi.getUserById(Number(id));
      setUser(data);
      setSelectedStatus(data.currentStatus || 'bench');
      // Auto-expand first bench record if active
      if (data.benchRecords && data.benchRecords.length > 0) {
        setExpandedBenchId(data.benchRecords[0].id);
      }
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
          onClick={() => navigate(-1)}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-2 transition shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
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

        {/* Info Card 3: Admin Status Management (Restricted to Exactly 2 Choices: Bench / Assigned to Project) */}
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
                <option value="bench">Bench</option>
                <option value="assigned">Assigned to Project</option>
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

      {/* Expandable Bench History Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-base text-slate-900">Bench History & Period Breakdown</h3>
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
          <div className="space-y-3">
            {benchRecords.map((record) => {
              const isExpanded = expandedBenchId === record.id;
              const isOngoing = !record.endDate;

              return (
                <div
                  key={record.id}
                  className={`rounded-xl border transition-all overflow-hidden ${
                    isExpanded ? 'border-blue-300 bg-blue-50/20 shadow-xs' : 'border-slate-200/80 bg-slate-50/80 hover:border-slate-300'
                  }`}
                >
                  {/* Bench Period Header */}
                  <div
                    onClick={() => setExpandedBenchId(isExpanded ? null : record.id)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${isOngoing ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-black text-slate-900 text-xs">
                          <span>
                            {new Date(record.startDate).toLocaleDateString()} —{' '}
                            {record.endDate ? new Date(record.endDate).toLocaleDateString() : 'Ongoing (Active Bench)'}
                          </span>
                          {isOngoing && (
                            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          Duration: <strong className="text-slate-800">{record.durationDays} Days</strong> • Click to {isExpanded ? 'collapse' : 'expand'} period metrics
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800">
                        {record.durationDays} Days
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded Bench Details */}
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-blue-100 space-y-4 mt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        {/* Metric 1: Readiness Score */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase">
                            <Gauge className="w-3.5 h-3.5 text-blue-600" />
                            <span>Readiness Score</span>
                          </div>
                          <div className="text-lg font-black text-slate-900">
                            {record.readinessScore || 75}%
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">As of current bench period</p>
                        </div>

                        {/* Metric 2: Assessment Attempts */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase">
                            <FileCheck className="w-3.5 h-3.5 text-purple-600" />
                            <span>Assessment Attempts</span>
                          </div>
                          <div className="text-lg font-black text-slate-900">
                            {record.assessmentAttemptsCount || 0} Attempts
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Taken during this bench period</p>
                        </div>

                        {/* Metric 3: Training Assignments */}
                        <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Training Assignments</span>
                          </div>
                          <div className="text-lg font-black text-slate-900">
                            {record.trainingHistory ? record.trainingHistory.length : 0} Tracks
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Assigned during bench period</p>
                        </div>
                      </div>

                      {/* Training History List */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                          <span>Training History for this Bench Period</span>
                        </h4>

                        {!record.trainingHistory || record.trainingHistory.length === 0 ? (
                          <p className="text-xs text-slate-400 italic bg-white p-3 rounded-lg border border-slate-100">
                            No training assignments recorded during this specific bench period.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {record.trainingHistory.map((th) => (
                              <div key={th.id} className="p-2.5 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-slate-900">{th.trackName}</span>
                                  <span className="text-[10px] text-slate-400 ml-2">Started: {new Date(th.startDate).toLocaleDateString()}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${th.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                  {th.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Skills belong to the resource profile, whose ID can differ from the user ID. */}
      {user.resourceId ? (
        <SkillsMatrixSection
          resourceId={user.resourceId}
          resourceUserId={user.id}
        />
      ) : (
        <div className="mt-6 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs font-medium">
          This user does not have a resource profile, so a skills matrix cannot be shown.
        </div>
      )}
    </div>
  );
};
