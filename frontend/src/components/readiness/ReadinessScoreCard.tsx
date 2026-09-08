import React, { useState } from 'react';
import { recalculateReadinessScore } from '../../api/readinessScoreApi';
import type { ReadinessScore } from '../../api/readinessScoreApi';
import { Award, RefreshCw, CheckCircle2, AlertTriangle, XCircle, TrendingUp, Sparkles, BookOpen, Code2, Brain, MessageSquare, Briefcase, FileCheck } from 'lucide-react';

interface ReadinessScoreCardProps {
  score: ReadinessScore | null;
  resourceId?: number | null;
  canRecalculate?: boolean;
  history?: ReadinessScore[];
  onScoreUpdated?: (updatedScore: ReadinessScore) => void;
}

export const ReadinessScoreCard: React.FC<ReadinessScoreCardProps> = ({
  score,
  resourceId,
  canRecalculate = false,
  history = [],
  onScoreUpdated,
}) => {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleRecalculate = async () => {
    if (!resourceId) return;
    try {
      setIsRecalculating(true);
      setErrorMsg(null);
      const res = await recalculateReadinessScore(resourceId);
      if (res.success && res.data) {
        onScoreUpdated?.(res.data);
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to recalculate score.');
    } finally {
      setIsRecalculating(false);
    }
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Deployment Ready
          </span>
        );
      case 'almost_ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Almost Ready
          </span>
        );
      case 'needs_development':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <TrendingUp className="w-3.5 h-3.5 text-orange-600" /> Needs Development
          </span>
        );
      case 'high_risk':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> High Risk
          </span>
        );
    }
  };

  const getScoreColor = (overall: number = 0) => {
    if (overall >= 85) return 'text-emerald-700 border-emerald-300 bg-emerald-50';
    if (overall >= 70) return 'text-amber-700 border-amber-300 bg-amber-50';
    if (overall >= 50) return 'text-orange-700 border-orange-300 bg-orange-50';
    return 'text-rose-700 border-rose-300 bg-rose-50';
  };

  const components = [
    { label: 'Technical Skills Matrix', value: Number(score?.technical_skills_pct || 0), icon: BookOpen, weight: '20%' },
    { label: 'Coding Challenges', value: Number(score?.coding_pct || 0), icon: Code2, weight: '20%' },
    { label: 'Knowledge Assessments', value: Number(score?.assessment_pct || 0), icon: Brain, weight: '20%' },
    { label: 'Interview Readiness', value: Number(score?.interview_readiness_pct || 0), icon: Sparkles, weight: '15%' },
    { label: 'Project Experience / Activities', value: Number(score?.project_experience_pct || 0), icon: Briefcase, weight: '15%' },
    { label: 'Communication Rating', value: Number(score?.communication_pct || 0), icon: MessageSquare, weight: '5%' },
    { label: 'Certifications Verified', value: Number(score?.certification_pct || 0), icon: FileCheck, weight: '5%' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              Deployment Readiness Score
            </h3>
            <p className="text-xs text-slate-500">
              Quantified composite score across 7 training & validation metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {score && getCategoryBadge(score.category)}

          {canRecalculate && resourceId && (
            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm shadow-blue-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
              {isRecalculating ? 'Recalculating...' : 'Recalculate Score'}
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {score ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Main Overall Dial */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
            <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center ${getScoreColor(score.overall_pct)} shadow-xs`}>
              <span className="text-3xl font-extrabold tracking-tight">{score.overall_pct}%</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Overall</span>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              Last calculated:{' '}
              <span className="text-slate-800 font-semibold">
                {new Date(score.calculated_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {history.length > 1 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="mt-3 text-xs text-blue-600 hover:underline flex items-center gap-1 font-bold"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                {showHistory ? 'Hide Score History' : `View History (${history.length} runs)`}
              </button>
            )}
          </div>

          {/* 7 Component Progress Breakdown */}
          <div className="lg:col-span-8 space-y-3.5">
            {components.map((comp) => {
              const Icon = comp.icon;
              return (
                <div key={comp.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-blue-600" />
                      {comp.label}
                      <span className="text-[10px] text-slate-400 font-mono">({comp.weight})</span>
                    </span>
                    <span className="font-bold text-slate-900 font-mono">{comp.value}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        comp.value >= 85
                          ? 'bg-emerald-500'
                          : comp.value >= 70
                          ? 'bg-amber-500'
                          : comp.value >= 50
                          ? 'bg-orange-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, comp.value))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 text-xs">
          No readiness score calculated yet. Click "Recalculate Score" to compute initial readiness metrics.
        </div>
      )}

      {/* History Modal / Drawer */}
      {showHistory && history.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Historical Trend Log</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {history.map((h, idx) => (
              <div key={h.id || idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400">#{history.length - idx}</span>
                  <span className="text-slate-600 font-semibold">
                    {new Date(h.calculated_date).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-900">{h.overall_pct}%</span>
                  {getCategoryBadge(h.category)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
