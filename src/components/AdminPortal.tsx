import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Compass, 
  FileCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  RefreshCw, 
  Copy, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Clock, 
  DollarSign, 
  Star, 
  Code,
  Save,
  Users,
  Image as ImageIcon,
  UploadCloud,
  FolderTree,
  FileCode,
  Download,
  Sparkles,
  Mail,
  ChevronRight,
  Bell,
  LogOut,
  KeyRound,
  ShieldCheck,
  Shield,
  Eye,
  ArrowLeft,
  Globe
} from 'lucide-react';
import { HolidayPackage, VisaService, BookingInquiry, VisaApplication, GoogleSheetsConfig, ItineraryDay, AdminUser } from '../types';
import { sheetsService } from '../services/sheetsService';
import { leadEmailService } from '../services/leadEmailService';
import { AdminLeadEmailManager } from './AdminLeadEmailManager';
import { AdminSecurityManager } from './AdminSecurityManager';
import { AdminUserManager } from './AdminUserManager';
import { adminAuthService } from '../services/adminAuthService';
import { GOOGLE_APPS_SCRIPT_CODE } from '../services/appsScriptTemplate';
import { formatCurrency } from '../utils/formatters';

export type AdminTabType = 'packages' | 'visas' | 'bookings' | 'sheets' | 'logo' | 'emails' | 'security' | 'users';

interface AdminPortalProps {
  packages: HolidayPackage[];
  visas: VisaService[];
  bookings: BookingInquiry[];
  applications: VisaApplication[];
  sheetsConfig: GoogleSheetsConfig;
  onRefresh: () => void;
  currentUser?: AdminUser | null;
  onLogout?: () => void;
  onProfileUpdated?: (user: AdminUser) => void;
  onExitToSite?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  packages,
  visas,
  bookings,
  applications,
  sheetsConfig,
  onRefresh,
  currentUser,
  onLogout,
  onProfileUpdated,
  onExitToSite,
}) => {
  // Functional permission calculations
  const canViewPackages = adminAuthService.canView(currentUser || null, 'packages');
  const canManagePackages = adminAuthService.canManage(currentUser || null, 'packages');

  const canViewVisas = adminAuthService.canView(currentUser || null, 'visas');
  const canManageVisas = adminAuthService.canManage(currentUser || null, 'visas');

  const canViewLeads = adminAuthService.canView(currentUser || null, 'leads');
  const canManageLeadStatus = adminAuthService.canManageLeadStatus(currentUser || null);
  const canDeleteLeads = adminAuthService.canDeleteLeads(currentUser || null);

  const canViewSheets = adminAuthService.canView(currentUser || null, 'databaseSync');
  const canManageSheets = adminAuthService.canManage(currentUser || null, 'databaseSync');

  const canViewEmails = adminAuthService.canView(currentUser || null, 'emailAlerts');
  const canManageEmails = adminAuthService.canManage(currentUser || null, 'emailAlerts');

  const canViewBranding = adminAuthService.canView(currentUser || null, 'branding');
  const canManageBranding = adminAuthService.canManage(currentUser || null, 'branding');
  const isSuperAdmin = adminAuthService.isSuperAdmin(currentUser || null);

  const getInitialTab = (): AdminTabType => {
    if (!currentUser) return 'packages';
    if (adminAuthService.canView(currentUser, 'packages')) return 'packages';
    if (adminAuthService.canView(currentUser, 'leads')) return 'bookings';
    if (adminAuthService.canView(currentUser, 'visas')) return 'visas';
    if (adminAuthService.isSuperAdmin(currentUser)) return 'users';
    if (adminAuthService.canView(currentUser, 'databaseSync')) return 'sheets';
    if (adminAuthService.canView(currentUser, 'branding')) return 'logo';
    if (adminAuthService.canView(currentUser, 'emailAlerts')) return 'emails';
    return 'security';
  };

  const [adminTab, setAdminTab] = useState<AdminTabType>(getInitialTab);

  // Auto-redirect if tab is restricted
  useEffect(() => {
    const isCurrentTabAllowed = () => {
      switch (adminTab) {
        case 'packages': return canViewPackages;
        case 'visas': return canViewVisas;
        case 'bookings': return canViewLeads;
        case 'sheets': return canViewSheets;
        case 'logo': return canViewBranding;
        case 'emails': return canViewEmails;
        case 'users': return isSuperAdmin;
        case 'security': return true;
        default: return true;
      }
    };

    if (!isCurrentTabAllowed()) {
      setAdminTab(getInitialTab());
    }
  }, [currentUser, canViewPackages, canViewVisas, canViewLeads, canViewSheets, canViewBranding, canManageBranding, canViewEmails, isSuperAdmin, adminTab]);
  const [copiedDirectUrl, setCopiedDirectUrl] = useState(false);
  const [emailRecipientCount, setEmailRecipientCount] = useState<number>(() => {
    return leadEmailService.getSettings().recipients.filter((r) => r.active).length;
  });

  useEffect(() => {
    const unsub = leadEmailService.subscribe(() => {
      setEmailRecipientCount(leadEmailService.getSettings().recipients.filter((r) => r.active).length);
    });
    return () => unsub();
  }, []);

  // Logo management state
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>(() => {
    return localStorage.getItem('custom_logo_data') || '/logo.png';
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoMessage, setLogoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLogoFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoMessage({ type: 'error', text: 'Please select a valid image file (PNG, JPG, or SVG).' });
      return;
    }

    setIsUploadingLogo(true);
    setLogoMessage(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        // Attempt to save to public/logo.png on server
        const response = await fetch('/api/upload-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl }),
        });

        // Save to localStorage for instant persistence across reloads
        localStorage.setItem('custom_logo_data', dataUrl);
        setLogoPreviewUrl(dataUrl);
        window.dispatchEvent(new Event('logo-updated'));

        if (response.ok) {
          setLogoMessage({
            type: 'success',
            text: 'Logo updated successfully! Saved to public/logo.png and applied across the entire portal.',
          });
        } else {
          setLogoMessage({
            type: 'success',
            text: 'Logo applied to portal and cached in browser storage! (You can also overwrite public/logo.png in the project file explorer).',
          });
        }
      } catch (err: any) {
        localStorage.setItem('custom_logo_data', dataUrl);
        setLogoPreviewUrl(dataUrl);
        window.dispatchEvent(new Event('logo-updated'));
        setLogoMessage({
          type: 'success',
          text: 'Logo applied to portal! (Cached in browser storage).',
        });
      } finally {
        setIsUploadingLogo(false);
      }
    };
    reader.onerror = () => {
      setLogoMessage({ type: 'error', text: 'Failed to read image file.' });
      setIsUploadingLogo(false);
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    localStorage.removeItem('custom_logo_data');
    const defaultUrl = `/logo.png?v=${Date.now()}`;
    setLogoPreviewUrl(defaultUrl);
    window.dispatchEvent(new Event('logo-updated'));
    setLogoMessage({
      type: 'success',
      text: 'Reset to default public/logo.png successfully.',
    });
  };

  // Apps Script Settings Form State
  const [webAppUrlInput, setWebAppUrlInput] = useState(sheetsConfig.webAppUrl);
  const [sheetIdInput, setSheetIdInput] = useState(sheetsConfig.sheetId);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedEnvVar, setCopiedEnvVar] = useState(false);

  // Modal states for Package CRUD
  const [editingPackage, setEditingPackage] = useState<HolidayPackage | null>(null);
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<HolidayPackage | null>(null);
  const [isSavingPackage, setIsSavingPackage] = useState(false);
  const [packageSaveError, setPackageSaveError] = useState<string | null>(null);
  const [isDeletingPackage, setIsDeletingPackage] = useState(false);

  // Modal states for Visa CRUD
  const [editingVisa, setEditingVisa] = useState<VisaService | null>(null);
  const [isAddingVisa, setIsAddingVisa] = useState(false);
  const [visaToDelete, setVisaToDelete] = useState<VisaService | null>(null);
  const [isSavingVisa, setIsSavingVisa] = useState(false);
  const [visaSaveError, setVisaSaveError] = useState<string | null>(null);
  const [isDeletingVisa, setIsDeletingVisa] = useState(false);

  // Save Apps Script Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingConnection(true);
    setTestResult(null);

    let cleanUrl = webAppUrlInput.trim();
    let cleanSheetId = sheetIdInput.trim();

    if (sheetsService.isGoogleSpreadsheetUrl(cleanUrl)) {
      const extracted = sheetsService.extractSheetId(cleanUrl);
      if (extracted) {
        cleanSheetId = extracted;
        setSheetIdInput(extracted);
      }
      cleanUrl = '';
      setWebAppUrlInput('');
      setTestResult({
        success: false,
        message: 'Google Spreadsheet document link detected. We extracted your Sheet ID. For live API access, follow the 3-step guide below to deploy the Apps Script as a Web App.',
      });
      sheetsService.clearCustomUrl();
      setTestingConnection(false);
      onRefresh();
      return;
    }

    await sheetsService.updateConfig({
      webAppUrl: cleanUrl,
      sheetId: cleanSheetId,
      isCustomUrlActive: !!cleanUrl,
    });

    if (cleanUrl) {
      const pingRes = await sheetsService.testConnection(cleanUrl);
      setTestResult(pingRes);
    } else {
      setTestResult({ success: true, message: 'Saved in Local Sheets Mirror mode.' });
    }

    setTestingConnection(false);
    onRefresh();
  };

  const handleDisconnectUrl = () => {
    sheetsService.clearCustomUrl();
    setWebAppUrlInput('');
    setTestResult({ success: true, message: 'Disconnected Web App URL. Operating smoothly in Local Database mode.' });
    onRefresh();
  };

  const handleTestConnection = async () => {
    const cleanUrl = webAppUrlInput.trim();
    if (!cleanUrl) {
      setTestResult({ success: false, message: 'Please enter a Google Apps Script Web App URL first.' });
      return;
    }

    if (sheetsService.isGoogleSpreadsheetUrl(cleanUrl)) {
      const extracted = sheetsService.extractSheetId(cleanUrl);
      setTestResult({
        success: false,
        message: `This is a Google Spreadsheet URL (Sheet ID: ${extracted || 'detected'}), not the Apps Script Web App deployment URL. Deploy the Apps Script in Extensions > Apps Script and paste the /exec URL.`,
      });
      return;
    }

    setTestingConnection(true);
    setTestResult(null);
    const res = await sheetsService.testConnection(cleanUrl);
    setTestResult(res);
    setTestingConnection(false);
  };

  const handleTestEmail = async () => {
    const cleanUrl = webAppUrlInput.trim();
    if (!cleanUrl) {
      setTestResult({ success: false, message: 'Please enter a Google Apps Script Web App URL first.' });
      return;
    }
    setTestingEmail(true);
    setTestResult(null);
    const res = await sheetsService.testAppsScriptEmail(cleanUrl);
    setTestResult(res);
    setTestingEmail(false);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const [actionBanner, setActionBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showBanner = (type: 'success' | 'error', text: string) => {
    setActionBanner({ type, text });
    setTimeout(() => setActionBanner(null), 5000);
  };

  // -------------------------------------------------------------
  // Package Handlers
  // -------------------------------------------------------------
  const handleSavePackageSubmit = async (pkgData: HolidayPackage) => {
    setIsSavingPackage(true);
    setPackageSaveError(null);
    try {
      const res = await sheetsService.savePackage(pkgData);
      setIsSavingPackage(false);
      if (res.success) {
        setEditingPackage(null);
        setIsAddingPackage(false);
        onRefresh();
        showBanner('success', res.message || 'Holiday package saved and synced to Google Sheets database!');
      } else {
        setPackageSaveError(res.error || res.message || 'Failed to save package to Google Sheets.');
      }
    } catch (err: any) {
      setIsSavingPackage(false);
      setPackageSaveError(err?.message || 'Error saving package to Google Sheets.');
    }
  };

  const confirmDeletePackage = async () => {
    if (packageToDelete) {
      setIsDeletingPackage(true);
      try {
        const res = await sheetsService.deletePackage(packageToDelete.id);
        setIsDeletingPackage(false);
        setPackageToDelete(null);
        onRefresh();
        if (res.success) {
          showBanner('success', res.message || 'Package deleted from Google Sheets database.');
        } else {
          showBanner('error', res.error || res.message || 'Failed to delete package from Google Sheets.');
        }
      } catch (err: any) {
        setIsDeletingPackage(false);
        showBanner('error', err?.message || 'Error deleting package.');
      }
    }
  };

  // -------------------------------------------------------------
  // Visa Handlers
  // -------------------------------------------------------------
  const handleSaveVisaSubmit = async (visaData: VisaService) => {
    setIsSavingVisa(true);
    setVisaSaveError(null);
    try {
      const res = await sheetsService.saveVisa(visaData);
      setIsSavingVisa(false);
      if (res.success) {
        setEditingVisa(null);
        setIsAddingVisa(false);
        onRefresh();
        showBanner('success', res.message || 'Visa service saved and synced to Google Sheets database!');
      } else {
        setVisaSaveError(res.error || res.message || 'Failed to save visa service to Google Sheets.');
      }
    } catch (err: any) {
      setIsSavingVisa(false);
      setVisaSaveError(err?.message || 'Error saving visa service to Google Sheets.');
    }
  };

  const confirmDeleteVisa = async () => {
    if (visaToDelete) {
      setIsDeletingVisa(true);
      try {
        const res = await sheetsService.deleteVisa(visaToDelete.id);
        setIsDeletingVisa(false);
        setVisaToDelete(null);
        onRefresh();
        if (res.success) {
          showBanner('success', res.message || 'Visa service deleted from Google Sheets database.');
        } else {
          showBanner('error', res.error || res.message || 'Failed to delete visa service.');
        }
      } catch (err: any) {
        setIsDeletingVisa(false);
        showBanner('error', err?.message || 'Error deleting visa.');
      }
    }
  };

  // Status updates
  const handleUpdateBookingStatus = async (id: string, status: BookingInquiry['status']) => {
    await sheetsService.updateBookingStatus(id, status);
    onRefresh();
  };

  const handleUpdateApplicationStatus = async (id: string, status: VisaApplication['status']) => {
    await sheetsService.updateApplicationStatus(id, status);
    onRefresh();
  };

  const handleCopyDirectUrl = () => {
    const url = `${window.location.origin}/?admin=true`;
    navigator.clipboard.writeText(url);
    setCopiedDirectUrl(true);
    setTimeout(() => setCopiedDirectUrl(false), 2500);
  };

  return (
    <div className="py-8 px-4 sm:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner: Operations & Database Management Overview */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Database className="w-3.5 h-3.5" />
                <span>Travel Operations & Database Portal</span>
              </div>

              <button
                type="button"
                onClick={handleCopyDirectUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                title="Copy the secret URL to access this admin terminal directly without public links"
              >
                {copiedDirectUrl ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-300">Staff Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Copy Direct Link (?admin=true)</span>
                  </>
                )}
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Admin & Operations Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Private staff portal hidden from public visitors. Hit directly via <code className="text-blue-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono text-xs font-bold">/?admin=true</code> or <code className="text-blue-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono text-xs font-bold">Ctrl+Shift+A</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onExitToSite && (
              <button
                onClick={onExitToSite}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:border-slate-500"
                title="Exit to the public website"
              >
                <ArrowLeft className="w-4 h-4 text-blue-400" />
                <span>Exit to Public Site</span>
              </button>
            )}

            {currentUser && (
              <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700/90 px-3.5 py-2 rounded-xl text-xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-left leading-tight">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{currentUser.email}</div>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sign Out / Lock Admin Portal"
                    className="ml-2 px-2.5 py-1 text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700 hover:border-rose-500/30"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Lock</span>
                  </button>
                )}
              </div>
            )}

            <button
              onClick={async () => {
                await sheetsService.syncWithGoogleSheets();
                onRefresh();
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync Database Now</span>
            </button>

            <button
              onClick={() => setAdminTab('sheets')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all"
            >
              <Code className="w-4 h-4 text-emerald-400" />
              <span>Database Sync Config</span>
            </button>
          </div>
        </div>

        {/* Sync Status Badge details */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Connection Status:</span>
            {sheetsConfig.syncStatus === 'connected' ? (
              <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected to Google Apps Script
              </span>
            ) : sheetsConfig.syncStatus === 'syncing' ? (
              <span className="flex items-center gap-1.5 font-bold text-blue-400">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Synchronizing with Sheets...
              </span>
            ) : sheetsConfig.syncStatus === 'error' ? (
              <span className="flex items-center gap-1.5 font-bold text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                Connection Error ({sheetsConfig.errorMessage || 'Check Apps Script URL'})
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <Database className="w-3 h-3 text-blue-400" />
                Local Sheets Database Mirror Active
              </span>
            )}
          </div>

          <div className="text-slate-400">
            Last Sync:{' '}
            <span className="text-slate-200 font-mono font-medium">
              {sheetsConfig.lastSyncedAt || 'Just now'}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto pb-1">
        {canViewPackages && (
          <button
            onClick={() => setAdminTab('packages')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              adminTab === 'packages'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Holiday Packages ({packages.length})</span>
          </button>
        )}

        {canViewVisas && (
          <button
            onClick={() => setAdminTab('visas')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              adminTab === 'visas'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Visa Services ({visas.length})</span>
          </button>
        )}

        {canViewLeads && (
          <button
            onClick={() => setAdminTab('bookings')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              adminTab === 'bookings'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Inquiries & Applications ({bookings.length + applications.length})</span>
            {!canManageLeadStatus && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                View Only
              </span>
            )}
          </button>
        )}

        {canViewSheets && (
          <button
            onClick={() => setAdminTab('sheets')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              adminTab === 'sheets'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Cloud Database & Sync Setup</span>
          </button>
        )}

        {canManageBranding && (
          <button
            onClick={() => setAdminTab('logo')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              adminTab === 'logo'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Brand Logo (logo.png)</span>
          </button>
        )}

        {canViewEmails && (
          <button
            onClick={() => setAdminTab('emails')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              adminTab === 'emails'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Lead Email Alerts ({emailRecipientCount})</span>
          </button>
        )}

        {isSuperAdmin && (
          <button
            onClick={() => setAdminTab('users')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              adminTab === 'users'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 text-purple-600" />
            <span>Staff & Roles</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-700">
              Super Admin
            </span>
          </button>
        )}

        <button
          onClick={() => setAdminTab('security')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
            adminTab === 'security'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security & Credentials</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: HOLIDAY PACKAGES MANAGEMENT */}
      {/* ============================================================= */}
      {adminTab === 'packages' && canViewPackages && (
        <div className="space-y-6">
          {!canManagePackages && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Read-Only Mode:</strong> Your staff account has view permission for holiday packages. Package creation, editing, and deletion are restricted to authorized managers.
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Manage Holiday Tour Packages
              </h2>
              <p className="text-xs text-slate-500">
                Create, update, or remove tour packages. Changes persist directly into your database.
              </p>
            </div>

            {canManagePackages && (
              <button
                onClick={() => {
                  setEditingPackage(null);
                  setIsAddingPackage(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Package</span>
              </button>
            )}
          </div>

          {/* Packages Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Package</th>
                    <th className="py-3.5 px-4">Destination</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4">Price / Person</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Rating</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={pkg.imageUrl}
                            alt={pkg.title}
                            className="w-10 h-10 rounded-lg object-cover shrink-0 bg-slate-100"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block line-clamp-1 max-w-xs">
                              {pkg.title}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              ID: {pkg.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {pkg.destination}, {pkg.country}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {pkg.duration}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(pkg.price)}
                        {pkg.originalPrice > pkg.price && (
                          <span className="text-[10px] text-slate-400 line-through ml-1">
                            {formatCurrency(pkg.originalPrice)}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700">
                          {pkg.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-amber-600 font-semibold">
                        ★ {pkg.rating.toFixed(1)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canManagePackages ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingPackage(pkg);
                                setIsAddingPackage(false);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Package"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setPackageToDelete(pkg)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Package"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium italic">
                            Read-Only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: VISA SERVICES MANAGEMENT */}
      {/* ============================================================= */}
      {adminTab === 'visas' && canViewVisas && (
        <div className="space-y-6">
          {!canManageVisas && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Read-Only Mode:</strong> Your staff account has view permission for visa services. Adding or updating visa countries and fees is restricted.
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Manage Visa Offerings & Requirements
              </h2>
              <p className="text-xs text-slate-500">
                Configure country visas, embassy fees, processing times, and document checklists stored in the database.
              </p>
            </div>

            {canManageVisas && (
              <button
                onClick={() => {
                  setEditingVisa(null);
                  setIsAddingVisa(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Visa Service</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Country & Flag</th>
                    <th className="py-3.5 px-4">Visa Type</th>
                    <th className="py-3.5 px-4">Processing Time</th>
                    <th className="py-3.5 px-4">Validity / Stay</th>
                    <th className="py-3.5 px-4">Total Fee</th>
                    <th className="py-3.5 px-4">Express</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visas.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          <span className="text-xl">{v.flagEmoji}</span>
                          <span>{v.country}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {v.visaType}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {v.processingTime}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {v.validity} ({v.stayDuration})
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(v.totalFee)}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          ({formatCurrency(v.embassyFee)}+{formatCurrency(v.serviceFee)})
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {v.expressAvailable ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Yes (+{formatCurrency(v.expressFee)})
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canManageVisas ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingVisa(v);
                                setIsAddingVisa(false);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Edit Visa Service"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setVisaToDelete(v)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Visa Service"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium italic">
                            Read-Only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: INQUIRIES & APPLICATIONS FEED */}
      {/* ============================================================= */}
      {adminTab === 'bookings' && canViewLeads && (
        <div className="space-y-8">
          {/* View-Only Restriction Banner if user cannot update status */}
          {!canManageLeadStatus && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3.5 rounded-2xl flex items-center gap-3 text-xs font-medium shadow-xs">
              <Eye className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <span className="font-bold block text-blue-950">View-Only Leads Mode Active:</span>
                <span>You have operational authorization to inspect client holiday bookings and visa application documents. Updating status or deleting lead records is restricted.</span>
              </div>
            </div>
          )}

          {/* Quick Lead Routing Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>Lead Email Alerts Active</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {emailRecipientCount} Active Recipient{emailRecipientCount === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Holiday package inquiries and visa applications are automatically routed to configured staff email inboxes.
                </p>
              </div>
            </div>
            {canViewEmails && (
              <button
                onClick={() => setAdminTab('emails')}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Manage Lead Emails</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Section: Visa Applications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Visa Applications ({applications.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Client visa applications and document tracking inquiries.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {applications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No visa applications submitted yet. Try applying from the Visa Services tab!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Ref Number</th>
                        <th className="py-3.5 px-4">Country & Type</th>
                        <th className="py-3.5 px-4">Applicant</th>
                        <th className="py-3.5 px-4">Passport</th>
                        <th className="py-3.5 px-4">Travel Date</th>
                        <th className="py-3.5 px-4">Amount</th>
                        <th className="py-3.5 px-4">{canManageLeadStatus ? 'Status (Click to Update)' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {applications.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {app.referenceNumber}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800">{app.country}</span>
                            <span className="block text-[11px] text-slate-500">{app.visaType}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900">{app.applicantName}</span>
                            <span className="block text-[11px] text-slate-500">{app.applicantEmail}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700">
                            {app.passportNumber}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {app.travelDate}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-700">
                            {formatCurrency(app.totalAmount)}
                          </td>
                          <td className="py-3.5 px-4">
                            {canManageLeadStatus ? (
                              <select
                                value={app.status}
                                onChange={(e) => handleUpdateApplicationStatus(app.id, e.target.value as any)}
                                className="py-1 px-2 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                              >
                                <option value="Under Review">Under Review</option>
                                <option value="Documents Verified">Documents Verified</option>
                                <option value="Submitted to Embassy">Submitted to Embassy</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            ) : (
                              <span className="inline-block py-1 px-2.5 rounded-lg text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700">
                                {app.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Section: Tour Bookings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Tour Package Bookings ({bookings.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Client holiday package inquiries and reservation records.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {bookings.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No tour package bookings submitted yet. Try booking a package from the Explore tab!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Booking ID</th>
                        <th className="py-3.5 px-4">Tour Package</th>
                        <th className="py-3.5 px-4">Passenger</th>
                        <th className="py-3.5 px-4">Departure Date</th>
                        <th className="py-3.5 px-4">Travelers</th>
                        <th className="py-3.5 px-4">Total</th>
                        <th className="py-3.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {b.id}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800 line-clamp-1 max-w-xs">
                            {b.packageTitle}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900">{b.customerName}</span>
                            <span className="block text-[11px] text-slate-500">{b.customerPhone}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {b.travelDate}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {b.travelersAdults} Adults{b.travelersChildren > 0 ? `, ${b.travelersChildren} Children` : ''}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-blue-700">
                            {formatCurrency(b.totalPrice)}
                          </td>
                          <td className="py-3.5 px-4">
                            {canManageLeadStatus ? (
                              <select
                                value={b.status}
                                onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value as any)}
                                className="py-1 px-2 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            ) : (
                              <span className="inline-block py-1 px-2.5 rounded-lg text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700">
                                {b.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: GOOGLE SHEETS & APPS SCRIPT SETUP */}
      {/* ============================================================= */}
      {adminTab === 'sheets' && canViewSheets && (
        <div className="space-y-8">
          {!canManageSheets && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Read-Only Mode:</strong> Your staff account has view permission for database sync settings. Modifying the Google Apps Script Web App URL and database sync settings is restricted.
              </span>
            </div>
          )}

          {/* Form to paste Web App URL */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Google Apps Script Web App Connectivity
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              Connect your live Google Spreadsheet by deploying the Google Apps Script below and pasting the generated Web App URL.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Google Apps Script Web App URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    value={webAppUrlInput}
                    onChange={(e) => setWebAppUrlInput(e.target.value)}
                    disabled={!canManageSheets}
                    className="flex-1 px-4 py-3 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection || testingEmail}
                    className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shrink-0 transition-colors cursor-pointer"
                  >
                    {testingConnection ? 'Testing...' : 'Test Ping'}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testingConnection || testingEmail}
                    className="px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs shrink-0 border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Sends an instant test lead email via Google Apps Script"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>{testingEmail ? 'Sending...' : 'Test Email Alert'}</span>
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Must be deployed with "Execute as: Me" and "Who has access: Anyone". Email notifications are sent automatically using Google's MailApp!
                </span>

                {sheetsService.isGoogleSpreadsheetUrl(webAppUrlInput) && (
                  <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span>
                      <strong>Notice:</strong> This is a Google Sheets document link. To connect live, deploy the Apps Script below as a Web App.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const extracted = sheetsService.extractSheetId(webAppUrlInput);
                        if (extracted) setSheetIdInput(extracted);
                        setWebAppUrlInput('');
                      }}
                      className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-bold shrink-0 text-[11px] transition-colors"
                    >
                      Extract Sheet ID & Clear
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Google Spreadsheet ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={sheetIdInput}
                  onChange={(e) => setSheetIdInput(e.target.value)}
                  className="w-full px-4 py-3 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {testResult && (
                <div
                  className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {canManageSheets && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                    >
                      Save Configuration
                    </button>

                    {(webAppUrlInput || sheetsConfig.webAppUrl) && (
                      <button
                        type="button"
                        onClick={handleDisconnectUrl}
                        className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs sm:text-sm transition-colors cursor-pointer"
                      >
                        Disconnect & Use Local Mode
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Reset database back to original sample holiday & visa templates?')) {
                        sheetsService.resetToDefaultTemplate();
                        onRefresh();
                      }
                    }}
                    className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    Reset to Default Seed Data
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Vercel & Custom Domain Live Database Configuration */}
          <div className="bg-linear-to-br from-indigo-50/80 via-blue-50/50 to-slate-50 rounded-2xl border border-blue-200 p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 shadow-sm mt-0.5">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">
                      Vercel & Custom Domain Instant Sync Guide
                    </h3>
                    {(import.meta as any)?.env?.VITE_GOOGLE_SHEETS_WEB_APP_URL ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Vercel Env Variable Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-300">
                        Browser Storage Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-2xl">
                    When you host on Vercel with your custom domain, holiday packages and visa services should fetch and save directly to your Google Sheets database so all admins and visitors see real-time data across all devices and sessions.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const val = `VITE_GOOGLE_SHEETS_WEB_APP_URL=${(webAppUrlInput || sheetsConfig.webAppUrl || '').trim()}`;
                  navigator.clipboard.writeText(val);
                  setCopiedEnvVar(true);
                  setTimeout(() => setCopiedEnvVar(false), 2500);
                }}
                disabled={!webAppUrlInput && !sheetsConfig.webAppUrl}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedEnvVar ? 'Copied Env Line!' : 'Copy Vercel Env Variable'}</span>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-blue-200/70 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-blue-100 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-bold">1</span>
                  Copy Web App URL
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Deploy your Apps Script with "Execute as: Me" and "Who has access: Anyone". Copy the <code className="text-blue-600 font-mono">/exec</code> URL.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-blue-100 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-bold">2</span>
                  Add to Vercel Settings
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Go to Vercel Dashboard → Your Project → Settings → Environment Variables. Add key <code className="text-blue-600 font-mono">VITE_GOOGLE_SHEETS_WEB_APP_URL</code>.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-blue-100 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-bold">3</span>
                  Redeploy on Custom Domain
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Trigger a redeploy. Your site on your custom domain will now communicate directly with Google Sheets as its live database!
                </p>
              </div>
            </div>
          </div>

          {/* Setup Guide */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Ready-to-Deploy Google Apps Script Code (`Code.gs`)
                </h3>
                <p className="text-xs text-slate-500">
                  Copy this complete Apps Script code directly into your Google Sheets project.
                </p>
              </div>

              <button
                onClick={handleCopyScript}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Apps Script Code'}</span>
              </button>
            </div>

            {/* Quick 4-step Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center mb-1.5">
                  1
                </div>
                <div className="font-bold text-slate-900">Open Apps Script</div>
                <div className="text-slate-500 text-[11px]">
                  In your Google Sheet, click <strong className="text-slate-800">Extensions → Apps Script</strong>.
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center mb-1.5">
                  2
                </div>
                <div className="font-bold text-slate-900">Paste Code & Save</div>
                <div className="text-slate-500 text-[11px]">
                  Paste this script into <code className="text-blue-600">Code.gs</code> and click Save.
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px] flex items-center justify-center mb-1.5">
                  3
                </div>
                <div className="font-bold text-slate-900">Test Email (Optional)</div>
                <div className="text-slate-500 text-[11px]">
                  Select <code className="text-emerald-700 font-mono">testEmailNotification</code> and click Run to verify inbox delivery.
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center justify-center mb-1.5">
                  4
                </div>
                <div className="font-bold text-slate-900">Deploy as Web App</div>
                <div className="text-slate-500 text-[11px]">
                  Deploy → New Deployment → Web app (Execute as: <strong>Me</strong>, Access: <strong>Anyone</strong>).
                </div>
              </div>
            </div>

            {/* Syntax preview box */}
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 text-slate-200 text-xs font-mono p-4 max-h-80 overflow-y-auto">
              <pre>{GOOGLE_APPS_SCRIPT_CODE}</pre>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 5: BRAND LOGO (logo.png) & FILE STRUCTURE */}
      {/* ============================================================= */}
      {adminTab === 'logo' && canViewBranding && (
        <div className="space-y-8">
          {!canManageBranding && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Read-Only Mode:</strong> Your staff account has view permission for portal branding. Uploading or modifying logo assets is restricted to authorized managers.
              </span>
            </div>
          )}

          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Brand Identity • Bengaluru</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Brand Logo Configuration (<code className="text-blue-300 font-mono text-lg">public/logo.png</code>)
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
                Your portal logo is served directly from <strong className="text-white font-mono">public/logo.png</strong> in the project file structure. 
                It powers the application Header, Footer, Mobile Navigation, and browser tab Favicon.
              </p>
            </div>
          </div>

          {/* Feedback banner */}
          {logoMessage && (
            <div
              className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium ${
                logoMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {logoMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{logoMessage.text}</span>
              </div>
              <button
                onClick={() => setLogoMessage(null)}
                className="text-xs opacity-70 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Col: File Structure & Upload Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: File Structure Information */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <FolderTree className="w-5 h-5 text-blue-600" />
                  <h3>File Structure Location</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  In Vite and modern web standards, any asset located in the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">public/</code> directory is served statically from the web root:
                </p>

                {/* Visual File Tree Diagram */}
                <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 border border-slate-800 space-y-1">
                  <div className="text-slate-400">📁 tours-visa-portal/</div>
                  <div className="pl-4 text-blue-400 font-bold flex items-center gap-1.5">
                    <span>├── 📁 public/</span>
                  </div>
                  <div className="pl-8 text-emerald-400 font-bold flex items-center gap-2 bg-emerald-950/40 py-1 px-2 rounded border border-emerald-800/40">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>├── 🖼️ logo.png</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-sans font-semibold ml-auto">Active Logo</span>
                  </div>
                  <div className="pl-4 text-slate-500">├── 📁 src/</div>
                  <div className="pl-4 text-slate-500">├── 📄 index.html</div>
                  <div className="pl-4 text-slate-500">└── 📄 metadata.json</div>
                </div>

                {/* Specs Table */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">File Path</span>
                    <span className="font-mono font-semibold text-slate-800">public/logo.png</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Public URL</span>
                    <span className="font-mono font-semibold text-blue-600">/logo.png</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Resolution</span>
                    <span className="font-mono font-semibold text-slate-800">512 × 512 px</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Formats</span>
                    <span className="font-mono font-semibold text-slate-800">PNG, SVG, JPG</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Interactive Upload Option */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                    <UploadCloud className="w-5 h-5 text-indigo-600" />
                    <h3>Add / Replace Logo File</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Direct write to <code className="font-mono font-bold">public/logo.png</code></span>
                </div>

                {/* Dropzone */}
                <label
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleLogoFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20 group text-center"
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleLogoFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                    {isUploadingLogo ? (
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                    ) : (
                      <UploadCloud className="w-7 h-7 text-blue-600" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-800 block">
                    {isUploadingLogo ? 'Processing & saving logo...' : 'Click to browse or drag and drop your logo here'}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    Accepts PNG, JPG, or SVG. Automatically updates <code className="font-mono text-slate-700 font-bold">public/logo.png</code>.
                  </span>
                </label>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex gap-2">
                    <a
                      href={logoPreviewUrl}
                      download="logo.png"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Current logo.png</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset to Default</span>
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Auto-synced to Header & Footer</span>
                </div>
              </div>

              {/* Card 3: Instructions for adding directly in file structure */}
              <div className="bg-blue-50/60 rounded-2xl p-6 border border-blue-100 text-slate-700 text-xs space-y-2.5">
                <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-600" />
                  <span>How to add logo.png directly via File Tree:</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed">
                  <li>In Google AI Studio's left sidebar, open the <strong>File Explorer</strong>.</li>
                  <li>Click on the <strong className="font-mono text-blue-800">public</strong> directory.</li>
                  <li>Upload your image file or rename your file to <strong className="font-mono text-blue-800">logo.png</strong>.</li>
                  <li>The application will automatically pick up <strong className="font-mono text-blue-800">public/logo.png</strong> with zero configuration needed.</li>
                </ol>
              </div>
            </div>

            {/* Right Col: Live Previews */}
            <div className="lg:col-span-5 space-y-6">
              {/* Preview 1: Light Header Preview */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  1. Live Header Preview (Light Theme)
                </span>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-11 px-2 py-1 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
                      <img
                        src={logoPreviewUrl}
                        alt="Preview"
                        className="h-8 w-auto max-w-[180px] object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                    Live Header
                  </span>
                </div>
              </div>

              {/* Preview 2: Dark Footer Preview */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  2. Live Footer Preview (Dark Theme)
                </span>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 shadow-md flex items-center justify-between text-white">
                  <div className="flex items-center gap-2.5">
                    <div className="h-11 px-2.5 py-1 rounded-xl bg-white border border-slate-700 shadow-sm flex items-center justify-center shrink-0">
                      <img
                        src={logoPreviewUrl}
                        alt="Preview"
                        className="h-7 w-auto max-w-[180px] object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                    Dark Canvas
                  </span>
                </div>
              </div>

              {/* Preview 3: Browser Tab Favicon Mockup */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  3. Browser Tab Favicon Mockup
                </span>
                <div className="bg-slate-200/70 p-2.5 rounded-xl border border-slate-300/80">
                  <div className="bg-white rounded-t-lg px-3 py-1.5 max-w-xs shadow-xs flex items-center gap-2 border-b-2 border-blue-600">
                    <img
                      src="/favicon.png"
                      alt="Favicon"
                      className="w-4 h-4 rounded-xs object-contain shrink-0"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = logoPreviewUrl;
                      }}
                    />
                    <span className="text-xs font-medium text-slate-800 truncate">
                      TripMyTour
                    </span>
                    <X className="w-3 h-3 text-slate-400 ml-auto shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 6: LEAD EMAIL ALERTS MANAGEMENT */}
      {/* ============================================================= */}
      {adminTab === 'emails' && canViewEmails && (
        <AdminLeadEmailManager />
      )}

      {/* ============================================================= */}
      {/* TAB 7: ADMIN SECURITY & CREDENTIALS MANAGEMENT */}
      {/* ============================================================= */}
      {adminTab === 'security' && (
        <AdminSecurityManager
          currentUser={currentUser || null}
          onLogout={onLogout || (() => {})}
          onProfileUpdated={onProfileUpdated || (() => {})}
        />
      )}

      {/* ============================================================= */}
      {/* TAB 8: STAFF USERS & FUNCTIONAL RESTRICTIONS (SUPER ADMIN) */}
      {/* ============================================================= */}
      {adminTab === 'users' && isSuperAdmin && (
        <AdminUserManager
          currentUser={currentUser || null}
          onUsersChanged={() => {
            const refreshed = adminAuthService.getCurrentUser();
            if (refreshed && onProfileUpdated) {
              onProfileUpdated(refreshed);
            }
          }}
        />
      )}

      {/* ============================================================= */}
      {/* MODAL: ADD / EDIT PACKAGE */}
      {/* ============================================================= */}
      {(isAddingPackage || editingPackage) && (
        <PackageFormModal
          pkg={editingPackage}
          onClose={() => {
            setEditingPackage(null);
            setIsAddingPackage(false);
            setPackageSaveError(null);
          }}
          onSave={handleSavePackageSubmit}
          isSaving={isSavingPackage}
          syncError={packageSaveError}
          onOpenSheetsSettings={() => setAdminTab('sheets')}
        />
      )}

      {/* ============================================================= */}
      {/* MODAL: ADD / EDIT VISA */}
      {/* ============================================================= */}
      {(isAddingVisa || editingVisa) && (
        <VisaFormModal
          visa={editingVisa}
          onClose={() => {
            setEditingVisa(null);
            setIsAddingVisa(false);
            setVisaSaveError(null);
          }}
          onSave={handleSaveVisaSubmit}
          isSaving={isSavingVisa}
          syncError={visaSaveError}
          onOpenSheetsSettings={() => setAdminTab('sheets')}
        />
      )}

      {/* ============================================================= */}
      {/* CONFIRMATION DIALOG: DELETE PACKAGE */}
      {/* ============================================================= */}
      {packageToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Delete Holiday Package?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">"{packageToDelete.title}"</strong>? 
                This package will be permanently deleted from the Google Sheets database.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                disabled={isDeletingPackage}
                onClick={() => setPackageToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDeletingPackage}
                onClick={confirmDeletePackage}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeletingPackage ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting from Sheets...</span>
                  </>
                ) : (
                  <span>Delete Package</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CONFIRMATION DIALOG: DELETE VISA */}
      {/* ============================================================= */}
      {visaToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Delete Visa Service?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">"{visaToDelete.country} - {visaToDelete.visaType}"</strong>? 
                This service offering will be removed from the Google Sheets database.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                disabled={isDeletingVisa}
                onClick={() => setVisaToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDeletingVisa}
                onClick={confirmDeleteVisa}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeletingVisa ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting from Sheets...</span>
                  </>
                ) : (
                  <span>Delete Visa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Banner */}
      {actionBanner && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-bounce">
          <div
            className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 border ${
              actionBanner.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {actionBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <span className="text-xs font-bold leading-relaxed">{actionBanner.text}</span>
            <button
              onClick={() => setActionBanner(null)}
              className="ml-auto p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// SUB-MODAL: PACKAGE FORM
// =========================================================================
interface PackageFormModalProps {
  pkg: HolidayPackage | null;
  onClose: () => void;
  onSave: (pkg: HolidayPackage) => void;
  isSaving?: boolean;
  syncError?: string | null;
  onOpenSheetsSettings?: () => void;
}

const PackageFormModal: React.FC<PackageFormModalProps> = ({
  pkg,
  onClose,
  onSave,
  isSaving = false,
  syncError = null,
  onOpenSheetsSettings,
}) => {
  const [title, setTitle] = useState(pkg?.title || '');
  const [destination, setDestination] = useState(pkg?.destination || '');
  const [country, setCountry] = useState(pkg?.country || '');
  const [duration, setDuration] = useState(pkg?.duration || '6 Days / 5 Nights');
  const [days, setDays] = useState(pkg?.days || 6);
  const [nights, setNights] = useState(pkg?.nights || 5);
  const [price, setPrice] = useState(pkg?.price || 699);
  const [originalPrice, setOriginalPrice] = useState(pkg?.originalPrice || 899);
  const [category, setCategory] = useState<HolidayPackage['category']>(pkg?.category || 'International');
  const [rating, setRating] = useState(pkg?.rating || 4.9);
  const [imageUrl, setImageUrl] = useState(pkg?.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80');
  const [overview, setOverview] = useState(pkg?.overview || '');
  const [hotelName, setHotelName] = useState(pkg?.hotelName || 'Luxury Resort & Spa');
  const [inclusionsText, setInclusionsText] = useState(pkg?.inclusions.join('\n') || '4-Star Hotel Stay\nDaily Buffet Breakfast\nAirport Transfers\nGuided City Excursion');
  const [exclusionsText, setExclusionsText] = useState(pkg?.exclusions.join('\n') || 'International Flights\nVisa Fees\nPersonal Expenses');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
    
    const savedPkg: HolidayPackage = {
      id: pkg?.id || `pkg-${Date.now().toString().slice(-6)}`,
      title,
      destination,
      country,
      duration,
      days: Number(days),
      nights: Number(nights),
      price: Number(price),
      originalPrice: Number(originalPrice),
      discountPercent: discount,
      rating: Number(rating),
      reviewCount: pkg?.reviewCount || 120,
      featured: true,
      category,
      imageUrl,
      galleryImages: pkg?.galleryImages || [imageUrl],
      overview: overview || `Discover ${destination} with guided tours, scenic highlights, and luxurious accommodations.`,
      inclusions: inclusionsText.split('\n').map((s) => s.trim()).filter(Boolean),
      exclusions: exclusionsText.split('\n').map((s) => s.trim()).filter(Boolean),
      itinerary: pkg?.itinerary || [
        { day: 1, title: 'Arrival & Welcome Dinner', description: `Check into ${hotelName} and enjoy an evening orientation feast.`, meals: 'Dinner' },
        { day: 2, title: `${destination} Highlights & Culture Tour`, description: 'Full day sightseeing to prominent historical monuments and viewpoints.', meals: 'Breakfast & Lunch' },
      ],
      hotelName,
      hotelRating: 5,
      nextDepartureDate: 'Weekly Departures',
    };

    onSave(savedPkg);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-slate-900 mb-4">
          {pkg ? 'Edit Holiday Package' : 'Create New Holiday Package'}
        </h2>

        {syncError && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold">Google Sheets Sync Notice</div>
              <div className="mt-0.5 leading-relaxed">{syncError}</div>
              {onOpenSheetsSettings && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSheetsSettings();
                  }}
                  className="mt-2 inline-flex items-center gap-1 font-semibold text-rose-900 underline hover:no-underline cursor-pointer"
                >
                  Configure Google Sheets Connection Settings →
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Package Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Destination City *</label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Country *</label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Duration Text</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Price (₹ INR) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Original Price (₹ INR)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
              >
                <option value="Domestic">Domestic</option>
                <option value="International">International</option>
                <option value="Honeymoon">Honeymoon</option>
                <option value="Luxury">Luxury</option>
                <option value="Budget">Budget</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hotel Name</label>
              <input
                type="text"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Cover Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Overview Description</label>
            <textarea
              rows={2}
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Inclusions (One per line)</label>
              <textarea
                rows={3}
                value={inclusionsText}
                onChange={(e) => setInclusionsText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              ></textarea>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Exclusions (One per line)</label>
              <textarea
                rows={3}
                value={exclusionsText}
                onChange={(e) => setExclusionsText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              ></textarea>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold shadow-sm flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Syncing to Google Sheets...</span>
                </>
              ) : (
                <span>Save Package</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// SUB-MODAL: VISA FORM
// =========================================================================
interface VisaFormModalProps {
  visa: VisaService | null;
  onClose: () => void;
  onSave: (visa: VisaService) => void;
  isSaving?: boolean;
  syncError?: string | null;
  onOpenSheetsSettings?: () => void;
}

const VisaFormModal: React.FC<VisaFormModalProps> = ({
  visa,
  onClose,
  onSave,
  isSaving = false,
  syncError = null,
  onOpenSheetsSettings,
}) => {
  const [country, setCountry] = useState(visa?.country || '');
  const [countryCode, setCountryCode] = useState(visa?.countryCode || 'US');
  const [flagEmoji, setFlagEmoji] = useState(visa?.flagEmoji || '🇺🇸');
  const [visaType, setVisaType] = useState(visa?.visaType || 'Tourist Visa (30 Days)');
  const [category, setCategory] = useState<VisaService['category']>(visa?.category || 'Tourist');
  const [processingTime, setProcessingTime] = useState(visa?.processingTime || '3 - 5 Working Days');
  const [validity, setValidity] = useState(visa?.validity || '60 Days');
  const [stayDuration, setStayDuration] = useState(visa?.stayDuration || 'Up to 30 Days');
  const [entryType, setEntryType] = useState<VisaService['entryType']>(visa?.entryType || 'Single Entry');
  const [embassyFee, setEmbassyFee] = useState(visa?.embassyFee || 75);
  const [serviceFee, setServiceFee] = useState(visa?.serviceFee || 25);
  const [expressAvailable, setExpressAvailable] = useState(visa?.expressAvailable || false);
  const [expressFee, setExpressFee] = useState(visa?.expressFee || 35);
  const [description, setDescription] = useState(visa?.description || '');
  const [docsText, setDocsText] = useState(
    visa?.documentsRequired.join('\n') ||
      'Passport scanned copy (min 6 months validity)\nPassport size photograph with white background\nConfirmed return flight ticket\nHotel reservation voucher'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedVisa: VisaService = {
      id: visa?.id || `visa-${Date.now().toString().slice(-6)}`,
      country,
      countryCode,
      flagEmoji,
      visaType,
      category,
      processingTime,
      validity,
      stayDuration,
      entryType,
      embassyFee: Number(embassyFee),
      serviceFee: Number(serviceFee),
      totalFee: Number(embassyFee) + Number(serviceFee),
      expressAvailable,
      expressFee: Number(expressFee),
      expressProcessingTime: '24 Hours Express',
      documentsRequired: docsText.split('\n').map((s) => s.trim()).filter(Boolean),
      popular: true,
      description: description || `Official visa assistance for travel to ${country}. Fast electronic processing.`,
    };

    onSave(savedVisa);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-500"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-slate-900 mb-4">
          {visa ? 'Edit Visa Offering' : 'Add New Visa Service'}
        </h2>

        {syncError && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold">Google Sheets Sync Notice</div>
              <div className="mt-0.5 leading-relaxed">{syncError}</div>
              {onOpenSheetsSettings && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSheetsSettings();
                  }}
                  className="mt-2 inline-flex items-center gap-1 font-semibold text-rose-900 underline hover:no-underline cursor-pointer"
                >
                  Configure Google Sheets Connection Settings →
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Country Name *</label>
              <input
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Flag Emoji</label>
              <input
                type="text"
                value={flagEmoji}
                onChange={(e) => setFlagEmoji(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-lg text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Visa Type Title *</label>
              <input
                type="text"
                required
                value={visaType}
                onChange={(e) => setVisaType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Entry Type</label>
              <select
                value={entryType}
                onChange={(e) => setEntryType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Single Entry">Single Entry</option>
                <option value="Multiple Entry">Multiple Entry</option>
                <option value="Transit">Transit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Processing Time</label>
              <input
                type="text"
                value={processingTime}
                onChange={(e) => setProcessingTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Embassy Fee (₹)</label>
              <input
                type="number"
                value={embassyFee}
                onChange={(e) => setEmbassyFee(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Service Fee (₹)</label>
              <input
                type="number"
                value={serviceFee}
                onChange={(e) => setServiceFee(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800">Express Processing Available?</span>
              <span className="block text-[11px] text-slate-500">24-48 hours expedited service</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={expressAvailable}
                onChange={(e) => setExpressAvailable(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              {expressAvailable && (
                <input
                  type="number"
                  placeholder="Fee ₹"
                  value={expressFee}
                  onChange={(e) => setExpressFee(Number(e.target.value))}
                  className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Required Documents (One per line)</label>
            <textarea
              rows={4}
              value={docsText}
              onChange={(e) => setDocsText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold shadow-sm flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Syncing to Google Sheets...</span>
                </>
              ) : (
                <span>Save Visa Offering</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
