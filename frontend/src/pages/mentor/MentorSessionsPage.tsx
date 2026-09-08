import React, { useState, useEffect } from 'react';
import { mentoringSessionApi } from '../../api/mentoringSessionApi';
import type { MentoringSession, MentoringSessionType } from '../../api/mentoringSessionApi';
import { resourceApi } from '../../api/resourceApi';
import type { ResourceProfile } from '../../api/resourceApi';
import {
  Users,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const MentorSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [mentees, setMentees] = useState<ResourceProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<number>(0);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().substring(0, 16));
  const [sessionType, setSessionType] = useState<MentoringSessionType>('review');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSessionData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [sessionList, allResources] = await Promise.all([
        mentoringSessionApi.getMyLoggedSessions(),
        resourceApi.getResources(),
      ]);
      setSessions(sessionList);
      setMentees(allResources);

      if (allResources.length > 0) {
        setSelectedResourceId(allResources[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load mentoring sessions:', err);
      setError(err.response?.data?.error || 'Failed to load mentoring sessions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, []);

  const handleCreateSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResourceId) {
      setError('Please select an assigned mentee.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await mentoringSessionApi.createSession({
        resource_id: selectedResourceId,
        session_date: new Date(sessionDate).toISOString(),
        session_type: sessionType,
        notes: notes.trim() || undefined,
      });

      setSuccessMsg('Mentoring session logged successfully.');
      setIsModalOpen(false);
      setNotes('');
      fetchSessionData();
    } catch (err: any) {
      console.error('Error logging mentoring session:', err);
      setError(err.response?.data?.error || 'Failed to log mentoring session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSession = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this mentoring session log?')) return;

    try {
      setError(null);
      await mentoringSessionApi.deleteSession(id);
      setSuccessMsg('Mentoring session deleted.');
      fetchSessionData();
    } catch (err: any) {
      console.error('Error deleting mentoring session:', err);
      setError(err.response?.data?.error || 'Failed to delete mentoring session.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600" />
            Mentoring Sessions Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Log and review 1:1 mentoring sessions, code reviews, and mock interview notes conducted for your mentees.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-xs hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Log Mentoring Session
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Past Sessions List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800">My Logged Sessions ({sessions.length})</h2>
        </div>

        {sessions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No mentoring sessions logged yet.</p>
            <p className="text-xs text-slate-400 mt-1">Click "Log Mentoring Session" to record your first 1:1 session.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                  <th className="py-3.5 px-5">Mentee</th>
                  <th className="py-3.5 px-5">Session Type</th>
                  <th className="py-3.5 px-5">Date & Time</th>
                  <th className="py-3.5 px-5">Notes & Guidance</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {session.resource_name?.substring(0, 2).toUpperCase() || 'M'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{session.resource_name || 'Assigned Mentee'}</p>
                          <p className="text-[11px] text-slate-400">{session.resource_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] uppercase border border-blue-100">
                        {session.session_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-500">
                      {new Date(session.session_date).toLocaleString()}
                    </td>
                    <td className="py-4 px-5 text-slate-600 max-w-md truncate">
                      {session.notes || 'No notes added'}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="px-2.5 py-1 text-rose-600 hover:text-rose-700 font-bold hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete session log"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> Log Mentoring Session
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSessionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Mentee *</label>
                <select
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                >
                  {mentees.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.user_name} ({m.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Session Type *</label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value as MentoringSessionType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                >
                  <option value="review">Code / Training Review</option>
                  <option value="mock_interview">Mock Interview Session</option>
                  <option value="feedback">1:1 Feedback & Career Guidance</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Session Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Session Notes & Recommendations</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Reviewed her coding submission, recommended more practice on edge cases..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Log Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
