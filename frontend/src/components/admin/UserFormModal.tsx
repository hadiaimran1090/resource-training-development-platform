import React, { useState, useEffect } from 'react';
import type {
  UserDetail,
  RoleCatalog,
  RegionCatalog,
  PracticeCatalog,
  CreateUserData,
  UpdateUserData,
} from '../../api/userApi';
import { userApi } from '../../api/userApi';
import { X, Loader2, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: UserDetail | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userToEdit,
}) => {
  const isEditMode = !!userToEdit;

  const [roles, setRoles] = useState<RoleCatalog[]>([]);
  const [regions, setRegions] = useState<RegionCatalog[]>([]);
  const [practices, setPractices] = useState<PracticeCatalog[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [regionId, setRegionId] = useState<number | ''>('');
  const [practiceId, setPracticeId] = useState<number | ''>('');
  const [status, setStatus] = useState('active');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch roles, regions, practices dropdown catalogs on mount
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        setLoadingCatalogs(true);
        const [rolesData, regionsData, practicesData] = await Promise.all([
          userApi.getRoles(),
          userApi.getRegions(),
          userApi.getPractices(),
        ]);
        const safeRoles = Array.isArray(rolesData) ? rolesData : [];
        const safeRegions = Array.isArray(regionsData) ? regionsData : [];
        const safePractices = Array.isArray(practicesData) ? practicesData : [];

        // Deduplicate catalog arrays by name
        const uniquePractices = safePractices.filter(
          (p, index, self) => index === self.findIndex((t) => t.name === p.name)
        );
        const uniqueRegions = safeRegions.filter(
          (r, index, self) => index === self.findIndex((t) => t.name === r.name)
        );

        // Strictly filter out System Administrator from client selection
        setRoles(safeRoles.filter((r) => r.name !== 'System Administrator'));
        setRegions(uniqueRegions);
        setPractices(uniquePractices);
      } catch (err: any) {
        setError('Failed to load role/region/practice catalogs.');
      } finally {
        setLoadingCatalogs(false);
      }
    };

    if (isOpen) {
      fetchCatalogs();
    }
  }, [isOpen]);

  // Populate form values when userToEdit changes
  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name || '');
      setEmail(userToEdit.email || '');
      setEmployeeId(userToEdit.employeeId || '');
      setPassword('');
      setSelectedRoleIds(userToEdit.roleIds || (userToEdit.roleId ? [userToEdit.roleId] : []));
      setRegionId(userToEdit.regionId || '');
      setPracticeId(userToEdit.practiceId || '');
      setStatus(userToEdit.status || 'active');
    } else {
      setName('');
      setEmail('');
      setEmployeeId('');
      setPassword('');
      setSelectedRoleIds([]);
      setRegionId('');
      setPracticeId('');
      setStatus('active');
    }
    setError(null);
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  // Selected Role Helper Names
  const selectedRoleNames = roles.filter((r) => selectedRoleIds.includes(r.id)).map((r) => r.name);

  // Role-Conditional Field Logic
  const isPracticeRequired = selectedRoleNames.includes('Practice Lead');
  const isRegionRequired = selectedRoleNames.includes('Regional Lead');

  const toggleRoleSelection = (id: number) => {
    if (selectedRoleIds.includes(id)) {
      setSelectedRoleIds(selectedRoleIds.filter((rId) => rId !== id));
    } else {
      setSelectedRoleIds([...selectedRoleIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side Validation
    if (!name.trim() || !email.trim() || selectedRoleIds.length === 0) {
      setError('Please fill in all mandatory fields (Name, Email) and select at least one Role.');
      return;
    }

    if (!isEditMode && !password.trim()) {
      setError('Password is required for creating a new user.');
      return;
    }

    if (isPracticeRequired && !practiceId) {
      setError('Practice assignment is required when Practice Lead role is selected.');
      return;
    }

    if (isRegionRequired && !regionId) {
      setError('Region assignment is required when Regional Lead role is selected.');
      return;
    }

    try {
      setSubmitting(true);

      if (isEditMode && userToEdit) {
        const updateData: UpdateUserData = {
          name: name.trim(),
          email: email.trim(),
          employeeId: employeeId.trim(),
          roleIds: selectedRoleIds,
          regionId: regionId ? Number(regionId) : null,
          practiceId: practiceId ? Number(practiceId) : null,
          status,
        };

        if (password.trim()) {
          updateData.password = password.trim();
        }

        await userApi.updateUser(userToEdit.id, updateData);
      } else {
        const createData: CreateUserData = {
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          employeeId: employeeId.trim() || undefined,
          roleIds: selectedRoleIds,
          regionId: regionId ? Number(regionId) : null,
          practiceId: practiceId ? Number(practiceId) : null,
          status,
        };

        await userApi.createUser(createData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Operation failed.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-6 pt-20 md:pt-24 pb-10 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditMode ? 'Edit User Profile' : 'Create New System User'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-3 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loadingCatalogs ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Loading roles & catalogs...</span>
            </div>
          ) : (
            <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ali Khan"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ali@example.com"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee ID */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">
                      Employee ID {!isEditMode && <span className="text-slate-400 font-medium">(optional)</span>}
                    </label>
                    {!isEditMode && (
                      <span className="text-[10px] text-slate-400 font-medium">Auto-generated if empty</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder={isEditMode ? 'e.g. EMP-102' : 'Leave blank to auto-generate'}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">
                      Password {!isEditMode && <span className="text-rose-500">*</span>}
                    </label>
                    {isEditMode && (
                      <span className="text-[10px] text-slate-400 font-medium">Optional on edit</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!isEditMode}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isEditMode ? 'Leave blank to keep unchanged' : '••••••••'}
                      className="w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Multi-Role Selection Checkboxes */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">
                    Assigned Roles (Select one or more) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Admin role hidden</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
                  {roles.map((r) => {
                    const isChecked = selectedRoleIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        onClick={() => toggleRoleSelection(r.id)}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by label click
                          className="mt-0.5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 leading-none">{r.name}</div>
                          {r.description && (
                            <div className="text-[10px] text-slate-500 font-normal truncate mt-0.5">
                              {r.description}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Role-Conditional Fields Section */}
              <div className="pt-2 pb-1 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Role-Conditional Scope
                  </span>
                  {selectedRoleNames.length > 0 && (
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      Roles: {selectedRoleNames.join(', ')}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Region Select */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700">
                        Region{' '}
                        {isRegionRequired && <span className="text-rose-500">* (Required)</span>}
                      </label>
                    </div>
                    <select
                      value={regionId}
                      onChange={(e) => setRegionId(e.target.value ? Number(e.target.value) : '')}
                      className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none transition-all ${
                        isRegionRequired
                          ? 'border-blue-300 ring-2 ring-blue-500/10'
                          : 'border-slate-200'
                      }`}
                    >
                      <option value="">Select Region (Optional)...</option>
                      {regions.map((reg) => (
                        <option key={reg.id} value={reg.id}>
                          {reg.name} ({reg.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Practice Select */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700">
                        Practice{' '}
                        {isPracticeRequired && <span className="text-rose-500">* (Required)</span>}
                      </label>
                    </div>
                    <select
                      value={practiceId}
                      onChange={(e) =>
                        setPracticeId(e.target.value ? Number(e.target.value) : '')
                      }
                      className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:outline-none transition-all ${
                        isPracticeRequired
                          ? 'border-blue-300 ring-2 ring-blue-500/10'
                          : 'border-slate-200'
                      }`}
                    >
                      <option value="">Select Practice (Optional)...</option>
                      {practices.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-slate-700">Account Status</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={status === 'active'}
                      onChange={() => setStatus('active')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-emerald-600">Active</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={status === 'inactive'}
                      onChange={() => setStatus('inactive')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-500">Inactive</span>
                  </label>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="user-form"
            disabled={submitting || loadingCatalogs}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : isEditMode ? (
              'Save Changes'
            ) : (
              'Create User'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
