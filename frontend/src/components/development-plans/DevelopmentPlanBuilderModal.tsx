import React, { useState, useEffect } from 'react';
import { createDevelopmentPlan } from '../../api/developmentPlanApi';
import type { DevelopmentPlanItem } from '../../api/developmentPlanApi';
import { skillApi } from '../../api/skillApi';
import type { RoleProfile } from '../../types/skill';
import { trainingCatalogApi } from '../../api/trainingCatalogApi';
import type { TrainingTrack } from '../../types/trainingCatalog';
import { resourceApi } from '../../api/resourceApi';
import type { ResourceProfile } from '../../api/resourceApi';
import { X, Plus, Trash2, Calendar, Target, BookOpen, AlertCircle } from 'lucide-react';

interface DevelopmentPlanBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated?: () => void;
  presetResourceId?: number;
}

export const DevelopmentPlanBuilderModal: React.FC<DevelopmentPlanBuilderModalProps> = ({
  isOpen,
  onClose,
  onPlanCreated,
  presetResourceId,
}) => {
  const [resources, setResources] = useState<ResourceProfile[]>([]);
  const [roleProfiles, setRoleProfiles] = useState<RoleProfile[]>([]);
  const [tracks, setTracks] = useState<TrainingTrack[]>([]);

  const [selectedResourceId, setSelectedResourceId] = useState<number>(presetResourceId || 0);
  const [selectedRoleProfileId, setSelectedRoleProfileId] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const [items, setItems] = useState<DevelopmentPlanItem[]>([
    { week_number: 1, focus_area: 'Advanced Java & Spring Boot Core', training_track_id: null },
    { week_number: 2, focus_area: 'React Frontend & REST Integration', training_track_id: null },
    { week_number: 3, focus_area: 'AWS Cloud Infrastructure & Docker', training_track_id: null },
    { week_number: 4, focus_area: 'System Design Architecture & Mock Interviews', training_track_id: null },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDropdowns();
    }
  }, [isOpen]);

  useEffect(() => {
    if (presetResourceId) {
      setSelectedResourceId(presetResourceId);
    }
  }, [presetResourceId]);

  const loadDropdowns = async () => {
    try {
      const [resData, rpData, trackData] = await Promise.all([
        resourceApi.getResources(),
        skillApi.getRoleProfiles(),
        trainingCatalogApi.getTracks(),
      ]);
      setResources(resData || []);
      setRoleProfiles(rpData || []);
      setTracks(trackData || []);
      if (!selectedRoleProfileId && rpData?.length > 0) {
        setSelectedRoleProfileId(rpData[0].id);
      }
      if (!selectedResourceId && resData?.length > 0 && !presetResourceId) {
        setSelectedResourceId(resData[0].id);
      }
    } catch (err) {
      console.error('Failed to load dropdowns for dev plan builder:', err);
    }
  };

  const handleAddItem = () => {
    const nextWeek = items.length + 1;
    setItems([...items, { week_number: nextWeek, focus_area: '', training_track_id: null }]);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index).map((item, i) => ({
      ...item,
      week_number: i + 1,
    }));
    setItems(updated);
  };

  const handleItemChange = (index: number, field: keyof DevelopmentPlanItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResourceId || !selectedRoleProfileId || !startDate || !endDate) {
      setErrorMsg('Please select a Resource, Target Role Profile, and valid dates.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await createDevelopmentPlan({
        resource_id: selectedResourceId,
        target_role_profile_id: selectedRoleProfileId,
        start_date: startDate,
        end_date: endDate,
        items,
      });
      onPlanCreated?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to create development plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl p-6 relative max-h-[90vh] flex flex-col text-slate-900">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Build Development Plan
            </h3>
            <p className="text-xs text-slate-500">
              Create a structured weekly learning roadmap targeting role readiness
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-5 overflow-y-auto pr-1 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Resource Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Resource</label>
              <select
                disabled={!!presetResourceId}
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              >
                <option value={0}>-- Select Resource --</option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.user_name || r.user_email} ({r.designation || 'Resource'})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Role Profile Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Role Profile</label>
              <select
                value={selectedRoleProfileId}
                onChange={(e) => setSelectedRoleProfileId(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value={0}>-- Select Role Profile --</option>
                {roleProfiles.map((rp) => (
                  <option key={rp.id} value={rp.id}>
                    {rp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Weekly Items Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" /> Weekly Breakdown & Focus Areas
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Week
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center gap-3"
                >
                  <div className="w-16 flex-shrink-0 font-mono text-xs font-bold text-blue-700 bg-blue-100/60 px-2.5 py-1.5 rounded-lg border border-blue-200 text-center">
                    Week {item.week_number}
                  </div>

                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      placeholder="Focus Area (e.g. Advanced Spring Boot & React Integration)"
                      value={item.focus_area}
                      onChange={(e) => handleItemChange(idx, 'focus_area', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="w-full md:w-56 flex-shrink-0">
                    <select
                      value={item.training_track_id || ''}
                      onChange={(e) =>
                        handleItemChange(
                          idx,
                          'training_track_id',
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Linked Track (Optional) --</option>
                      {tracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 shadow-sm shadow-blue-500/20"
            >
              {isSubmitting ? 'Creating Plan...' : 'Create Development Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
