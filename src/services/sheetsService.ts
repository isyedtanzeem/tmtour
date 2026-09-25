import { HolidayPackage, VisaService, BookingInquiry, VisaApplication, GoogleSheetsConfig, AdminUser } from '../types';
import { DEFAULT_HOLIDAY_PACKAGES, DEFAULT_VISA_SERVICES } from '../data/initialData';
import { leadEmailService } from './leadEmailService';
import { FILE_SYSTEM_SHEETS_CONFIG } from '../config/sheetsConfig';

const STORAGE_KEYS = {
  CONFIG: 'tripmytour_sheets_config_v2',
  PACKAGES: 'tripmytour_sheets_packages_v2',
  VISAS: 'tripmytour_sheets_visas_v2',
  BOOKINGS: 'tripmytour_sheets_bookings_v2',
  APPLICATIONS: 'tripmytour_sheets_applications_v2',
  STAFF: 'tripmytour_sheets_staff_v2',
  LOGO: 'custom_logo_data',
  LOGO_META: 'tripmytour_logo_meta',
};

// Detect any Web App URL injected via Vite / Vercel Environment Variables
export const getEnvWebAppUrl = (): string => {
  try {
    const metaEnv = (import.meta as any)?.env;
    return (
      (metaEnv && (
        metaEnv.VITE_GOOGLE_SHEETS_WEB_APP_URL ||
        metaEnv.VITE_SHEETS_WEB_APP_URL ||
        metaEnv.VITE_SHEETS_URL
      )) || ''
    ).trim();
  } catch {
    return '';
  }
};

export class SheetsService {
  private static instance: SheetsService;

  private config: GoogleSheetsConfig = {
    webAppUrl: '',
    sheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', // sample template ID
    isCustomUrlActive: false,
    lastSyncedAt: null,
    syncStatus: 'local_fallback',
    errorMessage: null,
  };

  // Authoritative in-memory database mirror synced with Google Sheets
  private packages: HolidayPackage[] = [];
  private visas: VisaService[] = [];
  private bookings: BookingInquiry[] = [];
  private applications: VisaApplication[] = [];
  private staffUsers: AdminUser[] = [];
  private logoUrl: string = '';
  private logoMeta: { updatedAt?: string; updatedBy?: string } = {};
  private isInitializedFromSheets = false;

  private listeners: (() => void)[] = [];

  private constructor() {
    this.loadInitialConfig();
    this.loadCachedData();
  }

  public static getInstance(): SheetsService {
    if (!SheetsService.instance) {
      SheetsService.instance = new SheetsService();
    }
    return SheetsService.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public notify(): void {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Error in SheetsService listener:', err);
      }
    });
  }

  public isValidWebAppUrl(url?: string | null): boolean {
    if (!url) return false;
    const trimmed = url.trim();
    return (
      trimmed.startsWith('https://script.google.com/macros/s/') &&
      trimmed.includes('/exec') &&
      !trimmed.includes('docs.google.com')
    );
  }

  public isGoogleSpreadsheetUrl(url?: string | null): boolean {
    if (!url) return false;
    return url.includes('docs.google.com/spreadsheets');
  }

  public extractSheetId(url?: string | null): string | null {
    if (!url) return null;
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  public getFileSystemConfig() {
    return {
      webAppUrl: (FILE_SYSTEM_SHEETS_CONFIG?.webAppUrl || '').trim(),
      sheetId: (FILE_SYSTEM_SHEETS_CONFIG?.sheetId || '').trim(),
      isConfigured: this.isValidWebAppUrl(FILE_SYSTEM_SHEETS_CONFIG?.webAppUrl),
    };
  }

  private loadInitialConfig(): void {
    const fsConfig = FILE_SYSTEM_SHEETS_CONFIG;
    const fsUrl = (fsConfig?.webAppUrl || '').trim();
    const envUrl = getEnvWebAppUrl();

    // Priority 1: Direct File System configuration (src/config/sheetsConfig.ts)
    if (fsUrl && this.isValidWebAppUrl(fsUrl)) {
      this.config = {
        ...this.config,
        webAppUrl: fsUrl,
        sheetId: fsConfig.sheetId || this.config.sheetId,
        isCustomUrlActive: true,
        syncStatus: 'syncing',
        errorMessage: null,
        source: 'file_system',
        isFileSystemFixed: true,
      };
      return;
    }

    // Priority 2: Vercel / Cloud Run Environment variable
    if (envUrl && this.isValidWebAppUrl(envUrl)) {
      this.config = {
        ...this.config,
        webAppUrl: envUrl,
        isCustomUrlActive: true,
        syncStatus: 'syncing',
        errorMessage: null,
        source: 'env_var',
        isFileSystemFixed: false,
      };
      return;
    }

    // Priority 3: Browser localStorage fallback
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);

        // Sanitize: if user pasted a spreadsheet URL instead of Apps Script URL, extract ID and clear webAppUrl
        if (parsed.webAppUrl && this.isGoogleSpreadsheetUrl(parsed.webAppUrl)) {
          const extractedId = this.extractSheetId(parsed.webAppUrl);
          if (extractedId) parsed.sheetId = extractedId;
          parsed.webAppUrl = '';
          parsed.isCustomUrlActive = false;
        }

        const effectiveUrl = (parsed.webAppUrl || '').trim();
        const hasValidUrl = this.isValidWebAppUrl(effectiveUrl);

        this.config = {
          ...this.config,
          ...parsed,
          webAppUrl: effectiveUrl,
          isCustomUrlActive: hasValidUrl && parsed.isCustomUrlActive !== false,
          syncStatus: hasValidUrl ? 'syncing' : 'local_fallback',
          errorMessage: null,
          source: hasValidUrl ? 'custom' : undefined,
          isFileSystemFixed: false,
        };
      }
    } catch (e) {
      console.warn('Could not read config from localStorage', e);
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Could not save config to localStorage', e);
    }
  }

  private normalizePackage(pkg: any): HolidayPackage {
    if (!pkg) return pkg;
    let itinerary = pkg.itinerary;
    if (typeof itinerary === 'string') {
      try {
        itinerary = JSON.parse(itinerary);
      } catch {
        // Plain text fallback if user typed manually in Google Sheets cell
        const lines = itinerary.split('\n').map((l: string) => l.trim()).filter(Boolean);
        itinerary = lines.map((line: string, idx: number) => {
          const dayMatch = line.match(/^Day\s*(\d+)[:\s-]*(.*)/i);
          const dayNum = dayMatch ? parseInt(dayMatch[1], 10) : idx + 1;
          const rest = dayMatch ? dayMatch[2] : line;
          const parts = rest.split(/[-–—:]+/);
          const title = parts[0]?.trim() || `Day ${dayNum}`;
          const desc = parts.slice(1).join(' - ').trim() || title;
          return {
            day: dayNum,
            title,
            description: desc,
            meals: 'Standard Meals',
          };
        });
      }
    }
    
    if (Array.isArray(itinerary) && itinerary.length > 0) {
      itinerary = itinerary.map((item: any, idx: number) => ({
        day: Number(item.day) || idx + 1,
        title: String(item.title || `Day ${idx + 1}`),
        description: String(item.description || ''),
        meals: String(item.meals || 'Breakfast Included'),
        activities: Array.isArray(item.activities) ? item.activities : undefined,
      }));
    } else {
      itinerary = [];
    }

    let inclusions = pkg.inclusions;
    if (typeof inclusions === 'string') {
      try { inclusions = JSON.parse(inclusions); } catch { inclusions = inclusions.split('\n').map((s: string) => s.trim()).filter(Boolean); }
    }
    if (!Array.isArray(inclusions)) inclusions = [];

    let exclusions = pkg.exclusions;
    if (typeof exclusions === 'string') {
      try { exclusions = JSON.parse(exclusions); } catch { exclusions = exclusions.split('\n').map((s: string) => s.trim()).filter(Boolean); }
    }
    if (!Array.isArray(exclusions)) exclusions = [];

    let galleryImages = pkg.galleryImages;
    if (typeof galleryImages === 'string') {
      try { galleryImages = JSON.parse(galleryImages); } catch { galleryImages = [pkg.imageUrl].filter(Boolean); }
    }
    if (!Array.isArray(galleryImages)) galleryImages = [pkg.imageUrl].filter(Boolean);

    return {
      ...pkg,
      days: Number(pkg.days) || (itinerary.length > 0 ? itinerary.length : 5),
      nights: Number(pkg.nights) || Math.max(1, (Number(pkg.days) || 5) - 1),
      price: Number(pkg.price) || 0,
      originalPrice: Number(pkg.originalPrice) || Number(pkg.price) || 0,
      rating: Number(pkg.rating) || 4.9,
      reviewCount: Number(pkg.reviewCount) || 100,
      itinerary,
      inclusions,
      exclusions,
      galleryImages,
    };
  }

  private loadCachedData(): void {
    try {
      const pkgRaw = localStorage.getItem(STORAGE_KEYS.PACKAGES);
      if (pkgRaw) {
        const parsed = JSON.parse(pkgRaw);
        this.packages = Array.isArray(parsed) ? parsed.map((p) => this.normalizePackage(p)) : [...DEFAULT_HOLIDAY_PACKAGES];
      } else {
        this.packages = [...DEFAULT_HOLIDAY_PACKAGES];
      }

      const visaRaw = localStorage.getItem(STORAGE_KEYS.VISAS);
      if (visaRaw) {
        this.visas = JSON.parse(visaRaw);
      } else {
        this.visas = [...DEFAULT_VISA_SERVICES];
      }

      const bookRaw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      if (bookRaw) {
        const parsed = JSON.parse(bookRaw);
        if (Array.isArray(parsed)) {
          this.bookings = parsed.map((b: any) => ({
            ...b,
            customerPhone: String(b.customerPhone || '').replace(/^'/, '').trim(),
          }));
        }
      }

      const appRaw = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
      if (appRaw) {
        const parsed = JSON.parse(appRaw);
        if (Array.isArray(parsed)) {
          this.applications = parsed.map((a: any) => ({
            ...a,
            applicantPhone: String(a.applicantPhone || '').replace(/^'/, '').trim(),
          }));
        }
      }

      const staffRaw = localStorage.getItem(STORAGE_KEYS.STAFF);
      if (staffRaw) {
        this.staffUsers = JSON.parse(staffRaw);
      }

      const logoRaw = localStorage.getItem(STORAGE_KEYS.LOGO);
      if (logoRaw) {
        this.logoUrl = logoRaw;
      }

      const logoMetaRaw = localStorage.getItem(STORAGE_KEYS.LOGO_META);
      if (logoMetaRaw) {
        try {
          this.logoMeta = JSON.parse(logoMetaRaw);
        } catch {
          this.logoMeta = {};
        }
      }
    } catch (e) {
      this.packages = [...DEFAULT_HOLIDAY_PACKAGES];
      this.visas = [...DEFAULT_VISA_SERVICES];
      this.bookings = [];
      this.applications = [];
      this.staffUsers = [];
      this.logoUrl = '';
      this.logoMeta = {};
    }
  }

  public getConfig(): GoogleSheetsConfig {
    return { ...this.config };
  }

  public clearCustomUrl(): void {
    const fsConfig = FILE_SYSTEM_SHEETS_CONFIG;
    const fsUrl = (fsConfig?.webAppUrl || '').trim();

    if (fsUrl && this.isValidWebAppUrl(fsUrl)) {
      // Revert back to the file system configuration
      this.config.webAppUrl = fsUrl;
      this.config.sheetId = fsConfig.sheetId || this.config.sheetId;
      this.config.isCustomUrlActive = true;
      this.config.syncStatus = 'syncing';
      this.config.errorMessage = null;
      this.config.source = 'file_system';
      this.config.isFileSystemFixed = true;
    } else {
      this.config.webAppUrl = '';
      this.config.isCustomUrlActive = false;
      this.config.syncStatus = 'local_fallback';
      this.config.errorMessage = null;
      this.config.source = undefined;
      this.config.isFileSystemFixed = false;
    }

    this.saveConfig();
    this.notify();
    if (this.config.isCustomUrlActive) {
      this.syncWithGoogleSheets();
    }
  }

  public async saveToFileSystem(
    targetUrl: string,
    targetSheetId?: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanUrl = (targetUrl || '').trim();
    const cleanSheetId = (targetSheetId || this.config.sheetId || '').trim();

    if (!cleanUrl) {
      return { success: false, message: 'Please enter a valid Google Apps Script Web App URL.' };
    }

    if (!this.isValidWebAppUrl(cleanUrl)) {
      return {
        success: false,
        message: 'Invalid Web App URL format. Must start with https://script.google.com/macros/s/... and end with /exec.',
      };
    }

    try {
      // Write directly to file system via backend endpoint
      const res = await fetch('/api/sheets-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webAppUrl: cleanUrl, sheetId: cleanSheetId }),
      });

      if (res.ok) {
        FILE_SYSTEM_SHEETS_CONFIG.webAppUrl = cleanUrl;
        if (cleanSheetId) FILE_SYSTEM_SHEETS_CONFIG.sheetId = cleanSheetId;

        this.config = {
          ...this.config,
          webAppUrl: cleanUrl,
          sheetId: cleanSheetId || this.config.sheetId,
          isCustomUrlActive: true,
          syncStatus: 'syncing',
          errorMessage: null,
          source: 'file_system',
          isFileSystemFixed: true,
        };
        this.saveConfig();
        this.notify();
        await this.syncWithGoogleSheets();

        return {
          success: true,
          message: 'Saved permanently to src/config/sheetsConfig.ts on the file system! All visitors & admins on your custom domain will now use this URL.',
        };
      }
    } catch (err) {
      console.warn('Direct file write endpoint unavailable, updating memory mirror:', err);
    }

    // Fallback: update in-memory mirror and storage
    FILE_SYSTEM_SHEETS_CONFIG.webAppUrl = cleanUrl;
    if (cleanSheetId) FILE_SYSTEM_SHEETS_CONFIG.sheetId = cleanSheetId;
    this.config = {
      ...this.config,
      webAppUrl: cleanUrl,
      sheetId: cleanSheetId || this.config.sheetId,
      isCustomUrlActive: true,
      syncStatus: 'syncing',
      errorMessage: null,
      source: 'file_system',
      isFileSystemFixed: true,
    };
    this.saveConfig();
    this.notify();
    await this.syncWithGoogleSheets();

    return {
      success: true,
      message: 'Active URL configured! Also update src/config/sheetsConfig.ts in your code repository for permanent Vercel deployment.',
    };
  }

  public async updateConfig(newConfig: Partial<GoogleSheetsConfig>): Promise<{ success: boolean; message?: string }> {
    let targetUrl = (newConfig.webAppUrl ?? this.config.webAppUrl ?? '').trim();
    let targetSheetId = (newConfig.sheetId ?? this.config.sheetId ?? '').trim();

    // Check if user entered a Google Spreadsheet link
    if (this.isGoogleSpreadsheetUrl(targetUrl)) {
      const extractedId = this.extractSheetId(targetUrl);
      if (extractedId) targetSheetId = extractedId;
      targetUrl = '';
    }

    const hasValidUrl = this.isValidWebAppUrl(targetUrl);
    const fsUrl = (FILE_SYSTEM_SHEETS_CONFIG?.webAppUrl || '').trim();
    const envUrl = getEnvWebAppUrl();
    const isFs = targetUrl === fsUrl && this.isValidWebAppUrl(fsUrl);
    const isEnv = targetUrl === envUrl;

    this.config = {
      ...this.config,
      ...newConfig,
      webAppUrl: targetUrl,
      sheetId: targetSheetId,
      isCustomUrlActive: hasValidUrl,
      syncStatus: hasValidUrl ? 'syncing' : 'local_fallback',
      errorMessage: null,
      source: isFs ? 'file_system' : isEnv ? 'env_var' : hasValidUrl ? 'custom' : undefined,
      isFileSystemFixed: isFs,
    };
    this.saveConfig();
    this.notify();

    if (hasValidUrl) {
      return await this.syncWithGoogleSheets();
    }
    return { success: true, message: 'Running in Local Sheets Database Mode' };
  }

  public async testConnection(targetUrl?: string): Promise<{ success: boolean; message: string; sheetName?: string }> {
    const rawUrl = (targetUrl || this.config.webAppUrl || '').trim();
    if (!rawUrl) {
      return { success: false, message: 'Please enter a Google Apps Script Web App URL.' };
    }

    if (this.isGoogleSpreadsheetUrl(rawUrl)) {
      const extractedId = this.extractSheetId(rawUrl);
      return {
        success: false,
        message: `This is a Google Spreadsheet link (ID: ${extractedId || 'detected'}), not the Apps Script Web App deployment URL. In your sheet, click Extensions > Apps Script, paste the code below, and click Deploy -> New deployment -> Web app -> Who has access: Anyone. Then copy and paste that /exec URL.`,
      };
    }

    if (!this.isValidWebAppUrl(rawUrl)) {
      return {
        success: false,
        message: 'Invalid Web App URL format. It must start with https://script.google.com/macros/s/... and end with /exec.',
      };
    }

    try {
      const pingUrl = `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}action=ping&t=${Date.now()}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const response = await fetch(pingUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && data.success) {
        return {
          success: true,
          message: data.message || 'Successfully connected to Google Sheets backend!',
          sheetName: data.sheetName || 'Google Spreadsheet',
        };
      } else {
        throw new Error(data?.error || 'Apps Script returned an error response.');
      }
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError';
      return {
        success: false,
        message: isTimeout
          ? 'Connection timed out (9s). Check your Apps Script deployment.'
          : `Connection notice: ${err?.message || 'Network issue'}. Ensure deployment has "Execute as: Me" and "Who has access: Anyone".`,
      };
    }
  }

  public async testAppsScriptEmail(targetUrl?: string): Promise<{ success: boolean; message: string }> {
    const rawUrl = (targetUrl || this.config.webAppUrl || '').trim();
    if (!rawUrl || !this.isValidWebAppUrl(rawUrl)) {
      return { success: false, message: 'Please provide a valid Apps Script Web App URL ending in /exec.' };
    }
    try {
      const notificationEmails = leadEmailService.getActiveRecipientsFor('holiday');
      const response = await fetch(rawUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'testEmail',
          notificationEmails,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return {
        success: data.success ?? true,
        message: data.message || 'Test email dispatched successfully via Google Apps Script!',
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Failed to trigger test email: ${e.message || 'Network error'}`,
      };
    }
  }

  /**
   * Universal executor for calling Google Apps Script Web App actions.
   * Handles GET (with automatic 302 follow and CORS headers from script.googleusercontent.com)
   * as well as POST fallback for larger payloads.
   */
  public async executeSheetsAction(
    action: string,
    extraPayload: Record<string, any> = {}
  ): Promise<{
    success: boolean;
    data?: any;
    packages?: HolidayPackage[];
    visas?: VisaService[];
    bookings?: BookingInquiry[];
    applications?: VisaApplication[];
    message?: string;
    error?: string;
  }> {
    const rawUrl = (this.config.webAppUrl || getEnvWebAppUrl() || '').trim();
    if (!rawUrl || !this.isValidWebAppUrl(rawUrl)) {
      return {
        success: false,
        error: 'Google Sheets Web App URL is not configured. Please configure your Apps Script URL ending in /exec.',
      };
    }

    const payload = {
      action,
      ...extraPayload,
      timestamp: new Date().toISOString(),
    };

    const payloadString = JSON.stringify(payload);
    // Method 1: For payloads under 3500 characters, GET request is 100% immune to browser CORS redirect issues
    if (payloadString.length < 3500) {
      try {
        const queryParams = new URLSearchParams();
        queryParams.set('action', action);
        if (extraPayload.data) {
          queryParams.set('data', JSON.stringify(extraPayload.data));
        }
        if (extraPayload.id) {
          queryParams.set('id', extraPayload.id);
        }
        if (extraPayload.status) {
          queryParams.set('status', extraPayload.status);
        }
        if (extraPayload.notificationEmails) {
          queryParams.set('notificationEmails', JSON.stringify(extraPayload.notificationEmails));
        }
        queryParams.set('t', Date.now().toString());

        const getUrl = `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}${queryParams.toString()}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(getUrl, {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const resJson = await response.json();
          if (resJson && resJson.success !== false) {
            this.handleSyncPayload(resJson);
            return {
              success: true,
              ...resJson,
            };
          } else if (resJson && resJson.error) {
            return {
              success: false,
              error: resJson.error,
            };
          }
        }
      } catch (err: any) {
        console.warn(`GET action=${action} failed or timed out, trying POST fallback:`, err?.message || err);
      }
    }

    // Method 2: POST request (for larger payloads or as reliable fallback)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const postRes = await fetch(rawUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: payloadString,
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (postRes.ok) {
        const resJson = await postRes.json();
        if (resJson && resJson.success !== false) {
          this.handleSyncPayload(resJson);
          return {
            success: true,
            ...resJson,
          };
        }
      }
    } catch (postErr: any) {
      console.warn(`Direct POST failed due to CORS/redirect, attempting background POST + GET verify:`, postErr?.message);
      
      // If browser CORS blocked the POST 302 redirect response:
      // Send with mode: 'no-cors' so Google Apps Script executes the row insertion,
      // then immediately perform a verified GET sync to fetch the updated spreadsheet!
      try {
        await fetch(rawUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: payloadString,
          mode: 'no-cors',
          redirect: 'follow',
        });

        // Allow 750ms for Google Sheet to commit the new row
        await new Promise((resolve) => setTimeout(resolve, 750));

        // Now fetch live data from Google Sheets to verify
        const syncResult = await this.syncWithGoogleSheets();
        if (syncResult.success) {
          return {
            success: true,
            packages: this.packages,
            visas: this.visas,
            bookings: this.bookings,
            applications: this.applications,
          };
        }
      } catch (fallbackErr: any) {
        return {
          success: false,
          error: `Could not sync with Google Sheets: ${fallbackErr?.message || 'Network error'}`,
        };
      }
    }

    // Secondary verification: re-sync all data from Google Sheets
    const syncRes = await this.syncWithGoogleSheets();
    return {
      success: syncRes.success,
      packages: this.packages,
      visas: this.visas,
      bookings: this.bookings,
      applications: this.applications,
      error: syncRes.success ? undefined : syncRes.message,
    };
  }

  private handleSyncPayload(data: any): void {
    let hasChanges = false;

    if (Array.isArray(data.packages) && data.packages.length > 0) {
      this.packages = data.packages.map((p: any) => this.normalizePackage(p));
      localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(this.packages));
      hasChanges = true;
    }
    if (Array.isArray(data.visas) && data.visas.length > 0) {
      this.visas = data.visas;
      localStorage.setItem(STORAGE_KEYS.VISAS, JSON.stringify(this.visas));
      hasChanges = true;
    }
    if (Array.isArray(data.bookings)) {
      this.bookings = data.bookings.map((b: any) => {
        let phone = String(b.customerPhone || '').trim();
        // If Google Sheets stored "#ERROR!" or "#VALUE!", preserve known local phone if available
        if (phone === '#ERROR!' || phone === '#VALUE!' || phone.startsWith('#') || !phone) {
          const cached = this.bookings.find((prev) => prev.id === b.id);
          if (cached && cached.customerPhone && !cached.customerPhone.startsWith('#')) {
            phone = cached.customerPhone;
          }
        }
        // Strip leading apostrophe prefix if present from Sheets
        if (phone.startsWith("'")) {
          phone = phone.slice(1).trim();
        }
        return {
          ...b,
          customerPhone: phone,
        };
      });
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(this.bookings));
      hasChanges = true;
    }
    if (Array.isArray(data.applications)) {
      this.applications = data.applications.map((a: any) => {
        let phone = String(a.applicantPhone || '').trim();
        if (phone === '#ERROR!' || phone === '#VALUE!' || phone.startsWith('#') || !phone) {
          const cached = this.applications.find((prev) => prev.id === a.id);
          if (cached && cached.applicantPhone && !cached.applicantPhone.startsWith('#')) {
            phone = cached.applicantPhone;
          }
        }
        if (phone.startsWith("'")) {
          phone = phone.slice(1).trim();
        }
        return {
          ...a,
          applicantPhone: phone,
        };
      });
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(this.applications));
      hasChanges = true;
    }
    if (Array.isArray(data.staffUsers) && data.staffUsers.length > 0) {
      this.staffUsers = data.staffUsers.map((u: any) => {
        let perms = u.permissions;
        if (typeof perms === 'string') {
          try {
            perms = JSON.parse(perms);
          } catch (e) {}
        }
        return {
          ...u,
          active: u.active === true || u.active === 'true' || u.active === 1 || u.active === '1',
          permissions: perms,
        };
      });
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(this.staffUsers));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sheets-staff-synced', { detail: this.staffUsers }));
      }
      hasChanges = true;
    }

    if (typeof data.logo === 'string') {
      const trimmedLogo = data.logo.trim();
      if (trimmedLogo) {
        this.logoUrl = trimmedLogo;
        localStorage.setItem(STORAGE_KEYS.LOGO, trimmedLogo);
        if (data.logoUpdatedAt || data.logoUpdatedBy) {
          this.logoMeta = {
            updatedAt: data.logoUpdatedAt || new Date().toISOString(),
            updatedBy: data.logoUpdatedBy || 'Google Sheets',
          };
          localStorage.setItem(STORAGE_KEYS.LOGO_META, JSON.stringify(this.logoMeta));
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('logo-updated'));
        }
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.isInitializedFromSheets = true;
      this.config.syncStatus = 'connected';
      this.config.lastSyncedAt = new Date().toLocaleTimeString();
      this.config.errorMessage = null;
      this.saveConfig();
      this.notify();
    }
  }

  public async syncWithGoogleSheets(): Promise<{ success: boolean; message?: string }> {
    const rawUrl = (this.config.webAppUrl || getEnvWebAppUrl() || '').trim();
    if (!rawUrl || !this.isValidWebAppUrl(rawUrl)) {
      this.config.syncStatus = 'local_fallback';
      this.notify();
      return { success: false, message: 'Google Sheets Web App URL is not configured.' };
    }

    this.config.syncStatus = 'syncing';
    this.config.errorMessage = null;
    this.notify();

    try {
      const cleanUrl = rawUrl;
      const fetchUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=getAllData&t=${Date.now()}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      // Clean GET request with follow redirect and NO custom headers
      const res = await fetch(fetchUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from Apps Script`);
      }

      const data = await res.json();
      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      this.handleSyncPayload(data);

      this.config.syncStatus = 'connected';
      this.config.lastSyncedAt = new Date().toLocaleTimeString();
      this.config.errorMessage = null;
      this.saveConfig();
      this.notify();
      return { success: true, message: 'Google Sheets synchronized successfully!' };
    } catch (err: any) {
      console.warn('Google Sheets sync notice (falling back to cache):', err?.message || err);
      this.config.syncStatus = 'local_fallback';
      this.config.errorMessage = err?.name === 'AbortError'
        ? 'Connection timed out. Check your Google Apps Script.'
        : 'Google Apps Script was unreachable. Check your deployment URL.';
      this.notify();
      return { success: false, message: this.config.errorMessage };
    }
  }

  // --------------------------------------------------------------------------
  // HOLIDAY PACKAGES (GOOGLE SHEETS AUTHORITATIVE)
  // --------------------------------------------------------------------------

  public getPackages(): HolidayPackage[] {
    if (this.packages && this.packages.length > 0) {
      return [...this.packages];
    }
    return [...DEFAULT_HOLIDAY_PACKAGES];
  }

  public async savePackage(pkg: HolidayPackage): Promise<{ success: boolean; message: string; error?: string }> {
    const rawUrl = (this.config.webAppUrl || getEnvWebAppUrl() || '').trim();
    if (!rawUrl || !this.isValidWebAppUrl(rawUrl)) {
      return {
        success: false,
        message: 'Google Sheets database is not connected.',
        error: 'To permanently save packages across sessions on your custom domain, connect your Google Apps Script Web App URL in Google Sheets settings (or add VITE_GOOGLE_SHEETS_WEB_APP_URL in Vercel). Packages cannot be saved without an active Google Sheet database.',
      };
    }

    // Execute save operation directly on Google Apps Script
    const result = await this.executeSheetsAction('savePackage', { data: pkg });

    if (!result.success) {
      return {
        success: false,
        message: 'Failed to save holiday package to Google Sheets.',
        error: result.error || 'Google Apps Script failed to save the package. Please ensure deployment has "Who has access: Anyone".',
      };
    }

    // Ensure local packages list is updated with the saved package
    const normalized = this.normalizePackage(pkg);
    const existingIndex = this.packages.findIndex((p) => p.id === pkg.id);
    if (existingIndex !== -1) {
      this.packages[existingIndex] = normalized;
    } else {
      this.packages.unshift(normalized);
    }
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(this.packages));
    this.notify();

    return {
      success: true,
      message: `Package "${pkg.title}" saved and instantly synced to Google Sheets database!`,
    };
  }

  public async deletePackage(id: string): Promise<{ success: boolean; message: string; error?: string }> {
    const rawUrl = (this.config.webAppUrl || getEnvWebAppUrl() || '').trim();
    if (!rawUrl || !this.isValidWebAppUrl(rawUrl)) {
      // Local removal
      this.packages = this.packages.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(this.packages));
      this.notify();
      return {
        success: true,
        message: 'Package deleted locally.',
      };
    }

    const result = await this.executeSheetsAction('deletePackage', { id });
    if (!result.success) {
      return {
        success: false,
        message: 'Failed to delete package from Google Sheets.',
        error: result.error,
      };
    }

    this.packages = this.packages.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(this.packages));
    this.notify();

    return {
      success: true,
      message: 'Package deleted from Google Sheets database successfully.',
    };
  }

  // --------------------------------------------------------------------------
  // VISA SERVICES (GOOGLE SHEETS AUTHORITATIVE)
  // --------------------------------------------------------------------------

  public getVisas(): VisaService[] {
    if (this.visas && this.visas.length > 0) {
      return [...this.visas];
    }
    return [...DEFAULT_VISA_SERVICES];
  }

  public async saveVisa(visa: VisaService): Promise<{ success: boolean; message: string; error?: string }> {
    const rawUrl = (this.config.webAppUrl || getEnvWebAppUrl() || '').trim();
    if (!rawUrl || !this.isValidWebAppUrl(rawUrl)) {
      return {
        success: false,
        message: 'Google Sheets database is not connected.',
        error: 'To permanently save visa services across sessions on your custom domain, connect your Google Apps Script Web App URL in Google Sheets settings (or add VITE_GOOGLE_SHEETS_WEB_APP_URL in Vercel). Visa services cannot be saved without an active Google Sheet database.',
      };
    }

    const result = await this.executeSheetsAction('saveVisa', { data: visa });

    if (!result.success) {
      return {
        success: false,
        message: 'Failed to save visa service to Google Sheets.',
        error: result.error || 'Google Apps Script failed to save the visa service.',
      };
    }

    const found = this.visas.find((v) => v.id === visa.id);
    if (!found) {
      this.visas.unshift(visa);
      localStorage.setItem(STORAGE_KEYS.VISAS, JSON.stringify(this.visas));
      this.notify();
    }

    return {
      success: true,
      message: `Visa service for "${visa.country}" saved and instantly synced to Google Sheets database!`,
    };
  }

  public async deleteVisa(id: string): Promise<{ success: boolean; message: string; error?: string }> {
    const rawUrl = (this.config.webAppUrl || getEnvWebAppUrl() || '').trim();
    if (!rawUrl || !this.isValidWebAppUrl(rawUrl)) {
      this.visas = this.visas.filter((v) => v.id !== id);
      localStorage.setItem(STORAGE_KEYS.VISAS, JSON.stringify(this.visas));
      this.notify();
      return { success: true, message: 'Visa service removed locally.' };
    }

    const result = await this.executeSheetsAction('deleteVisa', { id });
    if (!result.success) {
      return {
        success: false,
        message: 'Failed to delete visa service from Google Sheets.',
        error: result.error,
      };
    }

    this.visas = this.visas.filter((v) => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VISAS, JSON.stringify(this.visas));
    this.notify();

    return {
      success: true,
      message: 'Visa service deleted from Google Sheets database successfully.',
    };
  }

  // --------------------------------------------------------------------------
  // BOOKING INQUIRIES
  // --------------------------------------------------------------------------

  public getBookings(): BookingInquiry[] {
    return [...this.bookings];
  }

  public async createBooking(booking: BookingInquiry): Promise<boolean> {
    // Keep clean phone for local UI, email, and WhatsApp
    const cleanPhone = (booking.customerPhone || '').replace(/^'/, '').trim();
    const localBooking: BookingInquiry = {
      ...booking,
      customerPhone: cleanPhone,
    };

    this.bookings.unshift(localBooking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(this.bookings));
    this.notify();

    // Trigger email notification to team
    leadEmailService.dispatchHolidayLeadAlert(localBooking);

    // Sync to remote Google Sheet:
    // IMPORTANT: Any phone number starting with "+" (e.g. "+91 98803 71756") or "0"
    // MUST be prepended with a single apostrophe (') when sent to Google Sheets.
    // In spreadsheet formulas, a leading "+" causes Google Sheets to evaluate it as a formula,
    // resulting in "#ERROR! (Formula parse error)". The leading apostrophe instructs Google Sheets
    // to store and display the value as plain text, eliminating the "#ERROR!".
    const sheetPhone = cleanPhone ? (cleanPhone.startsWith("'") ? cleanPhone : `'${cleanPhone}`) : '';
    const sheetBooking = {
      ...localBooking,
      customerPhone: sheetPhone,
    };

    const notificationEmails = leadEmailService.getActiveRecipientsFor('holiday');
    this.executeSheetsAction('createBooking', {
      data: sheetBooking,
      notificationEmails,
    }).catch((err) => console.warn('Booking sync notice:', err));

    return true;
  }

  public async updateBookingStatus(id: string, status: BookingInquiry['status']): Promise<boolean> {
    const target = this.bookings.find((b) => b.id === id);
    if (target) {
      target.status = status;
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(this.bookings));
      this.notify();

      this.executeSheetsAction('updateBookingStatus', { id, status }).catch((err) =>
        console.warn('Booking status sync notice:', err)
      );
      return true;
    }
    return false;
  }

  public async deleteBooking(id: string): Promise<boolean> {
    this.bookings = this.bookings.filter((b) => b.id !== id);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(this.bookings));
    this.notify();

    this.executeSheetsAction('deleteBooking', { id }).catch((err) =>
      console.warn('Booking delete notice:', err)
    );
    return true;
  }

  // --------------------------------------------------------------------------
  // VISA APPLICATIONS
  // --------------------------------------------------------------------------

  public getApplications(): VisaApplication[] {
    return [...this.applications];
  }

  public async createVisaApplication(app: VisaApplication): Promise<boolean> {
    const cleanPhone = (app.applicantPhone || '').replace(/^'/, '').trim();
    const localApp: VisaApplication = {
      ...app,
      applicantPhone: cleanPhone,
    };

    this.applications.unshift(localApp);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(this.applications));
    this.notify();

    // Trigger email notification
    leadEmailService.dispatchVisaLeadAlert(localApp);

    // Escape phone with apostrophe for Google Sheets formula protection
    const sheetPhone = cleanPhone ? (cleanPhone.startsWith("'") ? cleanPhone : `'${cleanPhone}`) : '';
    const sheetApp = {
      ...localApp,
      applicantPhone: sheetPhone,
    };

    const notificationEmails = leadEmailService.getActiveRecipientsFor('visa');
    this.executeSheetsAction('createVisaApplication', {
      data: sheetApp,
      notificationEmails,
    }).catch((err) => console.warn('Visa app sync notice:', err));

    return true;
  }

  public async updateApplicationStatus(id: string, status: VisaApplication['status']): Promise<boolean> {
    const target = this.applications.find((a) => a.id === id);
    if (target) {
      target.status = status;
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(this.applications));
      this.notify();

      this.executeSheetsAction('updateApplicationStatus', { id, status }).catch((err) =>
        console.warn('Visa application status sync notice:', err)
      );
      return true;
    }
    return false;
  }

  public async deleteApplication(id: string): Promise<boolean> {
    this.applications = this.applications.filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(this.applications));
    this.notify();

    this.executeSheetsAction('deleteApplication', { id }).catch((err) =>
      console.warn('Visa app delete notice:', err)
    );
    return true;
  }

  /**
   * Triggers the remote Google Apps Script to scan existing rows in Google Sheets,
   * repair any cells showing '#ERROR!' by recovering the phone number from the cell formula,
   * and permanently set the phone columns to Plain Text format.
   */
  public async repairPhoneErrorsInSheets(): Promise<{ success: boolean; repairedCount?: number; message?: string }> {
    try {
      const res = await this.executeSheetsAction('repairPhoneErrors');
      if (res.success) {
        await this.syncWithGoogleSheets();
        return {
          success: true,
          repairedCount: (res as any).repairedCount || 0,
          message: res.message || 'Successfully repaired phone number cells in Google Sheets!',
        };
      }
      return {
        success: false,
        message: res.error || 'Failed to repair phone numbers in Google Sheets.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Error executing repair in Google Sheets.',
      };
    }
  }

  // --------------------------------------------------------------------------
  // STAFF USERS & ROLES (GOOGLE SHEETS AUTHORITATIVE)
  // --------------------------------------------------------------------------

  public getStaffUsers(): AdminUser[] {
    return [...this.staffUsers];
  }

  public async saveStaffUser(user: AdminUser): Promise<{ success: boolean; message: string; error?: string }> {
    const rawUrl = (this.config.webAppUrl || getEnvWebAppUrl() || '').trim();
    if (!rawUrl || !this.isValidWebAppUrl(rawUrl)) {
      const idx = this.staffUsers.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        this.staffUsers[idx] = user;
      } else {
        this.staffUsers.push(user);
      }
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(this.staffUsers));
      this.notify();
      return {
        success: true,
        message: 'Saved to local system. Connect Google Apps Script to synchronize with Google Sheets.',
      };
    }

    const result = await this.executeSheetsAction('saveStaffUser', { data: user });
    if (!result.success) {
      return {
        success: false,
        message: 'Failed to save staff user to Google Sheets.',
        error: result.error || 'Google Apps Script failed to save staff user.',
      };
    }

    const idx = this.staffUsers.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.staffUsers[idx] = user;
    } else {
      this.staffUsers.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(this.staffUsers));
    this.notify();

    return {
      success: true,
      message: `Staff member '${user.name}' successfully saved and synced to Google Sheets!`,
    };
  }

  public async deleteStaffUser(id: string): Promise<{ success: boolean; message: string; error?: string }> {
    const rawUrl = (this.config.webAppUrl || getEnvWebAppUrl() || '').trim();
    if (!rawUrl || !this.isValidWebAppUrl(rawUrl)) {
      this.staffUsers = this.staffUsers.filter((u) => u.id !== id);
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(this.staffUsers));
      this.notify();
      return { success: true, message: 'Staff member removed locally.' };
    }

    const result = await this.executeSheetsAction('deleteStaffUser', { id });
    if (!result.success) {
      return {
        success: false,
        message: 'Failed to delete staff user from Google Sheets.',
        error: result.error,
      };
    }

    this.staffUsers = this.staffUsers.filter((u) => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(this.staffUsers));
    this.notify();

    return {
      success: true,
      message: 'Staff user deleted from Google Sheets database successfully.',
    };
  }

  public async validateStaffWithAppsScript(
    identifier: string,
    passwordAttempt: string
  ): Promise<{ success: boolean; message?: string; user?: AdminUser; error?: string }> {
    const rawUrl = (this.config.webAppUrl || getEnvWebAppUrl() || '').trim();
    if (!rawUrl || !this.isValidWebAppUrl(rawUrl)) {
      return {
        success: false,
        error: 'No active Google Apps Script Web App configured.',
      };
    }

    try {
      const result = await this.executeSheetsAction('validateStaff', {
        data: { identifier, password: passwordAttempt },
      });

      if (result.success && (result.data?.user || (result as any).user)) {
        const validatedUser = result.data?.user || (result as any).user;
        return {
          success: true,
          user: validatedUser,
          message: result.message || 'Credentials validated by Google Apps Script.',
        };
      } else {
        return {
          success: false,
          error: result.error || 'Invalid credentials or staff member inactive in Google Sheets.',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to communicate with Google Apps Script.',
      };
    }
  }

  public getLogoUrl(): string {
    return this.logoUrl || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.LOGO) || '' : '');
  }

  public getLogoMeta(): { updatedAt?: string; updatedBy?: string } {
    return { ...this.logoMeta };
  }

  public async saveLogoToSheets(
    dataUrl: string,
    updatedBy?: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    const trimmed = (dataUrl || '').trim();
    if (!trimmed) {
      return { success: false, message: 'Invalid logo data provided.' };
    }

    // Immediately cache locally and notify frontend
    this.logoUrl = trimmed;
    localStorage.setItem(STORAGE_KEYS.LOGO, trimmed);
    this.logoMeta = {
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'Super Admin',
    };
    localStorage.setItem(STORAGE_KEYS.LOGO_META, JSON.stringify(this.logoMeta));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('logo-updated'));
    }
    this.notify();

    const rawUrl = (this.config.webAppUrl || getEnvWebAppUrl() || '').trim();
    if (!rawUrl || !this.isValidWebAppUrl(rawUrl)) {
      return {
        success: true,
        message: 'Logo updated in browser local storage. Connect Google Sheets Web App URL for remote sync across devices.',
      };
    }

    try {
      const res = await this.executeSheetsAction('saveLogo', {
        data: {
          logo: trimmed,
          updatedBy: updatedBy || 'Super Admin',
        },
      });

      if (res.success) {
        return {
          success: true,
          message: "Logo successfully saved and synced to Google Sheets ('Branding_Settings' tab)!",
        };
      } else {
        return {
          success: false,
          message: 'Saved locally, but Google Sheets returned an error: ' + (res.error || 'Unknown error'),
          error: res.error,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: 'Saved locally, but could not reach Google Sheets Web App.',
        error: err?.message,
      };
    }
  }

  public async resetLogoInSheets(
    updatedBy?: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    this.logoUrl = '';
    this.logoMeta = {};
    localStorage.removeItem(STORAGE_KEYS.LOGO);
    localStorage.removeItem(STORAGE_KEYS.LOGO_META);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('logo-updated'));
    }
    this.notify();

    const rawUrl = (this.config.webAppUrl || getEnvWebAppUrl() || '').trim();
    if (!rawUrl || !this.isValidWebAppUrl(rawUrl)) {
      return {
        success: true,
        message: 'Logo reset to default public/logo.svg locally.',
      };
    }

    try {
      const res = await this.executeSheetsAction('resetLogo', {
        data: { updatedBy: updatedBy || 'Super Admin' },
      });
      return {
        success: res.success,
        message: res.message || 'Logo reset to default in Google Sheets!',
        error: res.error,
      };
    } catch (err: any) {
      return {
        success: true,
        message: 'Reset locally (failed to notify Google Sheets: ' + (err?.message || '') + ')',
      };
    }
  }

  public async syncLogoFromSheets(): Promise<{ success: boolean; logoUrl?: string; message: string }> {
    const rawUrl = (this.config.webAppUrl || getEnvWebAppUrl() || '').trim();
    if (!rawUrl || !this.isValidWebAppUrl(rawUrl)) {
      return {
        success: false,
        message: 'Google Sheets Web App URL is not connected.',
      };
    }

    try {
      const res = await this.executeSheetsAction('getLogo');
      if (res.success && res.data) {
        const remoteLogo = (res.data.logo || (res as any).logo || '').trim();
        if (remoteLogo) {
          this.logoUrl = remoteLogo;
          localStorage.setItem(STORAGE_KEYS.LOGO, remoteLogo);
          if (res.data.updatedAt || res.data.updatedBy) {
            this.logoMeta = {
              updatedAt: res.data.updatedAt,
              updatedBy: res.data.updatedBy,
            };
            localStorage.setItem(STORAGE_KEYS.LOGO_META, JSON.stringify(this.logoMeta));
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('logo-updated'));
          }
          this.notify();
          return {
            success: true,
            logoUrl: remoteLogo,
            message: "Logo retrieved and synced from Google Sheets ('Branding_Settings' tab)!",
          };
        } else {
          return {
            success: true,
            logoUrl: '',
            message: 'No custom logo found in Google Sheets (using default logo.svg).',
          };
        }
      } else {
        return {
          success: false,
          message: res.error || 'Could not fetch logo from Google Sheets.',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Failed to sync logo from Google Sheets.',
      };
    }
  }

  // Reset database back to default seed template
  public resetToDefaultTemplate(): void {
    this.packages = [...DEFAULT_HOLIDAY_PACKAGES];
    this.visas = [...DEFAULT_VISA_SERVICES];
    this.bookings = [];
    this.applications = [];
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(this.packages));
    localStorage.setItem(STORAGE_KEYS.VISAS, JSON.stringify(this.visas));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
    this.notify();
  }
}

export const sheetsService = SheetsService.getInstance();
