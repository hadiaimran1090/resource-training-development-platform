import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Loader2, Search, Users, Plus, Target } from 'lucide-react';
import { resourceApi, type ResourceProfile } from '../../api/resourceApi';
import { useAuth } from '../../context/AuthContext';
import { DevelopmentPlanBuilderModal } from '../../components/development-plans/DevelopmentPlanBuilderModal';

export const RegionalLeadResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState<ResourceProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const loadResources = async () => {
      try {
        setLoading(true);
        const data = await resourceApi.getResources();
        setResources(data.filter((resource) => resource.region_id === user?.regionId));
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load regional resources.');
      } finally {
        setLoading(false);
      }
    };
    loadResources();
  }, [user?.regionId]);

  const visibleResources = resources.filter((resource) => {
    const term = search.trim().toLowerCase();
    return (
      !term ||
      [resource.user_name, resource.employee_id, resource.designation].some((value) =>
        value?.toLowerCase().includes(term)
      )
    );
  });

  const handleOpenBuilder = (resId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedResourceId(resId);
    setIsBuilderOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Regional Resources</h1>
            <p className="text-xs text-slate-500">
              Manage engineering resources, build 4-week development plans, and review readiness scores.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedResourceId(undefined);
            setIsBuilderOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm shadow-blue-500/20 transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Development Plan</span>
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, ID, or designation..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto mb-2" />
            Loading resources...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs flex justify-center items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        ) : visibleResources.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-xs">No resources found in your region.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleResources.map((resource) => (
              <div
                key={resource.id}
                onClick={() => navigate(`/regional-lead/resources/${resource.id}`)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-blue-50/40 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm overflow-hidden shrink-0">
                  {resource.profile_image_url ? (
                    <img src={resource.profile_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    resource.user_name.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-slate-900">{resource.user_name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {resource.employee_id} · {resource.designation}
                  </p>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {resource.current_status}
                </span>

                <button
                  onClick={(e) => handleOpenBuilder(resource.id, e)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition flex items-center gap-1 shrink-0"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Build Plan</span>
                </button>

                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      <DevelopmentPlanBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        presetResourceId={selectedResourceId}
        onPlanCreated={() => {
          // reload if needed
        }}
      />
    </div>
  );
};
