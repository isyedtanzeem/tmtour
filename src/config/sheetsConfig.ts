/**
 * ============================================================================
 * FILE-SYSTEM AUTHORITATIVE GOOGLE SHEETS & APPS SCRIPT CONFIGURATION
 * ============================================================================
 * 
 * This file is stored directly in the repository/file system.
 * By defining your Google Apps Script Web App URL here, all users, devices,
 * incognito sessions, and custom domain visitors on Vercel will automatically
 * communicate directly with your Google Sheets database without relying on
 * browser localStorage.
 */

export interface FileSystemSheetsConfig {
  /**
   * Your deployed Google Apps Script Web App URL (must end in /exec)
   * e.g. "https://script.google.com/macros/s/AKfycbx.../exec"
   */
  webAppUrl: string;

  /**
   * Optional Google Spreadsheet Document ID
   * Found in sheet URL: https://docs.google.com/spreadsheets/d/<ID>/edit
   */
  sheetId: string;

  /**
   * Sheet tab names matching the Google Apps Script template
   */
  tabNames: {
    holidayPackages: string;
    visaServices: string;
    bookings: string;
    applications: string;
    logs: string;
  };
}

export const FILE_SYSTEM_SHEETS_CONFIG: FileSystemSheetsConfig = {
  // Paste your live Google Apps Script Web App URL below:
  webAppUrl: '',

  // Optional: Google Spreadsheet Document ID
  sheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',

  tabNames: {
    holidayPackages: 'Holiday_Packages',
    visaServices: 'Visa_Services',
    bookings: 'Bookings_Leads',
    applications: 'Visa_Applications',
    logs: 'Activity_Logs',
  },
};
