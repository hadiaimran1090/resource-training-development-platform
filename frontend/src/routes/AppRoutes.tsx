import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ManagementDashboard } from '../pages/management/ManagementDashboard';
import { PracticeLeadDashboard } from '../pages/practice-lead/PracticeLeadDashboard';
import { ResourceDashboard } from '../pages/resource/ResourceDashboard';
import { RegionalLeadDashboard } from '../pages/regional-lead/RegionalLeadDashboard';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { TrainingManagerDashboard } from '../pages/training-manager/TrainingManagerDashboard';
import { MentorDashboard } from '../pages/mentor/MentorDashboard';

export const AppRoutes: React.FC = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/management/dashboard" replace />} />
        <Route path="/management/dashboard" element={<ManagementDashboard />} />
        <Route path="/practice-lead/dashboard" element={<PracticeLeadDashboard />} />
        <Route path="/resource/dashboard" element={<ResourceDashboard />} />
        <Route path="/regional-lead/dashboard" element={<RegionalLeadDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/training-manager/dashboard" element={<TrainingManagerDashboard />} />
        <Route path="/mentor/dashboard" element={<MentorDashboard />} />
        <Route path="*" element={<Navigate to="/management/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
};
