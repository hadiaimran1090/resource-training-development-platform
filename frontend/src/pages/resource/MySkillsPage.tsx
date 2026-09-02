import React, { useEffect, useState } from 'react';
import { resourceApi } from '../../api/resourceApi';
import type { ResourceProfile } from '../../api/resourceApi';
import { SkillsMatrixSection } from '../../components/profile/SkillsMatrixSection';
import { Award, Loader2, AlertCircle } from 'lucide-react';

export const MySkillsPage: React.FC = () => {
  const [profile, setProfile] = useState<ResourceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await resourceApi.getMyProfile();
        setProfile(data);
      } catch (err: any) {
        console.error('Error fetching profile for skills page:', err);
        setError(err?.response?.data?.message || 'Failed to load user resource profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs font-semibold">Loading your skills matrix profile...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 space-y-3">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="font-extrabold text-slate-800 text-base">Skills Matrix Unavailable</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {error || 'Resource profile could not be loaded for your account.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-600" />
            My Skills & Competency Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your current proficiency levels, self-assessments, target goals, and role gap benchmarks
          </p>
        </div>
      </div>

      {/* Embedded Skills Matrix Component */}
      <SkillsMatrixSection
        resourceId={profile.id}
        resourceUserId={profile.user_id}
        resourceRegionId={profile.region_id}
      />
    </div>
  );
};
