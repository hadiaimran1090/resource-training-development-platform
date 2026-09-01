import React, { useEffect, useState } from 'react';
import { userApi, type BenchRecord } from '../../api/userApi';
import { X, Clock, Calendar, AlertCircle, Loader2, History } from 'lucide-react';

interface BenchHistoryModalProps {
  userId: number;
  userName: string;
  onClose: () => void;
}

export const BenchHistoryModal: React.FC<BenchHistoryModalProps> = ({ userId, userName, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalBenchDays, setTotalBenchDays] = useState(0);
  const [benchRecords, setBenchRecords] = useState<BenchRecord[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await userApi.getUserBenchHistory(userId);
        setTotalBenchDays(data.totalBenchDays !== undefined ? data.totalBenchDays : (data as any).maxBenchDays || 0);
        setBenchRecords(data.benchRecords || []);
      } catch (err: any) {
        console.error('Bench history fetch error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load bench history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Bench History</h3>
              <p className="text-xs text-slate-500">{userName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs font-semibold">Loading bench history...</span>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-rose-500 text-xs font-medium flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            {/* Total Bench Summary Card */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-xl shadow-md flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">Total Bench Time</p>
                <p className="text-2xl font-black tracking-tight">{totalBenchDays} Days</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-200" />
              </div>
            </div>

            {/* Bench History Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Historical Records</h4>
              {benchRecords.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-100">
                  No historical bench periods recorded for this user.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {benchRecords.map((record) => (
                    <div
                      key={record.id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>
                            {new Date(record.startDate).toLocaleDateString()} —{' '}
                            {record.endDate ? new Date(record.endDate).toLocaleDateString() : 'Present (Active)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 pl-5">
                          {record.reason || 'Bench Transition Period'}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-700">
                          {record.durationDays} Days
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
