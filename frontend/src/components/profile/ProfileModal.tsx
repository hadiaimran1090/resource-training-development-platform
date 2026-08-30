import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  User as UserIcon,
  Camera,
  KeyRound,
  Shield,
  MapPin,
  IdCard,
  Mail,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImageUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('New password and confirmation password do not match.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await updateProfile({
        password: password.trim() ? password.trim() : undefined,
        profileImageUrl: profileImage,
      });

      setSuccess('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rolesList = user.roles || (user.role ? [user.role] : []);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-6 pt-16 md:pt-20 pb-8 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-md w-full overflow-hidden transition-all flex flex-col max-h-[80vh] my-auto">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-tight">Edit Profile & Account Settings</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-5 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-5 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-700 font-medium">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Avatar Section */}
          <div className="flex items-center gap-4 pb-3 border-b border-slate-100">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-md flex items-center justify-center text-slate-400">
                {profileImage ? (
                  <img src={profileImage} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-8 h-8 text-slate-300" />
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md border-2 border-white transition-transform active:scale-95 cursor-pointer"
                title="Upload Profile Image"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-sm text-slate-900 truncate">{user.name}</h4>
              <p className="text-xs text-slate-500 font-medium truncate">{user.email}</p>

              {/* User Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {rolesList.map((r) => (
                  <span
                    key={r}
                    className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full text-[10px] font-bold flex items-center gap-1"
                  >
                    <Shield className="w-2.5 h-2.5 text-blue-600" />
                    {r}
                  </span>
                ))}
                {user.region && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-slate-500" />
                    {user.region}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Account Details Read-Only Overview */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2">
              <IdCard className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Employee ID</span>
                <span className="font-bold text-slate-700 text-xs truncate block">{user.employeeId}</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Account Status</span>
                <span className="font-bold text-emerald-600 uppercase text-[11px] block">{user.status}</span>
              </div>
            </div>
          </div>

          {/* Password Update Section */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>Change Password</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  New Password <span className="text-slate-400 font-normal">(Leave blank to keep current)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {password.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Password & Profile</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
