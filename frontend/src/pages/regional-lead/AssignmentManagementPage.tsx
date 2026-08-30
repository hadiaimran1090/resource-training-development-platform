import React, { useState, useEffect } from 'react';
import type { AssignmentDetail, AssignableResource } from '../../api/assignmentApi';
import { assignmentApi } from '../../api/assignmentApi';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  UserCheck,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  Building,
  User,
  ShieldAlert,
} from 'lucide-react';

export const AssignmentManagementPage: React.FC = () => {
  const [assignments, setAssignments] = useState<AssignmentDetail[]>([]);
  const [assignableResources, setAssignableResources] = useState<AssignableResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentDetail | null>(null);

  // Form State
  const [resourceId, setResourceId] = useState<number | ''>('');
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'active' | 'completed'>('active');

  const [modalError, setModalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [asgData, resData] = await Promise.all([
        assignmentApi.getAssignments(),
        assignmentApi.getAssignableResources(),
      ]);
      setAssignments(Array.isArray(asgData) ? asgData : []);
      setAssignableResources(Array.isArray(resData) ? resData : []);
    } catch (err: any) {
      console.error('Fetch assignment data error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load assignment records.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingAssignment(null);
    setResourceId(assignableResources.length > 0 ? assignableResources[0].resource_id : '');
    setClientName('');
    setProjectName('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setStatus('active');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (asg: AssignmentDetail) => {
    setEditingAssignment(asg);
    setResourceId(asg.resource_id);
    setClientName(asg.client_name);
    setProjectName(asg.project_name || '');
    setStartDate(asg.start_date ? asg.start_date.split('T')[0] : '');
    setEndDate(asg.end_date ? asg.end_date.split('T')[0] : '');
    setStatus(asg.status === 'completed' ? 'completed' : 'active');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!resourceId) {
      setModalError('Please select a Resource.');
      return;
    }
    if (!clientName.trim()) {
      setModalError('Client Name is required.');
      return;
    }
    if (!startDate) {
      setModalError('Start Date is required.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingAssignment) {
        await assignmentApi.updateAssignment(editingAssignment.id, {
          client_name: clientName.trim(),
          project_name: projectName.trim(),
          start_date: startDate,
          end_date: endDate || null,
          status,
        });
      } else {
        await assignmentApi.createAssignment({
          resource_id: Number(resourceId),
          client_name: clientName.trim(),
          project_name: projectName.trim(),
          start_date: startDate,
          end_date: endDate || null,
          status,
        });
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setModalError(err.response?.data?.message || err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this client assignment?')) return;
    try {
      setDeletingId(id);
      await assignmentApi.deleteAssignment(id);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete assignment.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredAssignments = Array.isArray(assignments)
    ? assignments.filter((a) => {
        const matchesSearch =
          a.resource_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.project_name && a.project_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          a.resource_employee_id?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
    : [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto selection:bg-blue-500 selection:text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Client & Project Assignments
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Assign resources in your region to client deployments, set timelines, and manage completion status.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Client Assignment</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by resource, client, or project..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-600 mr-1">Status:</span>
          {(['all', 'active', 'completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {error ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="text-xs font-bold text-rose-600">{error}</p>
            <button
              onClick={fetchData}
              className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading assignments directory...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <Briefcase className="w-10 h-10 text-slate-300" />
            <h3 className="text-sm font-bold text-slate-700">No assignments found</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              No client assignments match your current search or status filter in your region.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Assigned Resource</th>
                  <th className="py-3.5 px-4">Client & Project</th>
                  <th className="py-3.5 px-4">Start Date</th>
                  <th className="py-3.5 px-4">End Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {filteredAssignments.map((asg) => (
                  <tr key={asg.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Resource Details */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-100">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{asg.resource_name}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {asg.designation || 'Resource'} • <code className="font-mono bg-slate-100 px-1 rounded">{asg.resource_employee_id}</code>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Client & Project */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-blue-600" />
                        {asg.client_name}
                      </div>
                      {asg.project_name && (
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {asg.project_name}
                        </div>
                      )}
                    </td>

                    {/* Start Date */}
                    <td className="py-4 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {asg.start_date ? new Date(asg.start_date).toLocaleDateString() : '—'}
                      </div>
                    </td>

                    {/* End Date */}
                    <td className="py-4 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {asg.end_date ? new Date(asg.end_date).toLocaleDateString() : <span className="text-blue-600 font-semibold text-[11px]">Ongoing (Active)</span>}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      {asg.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Active Assignment
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <UserCheck className="w-3 h-3 text-slate-500" />
                          Completed
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(asg)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Assignment"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(asg.id)}
                          disabled={deletingId === asg.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete Assignment"
                        >
                          {deletingId === asg.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-6 pt-20 md:pt-24 pb-10 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {editingAssignment ? 'Edit Client Assignment' : 'Create Client Assignment'}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitModal} className="p-6 overflow-y-auto space-y-4">
              {modalError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-3 text-rose-700 text-xs font-medium">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Resource Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Select Resource <span className="text-rose-500">*</span>
                </label>
                <select
                  disabled={Boolean(editingAssignment)}
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60"
                >
                  <option value="">Choose Resource in Region...</option>
                  {assignableResources.map((res) => (
                    <option key={res.resource_id} value={res.resource_id}>
                      {res.name} ({res.employee_id}) — {res.designation} [{res.current_status.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Client Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Acme Corp / Global Bank"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Project Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Project Name / Scope
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Fintech Platform Modernization"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    End Date {status === 'completed' && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Status Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Assignment Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'completed')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  <option value="active">Active Assignment (Resource Deployed)</option>
                  <option value="completed">Completed (Return Resource to Bench)</option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingAssignment ? 'Update Assignment' : 'Deploy Resource'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
