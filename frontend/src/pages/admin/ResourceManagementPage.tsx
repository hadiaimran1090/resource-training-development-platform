import React, { useState, useEffect } from 'react';
import type { ResourceProfile, CreateResourceData } from '../../api/resourceApi';
import { resourceApi } from '../../api/resourceApi';
import type { Region } from '../../api/regionApi';
import { regionApi } from '../../api/regionApi';
import type { Practice } from '../../api/practiceApi';
import { practiceApi } from '../../api/practiceApi';
import type { UserDetail } from '../../api/userApi';
import { userApi } from '../../api/userApi';
import { Users, Plus, Edit2, Search, Loader2, AlertCircle, Briefcase, Award, Globe, Building, CheckCircle2, Clock } from 'lucide-react';

export const ResourceManagementPage: React.FC = () => {
  const [resources, setResources] = useState<ResourceProfile[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceProfile | null>(null);

  // Create/Edit Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('Senior Software Engineer');
  const [experienceYears, setExperienceYears] = useState<number>(2.0);
  const [regionId, setRegionId] = useState<number | ''>('');
  const [practiceId, setPracticeId] = useState<number | ''>('');
  const [regionalLeadId, setRegionalLeadId] = useState<number | ''>('');
  const [currentStatus, setCurrentStatus] = useState<'assigned' | 'bench' | 'training'>('bench');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resData, regData, pracData, userData] = await Promise.all([
        resourceApi.getResources(),
        regionApi.getRegions(),
        practiceApi.getPractices(),
        userApi.getUsers(),
      ]);
      setResources(Array.isArray(resData) ? resData : []);
      setRegions(Array.isArray(regData) ? regData : []);
      setPractices(Array.isArray(pracData) ? pracData : []);
      setUsers(Array.isArray(userData) ? userData : []);
      setError(null);
    } catch (err: any) {
      setError('Failed to load resources catalog.');
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingResource(null);
    setName('');
    setEmail('');
    setPassword('');
    setEmployeeId('');
    setDesignation('Software Engineer');
    setExperienceYears(2.0);
    setRegionId('');
    setPracticeId('');
    setRegionalLeadId('');
    setCurrentStatus('bench');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (res: ResourceProfile) => {
    setEditingResource(res);
    setName(res.user_name);
    setEmail(res.user_email);
    setPassword('');
    setEmployeeId(res.employee_id);
    setDesignation(res.designation);
    setExperienceYears(res.experience_years || 1.0);
    setRegionId(res.region_id || '');
    setPracticeId(res.practice_id || '');
    setRegionalLeadId(res.regional_lead_id || '');
    setCurrentStatus(res.current_status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      if (editingResource) {
        await resourceApi.updateResource(editingResource.id, {
          designation,
          experience_years: experienceYears,
          region_id: regionId ? Number(regionId) : null,
          practice_id: practiceId ? Number(practiceId) : null,
          regional_lead_id: regionalLeadId ? Number(regionalLeadId) : null,
          current_status: currentStatus,
        });
      } else {
        if (!name.trim() || !email.trim() || !password.trim() || !employeeId.trim()) {
          alert('Name, Email, Password, and Employee ID are required for creating a resource account.');
          setSubmitting(false);
          return;
        }

        const payload: CreateResourceData = {
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          employeeId: employeeId.trim(),
          designation: designation.trim(),
          experience_years: experienceYears,
          region_id: regionId ? Number(regionId) : null,
          practice_id: practiceId ? Number(practiceId) : null,
          regional_lead_id: regionalLeadId ? Number(regionalLeadId) : null,
          current_status: currentStatus,
        };

        await resourceApi.createResource(payload);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save resource profile.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredResources = Array.isArray(resources)
    ? resources.filter((r) => {
        const matchesSearch =
          r.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.designation.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || r.current_status === statusFilter;
        return matchesSearch && matchesStatus;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Engineering Resources</h1>
            <p className="text-xs text-slate-500 font-medium">Manage engineering resource profiles, practice assignments, and bench status.</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Resource</span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resource by name, designation, ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="bench">Bench</option>
            <option value="assigned">Assigned</option>
            <option value="training">Training</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs font-semibold">Loading resources...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 text-xs font-semibold flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            No resources found matching filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Resource Name</th>
                  <th className="px-6 py-3.5">Designation & Exp</th>
                  <th className="px-6 py-3.5">Region & Practice</th>
                  <th className="px-6 py-3.5">Resource Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredResources.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-600 text-white font-bold flex items-center justify-center text-xs border border-slate-200 shrink-0">
                          {res.profile_image_url ? (
                            <img src={res.profile_image_url} alt={res.user_name} className="w-full h-full object-cover" />
                          ) : (
                            res.user_name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{res.user_name}</div>
                          <div className="text-[10px] text-slate-400">{res.user_email} • <code className="bg-slate-100 px-1 rounded">{res.employee_id}</code></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                        <span>{res.designation}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Award className="w-3 h-3 text-slate-400" />
                        <span>{res.experience_years} Years Exp</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          <Globe className="w-2.5 h-2.5" />
                          {res.region_name || 'No Region'}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 ml-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                          <Building className="w-2.5 h-2.5" />
                          {res.practice_name || 'No Practice'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 w-max ${
                          res.current_status === 'assigned'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : res.current_status === 'training'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                        }`}
                      >
                        {res.current_status === 'assigned' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>ASSIGNED</span>
                          </>
                        ) : res.current_status === 'training' ? (
                          <>
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>TRAINING</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-blue-500" />
                            <span>BENCH</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(res)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Resource Profile"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-base text-slate-900">
              {editingResource ? `Edit Resource Profile (${editingResource.user_name})` : 'Create New Resource Profile'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingResource && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rachel Resource"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="rachel@rtdp.com"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Employee ID *</label>
                      <input
                        type="text"
                        required
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="RTDP-RES-101"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Initial Password *</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Designation *</label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Experience (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Assign Region</label>
                  <select
                    value={regionId}
                    onChange={(e) => setRegionId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="">Select Region...</option>
                    {regions.map((reg) => (
                      <option key={reg.id} value={reg.id}>
                        {reg.name} ({reg.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Assign Practice</label>
                  <select
                    value={practiceId}
                    onChange={(e) => setPracticeId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="">Select Practice...</option>
                    {practices.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Assign Regional Lead</label>
                  <select
                    value={regionalLeadId}
                    onChange={(e) => setRegionalLeadId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="">Select Lead...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Resource Employment Status</label>
                  <select
                    value={currentStatus}
                    onChange={(e) => setCurrentStatus(e.target.value as 'assigned' | 'bench' | 'training')}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="bench">Bench</option>
                    <option value="assigned">Assigned to Project</option>
                    <option value="training">Training Track</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingResource ? 'Save Profile Changes' : 'Create Resource'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
