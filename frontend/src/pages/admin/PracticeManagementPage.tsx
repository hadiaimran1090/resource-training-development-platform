import React, { useState, useEffect } from 'react';
import type { Practice, CreatePracticeData } from '../../api/practiceApi';
import { practiceApi } from '../../api/practiceApi';
import type { UserDetail } from '../../api/userApi';
import { userApi } from '../../api/userApi';
import { Building, Plus, Edit2, CheckCircle2, XCircle, Search, Loader2, AlertCircle, Users, UserCheck } from 'lucide-react';

export const PracticeManagementPage: React.FC = () => {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [leadUsers, setLeadUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPractice, setEditingPractice] = useState<Practice | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leadUserId, setLeadUserId] = useState<number | ''>('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [practicesData, usersData] = await Promise.all([
        practiceApi.getPractices(),
        userApi.getUsers(),
      ]);
      setPractices(Array.isArray(practicesData) ? practicesData : []);
      setLeadUsers(Array.isArray(usersData) ? usersData : []);
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch practice data.');
      setPractices([]);
      setLeadUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingPractice(null);
    setName('');
    setDescription('');
    setLeadUserId('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prac: Practice) => {
    setEditingPractice(prac);
    setName(prac.name);
    setDescription(prac.description || '');
    setLeadUserId(prac.lead_user_id || '');
    setStatus(prac.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      const payload: CreatePracticeData = {
        name: name.trim(),
        description: description.trim(),
        lead_user_id: leadUserId ? Number(leadUserId) : null,
        status,
      };

      if (editingPractice) {
        await practiceApi.updatePractice(editingPractice.id, payload);
      } else {
        await practiceApi.createPractice(payload);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Operation failed.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (prac: Practice) => {
    const newStatus = prac.status === 'active' ? 'inactive' : 'active';
    try {
      await practiceApi.togglePracticeStatus(prac.id, newStatus);
      fetchData();
    } catch (err: any) {
      alert('Failed to toggle status.');
    }
  };

  const filteredPractices = Array.isArray(practices)
    ? practices.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Practices Management</h1>
            <p className="text-xs text-slate-500 font-medium">Manage technical practices, descriptions, and practice leads.</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Practice</span>
        </button>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search practice by name or description..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs font-semibold">Loading practices...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 text-xs font-semibold flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : filteredPractices.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            No practices found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Practice Name</th>
                  <th className="px-6 py-3.5">Assigned Practice Lead</th>
                  <th className="px-6 py-3.5">Total Users</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredPractices.map((prac) => (
                  <tr key={prac.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{prac.name}</div>
                      {prac.description && (
                        <div className="text-[11px] text-slate-400 max-w-xs truncate">{prac.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {prac.lead_name ? (
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          <div>
                            <div className="font-bold text-slate-800">{prac.lead_name}</div>
                            <div className="text-[10px] text-slate-400">{prac.lead_email}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{prac.total_users || 0} users</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(prac)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 transition-all ${
                          prac.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {prac.status === 'active' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>ACTIVE</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>INACTIVE</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(prac)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Practice"
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
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">
              {editingPractice ? 'Edit Practice' : 'Add New Practice'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Practice Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Software Engineering"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Practice overview & domain responsibilities..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Assign Practice Lead (Optional)</label>
                <select
                  value={leadUserId}
                  onChange={(e) => setLeadUserId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="">Select User as Practice Lead...</option>
                  {leadUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
                  <span>{editingPractice ? 'Save Changes' : 'Create Practice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
