import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  User,
  Award,
  Route,
  Calendar,
  FileCheck,
  Code,
  CheckCircle,
  History,
  Gauge,
  Armchair,
  Users,
  CheckSquare,
  BookOpen,
  FileText,
  Video,
  AlertTriangle,
  Bell,
  BarChart2,
  TrendingUp,
  FileSpreadsheet,
  UserCheck,
  Shield,
  Globe,
  Building,
  UserPlus,
  Settings,
  GitBranch,
  Layers,
  Terminal,
  LineChart,
  MessageSquare,
  Lightbulb,
  PieChart,
  Zap,
  HelpCircle,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// 1. Resource Dashboard Sidebar Configuration
const resourceSidebar: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Resource Dashboard', path: '/resource/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Learning & Development',
    items: [
      { name: 'My Training Plan', path: '/resource/dashboard#training-plan', icon: Route },
      { name: "Today's Activities", path: '/resource/dashboard#activities', icon: Calendar },
      { name: 'Assessments', path: '/resource/dashboard#assessments', icon: FileCheck },
      { name: 'Coding Challenges', path: '/resource/dashboard#challenges', icon: Code },
    ],
  },
  {
    title: 'Career & Profile',
    items: [
      { name: 'My Profile', path: '/resource/dashboard#profile', icon: User },
      { name: 'My Skills', path: '/resource/dashboard#skills', icon: Award },
      { name: 'Certifications', path: '/resource/dashboard#certifications', icon: CheckCircle },
      { name: 'Interview History', path: '/resource/dashboard#interview-history', icon: History },
      { name: 'My Readiness Score', path: '/resource/dashboard#readiness', icon: Gauge },
    ],
  },
];

// 2. Regional Lead Dashboard Sidebar Configuration
const regionalLeadSidebar: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Regional Lead Dashboard', path: '/regional-lead/dashboard', icon: LayoutDashboard },
      { name: 'Bench Overview', path: '/regional-lead/dashboard#bench-overview', icon: Armchair },
      { name: 'Resources', path: '/regional-lead/dashboard#resources', icon: Users },
    ],
  },
  {
    title: 'Approvals & Tracking',
    items: [
      { name: 'Development Plans (approve)', path: '/regional-lead/dashboard#dev-plans', icon: CheckSquare },
      { name: 'Training Assignments', path: '/regional-lead/dashboard#training', icon: BookOpen },
      { name: 'Assessments Review', path: '/regional-lead/dashboard#assessments-review', icon: FileText },
      { name: 'Interviews', path: '/regional-lead/dashboard#interviews', icon: Video },
    ],
  },
  {
    title: 'Alerts & System',
    items: [
      { name: 'At-Risk Resources', path: '/regional-lead/dashboard#at-risk', icon: AlertTriangle },
      { name: 'Notifications', path: '/regional-lead/dashboard#notifications', icon: Bell },
    ],
  },
];

// 3. Practice Lead Dashboard Sidebar Configuration
const practiceLeadSidebar: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Practice Lead Dashboard', path: '/practice-lead/dashboard', icon: LayoutDashboard },
      { name: 'Org Bench Overview', path: '/practice-lead/dashboard#bench-overview', icon: Armchair },
    ],
  },
  {
    title: 'Analytics & Programs',
    items: [
      { name: 'Regional Comparison', path: '/practice-lead/dashboard#regional-comparison', icon: BarChart2 },
      { name: 'Development Metrics', path: '/practice-lead/dashboard#dev-metrics', icon: TrendingUp },
      { name: 'Strategic Program Approvals', path: '/practice-lead/dashboard#approvals', icon: CheckSquare },
      { name: 'Reports', path: '/practice-lead/dashboard#reports', icon: FileSpreadsheet },
    ],
  },
];

// 4. System Administrator Dashboard Sidebar Configuration
const adminSidebar: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'System Administrator Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'User & Access Control',
    items: [
      { name: 'User Management', path: '/admin/users', icon: UserCheck },
      { name: 'Roles', path: '/admin/dashboard#roles', icon: Shield },
      { name: 'Regions', path: '/admin/dashboard#regions', icon: Globe },
      { name: 'Practices', path: '/admin/dashboard#practices', icon: Building },
    ],
  },
  {
    title: 'Catalog & Profiles',
    items: [
      { name: 'Skills Catalog', path: '/admin/dashboard#skills-catalog', icon: BookOpen },
      { name: 'Role Profiles', path: '/admin/dashboard#role-profiles', icon: UserPlus },
    ],
  },
  {
    title: 'System Control',
    items: [
      { name: 'System Settings', path: '/admin/dashboard#settings', icon: Settings },
      { name: 'Audit Log', path: '/admin/dashboard#audit-log', icon: History },
    ],
  },
];

// 5. Training Manager Dashboard Sidebar Configuration
const trainingManagerSidebar: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Training Manager Dashboard', path: '/training-manager/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Curriculum & Content',
    items: [
      { name: 'Training Tracks', path: '/training-manager/dashboard#tracks', icon: GitBranch },
      { name: 'Programs', path: '/training-manager/dashboard#programs', icon: BookOpen },
      { name: 'Modules', path: '/training-manager/dashboard#modules', icon: Layers },
      { name: 'Daily Activity Templates', path: '/training-manager/dashboard#templates', icon: Calendar },
      { name: 'Assessments', path: '/training-manager/dashboard#assessments', icon: FileCheck },
      { name: 'Coding Challenges', path: '/training-manager/dashboard#challenges', icon: Terminal },
    ],
  },
  {
    title: 'Requirements & Reports',
    items: [
      { name: 'Role Profiles', path: '/training-manager/dashboard#profiles', icon: UserPlus },
      { name: 'Effectiveness Reports', path: '/training-manager/dashboard#reports', icon: LineChart },
    ],
  },
];

// 6. Mentor / SME Dashboard Sidebar Configuration
const mentorSidebar: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Mentor / SME Dashboard', path: '/mentor/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Mentorship Activities',
    items: [
      { name: 'My Mentees', path: '/mentor/dashboard#mentees', icon: Users },
      { name: 'Coding Review Queue', path: '/mentor/dashboard#review-queue', icon: Code },
      { name: 'Mock Interviews', path: '/mentor/dashboard#mock-interviews', icon: Video },
      { name: 'Feedback History', path: '/mentor/dashboard#feedback-history', icon: MessageSquare },
      { name: 'Recommendations', path: '/mentor/dashboard#recommendations', icon: Lightbulb },
    ],
  },
];

// 7. Management Dashboard Sidebar Configuration
const managementSidebar: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Management Dashboard', path: '/management/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Executive Insights',
    items: [
      { name: 'Executive Summary', path: '/management/dashboard#executive-summary', icon: TrendingUp },
      { name: 'Bench Trends', path: '/management/dashboard#bench-trends', icon: LineChart },
      { name: 'Readiness Distribution', path: '/management/dashboard#readiness-distribution', icon: PieChart },
      { name: 'Interview & Deployment Metrics', path: '/management/dashboard#deployment-metrics', icon: BarChart2 },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const currentPath = location.pathname;

  // Determine exact sidebar config based on current dashboard route
  let navSections: NavSection[] = managementSidebar;

  if (currentPath.startsWith('/resource')) {
    navSections = resourceSidebar;
  } else if (currentPath.startsWith('/regional-lead')) {
    navSections = regionalLeadSidebar;
  } else if (currentPath.startsWith('/practice-lead')) {
    navSections = practiceLeadSidebar;
  } else if (currentPath.startsWith('/admin')) {
    navSections = adminSidebar;
  } else if (currentPath.startsWith('/training-manager')) {
    navSections = trainingManagerSidebar;
  } else if (currentPath.startsWith('/mentor')) {
    navSections = mentorSidebar;
  } else if (currentPath.startsWith('/management')) {
    navSections = managementSidebar;
  }

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-[260px] bg-white border-r border-slate-200 shadow-sm z-50 py-5 text-slate-700 overflow-x-hidden select-none">
      {/* Brand Header */}
      <div className="px-5 mb-5 flex flex-col gap-0.5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 shrink-0">
            <span className="text-base font-extrabold">R</span>
          </div>
          <h1 className="font-bold text-lg text-slate-900 tracking-tight truncate">RTDP Global</h1>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pl-11 truncate">
          Enterprise Resource
        </span>
      </div>

      {/* Quick Action Button */}
      <div className="px-3.5 mb-5 shrink-0">
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 px-3 font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 fill-white/20 shrink-0" />
          <span>Quick Training</span>
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="px-2 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const fullItemPath = item.path;
                const isMainRoute = !fullItemPath.includes('#');

                return (
                  <NavLink
                    key={item.name + item.path}
                    to={item.path}
                    className={({ isActive }) => {
                      const isItemActive =
                        (isMainRoute && isActive) ||
                        (fullItemPath.includes('#') &&
                          currentPath + location.hash === fullItemPath);

                      return `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all overflow-hidden ${
                        isItemActive
                          ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`;
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {isMainRoute && (
                      <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0 ml-1" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Support / Logout */}
      <div className="px-3.5 mt-auto pt-3 border-t border-slate-100 space-y-0.5 shrink-0">
        <button className="w-full flex items-center gap-2.5 text-slate-600 hover:text-slate-900 px-2.5 py-2 hover:bg-slate-50 transition-all rounded-lg text-xs font-semibold">
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>Support</span>
        </button>
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full flex items-center gap-2.5 text-slate-600 hover:text-rose-600 px-2.5 py-2 hover:bg-slate-50 transition-all rounded-lg text-xs font-semibold"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
