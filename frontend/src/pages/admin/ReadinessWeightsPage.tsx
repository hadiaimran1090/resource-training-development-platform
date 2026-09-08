import React, { useState, useEffect } from 'react';
import { getReadinessScoreWeights, updateReadinessScoreWeights } from '../../api/readinessScoreApi';
import type { ReadinessScoreWeight } from '../../api/readinessScoreApi';
import { Sliders, Save, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Gauge } from 'lucide-react';

export const ReadinessWeightsPage: React.FC = () => {
  const [weights, setWeights] = useState<ReadinessScoreWeight[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadWeights();
  }, []);

  const loadWeights = async () => {
    try {
      setErrorMsg(null);
      const res = await getReadinessScoreWeights();
      setWeights(res.data || []);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to load readiness score weights.');
    }
  };

  const handleWeightChange = (id: number, field: 'weight_pct' | 'is_active', value: any) => {
    setWeights((prev) =>
      prev.map((w) => (w.id === id ? { ...w, [field]: value } : w))
    );
  };

  const activeSum = weights
    .filter((w) => w.is_active)
    .reduce((acc, w) => acc + (Number(w.weight_pct) || 0), 0);

  const isValidSum = Math.abs(activeSum - 100.0) <= 0.01;

  const handleSave = async () => {
    if (!isValidSum) {
      setErrorMsg(`Active weights must sum to exactly 100%. Current sum: ${activeSum.toFixed(2)}%`);
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      await updateReadinessScoreWeights(weights);
      setSuccessMsg('Readiness score weights updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to update weights.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-xs">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Readiness Score Engine Weights
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure component formula weights and active statuses for the deployment readiness calculation engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadWeights}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || !isValidSum}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-2 disabled:opacity-50 shadow-md shadow-blue-500/20"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Realtime Sum Status Banner */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between gap-4 text-xs font-semibold shadow-xs transition-all ${
          isValidSum
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-rose-50/80 border-rose-200 text-rose-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isValidSum ? (
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="font-bold text-xs">
              {isValidSum
                ? 'Configuration Valid — Active weights sum to 100%'
                : 'Validation Error — Active weights must sum to 100%'}
            </div>
            <div className="text-[11px] font-medium opacity-80 mt-0.5">
              {isValidSum
                ? 'All 7 categories are balanced correctly for readiness score calculation.'
                : `Current formula sum is ${activeSum.toFixed(2)}%. Adjust weight percentages below before saving.`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/80 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs font-bold shrink-0">
          <Gauge className="w-4 h-4 text-blue-600" />
          <span>Sum: {activeSum.toFixed(2)}%</span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Weights Table Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Component Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Weight Percentage (%)</th>
              <th className="px-6 py-4 text-right">Effective Weight</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {weights.map((w) => (
              <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900 tracking-wide flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>{w.component_name.replace(/_/g, ' ')}</span>
                </td>
                <td className="px-6 py-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={w.is_active}
                      onChange={(e) => handleWeightChange(w.id, 'is_active', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className={`ml-2.5 text-xs font-bold ${w.is_active ? 'text-slate-800' : 'text-slate-400'}`}>
                      {w.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </label>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      disabled={!w.is_active}
                      value={w.weight_pct}
                      onChange={(e) =>
                        handleWeightChange(w.id, 'weight_pct', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono font-bold focus:outline-none disabled:bg-slate-100 disabled:text-slate-400 shadow-2xs"
                    />
                    <span className="text-slate-500 font-mono font-bold">%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono font-extrabold text-sm">
                  {w.is_active ? (
                    <span className={isValidSum ? 'text-emerald-600' : 'text-amber-600'}>
                      {isValidSum
                        ? `${Number(w.weight_pct).toFixed(2)}%`
                        : `${((Number(w.weight_pct) / (activeSum || 1)) * 100).toFixed(2)}% (rel)`}
                    </span>
                  ) : (
                    <span className="text-slate-300 line-through text-xs font-normal">0.00%</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
