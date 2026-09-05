import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { trainingCatalogApi } from '../../api/trainingCatalogApi';
import { skillApi } from '../../api/skillApi';
import type {
  TrainingTrack,
  TrainingProgram,
  TrainingModule,
  TrackFullTree,
  SkillLevel,
  ContentType,
} from '../../types/trainingCatalog';
import type { RoleProfile } from '../../types/skill';
import {
  GitBranch,
  BookOpen,
  Layers,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Video,
  FileText,
  FlaskConical,
  Clock,
  UserCheck,
  AlertCircle,
  Loader2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Shield,
  Search,
} from 'lucide-react';

export const TrainingCatalogPage: React.FC = () => {
  const { user } = useAuth();
  const userRoles = user?.roles || (user?.role ? [user.role] : []);
  const canManage = userRoles.some((r) =>
    ['System Administrator', 'Training Manager', 'Admin'].includes(r)
  );

  // Navigation State: null = level 1 (tracks), trackId = level 2 (programs), programId = level 3 (modules)
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);

  // Data State
  const [tracks, setTracks] = useState<TrainingTrack[]>([]);
  const [currentTrackTree, setCurrentTrackTree] = useState<TrackFullTree | null>(null);
  const [roleProfiles, setRoleProfiles] = useState<RoleProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<TrainingTrack | null>(null);
  const [trackForm, setTrackForm] = useState({
    name: '',
    description: '',
    duration_days: 10,
    target_role_profile_id: '',
  });

  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);
  const [programForm, setProgramForm] = useState({
    name: '',
    skill_level: 'intermediate' as SkillLevel,
    duration_days: 10,
    prerequisites: '',
  });

  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [moduleForm, setModuleForm] = useState({
    name: '',
    day_number: 1,
    content_type: 'video' as ContentType,
    content_url: '',
    sequence_order: 1,
  });

  // Load Tracks & Role Profiles on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // When selectedTrackId changes, hydrate track tree
  useEffect(() => {
    if (selectedTrackId) {
      loadTrackTree(selectedTrackId);
    } else {
      setCurrentTrackTree(null);
      setSelectedProgramId(null);
    }
  }, [selectedTrackId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [tracksData, rolesData] = await Promise.all([
        trainingCatalogApi.getTracks(),
        skillApi.getRoleProfiles(),
      ]);
      setTracks(tracksData);
      setRoleProfiles(rolesData);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load catalog data.');
    } finally {
      setLoading(false);
    }
  };

  const loadTrackTree = async (trackId: number) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const tree = await trainingCatalogApi.getTrackById(trackId);
      setCurrentTrackTree(tree);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load track details.');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Selected entities helper
  const selectedTrack = currentTrackTree || tracks.find((t) => t.id === selectedTrackId);
  const selectedProgram = currentTrackTree?.programs.find((p) => p.id === selectedProgramId);

  // ==========================================
  // TRACK HANDLERS
  // ==========================================
  const handleOpenTrackModal = (track?: TrainingTrack) => {
    if (track) {
      setEditingTrack(track);
      setTrackForm({
        name: track.name,
        description: track.description || '',
        duration_days: track.duration_days,
        target_role_profile_id: track.target_role_profile_id ? String(track.target_role_profile_id) : '',
      });
    } else {
      setEditingTrack(null);
      setTrackForm({
        name: '',
        description: '',
        duration_days: 10,
        target_role_profile_id: '',
      });
    }
    setIsTrackModalOpen(true);
  };

  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackForm.name.trim() || trackForm.duration_days <= 0) {
      setErrorMsg('Track name is required and duration must be greater than 0.');
      return;
    }

    try {
      setErrorMsg(null);
      const payload = {
        name: trackForm.name.trim(),
        description: trackForm.description.trim() || undefined,
        duration_days: Number(trackForm.duration_days),
        target_role_profile_id: trackForm.target_role_profile_id
          ? Number(trackForm.target_role_profile_id)
          : null,
      };

      if (editingTrack) {
        await trainingCatalogApi.updateTrack(editingTrack.id, payload);
        showSuccess(`Track "${payload.name}" updated successfully.`);
      } else {
        await trainingCatalogApi.createTrack(payload);
        showSuccess(`Track "${payload.name}" created successfully.`);
      }

      setIsTrackModalOpen(false);
      loadInitialData();
      if (selectedTrackId) loadTrackTree(selectedTrackId);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save training track.');
    }
  };

  const handleDeleteTrack = async (track: TrainingTrack) => {
    if (!window.confirm(`Are you sure you want to delete track "${track.name}"?`)) return;

    try {
      setErrorMsg(null);
      await trainingCatalogApi.deleteTrack(track.id);
      showSuccess(`Track "${track.name}" deleted successfully.`);
      if (selectedTrackId === track.id) {
        setSelectedTrackId(null);
      }
      loadInitialData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to delete track.');
    }
  };

  // ==========================================
  // PROGRAM HANDLERS
  // ==========================================
  const handleOpenProgramModal = (program?: TrainingProgram) => {
    if (program) {
      setEditingProgram(program);
      setProgramForm({
        name: program.name,
        skill_level: program.skill_level,
        duration_days: program.duration_days,
        prerequisites: program.prerequisites || '',
      });
    } else {
      setEditingProgram(null);
      setProgramForm({
        name: '',
        skill_level: 'intermediate',
        duration_days: selectedTrack ? selectedTrack.duration_days : 10,
        prerequisites: '',
      });
    }
    setIsProgramModalOpen(true);
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrackId) return;
    if (!programForm.name.trim() || programForm.duration_days <= 0) {
      setErrorMsg('Program name is required and duration must be greater than 0.');
      return;
    }

    try {
      setErrorMsg(null);
      const payload = {
        name: programForm.name.trim(),
        skill_level: programForm.skill_level,
        duration_days: Number(programForm.duration_days),
        prerequisites: programForm.prerequisites.trim() || undefined,
      };

      if (editingProgram) {
        await trainingCatalogApi.updateProgram(editingProgram.id, payload);
        showSuccess(`Program "${payload.name}" updated successfully.`);
      } else {
        await trainingCatalogApi.createProgram(selectedTrackId, payload);
        showSuccess(`Program "${payload.name}" created successfully.`);
      }

      setIsProgramModalOpen(false);
      loadTrackTree(selectedTrackId);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save training program.');
    }
  };

  const handleDeleteProgram = async (program: TrainingProgram) => {
    if (!window.confirm(`Are you sure you want to delete program "${program.name}"?`)) return;

    try {
      setErrorMsg(null);
      await trainingCatalogApi.deleteProgram(program.id);
      showSuccess(`Program "${program.name}" deleted successfully.`);
      if (selectedProgramId === program.id) {
        setSelectedProgramId(null);
      }
      if (selectedTrackId) loadTrackTree(selectedTrackId);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to delete program.');
    }
  };

  // ==========================================
  // MODULE HANDLERS & REORDERING
  // ==========================================
  const handleOpenModuleModal = (moduleItem?: TrainingModule) => {
    if (moduleItem) {
      setEditingModule(moduleItem);
      setModuleForm({
        name: moduleItem.name,
        day_number: moduleItem.day_number,
        content_type: moduleItem.content_type,
        content_url: moduleItem.content_url || '',
        sequence_order: moduleItem.sequence_order,
      });
    } else {
      setEditingModule(null);
      const existingModules = selectedProgram?.modules || [];
      const nextSeq = existingModules.length > 0
        ? Math.max(...existingModules.map((m) => m.sequence_order)) + 1
        : 1;
      const nextDay = existingModules.length > 0
        ? Math.min(existingModules.length + 1, selectedProgram?.duration_days || 10)
        : 1;

      setModuleForm({
        name: '',
        day_number: nextDay,
        content_type: 'video',
        content_url: '',
        sequence_order: nextSeq,
      });
    }
    setIsModuleModalOpen(true);
  };

  const isModuleDayExceeded = Boolean(
    selectedProgram && Number(moduleForm.day_number) > selectedProgram.duration_days
  );

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId || !selectedProgram) return;

    if (isModuleDayExceeded) {
      setErrorMsg(`Day number (${moduleForm.day_number}) cannot exceed program duration (${selectedProgram.duration_days} days).`);
      return;
    }

    if (!moduleForm.name.trim()) {
      setErrorMsg('Module name is required.');
      return;
    }

    try {
      setErrorMsg(null);
      const payload = {
        name: moduleForm.name.trim(),
        day_number: Number(moduleForm.day_number),
        content_type: moduleForm.content_type,
        content_url: moduleForm.content_url.trim() || undefined,
        sequence_order: Number(moduleForm.sequence_order),
      };

      if (editingModule) {
        await trainingCatalogApi.updateModule(editingModule.id, payload);
        showSuccess(`Module "${payload.name}" updated successfully.`);
      } else {
        await trainingCatalogApi.createModule(selectedProgramId, payload);
        showSuccess(`Module "${payload.name}" created successfully.`);
      }

      setIsModuleModalOpen(false);
      if (selectedTrackId) loadTrackTree(selectedTrackId);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save training module.');
    }
  };

  const handleDeleteModule = async (moduleItem: TrainingModule) => {
    if (!window.confirm(`Are you sure you want to delete module "${moduleItem.name}"?`)) return;

    try {
      setErrorMsg(null);
      await trainingCatalogApi.deleteModule(moduleItem.id);
      showSuccess(`Module "${moduleItem.name}" deleted successfully.`);
      if (selectedTrackId) loadTrackTree(selectedTrackId);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to delete module.');
    }
  };

  const handleMoveModule = async (currentIndex: number, direction: 'up' | 'down') => {
    if (!selectedProgram || !selectedTrackId) return;

    const modules = [...selectedProgram.modules];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= modules.length) return;

    // Swap items
    const temp = modules[currentIndex];
    modules[currentIndex] = modules[targetIndex];
    modules[targetIndex] = temp;

    // Reassign sequence orders 1..N
    const reorderPayload = modules.map((m, idx) => ({
      module_id: m.id,
      sequence_order: idx + 1,
    }));

    try {
      setErrorMsg(null);
      await trainingCatalogApi.reorderModules(selectedProgram.id, reorderPayload);
      showSuccess('Modules sequence reordered successfully.');
      loadTrackTree(selectedTrackId);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to reorder modules.');
    }
  };

  // Helper badge renderers
  const getSkillBadge = (level: SkillLevel) => {
    switch (level) {
      case 'beginner':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'advanced':
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-indigo-600" />;
      case 'document':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'lab':
        return <FlaskConical className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getContentTypeBadge = (type: ContentType) => {
    switch (type) {
      case 'video':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'document':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'lab':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  // Filtered tracks list
  const filteredTracks = tracks.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.target_role_profile_name &&
        t.target_role_profile_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================== */}
      {/* TOP NAVIGATION / BREADCRUMB BAR            */}
      {/* ========================================== */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button
            onClick={() => {
              setSelectedTrackId(null);
              setSelectedProgramId(null);
            }}
            className={`hover:text-blue-600 transition-colors flex items-center gap-1.5 ${
              !selectedTrackId ? 'text-blue-700 font-extrabold' : ''
            }`}
          >
            <GitBranch className="w-4 h-4 text-blue-600" />
            <span>Training Tracks</span>
          </button>

          {selectedTrack && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <button
                onClick={() => setSelectedProgramId(null)}
                className={`hover:text-blue-600 transition-colors ${
                  !selectedProgramId ? 'text-blue-700 font-extrabold' : ''
                }`}
              >
                {selectedTrack.name}
              </button>
            </>
          )}

          {selectedProgram && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-blue-700 font-extrabold truncate max-w-[250px]">
                {selectedProgram.name}
              </span>
            </>
          )}
        </nav>

        {/* Level Navigation Back Buttons */}
        <div>
          {selectedProgramId ? (
            <button
              onClick={() => setSelectedProgramId(null)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Programs</span>
            </button>
          ) : selectedTrackId ? (
            <button
              onClick={() => setSelectedTrackId(null)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Tracks</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Error & Success Messages */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-medium flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-xs font-bold underline hover:text-rose-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
          <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <p className="text-xs font-medium">Loading catalog data...</p>
        </div>
      ) : (
        <>
          {/* ========================================== */}
          {/* LEVEL 1: TRACKS LIST VIEW                  */}
          {/* ========================================== */}
          {!selectedTrackId && (
            <div className="space-y-6">
              {/* Level 1 Title Header Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <GitBranch className="w-7 h-7 text-blue-600" />
                    <span>Training Catalog Builder</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Structure multi-level training tracks, programs, and daily learning modules for enterprise roles.
                  </p>
                </div>

                {canManage && (
                  <button
                    onClick={() => handleOpenTrackModal()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Track</span>
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tracks by name or target role profile..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  Total Tracks: {filteredTracks.length}
                </div>
              </div>

              {filteredTracks.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                  <GitBranch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">No Training Tracks Found</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? 'No tracks match your search filter.'
                      : 'Get started by creating your first training track using the "+ New Track" action.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredTracks.map((track) => (
                    <div
                      key={track.id}
                      className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Header Badge & Title */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                            <GitBranch className="w-5 h-5" />
                          </div>
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {track.duration_days} Days
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {track.name}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[32px]">
                          {track.description || 'No description provided.'}
                        </p>

                        {/* Linked Role Profile */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="text-[11px] font-medium text-slate-500">Target Role:</span>
                          {track.target_role_profile_name ? (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[11px] rounded-md truncate">
                              {track.target_role_profile_name}
                            </span>
                          ) : (
                            <span className="text-[11px] italic text-slate-400">Unassigned</span>
                          )}
                        </div>
                      </div>

                      {/* Footer Info & Actions */}
                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-500">
                          {track.program_count || 0} Program(s)
                        </span>

                        <div className="flex items-center gap-2">
                          {canManage && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenTrackModal(track);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Track"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTrack(track);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Track"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedTrackId(track.id)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                          >
                            <span>Programs</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* LEVEL 2: PROGRAMS LIST VIEW                */}
          {/* ========================================== */}
          {selectedTrackId && !selectedProgramId && currentTrackTree && (
            <div className="space-y-6">
              {/* Track Summary Banner Card */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 font-extrabold text-[10px] uppercase tracking-wider rounded-md border border-blue-400/30">
                      Training Track
                    </span>
                    {currentTrackTree.target_role_profile_name && (
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-semibold text-[10px] rounded-md border border-emerald-400/30">
                        Target Role: {currentTrackTree.target_role_profile_name}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-black text-white">{currentTrackTree.name}</h1>
                  <p className="text-xs text-slate-300 max-w-2xl">
                    {currentTrackTree.description || 'No description provided for this track.'}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-4 bg-white/10 p-3 rounded-xl backdrop-blur-xs">
                    <div className="text-center px-3">
                      <span className="text-lg font-black text-white block">
                        {currentTrackTree.duration_days}
                      </span>
                      <span className="text-[10px] text-slate-300 font-semibold uppercase">Total Days</span>
                    </div>
                    <div className="h-8 w-[1px] bg-white/20" />
                    <div className="text-center px-3">
                      <span className="text-lg font-black text-white block">
                        {currentTrackTree.programs.length}
                      </span>
                      <span className="text-[10px] text-slate-300 font-semibold uppercase">Programs</span>
                    </div>
                  </div>

                  {canManage && (
                    <button
                      onClick={() => handleOpenProgramModal()}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Program</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Programs Section Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>Training Programs ({currentTrackTree.programs.length})</span>
                </h3>
              </div>

              {currentTrackTree.programs.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">No Programs Found</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    This track currently has no programs assigned. Click "+ New Program" above to add one.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {currentTrackTree.programs.map((program) => (
                    <div
                      key={program.id}
                      className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span
                            className={`px-2.5 py-0.5 text-[11px] font-extrabold rounded-md uppercase tracking-wider border ${getSkillBadge(
                              program.skill_level
                            )}`}
                          >
                            {program.skill_level}
                          </span>
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {program.duration_days} Days
                          </span>
                        </div>

                        <h4 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {program.name}
                        </h4>

                        {program.prerequisites && (
                          <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="font-bold text-slate-700">Prerequisites: </span>
                            <span>{program.prerequisites}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-500">
                          {program.modules?.length || 0} Module(s)
                        </span>

                        <div className="flex items-center gap-2">
                          {canManage && (
                            <>
                              <button
                                onClick={() => handleOpenProgramModal(program)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Program"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProgram(program)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Program"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedProgramId(program.id)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
                          >
                            <span>Manage Modules</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* LEVEL 3: MODULES LIST VIEW & REORDERING    */}
          {/* ========================================== */}
          {selectedTrackId && selectedProgramId && selectedProgram && (
            <div className="space-y-6">
              {/* Program Summary Header Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-md border ${getSkillBadge(
                        selectedProgram.skill_level
                      )}`}
                    >
                      {selectedProgram.skill_level}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Duration: {selectedProgram.duration_days} Days max
                    </span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-900">{selectedProgram.name}</h1>
                  {selectedProgram.prerequisites && (
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Prerequisites:</span>{' '}
                      {selectedProgram.prerequisites}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {canManage && (
                    <button
                      onClick={() => handleOpenModuleModal()}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Module</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Modules Sequence List Container */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Curriculum Sequence ({selectedProgram.modules?.length || 0} Modules)</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    Use Up/Down arrows to adjust module sequence order
                  </span>
                </div>

                {(!selectedProgram.modules || selectedProgram.modules.length === 0) ? (
                  <div className="p-12 text-center">
                    <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-700">No Modules Added Yet</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Add modules to construct the daily learning sequence for this program. Click "+ New Module" above.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {selectedProgram.modules.map((mod, idx) => (
                      <div
                        key={mod.id}
                        className="px-6 py-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4 group"
                      >
                        {/* Left Info: Rank Controls, Day badge, Type icon, Name */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Reorder Buttons */}
                          {canManage && (
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button
                                disabled={idx === 0}
                                onClick={() => handleMoveModule(idx, 'up')}
                                className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 hover:bg-slate-200/50 rounded transition-colors"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={idx === selectedProgram.modules.length - 1}
                                onClick={() => handleMoveModule(idx, 'down')}
                                className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 hover:bg-slate-200/50 rounded transition-colors"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Sequence Number */}
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                            #{mod.sequence_order}
                          </div>

                          {/* Day Number Badge */}
                          <div className="px-3 py-1 bg-blue-50 text-blue-800 font-extrabold text-xs rounded-xl border border-blue-100 shrink-0">
                            Day {mod.day_number}
                          </div>

                          {/* Content Type Icon Badge */}
                          <div
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 shrink-0 ${getContentTypeBadge(
                              mod.content_type
                            )}`}
                          >
                            {getContentTypeIcon(mod.content_type)}
                            <span className="capitalize">{mod.content_type}</span>
                          </div>

                          {/* Module Name & Link */}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {mod.name}
                            </h4>
                            {mod.content_url && (
                              <a
                                href={mod.content_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5 truncate"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>{mod.content_url}</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Right Actions */}
                        {canManage && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleOpenModuleModal(mod)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Module"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteModule(mod)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Module"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================== */}
      {/* TRACK MODAL                                */}
      {/* ========================================== */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              {editingTrack ? 'Edit Training Track' : 'Create New Training Track'}
            </h3>

            <form onSubmit={handleSaveTrack} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Track Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={trackForm.name}
                  onChange={(e) => setTrackForm({ ...trackForm, name: e.target.value })}
                  placeholder='e.g., "AWS Cloud Engineer Track"'
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Role Profile (Optional)
                </label>
                <select
                  value={trackForm.target_role_profile_id}
                  onChange={(e) =>
                    setTrackForm({ ...trackForm, target_role_profile_id: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="">-- Select Linked Role Profile --</option>
                  {roleProfiles.map((rp) => (
                    <option key={rp.id} value={rp.id}>
                      {rp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Duration (Days) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={trackForm.duration_days}
                  onChange={(e) =>
                    setTrackForm({ ...trackForm, duration_days: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={trackForm.description}
                  onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })}
                  placeholder="Overview of curriculum goals..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTrackModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all"
                >
                  {editingTrack ? 'Update Track' : 'Create Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* PROGRAM MODAL                              */}
      {/* ========================================== */}
      {isProgramModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              {editingProgram ? 'Edit Training Program' : 'Create New Training Program'}
            </h3>

            <form onSubmit={handleSaveProgram} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Program Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={programForm.name}
                  onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                  placeholder='e.g., "AWS Fundamentals to Deployment"'
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Skill Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={programForm.skill_level}
                    onChange={(e) =>
                      setProgramForm({ ...programForm, skill_level: e.target.value as SkillLevel })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duration (Days) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={programForm.duration_days}
                    onChange={(e) =>
                      setProgramForm({
                        ...programForm,
                        duration_days: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prerequisites</label>
                <textarea
                  rows={2}
                  value={programForm.prerequisites}
                  onChange={(e) => setProgramForm({ ...programForm, prerequisites: e.target.value })}
                  placeholder='e.g., "Basic cloud computing concepts"'
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProgramModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all"
                >
                  {editingProgram ? 'Update Program' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODULE MODAL & INLINE VALIDATION           */}
      {/* ========================================== */}
      {isModuleModalOpen && selectedProgram && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              {editingModule ? 'Edit Training Module' : 'Create New Training Module'}
            </h3>

            <form onSubmit={handleSaveModule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Module Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={moduleForm.name}
                  onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                  placeholder='e.g., "EC2 Basics"'
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Day Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={moduleForm.day_number}
                    onChange={(e) =>
                      setModuleForm({
                        ...moduleForm,
                        day_number: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-medium focus:ring-2 focus:outline-none ${
                      isModuleDayExceeded
                        ? 'border-rose-300 bg-rose-50 text-rose-900 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Content Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={moduleForm.content_type}
                    onChange={(e) =>
                      setModuleForm({
                        ...moduleForm,
                        content_type: e.target.value as ContentType,
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                    <option value="lab">Lab</option>
                  </select>
                </div>
              </div>

              {/* Inline Validation Error Banner */}
              {isModuleDayExceeded && (
                <div className="p-3 bg-rose-100 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    Validation Error: Day number ({moduleForm.day_number}) cannot exceed parent
                    program duration ({selectedProgram.duration_days} days).
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Content URL / Resource Link
                </label>
                <input
                  type="url"
                  value={moduleForm.content_url}
                  onChange={(e) => setModuleForm({ ...moduleForm, content_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModuleModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isModuleDayExceeded}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-md transition-all"
                >
                  {editingModule ? 'Update Module' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
