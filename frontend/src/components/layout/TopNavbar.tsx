import React from 'react';
import { Menu, Bell, Settings, Layers } from 'lucide-react';

interface TopNavbarProps {
  onToggleSidebar?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onToggleSidebar }) => {
  return (
    <nav className="md:hidden flex justify-between items-center w-full px-4 h-16 sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Menu"
          className="p-2 text-slate-600 hover:text-blue-600 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-blue-600 tracking-tight">RTDP</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          aria-label="Notifications"
          className="p-2 text-slate-500 hover:text-blue-600 transition-colors"
        >
          <Bell className="w-5 h-5" />
        </button>
        <button
          aria-label="Settings"
          className="p-2 text-slate-500 hover:text-blue-600 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
};
