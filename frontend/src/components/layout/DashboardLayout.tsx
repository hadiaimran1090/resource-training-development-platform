import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { ProfileModal } from '../profile/ProfileModal';
import { ProfileDropdown } from './ProfileDropdown';
import { useAuth } from '../../context/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const getDashboardGreeting = (pathname: string, userName?: string) => {
  const firstName = userName ? userName.split(' ')[0] : 'User';

  if (pathname.startsWith('/admin')) {
    return {
      title: `Welcome back, ${firstName}`,
      subtitle: 'System administration & platform control overview.',
    };
  }
  if (pathname.startsWith('/mentor')) {
    return {
      title: `Welcome back, ${firstName}`,
      subtitle: "Here's what's happening with your mentees today.",
    };
  }
  if (pathname.startsWith('/practice-lead')) {
    return {
      title: `Welcome back, ${firstName}`,
      subtitle: 'Practice oversight and bench allocation tracking.',
    };
  }
  if (pathname.startsWith('/regional-lead')) {
    return {
      title: `Welcome back, ${firstName}`,
      subtitle: 'Regional operations and resource development approvals.',
    };
  }
  if (pathname.startsWith('/training-manager')) {
    return {
      title: `Welcome back, ${firstName}`,
      subtitle: 'Curriculum management and assessment progress.',
    };
  }
  if (pathname.startsWith('/resource')) {
    return {
      title: `Welcome back, ${firstName}`,
      subtitle: 'Your personal learning path & deployment readiness score.',
    };
  }
  if (pathname.startsWith('/management')) {
    return {
      title: `Welcome back, ${firstName}`,
      subtitle: 'Executive summary & strategic performance insights.',
    };
  }
  return {
    title: `Welcome back, ${firstName}`,
    subtitle: 'Resource Training & Development Platform',
  };
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const greeting = getDashboardGreeting(location.pathname, user?.name);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-700">
      <TopNavbar
        onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Profile Edit Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[260px] min-w-0 flex flex-col relative pb-12">
        {/* Top Header Bar for Desktop */}
        <header className="hidden md:flex items-center justify-between px-8 py-3 bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
          {/* Welcome Greeting on the Left */}
          <div className="flex flex-col">
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
              {greeting.title}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {greeting.subtitle}
            </p>
          </div>

          {/* Profile Dropdown Component on the Right */}
          <ProfileDropdown onOpenProfileModal={() => setProfileModalOpen(true)} />
        </header>

        {/* Subtle Ambient Background Gradient */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[80px] translate-y-1/2" />
        </div>

        <div className="z-10 relative px-4 md:px-8 py-6 max-w-[1440px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
