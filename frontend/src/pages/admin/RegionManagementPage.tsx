import React, { useState, useEffect } from 'react';
import type { Region, CreateRegionData } from '../../api/regionApi';
import { regionApi } from '../../api/regionApi';
import type { Practice } from '../../api/practiceApi';
import { practiceApi } from '../../api/practiceApi';
import { Globe, Plus, Edit2, CheckCircle2, XCircle, Search, Loader2, AlertCircle, Users, Building } from 'lucide-react';

export const RegionManagementPage: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [allPractices, setAllPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [selectedPracticeIds, setSelectedPracticeIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchRegionsAndPractices = async () => {
    try {
      setLoading(true);
      const [regionsData, practicesData] = await Promise.all([
        regionApi.getRegions(),
        practiceApi.getPractices(),
      ]);
      setRegions(Array.isArray(regionsData) ? regionsData : []);
      setAllPractices(Array.isArray(practicesData) ? practicesData : []);
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch region data.');
      setRegions([]);
      setAllPractices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegionsAndPractices();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingRegion(null);
    setName('');
    setCode('');
    setStatus('active');
    setSelectedPracticeIds([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (reg: Region) => {
    setEditingRegion(reg);
    setName(reg.name);
    setCode(reg.code);
    setStatus(reg.status);
    setSelectedPracticeIds(reg.practices ? reg.practices.map((p) => p.id) : []);
    setIsModalOpen(true);
  };

  const togglePracticeSelection = (pId: number) => {
    setSelectedPracticeIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    try {
      setSubmitting(true);
      const payload: CreateRegionData = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        status,
        practiceIds: selectedPracticeIds,
      };

      if (editingRegion) {
        await regionApi.updateRegion(editingRegion.id, payload);
      } else {
        await regionApi.createRegion(payload);
      }

      setIsModalOpen(false);
      fetchRegionsAndPractices();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Operation failed.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (reg: Region) => {
    const newStatus = reg.status === 'active' ? 'inactive' : 'active';
    try {
      await regionApi.toggleRegionStatus(reg.id, newStatus);
      fetchRegionsAndPractices();
    } catch (err: any) {
      alert('Failed to toggle status.');
    }
  };

  const filteredRegions = Array.isArray(regions)
    ? regions.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Regions Management</h1>
            <p className="text-xs text-slate-500 font-medium">Manage enterprise operational regions and regional practice associations.</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Region</span>
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
            placeholder="Search region by name or code..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs font-semibold">Loading regions...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-500 text-xs font-semibold flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : filteredRegions.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-medium">
            No regions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Region Name</th>
                  <th className="px-6 py-3.5">Region Code</th>
                  <th className="px-6 py-3.5">Associated Practices</th>
                  <th className="px-6 py-3.5">Assigned Users</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredRegions.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{reg.name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px] text-slate-700 font-bold">
                        {reg.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {reg.practices && reg.practices.length > 0 ? (
                          reg.practices.map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60"
                            >
                              <Building className="w-2.5 h-2.5" />
                              {p.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No practices linked</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{reg.total_users || 0} users</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(reg)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 transition-all ${
                          reg.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {reg.status === 'active' ? (
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
                        onClick={() => handleOpenEditModal(reg)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Region"
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
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-base text-slate-900">
              {editingRegion ? 'Edit Region' : 'Add New Region'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Region Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. North America"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Region Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. NA"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Multiple Practices Selection Checklist */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Associate Practices to Region</label>
                <div className="max-h-36 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  {allPractices.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic">No practices created yet.</div>
                  ) : (
                    allPractices.map((prac) => (
                      <label key={prac.id} className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPracticeIds.includes(prac.id)}
                          onChange={() => togglePracticeSelection(prac.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{prac.name}</span>
                      </label>
                    ))
                  )}
                </div>
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
                  <span>{editingRegion ? 'Save Changes' : 'Create Region'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
