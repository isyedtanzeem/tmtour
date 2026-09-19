import React, { useState } from 'react';
import { 
  Plane, 
  FileCheck, 
  Compass, 
  ShieldCheck, 
  Search, 
  Settings, 
  Database, 
  Menu, 
  X, 
  RefreshCw,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Mail,
  Lock,
  ArrowLeft,
  MessageSquare
} from 'lucide-react';
import { GoogleSheetsConfig, ActiveTabType } from '../types';
import { BUSINESS_INFO } from '../utils/formatters';

interface HeaderProps {
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  sheetsConfig: GoogleSheetsConfig;
  onSyncClick: () => void;
  isSyncing: boolean;
  isAdminAuthenticated?: boolean;
  onExitAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  sheetsConfig,
  onSyncClick,
  isSyncing,
  isAdminAuthenticated = false,
  onExitAdmin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currency, setCurrency] = useState('INR (₹)');
  const logoUrl = '/logo.svg';

  const getSyncBadge = () => {
    if (sheetsConfig.syncStatus === 'connected') {
      return (
        <button
          onClick={onSyncClick}
          title="Cloud Database Connected. Click to sync now."
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Database Live</span>
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      );
    }
    if (sheetsConfig.syncStatus === 'syncing' || isSyncing) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
          <span>Syncing Data...</span>
        </div>
      );
    }
    if (sheetsConfig.syncStatus === 'error') {
      return (
        <button
          onClick={onSyncClick}
          title={sheetsConfig.errorMessage || 'Sync error'}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
        >
          <AlertCircle className="w-3 h-3 text-amber-600" />
          <span>Offline (Retry)</span>
        </button>
      );
    }
    // Local fallback
    return (
      <div
        title="Local Database Active"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700"
      >
        <Database className="w-3 h-3 text-blue-400" />
        <span>Database Active</span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top micro bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <a 
              href={`tel:${BUSINESS_INFO.phone}`}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>Call / WhatsApp: <strong className="text-white font-bold">{BUSINESS_INFO.phone}</strong></span>
            </a>
            <span className="hidden sm:inline-block text-slate-600">|</span>
            <span className="hidden sm:flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bengaluru Embassy & Travel Desk</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'admin' ? (
              getSyncBadge()
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-emerald-400 border border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Travel Agency</span>
              </div>
            )}

            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-slate-800 text-slate-200 text-xs rounded px-2 py-0.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
            >
              <option value="INR (₹)">INR (₹)</option>
              <option value="USD ($)">USD ($)</option>
              <option value="EUR (€)">EUR (€)</option>
              <option value="GBP (£)">GBP (£)</option>
              <option value="AED (د.إ)">AED (د.إ)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 text-left group focus:outline-hidden"
        >
          <div className="h-14 sm:h-16 flex items-center group-hover:opacity-90 transition-opacity">
            <img
              src={logoUrl}
              alt="TripMyTour Logo"
              className="h-[80px] sm:h-[80px] w-auto max-w-[440px] sm:max-w-[340px] object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="hidden items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                <Plane className="w-5 h-5 -rotate-45" />
              </div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 block leading-tight">
                Trip<span className="text-blue-600">MyTour</span>
              </span>
            </div>
          </div>
        </button>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'home'
                ? 'text-blue-600 bg-blue-50/80 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'packages'
                ? 'text-blue-600 bg-blue-50/80 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4 text-blue-500" />
            <span>Holiday Packages</span>
          </button>
          <button
            onClick={() => setActiveTab('visas')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'visas'
                ? 'text-blue-600 bg-blue-50/80 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileCheck className="w-4 h-4 text-emerald-500" />
            <span>Visa Services</span>
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'contact'
                ? 'text-blue-600 bg-blue-50/80 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Mail className="w-4 h-4 text-sky-500" />
            <span>Contact</span>
          </button>
        </nav>

        {/* Right CTA / Action */}
        <div className="hidden md:flex items-center gap-3">
          {activeTab === 'admin' ? (
            <button
              onClick={onExitAdmin || (() => setActiveTab('home'))}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs cursor-pointer border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4 text-slate-300" />
              <span>Exit to Public Site</span>
            </button>
          ) : (
            <>
              <a
                href={`https://wa.me/${BUSINESS_INFO.phoneRaw}?text=${encodeURIComponent('Hello TripMyTour, I would like to plan a holiday trip or visa.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>

              <button
                onClick={() => setActiveTab('visas')}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Enquire for Visa
              </button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-lg">
          <button
            onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
              activeTab === 'home' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => { setActiveTab('packages'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
              activeTab === 'packages' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'
            }`}
          >
            <Compass className="w-4 h-4 text-blue-500" />
            <span>Holiday Packages</span>
          </button>
          <button
            onClick={() => { setActiveTab('visas'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
              activeTab === 'visas' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'
            }`}
          >
            <FileCheck className="w-4 h-4 text-emerald-500" />
            <span>Visa Services</span>
          </button>
          <button
            onClick={() => { setActiveTab('contact'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
              activeTab === 'contact' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'
            }`}
          >
            <Mail className="w-4 h-4 text-sky-500" />
            <span>Contact Us</span>
          </button>
          {activeTab === 'admin' && (
            <button
              onClick={() => { 
                if (onExitAdmin) onExitAdmin();
                else setActiveTab('home'); 
                setMobileMenuOpen(false); 
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4 text-slate-300" />
              <span>Exit to Public Site</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
