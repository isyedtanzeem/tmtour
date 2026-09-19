export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  meals: string;
  activities?: string[];
}

export interface HolidayPackage {
  id: string;
  title: string;
  destination: string;
  country: string;
  duration: string;
  days: number;
  nights: number;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  category: 'International' | 'Domestic' | 'Honeymoon' | 'Adventure' | 'Luxury' | 'Budget';
  imageUrl: string;
  galleryImages: string[];
  overview: string;
  inclusions: string[];
  exclusions: string[];
  itinerary: ItineraryDay[];
  hotelName: string;
  hotelRating: number;
  nextDepartureDate: string;
}

export interface VisaService {
  id: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  flagUrl?: string;
  visaType: string;
  category: 'Tourist' | 'Business' | 'Transit' | 'Work';
  processingTime: string;
  validity: string;
  stayDuration: string;
  entryType: 'Single Entry' | 'Multiple Entry' | 'Transit';
  embassyFee: number;
  serviceFee: number;
  totalFee: number;
  expressAvailable: boolean;
  expressFee: number;
  expressProcessingTime: string;
  documentsRequired: string[];
  popular: boolean;
  description: string;
}

export interface BookingInquiry {
  id: string;
  packageId: string;
  packageTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  travelDate: string;
  travelersAdults: number;
  travelersChildren: number;
  totalPrice: number;
  specialRequests?: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface VisaApplication {
  id: string;
  referenceNumber: string;
  visaId: string;
  country: string;
  visaType: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  passportNumber: string;
  nationality: string;
  travelDate: string;
  expressProcessing: boolean;
  totalAmount: number;
  uploadedDocuments: string[];
  status: 'Under Review' | 'Documents Verified' | 'Submitted to Embassy' | 'Approved' | 'Rejected';
  submittedAt: string;
  notes?: string;
}

export interface GoogleSheetsConfig {
  webAppUrl: string;
  sheetId: string;
  isCustomUrlActive: boolean;
  lastSyncedAt: string | null;
  syncStatus: 'connected' | 'syncing' | 'error' | 'local_fallback';
  errorMessage: string | null;
  source?: 'file_system' | 'env_var' | 'custom';
  isFileSystemFixed?: boolean;
}

export interface LeadEmailRecipient {
  id: string;
  email: string;
  name: string;
  receiveHolidayLeads: boolean;
  receiveVisaLeads: boolean;
  receiveContactLeads: boolean;
  active: boolean;
  createdAt: string;
  notes?: string;
}

export interface LeadEmailSettings {
  enabled: boolean;
  recipients: LeadEmailRecipient[];
  sendInstantAlert: boolean;
  sendDailySummary: boolean;
  senderDisplayName: string;
  senderEmail?: string;
  alertSubjectPrefix: string;
  includeCustomerPhone: boolean;
  includeCustomerEmail: boolean;
  includeFullDetails: boolean;
  updatedAt: string;
}

export interface LeadNotificationLog {
  id: string;
  timestamp: string;
  type: 'holiday' | 'visa' | 'contact' | 'test';
  leadReference: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceTitle: string;
  recipientEmails: string[];
  status: 'Sent' | 'Delivered' | 'Failed';
  messagePreview?: string;
  error?: string;
}

export interface ModulePermissions {
  packages: {
    view: boolean;
    manage: boolean; // create, edit, delete
  };
  visas: {
    view: boolean;
    manage: boolean; // create, edit, delete
  };
  leads: {
    view: boolean; // view holiday inquiries & visa applications
    manageStatus: boolean; // change status: Pending -> In Review -> Contacted -> Completed
    delete: boolean; // delete inquiry records
  };
  databaseSync: {
    view: boolean;
    manage: boolean;
  };
  emailAlerts: {
    view: boolean;
    manage: boolean;
  };
  branding: {
    manage: boolean;
  };
  userManagement: {
    manage: boolean; // create & configure staff permissions (Super Admin only)
  };
}

export type AdminRole = 
  | 'Super Admin' 
  | 'Operations Manager' 
  | 'Lead Specialist' 
  | 'Custom Staff';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  name: string;
  role: AdminRole;
  active: boolean;
  permissions: ModulePermissions;
  password?: string;
  createdAt?: string;
  lastLoginAt?: string;
  sessionExpiresAt?: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'PASSWORD_CHANGED' | 'PROFILE_UPDATED' | 'CREDENTIALS_RESET' | 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED';
  details: string;
  ip?: string;
  userAgent?: string;
}

export type ActiveTabType = 'home' | 'packages' | 'visas' | 'admin' | 'contact';
