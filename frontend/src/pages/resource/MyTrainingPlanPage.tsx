import React, { useState, useEffect } from 'react';
import {
  Route,
  CheckCircle2,
  Clock,
  BookOpen,
  Code,
  FileCheck,
  Video,
  FileText,
  AlertCircle,
  Loader2,
  Calendar,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { trainingAssignmentApi } from '../../api/trainingAssignmentApi';
import { resourceApi } from '../../api/resourceApi';
import type { ResourceProfile } from '../../api/resourceApi';
import type { TrainingAssignment, DailyActivity } from '../../types/trainingAssignment';
import { Link } from 'react-router-dom';

export const MyTrainingPlanPage: React.FC = () => {
  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [profile, setProfile] = useState<ResourceProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [completingId, setCompletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const myProfile = await resourceApi.getMyProfile();
      setProfile(myProfile);

      const assignmentsList = await trainingAssignmentApi.getAssignments();
      if (assignmentsList.length > 0) {
        // Fetch detailed version for all assignments
        const fullDetails = await Promise.all(
          assignmentsList.map((a) => trainingAssignmentApi.getAssignmentById(a.id))
        );
        setAssignments(fullDetails);
      } else {
        setAssignments([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load training plan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteActivity = async (activityId: number) => {
    try {
      setCompletingId(activityId);
      await trainingAssignmentApi.completeDailyActivity(activityId);
      await fetchPlan();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to mark activity complete.');
    } finally {
      setCompletingId(null);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assessment':
        return <FileCheck className="w-4 h-4 text-purple-600" />;
      case 'coding':
      case 'poc':
        return <Code className="w-4 h-4 text-blue-600" />;
      case 'mock_interview':
      case 'mentor_session':
        return <Video className="w-4 h-4 text-amber-600" />;
      case 'reading':
      case 'documentation':
        return <FileText className="w-4 h-4 text-slate-600" />;
      default:
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
    }
  };


  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-extrabold text-[11px] uppercase tracking-wider border border-blue-400/20">
              Personalized Learning Path
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">My Training Plan</h1>
          <p className="text-xs text-blue-200/80">
            Full roadmap of your assigned track including complete day-by-day learning activities.
          </p>
        </div>

        <Link
          to="/resource/todays-activities"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <Calendar className="w-4 h-4" />
          <span>Today's Activities</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span>Loading training plan roadmap...</span>
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4 max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Route className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">No Training Plan Assigned Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You do not have an active training plan assigned. Your Regional Lead will assign a training track based on your skills matrix and target role profile.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {assignments.map((assignment) => {
            const groupedActivities = (assignment.daily_activities || []).reduce<Record<number, DailyActivity[]>>(
              (acc, act) => {
                acc[act.day_number] = acc[act.day_number] || [];
                acc[act.day_number].push(act);
                return acc;
              },
              {}
            );

            const daysList = Object.keys(groupedActivities)
              .map(Number)
              .sort((a, b) => a - b);

            const total = assignment.total_activities || assignment.daily_activities?.length || 0;
            const completed =
              assignment.completed_activities ||
              assignment.daily_activities?.filter((a) => a.status === 'completed').length ||
              0;
            const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div key={assignment.id} className="space-y-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-200">
                {/* Overview Progress Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">{assignment.track_name}</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Start Date: <span className="font-bold text-slate-800">{new Date(assignment.start_date).toLocaleDateString()}</span> • Assigned By:{' '}
                        <span className="font-bold text-slate-800">{assignment.assigned_by_name || 'Regional Lead'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                          assignment.approval_status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : assignment.approval_status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {assignment.approval_status.toUpperCase()}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                          assignment.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {assignment.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Overall Progress */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600">Overall Training Track Completion</span>
                      <span className="text-blue-600 font-extrabold">
                        {completed} / {total} Daily Tasks ({progressPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-500 rounded-full"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Timeline Days */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Day-by-Day Learning Roadmap ({daysList.length} Days)
                  </h3>

                  <div className="space-y-4">
                    {daysList.map((dayNum) => {
                      const dayActs = groupedActivities[dayNum];
                      const isDayDone = dayActs.every((a) => a.status === 'completed');

                      return (
                        <div
                          key={dayNum}
                          className={`bg-white rounded-2xl border p-5 shadow-xs transition-all ${
                            isDayDone ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-extrabold text-xs">
                                Day {dayNum}
                              </span>
                              <span className="text-xs font-bold text-slate-500">
                                ({dayActs.length} {dayActs.length === 1 ? 'Activity' : 'Activities'})
                              </span>
                            </div>

                            {isDayDone && (
                              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Day Completed</span>
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 divide-y divide-slate-100">
                            {dayActs.map((act) => (
                              <div
                                key={act.id}
                                className="pt-2 first:pt-0 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-slate-100">
                                    {getActivityIcon(act.activity_type)}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-800">{act.description}</p>
                                    <span className="text-[10px] text-slate-400 font-bold capitalize">
                                      Type: {act.activity_type}
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  {act.status === 'completed' ? (
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                      Completed
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleCompleteActivity(act.id)}
                                      disabled={completingId === act.id}
                                      className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-[11px] font-bold transition-all disabled:opacity-50"
                                    >
                                      {completingId === act.id ? 'Saving...' : 'Mark Done'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
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
