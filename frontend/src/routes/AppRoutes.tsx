import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { ManagementDashboard } from '../pages/management/ManagementDashboard';
import { PracticeLeadDashboard } from '../pages/practice-lead/PracticeLeadDashboard';
import { ResourceDashboard } from '../pages/resource/ResourceDashboard';
import { RegionalLeadDashboard } from '../pages/regional-lead/RegionalLeadDashboard';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { TrainingManagerDashboard } from '../pages/training-manager/TrainingManagerDashboard';
import { MentorDashboard } from '../pages/mentor/MentorDashboard';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { RegionManagementPage } from '../pages/admin/RegionManagementPage';
import { PracticeManagementPage } from '../pages/admin/PracticeManagementPage';
import { ResourceManagementPage } from '../pages/admin/ResourceManagementPage';
import { ResourceProfilePage } from '../pages/resource/ResourceProfilePage';
import { AssignmentManagementPage } from '../pages/regional-lead/AssignmentManagementPage';
import { Loader2, ShieldAlert } from 'lucide-react';

const RequireRole: React.FC<{ allowedRoles: string[]; children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const { user } = useAuth();
  const userRoles = user?.roles || (user?.role ? [user.role] : []);
  const hasAccess = userRoles.some((r) => allowedRoles.includes(r));

  if (!hasAccess) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-3 min-h-[60vh]">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">403 — Access Forbidden</h2>
        <p className="text-xs text-slate-500 max-w-md">
          You do not have permission to view this module. Access is restricted to users with assigned role(s): [{allowedRoles.join(', ')}].
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

const RoleBasedDefaultRedirect: React.FC = () => {
  const { user } = useAuth();
  const roles = user?.roles || (user?.role ? [user.role] : []);

  if (roles.includes('System Administrator')) return <Navigate to="/admin/dashboard" replace />;
  if (roles.includes('Practice Lead')) return <Navigate to="/practice-lead/dashboard" replace />;
  if (roles.includes('Regional Lead')) return <Navigate to="/regional-lead/dashboard" replace />;
  if (roles.includes('Training Manager')) return <Navigate to="/training-manager/dashboard" replace />;
  if (roles.includes('Mentor')) return <Navigate to="/mentor/dashboard" replace />;
  if (roles.includes('Management')) return <Navigate to="/management/dashboard" replace />;
  return <Navigate to="/resource/dashboard" replace />;
};

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<RoleBasedDefaultRedirect />} />
        <Route
          path="/admin/dashboard"
          element={
            <RequireRole allowedRoles={['System Administrator']}>
              <AdminDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireRole allowedRoles={['System Administrator']}>
              <UserManagementPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/regions"
          element={
            <RequireRole allowedRoles={['System Administrator']}>
              <RegionManagementPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/practices"
          element={
            <RequireRole allowedRoles={['System Administrator']}>
              <PracticeManagementPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/resources"
          element={
            <RequireRole allowedRoles={['System Administrator']}>
              <ResourceManagementPage />
            </RequireRole>
          }
        />
        <Route
          path="/regional-lead/dashboard"
          element={
            <RequireRole allowedRoles={['Regional Lead']}>
              <RegionalLeadDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/regional-lead/assignments"
          element={
            <RequireRole allowedRoles={['Regional Lead', 'System Administrator', 'Management']}>
              <AssignmentManagementPage />
            </RequireRole>
          }
        />
        <Route
          path="/practice-lead/dashboard"
          element={
            <RequireRole allowedRoles={['Practice Lead']}>
              <PracticeLeadDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/training-manager/dashboard"
          element={
            <RequireRole allowedRoles={['Training Manager']}>
              <TrainingManagerDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/mentor/dashboard"
          element={
            <RequireRole allowedRoles={['Mentor']}>
              <MentorDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/management/dashboard"
          element={
            <RequireRole allowedRoles={['Management']}>
              <ManagementDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/resource/dashboard"
          element={
            <RequireRole allowedRoles={['Resource']}>
              <ResourceDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/resource/profile"
          element={
            <RequireRole allowedRoles={['Resource']}>
              <ResourceProfilePage />
            </RequireRole>
          }
        />
        <Route path="*" element={<RoleBasedDefaultRedirect />} />
      </Routes>
    </DashboardLayout>
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
};
