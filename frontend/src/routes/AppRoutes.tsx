import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { ForcePasswordResetPage } from '../pages/auth/ForcePasswordResetPage';
import { ManagementDashboard } from '../pages/management/ManagementDashboard';
import { PracticeLeadDashboard } from '../pages/practice-lead/PracticeLeadDashboard';
import { ResourceDashboard } from '../pages/resource/ResourceDashboard';
import { RegionalLeadDashboard } from '../pages/regional-lead/RegionalLeadDashboard';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { TrainingManagerDashboard } from '../pages/training-manager/TrainingManagerDashboard';
import { MentorDashboard } from '../pages/mentor/MentorDashboard';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { UserDetailPage } from '../pages/admin/UserDetailPage';
import { RegionManagementPage } from '../pages/admin/RegionManagementPage';
import { PracticeManagementPage } from '../pages/admin/PracticeManagementPage';
import { ResourceManagementPage } from '../pages/admin/ResourceManagementPage';
import { SkillsCatalogPage } from '../pages/admin/SkillsCatalogPage';
import { RoleProfilesPage } from '../pages/admin/RoleProfilesPage';
import { RoleProfileDetailPage } from '../pages/admin/RoleProfileDetailPage';
import { AuditLogPage } from '../pages/admin/AuditLogPage';
import { TrainingCatalogPage } from '../pages/training-manager/TrainingCatalogPage';
import { ResourceProfilePage } from '../pages/resource/ResourceProfilePage';
import { MySkillsPage } from '../pages/resource/MySkillsPage';
import { AssignmentManagementPage } from '../pages/regional-lead/AssignmentManagementPage';
import { TrainingAssignmentsPage } from '../pages/regional-lead/TrainingAssignmentsPage';
import { RegionalLeadResourcesPage } from '../pages/regional-lead/RegionalLeadResourcesPage';
import { RegionalLeadResourceDetailPage } from '../pages/regional-lead/RegionalLeadResourceDetailPage';
import { RegionalLeadNotificationsPage } from '../pages/regional-lead/RegionalLeadNotificationsPage';
import { TodaysActivitiesPage } from '../pages/resource/TodaysActivitiesPage';
import { MyTrainingPlanPage } from '../pages/resource/MyTrainingPlanPage';
import { AssessmentManagementPage } from '../pages/training-manager/AssessmentManagementPage';
import { TakeAssessmentPage } from '../pages/resource/TakeAssessmentPage';
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
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

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

  if (user?.mustResetPassword && location.pathname !== '/force-password-reset') {
    return <Navigate to="/force-password-reset" replace />;
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
          path="/admin/audit-log"
          element={
            <RequireRole allowedRoles={['System Administrator', 'Management', 'Regional Lead', 'Practice Lead']}>
              <AuditLogPage />
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
          path="/admin/users/:id"
          element={
            <RequireRole allowedRoles={['System Administrator', 'Regional Lead', 'Training Manager', 'Practice Lead']}>
              <UserDetailPage />
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
          path="/admin/skills"
          element={
            <RequireRole allowedRoles={['System Administrator', 'Training Manager', 'Regional Lead']}>
              <SkillsCatalogPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/role-profiles"
          element={
            <RequireRole allowedRoles={['System Administrator', 'Training Manager', 'Regional Lead']}>
              <RoleProfilesPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/role-profiles/:id"
          element={
            <RequireRole allowedRoles={['System Administrator', 'Training Manager', 'Regional Lead']}>
              <RoleProfileDetailPage />
            </RequireRole>
          }
        />
        <Route
          path="/training-manager/skills"
          element={
            <RequireRole allowedRoles={['Training Manager', 'System Administrator', 'Regional Lead']}>
              <SkillsCatalogPage />
            </RequireRole>
          }
        />
        <Route
          path="/training-manager/role-profiles"
          element={
            <RequireRole allowedRoles={['Training Manager', 'System Administrator', 'Regional Lead']}>
              <RoleProfilesPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/training-catalog"
          element={
            <RequireRole allowedRoles={['System Administrator', 'Training Manager']}>
              <TrainingCatalogPage />
            </RequireRole>
          }
        />
        <Route
          path="/training-manager/training-catalog"
          element={
            <RequireRole allowedRoles={['Training Manager', 'System Administrator', 'Regional Lead']}>
              <TrainingCatalogPage />
            </RequireRole>
          }
        />
        <Route
          path="/regional-lead/assessments"
          element={
            <RequireRole allowedRoles={['Regional Lead', 'Training Manager']}>
              <AssessmentManagementPage />
            </RequireRole>
          }
        />
        <Route path="/training-catalog" element={<TrainingCatalogPage />} />
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
          path="/regional-lead/training-assignments"
          element={
            <RequireRole allowedRoles={['Regional Lead', 'System Administrator', 'Practice Lead', 'Training Manager']}>
              <TrainingAssignmentsPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/training-assignments"
          element={
            <RequireRole allowedRoles={['System Administrator', 'Training Manager', 'Regional Lead', 'Practice Lead']}>
              <TrainingAssignmentsPage />
            </RequireRole>
          }
        />
        <Route
          path="/resource/todays-activities"
          element={
            <RequireRole allowedRoles={['Resource', 'Regional Lead', 'System Administrator']}>
              <TodaysActivitiesPage />
            </RequireRole>
          }
        />
        <Route
          path="/resource/my-training-plan"
          element={
            <RequireRole allowedRoles={['Resource', 'Regional Lead', 'System Administrator']}>
              <MyTrainingPlanPage />
            </RequireRole>
          }
        />
        <Route path="/todays-activities" element={<TodaysActivitiesPage />} />
        <Route path="/my-training-plan" element={<MyTrainingPlanPage />} />
        <Route
          path="/training-manager/assessments"
          element={
            <RequireRole allowedRoles={['Training Manager', 'System Administrator']}>
              <AssessmentManagementPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/assessments"
          element={
            <RequireRole allowedRoles={['System Administrator', 'Training Manager']}>
              <AssessmentManagementPage />
            </RequireRole>
          }
        />
        <Route
          path="/resource/assessments"
          element={
            <RequireRole allowedRoles={['Resource', 'System Administrator', 'Regional Lead']}>
              <TakeAssessmentPage />
            </RequireRole>
          }
        />
        <Route path="/assessments" element={<TakeAssessmentPage />} />
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
          path="/regional-lead/resources"
          element={
            <RequireRole allowedRoles={['Regional Lead']}>
              <RegionalLeadResourcesPage />
            </RequireRole>
          }
        />
        <Route
          path="/regional-lead/resources/:resourceId"
          element={
            <RequireRole allowedRoles={['Regional Lead']}>
              <RegionalLeadResourceDetailPage />
            </RequireRole>
          }
        />
        <Route
          path="/regional-lead/notifications"
          element={
            <RequireRole allowedRoles={['Regional Lead']}>
              <RegionalLeadNotificationsPage />
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
          path="/skills"
          element={
            <RequireRole allowedRoles={['System Administrator']}>
              <MySkillsPage />
            </RequireRole>
          }
        />
        <Route path="/my-skills" element={<Navigate to="/profile" replace />} />
        <Route path="/resource/skills" element={<Navigate to="/profile" replace />} />
        <Route path="/profile" element={<ResourceProfilePage />} />
        <Route path="/resource/profile" element={<ResourceProfilePage />} />
        <Route path="/admin/profile" element={<ResourceProfilePage />} />
        <Route path="/regional-lead/profile" element={<ResourceProfilePage />} />
        <Route path="/practice-lead/profile" element={<ResourceProfilePage />} />
        <Route path="*" element={<RoleBasedDefaultRedirect />} />
      </Routes>
    </DashboardLayout>
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/force-password-reset" element={<ForcePasswordResetPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
};
