import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Loader2,
  XCircle,
  Target,
  Award,
  Info,
  Clock,
} from 'lucide-react';
import { notificationApi, type Notification } from '../../api/notificationApi';
import { skillApi, type SkillRequest } from '../../api/skillApi';
import { approveDevelopmentPlan, rejectDevelopmentPlan } from '../../api/developmentPlanApi';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'skill_request':
      return <Award className="w-5 h-5 text-purple-600" />;
    case 'development_plan_approval':
      return <Target className="w-5 h-5 text-blue-600" />;
    case 'development_plan_approved':
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    case 'development_plan_rejected':
      return <XCircle className="w-5 h-5 text-rose-600" />;
    case 'development_plan_completed':
      return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
    default:
      return <Info className="w-5 h-5 text-slate-500" />;
  }
};

const getNotificationBg = (type: string) => {
  switch (type) {
    case 'skill_request':
      return 'bg-purple-50';
    case 'development_plan_approval':
      return 'bg-blue-50';
    case 'development_plan_approved':
      return 'bg-emerald-50';
    case 'development_plan_rejected':
      return 'bg-rose-50';
    default:
      return 'bg-slate-50';
  }
};

const getNotificationLabel = (type: string) => {
  switch (type) {
    case 'skill_request': return 'Skill Request';
    case 'development_plan_approval': return 'Plan Needs Approval';
    case 'development_plan_approved': return 'Plan Approved';
    case 'development_plan_rejected': return 'Plan Rejected';
    case 'development_plan_completed': return 'Plan Completed';
    default: return 'Notification';
  }
};

export const RegionalLeadNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [requests, setRequests] = useState<SkillRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [notificationData, requestData] = await Promise.all([
        notificationApi.getMyNotifications(),
        skillApi.getPendingSkillRequests(),
      ]);
      setNotifications(notificationData);
      setRequests(requestData);
      // Mark all unread as read
      await Promise.all(
        notificationData.filter((n) => !n.is_read).map((n) => notificationApi.markAsRead(n.id))
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSkillAction = async (request: SkillRequest, approved: boolean) => {
    try {
      setActionId(`skill-${request.id}`);
      if (approved) await skillApi.approveSkillRequest(request.id);
      else await skillApi.rejectSkillRequest(request.id);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not update this skill request.');
    } finally {
      setActionId(null);
    }
  };

  const handleDevPlanAction = async (planId: number, approved: boolean) => {
    try {
      setActionId(`plan-${planId}`);
      if (approved) await approveDevelopmentPlan(planId);
      else await rejectDevelopmentPlan(planId);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not process this development plan.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Notifications</h1>
          <p className="text-xs text-slate-500 mt-0.5">All your pending approvals and activity updates</p>
        </div>
        {notifications.length > 0 && (
          <span className="ml-auto px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">
            {notifications.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
          Loading notifications...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs flex gap-2 items-center border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-700 text-base">All caught up!</h3>
          <p className="text-xs text-slate-500 max-w-sm">No new notifications at this time. Check back later for skill requests and plan approvals.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const isDevPlanApproval = notification.type === 'development_plan_approval';
            const isSkillRequest = notification.type === 'skill_request';
            const skillRequest = isSkillRequest
              ? requests.find((r) => r.id === notification.related_entity_id)
              : undefined;
            const planId = isDevPlanApproval ? notification.related_entity_id : undefined;
            const isProcessing =
              actionId === `skill-${skillRequest?.id}` || actionId === `plan-${planId}`;

            return (
              <div
                key={notification.id}
                className={`p-5 bg-white rounded-2xl border shadow-xs transition-all ${
                  !notification.is_read ? 'border-blue-200 shadow-blue-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getNotificationBg(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {getNotificationLabel(notification.type)}
                        </span>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5 leading-snug">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {!notification.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(notification.created_at).toLocaleString('en-US', {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Skill request details */}
                    {isSkillRequest && skillRequest && (
                      <div className="mt-3">
                        <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div>
                              <p className="font-extrabold text-slate-900 text-sm">{skillRequest.skill_name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Requested by <span className="font-bold text-slate-700">{skillRequest.requester_name}</span>
                                {skillRequest.region_name && ` · ${skillRequest.region_name}`}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                              {skillRequest.category}
                            </span>
                          </div>
                          {skillRequest.justification && (
                            <p className="mt-2 text-xs text-slate-600 bg-white/70 rounded-lg p-2.5 italic border border-purple-100">
                              "{skillRequest.justification}"
                            </p>
                          )}
                        </div>
                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            disabled={isProcessing}
                            onClick={() => handleSkillAction(skillRequest, false)}
                            className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-xs font-bold disabled:opacity-50 hover:bg-rose-50 transition"
                          >
                            <XCircle className="w-3.5 h-3.5 inline mr-1" />Reject
                          </button>
                          <button
                            disabled={isProcessing}
                            onClick={() => handleSkillAction(skillRequest, true)}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold disabled:opacity-50 hover:bg-purple-700 transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />Approve
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Dev plan approval actions */}
                    {isDevPlanApproval && planId && (
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          disabled={isProcessing}
                          onClick={() => handleDevPlanAction(planId, false)}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-xs font-bold disabled:opacity-50 hover:bg-rose-50 transition"
                        >
                          <XCircle className="w-3.5 h-3.5 inline mr-1" />Reject Plan
                        </button>
                        <button
                          disabled={isProcessing}
                          onClick={() => handleDevPlanAction(planId, true)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold disabled:opacity-50 hover:bg-blue-700 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />Approve Plan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
