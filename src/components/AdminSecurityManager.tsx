import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  User, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  LogOut, 
  History, 
  Clock, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Terminal,
  FileText,
  Trash2,
  Sparkles,
  Copy,
  ExternalLink
} from 'lucide-react';
import { adminAuthService } from '../services/adminAuthService';
import { AdminUser, SecurityAuditLog } from '../types';

interface AdminSecurityManagerProps {
  currentUser: AdminUser | null;
  onLogout: () => void;
  onProfileUpdated: (user: AdminUser) => void;
}

export const AdminSecurityManager: React.FC<AdminSecurityManagerProps> = ({
  currentUser,
  onLogout,
  onProfileUpdated,
}) => {
  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile update state
  const [nameInput, setNameInput] = useState(currentUser?.name || '');
  const [emailInput, setEmailInput] = useState(currentUser?.email || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);

  const refreshLogs = () => {
    setAuditLogs(adminAuthService.getAuditLogs());
  };

  const handleCopyDirectLink = () => {
    const url = `${window.location.origin}/?admin=true`;
    navigator.clipboard.writeText(url);
    setCopiedDirect(true);
    setTimeout(() => setCopiedDirect(false), 2500);
  };

  useEffect(() => {
    refreshLogs();
    if (currentUser) {
      setNameInput(currentUser.name);
      setEmailInput(currentUser.email);
    }
  }, [currentUser]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    if (newPassword.length < 4) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 4 characters long.' });
      return;
    }

    const res = adminAuthService.changePassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordMsg({ type: 'success', text: res.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      refreshLogs();
    } else {
      setPasswordMsg({ type: 'error', text: res.message });
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);

    const res = adminAuthService.updateProfile(nameInput, emailInput);
    if (res.success) {
      setProfileMsg({ type: 'success', text: res.message });
      const updatedUser = adminAuthService.getCurrentUser();
      if (updatedUser) onProfileUpdated(updatedUser);
      refreshLogs();
    } else {
      setProfileMsg({ type: 'error', text: res.message });
    }
  };

  const handleResetDefaults = () => {
    adminAuthService.resetToDefaults();
    setConfirmResetOpen(false);
    setPasswordMsg({ type: 'success', text: 'Admin credentials restored to defaults: admin / admin' });
    const updated = adminAuthService.getCurrentUser();
    if (updated) onProfileUpdated(updated);
    refreshLogs();
  };

  const handleClearLogs = () => {
    adminAuthService.clearAuditLogs();
    refreshLogs();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Admin Authentication & Access Control
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Session Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage your administrator credentials, update contact records, and inspect security audit trails.
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer shadow-sm hover:shadow-md"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out / Lock Admin</span>
        </button>
      </div>

      {/* Grid: Profile & Password Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: Change Password */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Change Admin Password</h3>
                <p className="text-[11px] text-slate-500">Update the secret password required to unlock this portal.</p>
              </div>
            </div>

            {passwordMsg && (
              <div
                className={`mt-4 p-3 rounded-2xl text-xs flex items-start gap-2 ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {passwordMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 4 characters"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Locked out or forgot password?</span>
            <button
              onClick={() => setConfirmResetOpen(true)}
              className="text-amber-600 hover:text-amber-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>

        {/* Card 2: Profile & Account Information */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Admin Account Profile</h3>
                <p className="text-[11px] text-slate-500">Contact details and role assignment for operations notifications.</p>
              </div>
            </div>

            {profileMsg && (
              <div
                className={`mt-4 p-3 rounded-2xl text-xs flex items-start gap-2 ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Administrator Name"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Primary Admin Email
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="admin@tripmytour.com"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Role</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">{currentUser?.role || 'Super Admin'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Session Expiry</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">Active (30 Days)</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Save Profile Information</span>
                </button>
              </div>
            </form>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Last Signed In:</span>
            <span className="font-mono text-slate-600">
              {currentUser?.lastLoginAt ? new Date(currentUser.lastLoginAt).toLocaleString() : 'Just now'}
            </span>
          </div>
        </div>
      </div>

      {/* Out-of-Site Staff Access & Shortcuts Information */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Out-of-Site Access & Private URLs</h3>
              <p className="text-[11px] text-slate-400">All public links to this Admin Portal are hidden from the public website.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyDirectLink}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {copiedDirect ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Link Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Direct Portal Link</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">1. Direct URL Trigger</span>
            <code className="text-white font-mono text-xs font-bold block truncate">{window.location.origin}/?admin=true</code>
            <p className="text-[11px] text-slate-400">Bookmark this URL or append <code className="text-blue-300 font-mono">/?admin=true</code> to hit the portal directly.</p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">2. Keyboard Shortcut</span>
            <div className="text-white font-mono text-xs font-bold">Ctrl + Shift + A</div>
            <p className="text-[11px] text-slate-400">Press on any page to immediately open the admin authentication gate.</p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-1">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">3. Mobile Staff Tap</span>
            <div className="text-white text-xs font-bold">Footer Triple-Click</div>
            <p className="text-[11px] text-slate-400">Tap the footer copyright line 3 times rapidly to access the portal from mobile.</p>
          </div>
        </div>
      </div>

      {/* Security Audit Trail Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Security & Authentication Audit Trail</h3>
              <p className="text-[11px] text-slate-500">Live inspection log of sign-ins, password updates, and protection events.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshLogs}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Refresh Log
            </button>
            <button
              onClick={handleClearLogs}
              className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              title="Clear audit trail"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400">
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Activity Details</th>
                <th className="py-2.5 px-3">Client Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.slice(0, 10).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        log.action === 'LOGIN_SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.action === 'LOGIN_FAILED'
                          ? 'bg-rose-100 text-rose-800'
                          : log.action === 'LOGOUT'
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono whitespace-nowrap text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} •{' '}
                    {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-3 px-3 text-slate-800 font-medium">
                    {log.details}
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[11px] truncate max-w-[180px]">
                    {log.userAgent || 'Web Client'}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 italic">
                    No security events recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Resetting Defaults */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Reset Admin Credentials?</h4>
              <p className="text-xs text-slate-500 mt-1">
                This will revert the admin username to <code className="text-blue-600 font-mono font-bold">admin@tripmytour.com</code> and password to <code className="text-blue-600 font-mono font-bold">admin</code>.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResetDefaults}
                className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
