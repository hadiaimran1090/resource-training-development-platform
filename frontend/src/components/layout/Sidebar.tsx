import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  User,
  Award,
  Route,
  Target,
  Calendar,
  FileCheck,
  Briefcase,
  Code,
  CheckCircle,
  History,
  Gauge,
  Armchair,
  Users,
  CheckSquare,
  BookOpen,
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
  Terminal,
  LineChart,
  MessageSquare,
  Lightbulb,
  PieChart,
  Zap,
  LogOut,
  ChevronRight,
  X
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

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
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
      { name: 'Training Catalog', path: '/training-catalog', icon: GitBranch },
      { name: 'My Training Plan', path: '/resource/my-training-plan', icon: Route },
      { name: 'My Development Plan', path: '/resource/my-development-plan', icon: Target },
      { name: "Today's Activities", path: '/resource/todays-activities', icon: Calendar },
      { name: 'Assessments', path: '/resource/assessments', icon: FileCheck },
      { name: 'Coding Challenges', path: '/resource/coding-challenges', icon: Code },
    ],
  },
  {
    title: 'Career & Profile',
    items: [
      { name: 'My Profile', path: '/profile', icon: User },
      { name: 'My Certifications', path: '/my-certifications', icon: Award },
      { name: 'Interview History', path: '/resource/interview-history', icon: History },
      { name: 'My Readiness Score', path: '/resource/my-development-plan', icon: Gauge },
    ],
  },
];

// 2. Regional Lead Dashboard Sidebar Configuration
const regionalLeadSidebar: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Regional Lead Dashboard', path: '/regional-lead/dashboard', icon: LayoutDashboard },
      { name: 'Notifications', path: '/regional-lead/notifications', icon: Bell },
      { name: 'My Profile', path: '/profile', icon: User },
    ],
  },
  {
    title: 'Approvals & Tracking',
    items: [
      { name: 'Resources Management', path: '/regional-lead/resources', icon: Users },
      { name: 'Development Plans', path: '/regional-lead/development-plans', icon: Target },
      { name: 'Bench Management', path: '/regional-lead/assignments', icon: CheckSquare },
      { name: 'Training Assignments', path: '/regional-lead/training-assignments', icon: Route },
      { name: 'Verify Certifications', path: '/regional-lead/certifications', icon: CheckCircle },
    ],
  },
  {
    title: 'Curriculum & Catalog',
    items: [
      { name: 'Training Catalog', path: '/training-catalog', icon: GitBranch },
      { name: 'Role Profiles', path: '/admin/role-profiles', icon: UserPlus },
      { name: 'Skills Catalog', path: '/admin/skills', icon: Award },
      { name: 'Assessments', path: '/regional-lead/assessments', icon: FileCheck },
      { name: 'Coding Challenges', path: '/regional-lead/coding-challenges', icon: Terminal },
    ],
  },
  {
    title: 'Career & Profile',
    items: [
      { name: 'My Certifications', path: '/my-certifications', icon: Award },
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
      { name: 'My Profile', path: '/profile', icon: User },
    ],
  },
  {
    title: 'Analytics & Programs',
    items: [
      { name: 'Training Catalog', path: '/training-catalog', icon: GitBranch },
      { name: 'Regional Comparison', path: '/practice-lead/dashboard#regional-comparison', icon: BarChart2 },
      { name: 'Development Metrics', path: '/practice-lead/dashboard#dev-metrics', icon: TrendingUp },
      { name: 'Strategic Program Approvals', path: '/practice-lead/dashboard#approvals', icon: CheckSquare },
      { name: 'Reports', path: '/practice-lead/dashboard#reports', icon: FileSpreadsheet },
    ],
  },
  {
    title: 'Career & Profile',
    items: [
      { name: 'My Certifications', path: '/my-certifications', icon: Award },
    ],
  },
];

// 4. System Administrator Dashboard Sidebar Configuration
const adminSidebar: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'System Administrator Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'My Skills', path: '/skills', icon: Award },
      { name: 'My Profile', path: '/profile', icon: User },
    ],
  },
  {
    title: 'User & Access Control',
    items: [
      { name: 'User Management', path: '/admin/users', icon: UserCheck },
      { name: 'Regions Management', path: '/admin/regions', icon: Globe },
      { name: 'Practices Management', path: '/admin/practices', icon: Building },
      { name: 'Resources Catalog', path: '/admin/resources', icon: Users },
      { name: 'Roles', path: '/admin/dashboard#roles', icon: Shield },
    ],
  },
  {
    title: 'Approvals & Tracking',
    items: [
      { name: 'Development Plans', path: '/admin/development-plans', icon: Target },
      { name: 'Verify Certifications', path: '/admin/certifications', icon: CheckCircle },
    ],
  },
  {
    title: 'System Control',
    items: [
      { name: 'Readiness Weights', path: '/admin/readiness-weights', icon: Settings },
      { name: 'System Settings', path: '/admin/dashboard#settings', icon: Settings },
      { name: 'Audit Log', path: '/admin/audit-log', icon: History },
    ],
  },
  {
    title: 'Career & Profile',
    items: [
      { name: 'My Certifications', path: '/my-certifications', icon: Award },
    ],
  },
];

// 5. Training Manager Dashboard Sidebar Configuration
const trainingManagerSidebar: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Training Manager Dashboard', path: '/training-manager/dashboard', icon: LayoutDashboard },
      { name: 'My Profile', path: '/profile', icon: User },
    ],
  },
  {
    title: 'Curriculum & Content',
    items: [
      { name: 'Training Catalog', path: '/training-manager/training-catalog', icon: GitBranch },
      { name: 'Role Profiles', path: '/training-manager/role-profiles', icon: UserPlus },
      { name: 'Daily Activity Templates', path: '/training-manager/dashboard#templates', icon: Calendar },
      { name: 'Assessments', path: '/training-manager/assessments', icon: FileCheck },
      { name: 'Coding Challenges', path: '/training-manager/coding-challenges', icon: Terminal },
    ],
  },
  {
    title: 'Approvals & Tracking',
    items: [
      { name: 'Development Plans', path: '/training-manager/development-plans', icon: Target },
    ],
  },
  {
    title: 'Requirements & Reports',
    items: [
      { name: 'Effectiveness Reports', path: '/training-manager/dashboard#reports', icon: LineChart },
    ],
  },
  {
    title: 'Career & Profile',
    items: [
      { name: 'My Certifications', path: '/my-certifications', icon: Award },
    ],
  },
];

// 6. Mentor / SME Dashboard Sidebar Configuration
const mentorSidebar: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Mentor / SME Dashboard', path: '/mentor/dashboard', icon: LayoutDashboard },
      { name: 'Training Catalog', path: '/training-catalog', icon: GitBranch },
      { name: 'My Profile', path: '/profile', icon: User },
    ],
  },
  {
    title: 'Mentorship Activities',
    items: [
      { name: 'My Mentees', path: '/mentor/dashboard#mentees', icon: Users },
      { name: 'Mentoring Sessions', path: '/mentor/sessions', icon: Calendar },
      { name: 'Coding Review Queue', path: '/mentor/coding-reviews', icon: Code },
      { name: 'Mock & Client Interviews', path: '/mentor/interviews', icon: Video },
      { name: 'Feedback History', path: '/mentor/dashboard#feedback-history', icon: MessageSquare },
      { name: 'Recommendations', path: '/mentor/dashboard#recommendations', icon: Lightbulb },
    ],
  },
  {
    title: 'Career & Profile',
    items: [
      { name: 'My Certifications', path: '/my-certifications', icon: Award },
    ],
  },
];

// 7. Management Dashboard Sidebar Configuration
const managementSidebar: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Management Dashboard', path: '/management/dashboard', icon: LayoutDashboard },
      { name: 'Training Catalog', path: '/training-catalog', icon: GitBranch },
      { name: 'My Profile', path: '/profile', icon: User },
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
  {
    title: 'Career & Profile',
    items: [
      { name: 'My Certifications', path: '/my-certifications', icon: Award },
    ],
  },
];

// Preferred Section Display Order for Multi-Role Unified Sidebar
const PREFERRED_SECTION_ORDER = [
  'Overview',
  'Learning & Development',
  'Approvals & Tracking',
  'Curriculum & Catalog',
  'User & Access Control',
  'System Control',
  'Mentorship Activities',
  'Executive Insights',
  'Analytics & Programs',
  'Career & Profile',
  'Alerts & System',
];

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const currentPath = location.pathname;

  const userRoles = user?.roles || (user?.role ? [user.role] : []);

  const roleSidebarMap: Record<string, NavSection[]> = {
    'System Administrator': adminSidebar,
    'Regional Lead': regionalLeadSidebar,
    'Practice Lead': practiceLeadSidebar,
    'Training Manager': trainingManagerSidebar,
    'Mentor': mentorSidebar,
    'Resource': resourceSidebar,
    'Management': managementSidebar,
  };

  // Determine aggregated navSections for multi-role users with strict name & path deduplication
  let navSections: NavSection[] = [];

  if (userRoles.length > 0) {
    const sectionMap = new Map<string, NavItem[]>();
    const seenPaths = new Set<string>();
    const seenNames = new Set<string>();

    userRoles.forEach((role) => {
      const config = roleSidebarMap[role];
      if (config) {
        config.forEach((section) => {
          const existingItems = sectionMap.get(section.title) || [];
          section.items.forEach((item) => {
            if (!seenPaths.has(item.path) && !seenNames.has(item.name)) {
              seenPaths.add(item.path);
              seenNames.add(item.name);
              existingItems.push(item);
            }
          });
          if (existingItems.length > 0) {
            sectionMap.set(section.title, existingItems);
          }
        });
      }
    });

    navSections = Array.from(sectionMap.entries())
      .filter(([_, items]) => items.length > 0)
      .map(([title, items]) => ({
        title,
        items,
      }));

    // Sort sections based on PREFERRED_SECTION_ORDER
    navSections.sort((a, b) => {
      const indexA = PREFERRED_SECTION_ORDER.indexOf(a.title);
      const indexB = PREFERRED_SECTION_ORDER.indexOf(b.title);
      const posA = indexA !== -1 ? indexA : 999;
      const posB = indexB !== -1 ? indexB : 999;
      return posA - posB;
    });
  }

  // Fallback to route-based resolution if roles not loaded
  if (navSections.length === 0) {
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
    } else {
      navSections = managementSidebar;
    }
  }

  return (
    <aside
      className={`flex flex-col fixed left-0 top-0 h-full w-[260px] bg-white border-r border-slate-200 shadow-xl z-50 py-5 text-slate-700 overflow-x-hidden select-none transition-transform duration-300 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="px-5 mb-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 shrink-0">
            <span className="text-base font-extrabold">R</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 tracking-tight truncate">RTDP Global</h1>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              Enterprise Resource
            </span>
          </div>
        </div>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
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
                    onClick={() => {
                      if (onMobileClose) onMobileClose();
                    }}
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
        <button
          onClick={() => {
            if (onMobileClose) onMobileClose();
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
