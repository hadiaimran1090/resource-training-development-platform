import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  Code,
  FileCheck,
  Video,
  FileText,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  Award,
  ArrowRight,
} from 'lucide-react';
import { trainingAssignmentApi } from '../../api/trainingAssignmentApi';
import { resourceApi } from '../../api/resourceApi';
import type { ResourceProfile } from '../../api/resourceApi';
import type {
  DailyActivity,
  TodaysActivitiesResponse,
} from '../../types/trainingAssignment';
import { Link } from 'react-router-dom';

export const TodaysActivitiesPage: React.FC = () => {
  const [profile, setProfile] = useState<ResourceProfile | null>(null);
  const [todaysData, setTodaysData] = useState<TodaysActivitiesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [completingId, setCompletingId] = useState<number | null>(null);
  const [celebratoryMessage, setCelebratoryMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchTodaysActivities();
  }, []);

  const fetchTodaysActivities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Fetch resource profile
      const myProfile = await resourceApi.getMyProfile();
      setProfile(myProfile);

      // Fetch today's activities using resource ID
      const data = await trainingAssignmentApi.getTodaysActivities(myProfile.id);
      setTodaysData(data);
    } catch (err: any) {
      const statusCode = err?.response?.status;
      if (statusCode === 403) {
        // Silently handle forbidden - means no training assigned yet
        setTodaysData(null);
      } else {
        setError(err?.response?.data?.message || "Failed to load today's activities.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteActivity = async (activityId: number) => {
    try {
      setCompletingId(activityId);
      const res = await trainingAssignmentApi.completeDailyActivity(activityId);

      if (res.assignmentCompleted) {
        setCelebratoryMessage(
          '🎉 Congratulations! You have completed all daily activities for your training track!'
        );
      }

      // Re-fetch activities
      if (profile) {
        const updatedData = await trainingAssignmentApi.getTodaysActivities(profile.id);
        setTodaysData(updatedData);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to mark activity complete.');
    } finally {
      setCompletingId(null);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assessment':
        return <FileCheck className="w-5 h-5 text-purple-600" />;
      case 'coding':
      case 'poc':
        return <Code className="w-5 h-5 text-blue-600" />;
      case 'mock_interview':
      case 'mentor_session':
        return <Video className="w-5 h-5 text-amber-600" />;
      case 'reading':
      case 'documentation':
        return <FileText className="w-5 h-5 text-slate-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-emerald-600" />;
    }
  };

  const renderActivityCard = (act: DailyActivity, isOverdue: boolean) => {
    const isDone = act.status === 'completed';

    return (
      <div
        key={act.id}
        className={`bg-white rounded-2xl border p-4 shadow-xs transition-all flex items-center justify-between gap-4 ${
          isDone
            ? 'border-emerald-200 bg-emerald-50/30'
            : isOverdue
            ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400'
            : 'border-slate-200 hover:border-blue-300'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDone ? 'bg-emerald-100' : isOverdue ? 'bg-amber-100' : 'bg-slate-100'
            }`}
          >
            {getActivityIcon(act.activity_type)}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-slate-900">{act.description}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isOverdue
                    ? 'bg-amber-100 text-amber-800 border border-amber-300/50'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                Day {act.day_number} - {isOverdue ? 'Overdue' : 'Today'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold capitalize">
                {act.activity_type}
              </span>
            </div>
            {isDone && act.completed_date && (
              <p className="text-[11px] text-emerald-700 font-medium">
                Completed on {new Date(act.completed_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        <div>
          {isDone ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Completed</span>
            </span>
          ) : (
            <button
              onClick={() => handleCompleteActivity(act.id)}
              disabled={completingId === act.id}
              className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 ${
                isOverdue ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {completingId === act.id ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Complete</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  const assignmentsList = todaysData?.assignments || (
    todaysData?.assignment
      ? [{ assignment: todaysData.assignment, activities: todaysData.activities || [], dayNumber: todaysData.dayNumber || 0 }]
      : []
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-300 font-extrabold text-[11px] uppercase tracking-wider border border-blue-400/30">
              Daily Training Dashboard
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Today's Activities</h1>
          <p className="text-xs text-blue-200/80">
            Track and complete your day-by-day learning tasks according to your assigned training plan.
          </p>
        </div>

        <Link
          to="/resource/my-training-plan"
          className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/20 backdrop-blur-xs transition-all flex items-center gap-2 shrink-0"
        >
          <Award className="w-4 h-4 text-blue-300" />
          <span>View Full Training Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {celebratoryMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{celebratoryMessage}</span>
          </div>
          <button
            onClick={() => setCelebratoryMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span>Loading today's scheduled activities...</span>
        </div>
      ) : assignmentsList.length === 0 ? (
        /* Empty State: No training assigned by Regional Lead */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4 max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-slate-900">No Training Assigned Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Your Regional Lead has not assigned a training track to you yet. Once a training plan is assigned and approved, your daily activities will appear here automatically.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/training-catalog"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Training Catalog</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {assignmentsList.map(({ assignment, activities, dayNumber }) => {
            const overdueActivities = activities.filter((a) => a.day_number < dayNumber);
            const todayActivities = activities.filter((a) => a.day_number === dayNumber);

            return (
              <div key={assignment.id} className="space-y-5 bg-slate-50/50 p-6 rounded-3xl border border-slate-200">
                {/* Active Assignment Header Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold">
                        Current: Day {dayNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        Track: <span className="text-slate-900 font-extrabold">{assignment.track_name}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Started on {new Date(assignment.start_date).toLocaleDateString()} • Track Duration:{' '}
                      {assignment.track_duration_days || 0} Days
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {overdueActivities.length > 0 && (
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold flex items-center gap-1.5 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        {overdueActivities.length} Overdue Task{overdueActivities.length > 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Approved & Active
                    </span>
                  </div>
                </div>

                {/* Today's Activities List */}
                {activities.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">No Activities Scheduled for Today</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {dayNumber < 1
                        ? 'Your training track is scheduled to start in the future.'
                        : 'You have completed all scheduled tasks for today and previous days. Great job!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Overdue Section */}
                    {overdueActivities.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Overdue Activities ({overdueActivities.length})</span>
                        </h3>

                        <div className="space-y-3">
                          {overdueActivities.map((act: DailyActivity) => renderActivityCard(act, true))}
                        </div>
                      </div>
                    )}

                    {/* Today Section */}
                    {todayActivities.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span>Today's Activities — Day {dayNumber} ({todayActivities.length})</span>
                        </h3>

                        <div className="space-y-3">
                          {todayActivities.map((act: DailyActivity) => renderActivityCard(act, false))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
