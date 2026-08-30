import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Shield, Settings } from 'lucide-react';

interface ProfileDropdownProps {
  onOpenProfileModal: () => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onOpenProfileModal }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  const primaryRole = user?.roles?.[0] || user?.role || 'User';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Circular Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-0.5 rounded-full hover:ring-4 hover:ring-blue-500/15 transition-all focus:outline-hidden ring-2 ring-blue-500/30 shadow-sm cursor-pointer group"
        title="Click for Profile Options"
      >
        <div className="w-9 h-9 rounded-full overflow-hidden bg-blue-600 text-white font-bold flex items-center justify-center border-2 border-white shadow-2xs shrink-0">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold">{user?.name?.charAt(0) || 'U'}</span>
          )}
        </div>
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header Info */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-600 text-white font-bold flex items-center justify-center border border-white shadow-2xs shrink-0">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold">{user?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-xs text-slate-900 truncate">{user?.name}</h4>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                <Shield className="w-2.5 h-2.5" />
                {primaryRole}
              </span>
            </div>
          </div>

          {/* Menu Actions */}
          <div className="p-1.5 space-y-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenProfileModal();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors text-left"
            >
              <Settings className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Edit Profile & Password</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
