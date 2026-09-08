import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Briefcase, Loader2, MapPin } from 'lucide-react';
import { resourceApi, type ResourceProfile } from '../../api/resourceApi';
import { SkillsMatrixSection } from '../../components/profile/SkillsMatrixSection';

export const RegionalLeadResourceDetailPage: React.FC = () => {
  const { resourceId } = useParams();
  const [resource, setResource] = useState<ResourceProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resourceId) return;
    resourceApi.getResourceById(Number(resourceId)).then(setResource).catch((err) => {
      setError(err?.response?.data?.message || 'Failed to load resource profile.');
    });
  }, [resourceId]);

  if (error) return <div className="p-8 text-center text-rose-600 text-sm"><AlertCircle className="w-5 h-5 inline mr-2" />{error}</div>;
  if (!resource) return <div className="py-20 text-center text-slate-500 text-xs"><Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />Loading resource profile...</div>;

  return (
    <div className="space-y-6">
      <Link to="/regional-lead/resources" className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600"><ArrowLeft className="w-4 h-4" />Back to Resources</Link>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-xl overflow-hidden">
          {resource.profile_image_url ? <img src={resource.profile_image_url} alt="" className="w-full h-full object-cover" /> : resource.user_name.charAt(0)}
        </div>
        <div><h1 className="text-xl font-extrabold text-slate-900">{resource.user_name}</h1><p className="text-xs text-slate-500">{resource.employee_id} · {resource.user_email}</p>
          <div className="flex gap-3 mt-2 text-xs text-slate-600"><span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{resource.designation}</span><span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{resource.region_name || 'No region'}</span></div></div>
      </div>
      <SkillsMatrixSection resourceId={resource.id} resourceUserId={resource.user_id} resourceRegionId={resource.region_id} />
    </div>
  );
};
