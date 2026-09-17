import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2,
  Clock,
  Building,
  Terminal,
  RefreshCw,
  Copy
} from 'lucide-react';
import { adminAuthService } from '../services/adminAuthService';
import { AdminUser } from '../types';
import { BUSINESS_INFO } from '../utils/formatters';

interface AdminLoginGateProps {
  onLoginSuccess: (user: AdminUser) => void;
  onBackToSite: () => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({
  onLoginSuccess,
  onBackToSite,
}) => {
  const [identifier, setIdentifier] = useState('admin@tripmytour.com');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyDirectUrl = () => {
    const url = `${window.location.origin}/?admin=true`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  // Check lockout on mount and tick
  useEffect(() => {
    const checkLockout = () => {
      const state = adminAuthService.getLockoutState();
      if (state.isLocked) {
        setLockoutTimer(state.remainingSeconds);
      } else {
        setLockoutTimer(0);
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFillDemo = (username: string, pass: string) => {
    setIdentifier(username);
    setPassword(pass);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter both username/email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Minor visual delay for secure auth UX
    setTimeout(() => {
      const res = adminAuthService.login(identifier, password, rememberMe);
      setIsSubmitting(false);

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message);
        if (res.lockoutSeconds) {
          setLockoutTimer(res.lockoutSeconds);
        }
      }
    }, 450);
  };

  const logoUrl = localStorage.getItem('custom_logo_data') || '/logo.png';

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-100/60">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToSite}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Website</span>
          </button>

          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit SSL Secured</span>
          </span>
        </div>

        {/* Login Container Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          {/* Card Header with Brand */}
          <div className="bg-slate-900 text-white p-7 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-slate-800/90 border border-slate-700 p-2.5 rounded-2xl mb-3 shadow-inner">
                <img
                  src={logoUrl}
                  alt="TripMyTour"
                  className="h-9 w-auto max-w-[160px] object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/20 mb-2">
                <Lock className="w-3 h-3 text-blue-400" />
                <span>Authorized Staff Portal</span>
              </div>

              <h2 className="text-xl font-extrabold text-white tracking-tight">
                Operations & Admin Login
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Restricted access for TripMyTour travel desk managers, visa officers, and system administrators.
              </p>
            </div>
          </div>

          {/* Card Body & Form */}
          <div className="p-7 space-y-6">
            {/* Lockout Warning Banner */}
            {lockoutTimer > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-800 animate-in fade-in duration-200">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-900">Security Lockout Active</div>
                  <p className="mt-0.5 text-[11px] text-rose-700">
                    Maximum consecutive failed attempts reached. Terminal access is temporarily locked for{' '}
                    <strong className="font-mono text-rose-900">{lockoutTimer} seconds</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message Banner */}
            {errorMessage && lockoutTimer === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-800 animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-[11px] font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username / Email Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin@tripmytour.com or admin"
                    disabled={lockoutTimer > 0 || isSubmitting}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Default: admin</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    disabled={lockoutTimer > 0 || isSubmitting}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Toggle */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">
                    Keep me signed in (30 days)
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={lockoutTimer > 0 || isSubmitting}
                className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authenticate & Enter Admin</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Fill Helper */}
            <div className="pt-4 border-t border-slate-200/80">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Default Admin Credentials:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleFillDemo('admin@tripmytour.com', 'admin')}
                    className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                  >
                    Auto-fill
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">User</span>
                    <span className="text-slate-800 font-semibold truncate block">admin@tripmytour.com</span>
                  </div>
                  <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">Password</span>
                    <span className="text-slate-800 font-semibold block">admin</span>
                  </div>
                </div>
              </div>

              {/* Discrete Staff Access instructions */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 space-y-2.5 text-xs text-blue-900">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-[11px] text-blue-950">
                    <Terminal className="w-3.5 h-3.5 text-blue-600" />
                    <span>Private Staff Access Methods</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyDirectUrl}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copiedUrl ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  All public links have been removed from the website. Staff can hit this terminal anytime via:
                </p>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="bg-white/80 px-2 py-1 rounded border border-blue-100 flex items-center justify-between">
                    <span className="text-blue-900 font-semibold">Direct URL:</span>
                    <span className="text-slate-600 font-bold truncate max-w-[200px]">{window.location.origin}/?admin=true</span>
                  </div>
                  <div className="bg-white/80 px-2 py-1 rounded border border-blue-100 flex items-center justify-between">
                    <span className="text-blue-900 font-semibold">Shortcut:</span>
                    <span className="text-slate-700 font-bold">Ctrl + Shift + A</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer Security note */}
          <div className="bg-slate-50 px-7 py-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{BUSINESS_INFO.name} Travel Desk & Operations</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>All authentication events are logged for security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
