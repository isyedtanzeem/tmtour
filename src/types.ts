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
}

export type ActiveTabType = 'home' | 'packages' | 'visas' | 'admin' | 'contact';
