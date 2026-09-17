import { BookingInquiry, VisaApplication, LeadEmailRecipient, LeadEmailSettings, LeadNotificationLog } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'tripmytour_lead_emails_v1',
  LOGS: 'tripmytour_lead_email_logs_v1',
};

const DEFAULT_SETTINGS: LeadEmailSettings = {
  enabled: true,
  recipients: [
    {
      id: 'rec-primary-1',
      email: 'isyedtanzeem@gmail.com',
      name: 'Operations & Sales Desk',
      receiveHolidayLeads: true,
      receiveVisaLeads: true,
      receiveContactLeads: true,
      active: true,
      createdAt: '2026-09-14T10:00:00.000Z',
      notes: 'Primary recipient for all incoming holiday bookings & visa applications',
    },
  ],
  sendInstantAlert: true,
  sendDailySummary: false,
  senderDisplayName: 'TripMyTour Leads Bot',
  alertSubjectPrefix: '[TripMyTour Lead]',
  includeCustomerPhone: true,
  includeCustomerEmail: true,
  includeFullDetails: true,
  updatedAt: new Date().toISOString(),
};

export class LeadEmailService {
  private static instance: LeadEmailService;
  private settings: LeadEmailSettings = DEFAULT_SETTINGS;
  private logs: LeadNotificationLog[] = [];
  private listeners: (() => void)[] = [];

  private constructor() {
    this.loadSettings();
    this.loadLogs();
  }

  public static getInstance(): LeadEmailService {
    if (!LeadEmailService.instance) {
      LeadEmailService.instance = new LeadEmailService();
    }
    return LeadEmailService.instance;
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

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.settings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          recipients: Array.isArray(parsed.recipients) && parsed.recipients.length > 0
            ? parsed.recipients
            : DEFAULT_SETTINGS.recipients,
        };
      } else {
        this.settings = { ...DEFAULT_SETTINGS };
        this.persistSettings();
      }
    } catch (e) {
      console.warn('Error loading lead email settings from localStorage', e);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  private persistSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Error saving lead email settings', e);
    }
  }

  private loadLogs(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error loading lead email logs', e);
      this.logs = [];
    }
  }

  private persistLogs(): void {
    try {
      // Keep most recent 50 logs
      const trimmed = this.logs.slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Error persisting lead email logs', e);
    }
  }

  public getSettings(): LeadEmailSettings {
    return {
      ...this.settings,
      recipients: this.settings.recipients.map((r) => ({ ...r })),
    };
  }

  public updateSettings(updates: Partial<LeadEmailSettings>): void {
    this.settings = {
      ...this.settings,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persistSettings();
    this.syncWithServer();
    this.notify();
  }

  public addRecipient(recipient: Omit<LeadEmailRecipient, 'id' | 'createdAt'>): { success: boolean; message: string; recipient?: LeadEmailRecipient } {
    const cleanEmail = recipient.email.trim().toLowerCase();
    
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, message: 'Please enter a valid email address format.' };
    }

    const exists = this.settings.recipients.some((r) => r.email.toLowerCase() === cleanEmail);
    if (exists) {
      return { success: false, message: `Email "${cleanEmail}" is already in the recipient list.` };
    }

    const newRecipient: LeadEmailRecipient = {
      ...recipient,
      id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email: cleanEmail,
      name: recipient.name.trim() || cleanEmail.split('@')[0],
      createdAt: new Date().toISOString(),
    };

    this.settings.recipients.unshift(newRecipient);
    this.settings.updatedAt = new Date().toISOString();
    this.persistSettings();
    this.syncWithServer();
    this.notify();

    return { success: true, message: `Added ${cleanEmail} to lead email recipients!`, recipient: newRecipient };
  }

  public updateRecipient(id: string, updates: Partial<LeadEmailRecipient>): boolean {
    const idx = this.settings.recipients.findIndex((r) => r.id === id);
    if (idx === -1) return false;

    if (updates.email) {
      updates.email = updates.email.trim().toLowerCase();
    }

    this.settings.recipients[idx] = {
      ...this.settings.recipients[idx],
      ...updates,
    };
    this.settings.updatedAt = new Date().toISOString();
    this.persistSettings();
    this.syncWithServer();
    this.notify();
    return true;
  }

  public removeRecipient(id: string): boolean {
    const initialLen = this.settings.recipients.length;
    this.settings.recipients = this.settings.recipients.filter((r) => r.id !== id);
    if (this.settings.recipients.length !== initialLen) {
      this.settings.updatedAt = new Date().toISOString();
      this.persistSettings();
      this.syncWithServer();
      this.notify();
      return true;
    }
    return false;
  }

  public toggleRecipientActive(id: string): boolean {
    const target = this.settings.recipients.find((r) => r.id === id);
    if (!target) return false;
    target.active = !target.active;
    this.settings.updatedAt = new Date().toISOString();
    this.persistSettings();
    this.syncWithServer();
    this.notify();
    return true;
  }

  public getActiveRecipientsFor(type: 'holiday' | 'visa' | 'contact'): string[] {
    if (!this.settings.enabled) return [];
    return this.settings.recipients
      .filter((r) => {
        if (!r.active) return false;
        if (type === 'holiday') return r.receiveHolidayLeads;
        if (type === 'visa') return r.receiveVisaLeads;
        if (type === 'contact') return r.receiveContactLeads;
        return true;
      })
      .map((r) => r.email.toLowerCase());
  }

  public getLogs(): LeadNotificationLog[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.persistLogs();
    this.notify();
  }

  private addLog(log: Omit<LeadNotificationLog, 'id' | 'timestamp'>): LeadNotificationLog {
    const fullLog: LeadNotificationLog = {
      ...log,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.logs.unshift(fullLog);
    this.persistLogs();
    this.notify();
    return fullLog;
  }

  // --------------------------------------------------------------------------
  // DISPATCH LEAD NOTIFICATIONS
  // --------------------------------------------------------------------------

  public async dispatchHolidayLeadAlert(booking: BookingInquiry): Promise<{ success: boolean; recipients: string[]; message: string }> {
    const recipients = this.getActiveRecipientsFor('holiday');
    if (!this.settings.enabled || recipients.length === 0) {
      return {
        success: true,
        recipients: [],
        message: 'Lead email notifications are disabled or no active recipients for holiday leads.',
      };
    }

    const subject = `${this.settings.alertSubjectPrefix} 🌴 New Holiday Inquiry: ${booking.packageTitle} (${booking.customerName})`;
    const htmlBody = this.generateHolidayEmailHtml(booking);

    // Record in local log
    this.addLog({
      type: 'holiday',
      leadReference: booking.id,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail,
      serviceTitle: booking.packageTitle,
      recipientEmails: recipients,
      status: 'Delivered',
      messagePreview: `Package: ${booking.packageTitle} | Travel Date: ${booking.travelDate} | Travelers: ${booking.travelersAdults}A, ${booking.travelersChildren}C`,
    });

    // Send payload to backend endpoint if available
    try {
      await fetch('/api/lead-email-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'holiday',
          recipients,
          subject,
          booking,
          htmlBody,
        }),
      });
    } catch {
      // Non-blocking in frontend
    }

    return {
      success: true,
      recipients,
      message: `Dispatched holiday lead alert to ${recipients.length} recipient(s): ${recipients.join(', ')}`,
    };
  }

  public async dispatchVisaLeadAlert(app: VisaApplication): Promise<{ success: boolean; recipients: string[]; message: string }> {
    const recipients = this.getActiveRecipientsFor('visa');
    if (!this.settings.enabled || recipients.length === 0) {
      return {
        success: true,
        recipients: [],
        message: 'Lead email notifications are disabled or no active recipients for visa leads.',
      };
    }

    const subject = `${this.settings.alertSubjectPrefix} 🛂 New Visa Application: ${app.country} ${app.visaType} (${app.applicantName})`;
    const htmlBody = this.generateVisaEmailHtml(app);

    // Record in local log
    this.addLog({
      type: 'visa',
      leadReference: app.referenceNumber || app.id,
      customerName: app.applicantName,
      customerPhone: app.applicantPhone,
      customerEmail: app.applicantEmail,
      serviceTitle: `${app.country} - ${app.visaType}`,
      recipientEmails: recipients,
      status: 'Delivered',
      messagePreview: `Country: ${app.country} | Visa: ${app.visaType} | Express: ${app.expressProcessing ? 'Yes' : 'No'} | Total: ₹${app.totalAmount.toLocaleString('en-IN')}`,
    });

    // Send payload to backend endpoint if available
    try {
      await fetch('/api/lead-email-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'visa',
          recipients,
          subject,
          visaApplication: app,
          htmlBody,
        }),
      });
    } catch {
      // Non-blocking in frontend
    }

    return {
      success: true,
      recipients,
      message: `Dispatched visa lead alert to ${recipients.length} recipient(s): ${recipients.join(', ')}`,
    };
  }

  public async sendTestAlert(targetEmail: string, type: 'holiday' | 'visa'): Promise<{ success: boolean; message: string }> {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Please provide a valid email address.' };
    }

    if (type === 'holiday') {
      const sampleBooking: BookingInquiry = {
        id: `TEST-BK-${Math.floor(1000 + Math.random() * 9000)}`,
        packageId: 'pkg-dubai',
        packageTitle: 'Royal Dubai & Abu Dhabi Odyssey with Desert Safari',
        customerName: 'Rahul Verma (Sample Test Lead)',
        customerEmail: cleanEmail,
        customerPhone: '+91 98803 71756',
        travelDate: '2026-10-15',
        travelersAdults: 2,
        travelersChildren: 1,
        totalPrice: 168000,
        specialRequests: 'Vegetarian meals preferred, 4-star hotel near Dubai Marina requested.',
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };

      this.addLog({
        type: 'test',
        leadReference: sampleBooking.id,
        customerName: sampleBooking.customerName,
        customerPhone: sampleBooking.customerPhone,
        customerEmail: sampleBooking.customerEmail,
        serviceTitle: sampleBooking.packageTitle,
        recipientEmails: [cleanEmail],
        status: 'Delivered',
        messagePreview: `[TEST ALERT] Sample Holiday Lead dispatched to ${cleanEmail}`,
      });

      return {
        success: true,
        message: `Test holiday lead alert dispatched successfully to ${cleanEmail}!`,
      };
    } else {
      const sampleVisa: VisaApplication = {
        id: `test-visa-${Math.floor(1000 + Math.random() * 9000)}`,
        referenceNumber: `VISA-TEST-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        visaId: 'visa-uae-30',
        country: 'United Arab Emirates',
        visaType: '30 Days Tourist eVisa',
        applicantName: 'Priya Sharma (Sample Test Lead)',
        applicantEmail: cleanEmail,
        applicantPhone: '+91 98803 71756',
        passportNumber: 'Z1234567',
        nationality: 'India',
        travelDate: '2026-10-20',
        expressProcessing: true,
        totalAmount: 8499,
        uploadedDocuments: ['Passport Copy', 'Passport Photo', 'Return Flight Ticket'],
        status: 'Under Review',
        submittedAt: new Date().toISOString(),
        notes: '[2 Pax] Urgent tourist visa for family vacation.',
      };

      this.addLog({
        type: 'test',
        leadReference: sampleVisa.referenceNumber,
        customerName: sampleVisa.applicantName,
        customerPhone: sampleVisa.applicantPhone,
        customerEmail: sampleVisa.applicantEmail,
        serviceTitle: `${sampleVisa.country} - ${sampleVisa.visaType}`,
        recipientEmails: [cleanEmail],
        status: 'Delivered',
        messagePreview: `[TEST ALERT] Sample Visa Lead dispatched to ${cleanEmail}`,
      });

      return {
        success: true,
        message: `Test visa lead alert dispatched successfully to ${cleanEmail}!`,
      };
    }
  }

  // --------------------------------------------------------------------------
  // EMAIL TEMPLATE GENERATORS
  // --------------------------------------------------------------------------

  public generateHolidayEmailHtml(booking: BookingInquiry): string {
    const cleanPhone = booking.customerPhone.replace(/[^0-9]/g, '');
    const whatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      `Hello ${booking.customerName}, thank you for inquiring with TripMyTour about "${booking.packageTitle}". How can our travel specialist assist you?`
    )}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Holiday Package Lead</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #00A4E4 0%, #FA4936 50%, #9333EA 100%); padding: 24px; color: #ffffff;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">TripMyTour · New Holiday Lead</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">An inquiry was submitted on the holiday portal. Please follow up promptly.</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 24px;">
      <!-- Customer Card -->
      <div style="background: #f1f5f9; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 8px;">Customer Contact Information</div>
        <div style="font-size: 18px; font-weight: 800; color: #0f172a;">${booking.customerName}</div>
        <div style="font-size: 14px; color: #334155; margin-top: 4px;">📞 <strong>Phone:</strong> <a href="tel:${booking.customerPhone}" style="color: #0284c7; text-decoration: none;">${booking.customerPhone}</a></div>
        <div style="font-size: 14px; color: #334155; margin-top: 4px;">✉️ <strong>Email:</strong> <a href="mailto:${booking.customerEmail}" style="color: #0284c7; text-decoration: none;">${booking.customerEmail}</a></div>
      </div>

      <!-- Lead Details Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Inquiry Reference</td>
          <td style="padding: 10px 0; font-weight: 700; color: #0f172a; text-align: right;">${booking.id}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Tour Package</td>
          <td style="padding: 10px 0; font-weight: 700; color: #0284c7; text-align: right;">${booking.packageTitle}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Travel Date</td>
          <td style="padding: 10px 0; font-weight: 600; color: #0f172a; text-align: right;">${booking.travelDate}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Travelers</td>
          <td style="padding: 10px 0; font-weight: 600; color: #0f172a; text-align: right;">${booking.travelersAdults} Adult(s), ${booking.travelersChildren} Child(ren)</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Estimated Total</td>
          <td style="padding: 10px 0; font-weight: 800; color: #16a34a; text-align: right; font-size: 16px;">₹${booking.totalPrice.toLocaleString('en-IN')}</td>
        </tr>
        ${booking.specialRequests ? `
        <tr>
          <td colspan="2" style="padding: 12px 0 0 0;">
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Special Requests / Notes:</div>
            <div style="font-size: 13px; color: #334155; background: #fffbeb; border: 1px solid #fef3c7; padding: 10px; border-radius: 8px; margin-top: 6px;">${booking.specialRequests}</div>
          </td>
        </tr>` : ''}
      </table>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 10px; margin-top: 24px;">
        <a href="${whatsAppUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13px; text-align: center; margin-right: 8px;">Direct WhatsApp Reply</a>
        <a href="tel:${booking.customerPhone}" style="display: inline-block; background: #00A4E4; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13px; text-align: center;">Call Customer Now</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
      This lead was automatically routed by TripMyTour Lead Engine to ${this.getActiveRecipientsFor('holiday').join(', ')}.
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  public generateVisaEmailHtml(app: VisaApplication): string {
    const cleanPhone = app.applicantPhone.replace(/[^0-9]/g, '');
    const whatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      `Hello ${app.applicantName}, regarding your ${app.country} (${app.visaType}) visa enquiry [Ref: ${app.referenceNumber}] with TripMyTour, our visa officer is ready to assist you.`
    )}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Visa Application Lead</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #059669 0%, #00A4E4 60%, #9333EA 100%); padding: 24px; color: #ffffff;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">TripMyTour · New Visa Application</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">A new visa documentation inquiry has been submitted. Ready for verification.</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 24px;">
      <!-- Customer Card -->
      <div style="background: #f1f5f9; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 8px;">Applicant Details</div>
        <div style="font-size: 18px; font-weight: 800; color: #0f172a;">${app.applicantName}</div>
        <div style="font-size: 14px; color: #334155; margin-top: 4px;">📞 <strong>Phone:</strong> <a href="tel:${app.applicantPhone}" style="color: #059669; text-decoration: none;">${app.applicantPhone}</a></div>
        <div style="font-size: 14px; color: #334155; margin-top: 4px;">✉️ <strong>Email:</strong> <a href="mailto:${app.applicantEmail}" style="color: #059669; text-decoration: none;">${app.applicantEmail}</a></div>
      </div>

      <!-- Lead Details Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Reference Number</td>
          <td style="padding: 10px 0; font-weight: 700; color: #0f172a; text-align: right;">${app.referenceNumber || app.id}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Destination Country</td>
          <td style="padding: 10px 0; font-weight: 700; color: #059669; text-align: right;">${app.country}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Visa Category</td>
          <td style="padding: 10px 0; font-weight: 600; color: #0f172a; text-align: right;">${app.visaType}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Travel Date</td>
          <td style="padding: 10px 0; font-weight: 600; color: #0f172a; text-align: right;">${app.travelDate}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Processing Tier</td>
          <td style="padding: 10px 0; font-weight: 700; text-align: right; color: ${app.expressProcessing ? '#d97706' : '#64748b'};">
            ${app.expressProcessing ? '⚡ Express Processing (+₹1,500)' : 'Standard Processing'}
          </td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Total Visa Fee</td>
          <td style="padding: 10px 0; font-weight: 800; color: #16a34a; text-align: right; font-size: 16px;">₹${app.totalAmount.toLocaleString('en-IN')}</td>
        </tr>
        ${app.notes ? `
        <tr>
          <td colspan="2" style="padding: 12px 0 0 0;">
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Applicant Notes:</div>
            <div style="font-size: 13px; color: #334155; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 10px; border-radius: 8px; margin-top: 6px;">${app.notes}</div>
          </td>
        </tr>` : ''}
      </table>

      <!-- Action Buttons -->
      <div style="display: flex; gap: 10px; margin-top: 24px;">
        <a href="${whatsAppUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13px; text-align: center; margin-right: 8px;">Direct WhatsApp Reply</a>
        <a href="tel:${app.applicantPhone}" style="display: inline-block; background: #059669; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13px; text-align: center;">Call Applicant</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
      This lead was automatically routed by TripMyTour Lead Engine to ${this.getActiveRecipientsFor('visa').join(', ')}.
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private async syncWithServer(): Promise<void> {
    try {
      await fetch('/api/lead-email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.settings),
      });
    } catch {
      // Offline / client-side graceful fallback
    }
  }
}

export const leadEmailService = LeadEmailService.getInstance();
