import React, { useEffect, useState } from 'react';
import { AlertCircle, Bell, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { notificationApi, type Notification } from '../../api/notificationApi';
import { skillApi, type SkillRequest } from '../../api/skillApi';

export const RegionalLeadNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [requests, setRequests] = useState<SkillRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [notificationData, requestData] = await Promise.all([
        notificationApi.getMyNotifications(), skillApi.getPendingSkillRequests(),
      ]);
      setNotifications(notificationData.filter((item) => item.type === 'skill_request'));
      setRequests(requestData);
      await Promise.all(notificationData.filter((item) => !item.is_read).map((item) => notificationApi.markAsRead(item.id)));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const action = async (request: SkillRequest, approved: boolean) => {
    try {
      setActionId(request.id);
      if (approved) await skillApi.approveSkillRequest(request.id);
      else await skillApi.rejectSkillRequest(request.id);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not update this skill request.');
    } finally {
      setActionId(null);
    }
  };

  const pendingNotifications = notifications
    .map((notification) => ({ notification, request: requests.find((request) => request.id === notification.related_entity_id) }))
    .filter((item): item is { notification: Notification; request: SkillRequest } => Boolean(item.request));

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Bell className="w-5 h-5" /></div>
        <div><h1 className="text-xl font-extrabold text-slate-900">Notifications</h1></div>
      </div>
      {loading ? <div className="py-16 text-center text-slate-500 text-xs"><Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto mb-2" />Loading notifications...</div>
        : error ? <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs flex gap-2"><AlertCircle className="w-4 h-4" />{error}</div>
        : pendingNotifications.length === 0 ? null
        : <div className="space-y-3">{pendingNotifications.map(({ notification, request }) => (
            <div key={notification.id} className="p-5 bg-white rounded-2xl border border-purple-200 shadow-xs">
              <div className="flex justify-between gap-4"><div><p className="font-extrabold text-slate-900">{request.skill_name}</p><p className="text-xs text-slate-500 mt-1">{notification.message}</p><p className="text-xs text-slate-600 mt-2">Requested by <span className="font-bold">{request.requester_name}</span> · {request.region_name || 'Your region'}</p>{request.justification && <p className="mt-3 text-xs text-slate-600 bg-slate-50 rounded-lg p-3">“{request.justification}”</p>}</div><span className="h-fit px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold">{request.category}</span></div>
              <div className="mt-4 flex justify-end gap-2"><button disabled={actionId === request.id} onClick={() => action(request, false)} className="px-3 py-2 rounded-lg border border-rose-200 text-rose-600 text-xs font-bold disabled:opacity-50"><XCircle className="w-3.5 h-3.5 inline mr-1" />Reject</button><button disabled={actionId === request.id} onClick={() => action(request, true)} className="px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold disabled:opacity-50"><CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />Approve</button></div>
            </div>
          ))}</div>}
    </div>
  );
};
