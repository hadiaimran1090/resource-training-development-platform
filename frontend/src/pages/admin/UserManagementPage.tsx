import React, { useState, useEffect } from 'react';
import type { UserDetail, RoleCatalog } from '../../api/userApi';
import { userApi } from '../../api/userApi';
import { UserFormModal } from '../../components/admin/UserFormModal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Power,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building,
  Globe,
  Trash2,
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [roles, setRoles] = useState<RoleCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserDetail | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserDetail | null>(null);

  const fetchUsersAndRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, rolesData] = await Promise.all([
        userApi.getUsers({
          search,
          roleId: roleFilter ? Number(roleFilter) : undefined,
          status: statusFilter || undefined,
        }),
        userApi.getRoles(),
      ]);

      setUsers(usersData);
      setRoles(rolesData);
    } catch (err: any) {
      console.error('Fetch users error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load user list.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setDeletingUserId(userToDelete.id);
      await userApi.deleteUser(userToDelete.id);
      setUserToDelete(null);
      await fetchUsersAndRoles();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to delete user.');
    } finally {
      setDeletingUserId(null);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, [search, roleFilter, statusFilter]);

  const handleOpenCreateModal = () => {
    setSelectedUserForEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserDetail) => {
    setSelectedUserForEdit(user);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (user: UserDetail) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      setTogglingStatusId(user.id);
      await userApi.updateUserStatus(user.id, newStatus);
      await fetchUsersAndRoles();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setTogglingStatusId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto selection:bg-blue-500 selection:text-white">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              User Management
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Manage system access, assign roles, regions, practices, and control user activation.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>


      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or EMP ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-600">Filters:</span>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value ? Number(e.target.value) : '')}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* User Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {error ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="text-xs font-bold text-rose-600">{error}</p>
            <button
              onClick={fetchUsersAndRoles}
              className="mt-2 text-xs font-bold text-blue-600 hover:underline"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-slate-500">Loading user directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
            <Users className="w-10 h-10 text-slate-300" />
            <h3 className="text-sm font-bold text-slate-700">No users found</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              No user records match your search or filter parameters. Try clearing filters or adding a new user.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">User Details</th>
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Region</th>
                  <th className="py-3.5 px-4">Practice</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* User Name & Email */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-100">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{user.name}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Employee ID */}
                    <td className="py-4 px-4">
                      <code className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-[11px] font-mono font-bold">
                        {user.employeeId}
                      </code>
                    </td>

                    {/* Role Badges */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 items-center max-w-[200px]">
                        {(user.roles && user.roles.length > 0 ? user.roles : [user.role || 'Resource']).map(
                          (roleName, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200"
                            >
                              <ShieldCheck className="w-3 h-3 text-blue-600 shrink-0" />
                              {roleName}
                            </span>
                          )
                        )}
                      </div>
                    </td>

                    {/* Region */}
                    <td className="py-4 px-4 text-slate-600">
                      {user.region ? (
                        <span className="inline-flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          {user.region}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Practice */}
                    <td className="py-4 px-4 text-slate-600">
                      {user.practice ? (
                        <span className="inline-flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {user.practice}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      {user.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          <XCircle className="w-3 h-3 text-slate-400" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={togglingStatusId === user.id}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.status === 'active'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={user.status === 'active' ? 'Deactivate User' : 'Activate User'}
                        >
                          {togglingStatusId === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          ) : (
                            <Power className="w-4 h-4" />
                          )}
                        </button>
                        {!user.roles?.includes('System Administrator') && (
                          <button
                            onClick={() => setUserToDelete(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsersAndRoles}
        userToEdit={selectedUserForEdit}
      />

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Delete User Account</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete user <span className="font-bold text-slate-800">{userToDelete.name}</span> (<code className="bg-slate-100 px-1 rounded">{userToDelete.email}</code>)? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deletingUserId === userToDelete.id}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {deletingUserId === userToDelete.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete User</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
