import { HolidayPackage, VisaService, BookingInquiry, VisaApplication, GoogleSheetsConfig } from '../types';
import { DEFAULT_HOLIDAY_PACKAGES, DEFAULT_VISA_SERVICES } from '../data/initialData';
import { leadEmailService } from './leadEmailService';

const STORAGE_KEYS = {
  CONFIG: 'tripmytour_sheets_config_v2',
  PACKAGES: 'tripmytour_sheets_packages_v2',
  VISAS: 'tripmytour_sheets_visas_v2',
  BOOKINGS: 'tripmytour_sheets_bookings_v2',
  APPLICATIONS: 'tripmytour_sheets_applications_v2',
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

  private listeners: (() => void)[] = [];

  private constructor() {
    this.loadInitialConfig();
    this.ensureInitialData();
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

  private notify(): void {
    this.listeners.forEach((l) => l());
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

  private loadInitialConfig(): void {
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

        const hasValidUrl = this.isValidWebAppUrl(parsed.webAppUrl);
        this.config = {
          ...this.config,
          ...parsed,
          isCustomUrlActive: hasValidUrl && !!parsed.isCustomUrlActive,
          syncStatus: 'local_fallback',
          errorMessage: null,
        };
        this.saveConfig();
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

  private ensureInitialData(): void {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.PACKAGES)) {
        localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(DEFAULT_HOLIDAY_PACKAGES));
      }
      if (!localStorage.getItem(STORAGE_KEYS.VISAS)) {
        localStorage.setItem(STORAGE_KEYS.VISAS, JSON.stringify(DEFAULT_VISA_SERVICES));
      }
      if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.APPLICATIONS)) {
        localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
      }
    } catch (e) {
      console.warn('Could not initialize local sheet mirror', e);
    }
  }

  public getConfig(): GoogleSheetsConfig {
    return { ...this.config };
  }

  public clearCustomUrl(): void {
    this.config.webAppUrl = '';
    this.config.isCustomUrlActive = false;
    this.config.syncStatus = 'local_fallback';
    this.config.errorMessage = null;
    this.saveConfig();
    this.notify();
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

    this.config = {
      ...this.config,
      ...newConfig,
      webAppUrl: targetUrl,
      sheetId: targetSheetId,
      isCustomUrlActive: hasValidUrl,
      syncStatus: hasValidUrl ? 'syncing' : 'local_fallback',
      errorMessage: null,
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
      const pingUrl = `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}action=ping`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Clean GET without custom headers to avoid CORS preflight rejection from Google Apps Script
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
          ? 'Connection timed out (8s). Check your Apps Script deployment.'
          : `Connection notice: ${err?.message || 'Network issue'}. Ensure deployment has "Execute as: Me" and "Who has access: Anyone".`,
      };
    }
  }

  public async syncWithGoogleSheets(): Promise<{ success: boolean; message?: string }> {
    if (!this.config.webAppUrl || !this.config.isCustomUrlActive || !this.isValidWebAppUrl(this.config.webAppUrl)) {
      this.config.syncStatus = 'local_fallback';
      this.notify();
      return { success: true, message: 'Running in Local Sheets Database Mode' };
    }

    this.config.syncStatus = 'syncing';
    this.config.errorMessage = null;
    this.notify();

    try {
      const cleanUrl = this.config.webAppUrl.trim();
      const fetchUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}action=getAllData`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      // Simple GET request with follow redirect and NO custom headers
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

      if (Array.isArray(data.packages) && data.packages.length > 0) {
        localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(data.packages));
      }
      if (Array.isArray(data.visas) && data.visas.length > 0) {
        localStorage.setItem(STORAGE_KEYS.VISAS, JSON.stringify(data.visas));
      }
      if (Array.isArray(data.bookings)) {
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(data.bookings));
      }
      if (Array.isArray(data.applications)) {
        localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(data.applications));
      }

      this.config.syncStatus = 'connected';
      this.config.lastSyncedAt = new Date().toLocaleTimeString();
      this.config.errorMessage = null;
      this.saveConfig();
      this.notify();
      return { success: true, message: 'Google Sheets synchronized successfully!' };
    } catch (err: any) {
      // Graceful fallback to local mirror without throwing console.error
      console.warn('Google Sheets sync notice (using local mirror):', err?.message || err);
      this.config.syncStatus = 'local_fallback';
      this.config.errorMessage = err?.name === 'AbortError'
        ? 'Connection timed out. Running on local data mirror.'
        : 'External Apps Script unreachable. Running on local data mirror.';
      this.notify();
      return { success: false, message: this.config.errorMessage };
    }
  }

  private async postToGoogleSheet(payload: any): Promise<void> {
    if (!this.config.webAppUrl || !this.config.isCustomUrlActive || !this.isValidWebAppUrl(this.config.webAppUrl)) {
      return;
    }

    try {
      await fetch(this.config.webAppUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors',
        redirect: 'follow',
      });
    } catch (err) {
      console.warn('Google Sheet background update notice:', err);
    }
  }

  // --------------------------------------------------------------------------
  // HOLIDAY PACKAGES
  // --------------------------------------------------------------------------

  public getPackages(): HolidayPackage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PACKAGES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading packages', e);
    }
    return DEFAULT_HOLIDAY_PACKAGES;
  }

  public async savePackage(pkg: HolidayPackage): Promise<boolean> {
    const list = this.getPackages();
    const existingIndex = list.findIndex((p) => p.id === pkg.id);
    if (existingIndex >= 0) {
      list[existingIndex] = pkg;
    } else {
      list.unshift(pkg);
    }
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(list));
    this.notify();

    // Background sync to remote Google Sheet if connected
    this.postToGoogleSheet({ action: 'savePackage', data: pkg });
    return true;
  }

  public async deletePackage(id: string): Promise<boolean> {
    const list = this.getPackages().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(list));
    this.notify();

    // Background sync to remote Google Sheet if connected
    this.postToGoogleSheet({ action: 'deletePackage', id });
    return true;
  }

  // --------------------------------------------------------------------------
  // VISA SERVICES
  // --------------------------------------------------------------------------

  public getVisas(): VisaService[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VISAS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading visas', e);
    }
    return DEFAULT_VISA_SERVICES;
  }

  public async saveVisa(visa: VisaService): Promise<boolean> {
    const list = this.getVisas();
    const existingIndex = list.findIndex((v) => v.id === visa.id);
    if (existingIndex >= 0) {
      list[existingIndex] = visa;
    } else {
      list.unshift(visa);
    }
    localStorage.setItem(STORAGE_KEYS.VISAS, JSON.stringify(list));
    this.notify();

    // Background sync to remote Google Sheet if connected
    this.postToGoogleSheet({ action: 'saveVisa', data: visa });
    return true;
  }

  public async deleteVisa(id: string): Promise<boolean> {
    const list = this.getVisas().filter((v) => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VISAS, JSON.stringify(list));
    this.notify();

    // Background sync to remote Google Sheet if connected
    this.postToGoogleSheet({ action: 'deleteVisa', id });
    return true;
  }

  // --------------------------------------------------------------------------
  // BOOKING INQUIRIES
  // --------------------------------------------------------------------------

  public getBookings(): BookingInquiry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading bookings', e);
    }
    return [];
  }

  public async createBooking(booking: BookingInquiry): Promise<boolean> {
    const list = this.getBookings();
    list.unshift(booking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(list));
    this.notify();

    // Trigger instant email notification to configured recipients
    leadEmailService.dispatchHolidayLeadAlert(booking);

    // Background sync to remote Google Sheet if connected (passes recipient emails for Apps Script email automation)
    const notificationEmails = leadEmailService.getActiveRecipientsFor('holiday');
    this.postToGoogleSheet({ 
      action: 'createBooking', 
      data: booking,
      notificationEmails,
    });
    return true;
  }

  public async updateBookingStatus(id: string, status: BookingInquiry['status']): Promise<boolean> {
    const list = this.getBookings();
    const target = list.find((b) => b.id === id);
    if (target) {
      target.status = status;
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(list));
      this.notify();

      // Background sync to remote Google Sheet if connected
      this.postToGoogleSheet({ action: 'updateBookingStatus', id, status });
      return true;
    }
    return false;
  }

  // --------------------------------------------------------------------------
  // VISA APPLICATIONS
  // --------------------------------------------------------------------------

  public getApplications(): VisaApplication[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading visa applications', e);
    }
    return [];
  }

  public async createVisaApplication(app: VisaApplication): Promise<boolean> {
    const list = this.getApplications();
    list.unshift(app);
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(list));
    this.notify();

    // Trigger instant email notification to configured recipients
    leadEmailService.dispatchVisaLeadAlert(app);

    // Background sync to remote Google Sheet if connected (passes recipient emails for Apps Script email automation)
    const notificationEmails = leadEmailService.getActiveRecipientsFor('visa');
    this.postToGoogleSheet({ 
      action: 'createVisaApplication', 
      data: app,
      notificationEmails,
    });
    return true;
  }

  public async updateApplicationStatus(id: string, status: VisaApplication['status']): Promise<boolean> {
    const list = this.getApplications();
    const target = list.find((a) => a.id === id);
    if (target) {
      target.status = status;
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(list));
      this.notify();

      // Background sync to remote Google Sheet if connected
      this.postToGoogleSheet({ action: 'updateApplicationStatus', id, status });
      return true;
    }
    return false;
  }

  // Reset database back to default seed template
  public resetToDefaultTemplate(): void {
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(DEFAULT_HOLIDAY_PACKAGES));
    localStorage.setItem(STORAGE_KEYS.VISAS, JSON.stringify(DEFAULT_VISA_SERVICES));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
    this.notify();
  }
}

export const sheetsService = SheetsService.getInstance();
