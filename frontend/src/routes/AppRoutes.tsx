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
import { Loader2, ShieldAlert } from 'lucide-react';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('System Administrator') || user?.role === 'System Administrator';

  if (!isAdmin) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-3 min-h-[60vh]">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">403 — Access Forbidden</h2>
        <p className="text-xs text-slate-500 max-w-md">
          You do not have permission to view User Management. This module is restricted exclusively to System Administrators.
        </p>
      </div>
    );
  }

  return <>{children}</>;
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
        <Route path="/" element={<Navigate to="/management/dashboard" replace />} />
        <Route path="/management/dashboard" element={<ManagementDashboard />} />
        <Route path="/practice-lead/dashboard" element={<PracticeLeadDashboard />} />
        <Route path="/resource/dashboard" element={<ResourceDashboard />} />
        <Route path="/regional-lead/dashboard" element={<RegionalLeadDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <UserManagementPage />
            </AdminRoute>
          }
        />
        <Route path="/training-manager/dashboard" element={<TrainingManagerDashboard />} />
        <Route path="/mentor/dashboard" element={<MentorDashboard />} />
        <Route path="*" element={<Navigate to="/management/dashboard" replace />} />
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
