export const BUSINESS_INFO = {
  name: 'TripMyTour',
  shortName: 'TripMyTour',
  portalName: 'TripMyTour',
  tagline: 'Holiday Packages & Visa Services',
  logoPath: '/logo.svg',
  phone: '098803 71756',
  phoneInternational: '+91 98803 71756',
  phoneRaw: '919880371756',
  email: 'lead.tripmytour2026@gmail.com',
  address: 'Nextcoworks, Ranka Colony Rd, Munivenkatppa Layout, BTM Layout 2nd Stage, Bilekahalli, Bengaluru, Karnataka 560076',
  shortAddress: 'BTM Layout 2nd Stage, Bengaluru, Karnataka 560076',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560076',
  country: 'India',
  operatingHours: 'Monday – Saturday: 9:30 AM – 8:00 PM IST',
  defaultCurrency: 'INR',
  currencySymbol: '₹',
};

/**
 * Formats monetary amounts in Indian Rupee (INR) by default,
 * following the Indian numbering system (e.g. ₹48,999 or ₹1,25,000).
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  if (currency.toUpperCase().includes('USD')) {
    return `$${Math.round(amount).toLocaleString('en-US')}`;
  }
  if (currency.toUpperCase().includes('EUR')) {
    return `€${Math.round(amount).toLocaleString('de-DE')}`;
  }
  if (currency.toUpperCase().includes('GBP')) {
    return `£${Math.round(amount).toLocaleString('en-GB')}`;
  }
  if (currency.toUpperCase().includes('AED')) {
    return `AED ${Math.round(amount).toLocaleString('en-US')}`;
  }

  // Default to Indian Rupee (INR)
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/**
 * Formats a phone string into Indian mobile format:
 * Handles 10-digit numbers, numbers starting with 0, or with +91.
 * Example outputs: "+91 98803 71756" or "098803 71756"
 */
export function formatIndianMobileInput(value: string): string {
  // Strip all non-digit and non-plus characters
  let cleaned = value.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+91')) {
    const digits = cleaned.slice(3).replace(/\D/g, '').slice(0, 10);
    if (digits.length > 5) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return `+91 ${digits}`;
  }

  if (cleaned.startsWith('0')) {
    const digits = cleaned.slice(1).replace(/\D/g, '').slice(0, 10);
    if (digits.length > 5) {
      return `0${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return `0${digits}`;
  }

  const digits = cleaned.replace(/\D/g, '').slice(0, 10);
  if (digits.length > 5) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length > 0) {
    return `+91 ${digits}`;
  }

  return value;
}

/**
 * Validates if the phone number is a valid 10-digit Indian phone number
 */
export function isValidIndianPhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, '');
  // Matches 10 digits (e.g. 9880371756), 11 digits starting with 0 (e.g. 09880371756),
  // or 12 digits starting with 91 (e.g. 919880371756)
  if (digitsOnly.length === 10) return /^[6-9]\d{9}$/.test(digitsOnly);
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) return /^[6-9]\d{9}$/.test(digitsOnly.slice(1));
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) return /^[6-9]\d{9}$/.test(digitsOnly.slice(2));
  return digitsOnly.length >= 10;
}

/**
 * Generates direct WhatsApp click-to-chat URL with pre-filled package inquiry message
 */
export function getPackageWhatsAppUrl(pkg: {
  id?: string;
  title: string;
  destination: string;
  duration?: string;
  price: number;
}): string {
  const lines = [
    `Hello ${BUSINESS_INFO.name}, I am interested in booking / inquiring about this holiday package:`,
    ``,
    `🏝️ *${pkg.title}*`,
    `📍 Destination: ${pkg.destination}`,
    pkg.duration ? `⏱️ Duration: ${pkg.duration}` : '',
    `💰 Price: ${formatCurrency(pkg.price)} per person`,
    ``,
    `Please share the detailed day-by-day itinerary, inclusions, flight options from my city, and best deal for travel dates.`,
  ].filter(Boolean);

  const text = lines.join('\n');
  return `https://wa.me/${BUSINESS_INFO.phoneRaw}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates direct WhatsApp click-to-chat URL for general inquiries
 */
export function getGeneralWhatsAppUrl(customSubject?: string): string {
  const text = customSubject
    ? `Hello ${BUSINESS_INFO.name}, I would like to inquire about: ${customSubject}. Please share more details.`
    : `Hello ${BUSINESS_INFO.name}, I would like to inquire about tour packages and travel visa services. Please share options and current offers.`;
  return `https://wa.me/${BUSINESS_INFO.phoneRaw}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates direct WhatsApp click-to-chat URL for visa inquiries
 */
export function getVisaWhatsAppUrl(visa: {
  country: string;
  visaType: string;
  totalFee: number;
  processingTime?: string;
}): string {
  const lines = [
    `Hello ${BUSINESS_INFO.name}, I need assistance with tourist/travel visa:`,
    ``,
    `🛂 Country: *${visa.country}*`,
    `📋 Visa Category: ${visa.visaType}`,
    visa.processingTime ? `⏱️ Processing Time: ${visa.processingTime}` : '',
    `💰 Total Fee: ${formatCurrency(visa.totalFee)}`,
    ``,
    `Please share the checklist of required documents and appointment process for Indian passport holders.`,
  ].filter(Boolean);

  const text = lines.join('\n');
  return `https://wa.me/${BUSINESS_INFO.phoneRaw}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates direct WhatsApp inquiry with user-entered details from the modal
 */
export function getCustomVisaWhatsAppUrl(details: {
  country: string;
  visaType: string;
  totalFee: number;
  customerName?: string;
  phone?: string;
  travelDate?: string;
  applicants?: number;
  express?: boolean;
  notes?: string;
}): string {
  const lines = [
    `Hello ${BUSINESS_INFO.name}, I would like to enquire about this visa:`,
    ``,
    `🛂 *${details.country} - ${details.visaType}*`,
    `💰 All-Inclusive Fee: ${formatCurrency(details.totalFee)}`,
    details.customerName ? `👤 Applicant Name: ${details.customerName}` : '',
    details.phone ? `📞 Contact: ${details.phone}` : '',
    details.travelDate ? `📅 Travel Date / Month: ${details.travelDate}` : '',
    details.applicants ? `👥 Travellers: ${details.applicants}` : '',
    details.express ? `⚡ Express 24-48h Processing Requested` : '',
    details.notes ? `💬 Query/Notes: ${details.notes}` : '',
    ``,
    `Please assist me with document verification and embassy procedure.`,
  ].filter(Boolean);

  const text = lines.join('\n');
  return `https://wa.me/${BUSINESS_INFO.phoneRaw}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates direct WhatsApp follow-up link for an existing visa enquiry reference
 */
export function getVisaFollowUpWhatsAppUrl(referenceNumber: string, country: string, visaType: string): string {
  const lines = [
    `Hello ${BUSINESS_INFO.name}, following up on my Visa Enquiry:`,
    ``,
    `📋 Reference ID: *${referenceNumber}*`,
    `🛂 Visa: *${country} - ${visaType}*`,
    ``,
    `Please share the status and next steps for document submission. Thank you!`,
  ];
  return `https://wa.me/${BUSINESS_INFO.phoneRaw}?text=${encodeURIComponent(lines.join('\n'))}`;
}

/**
 * Generates direct telephone link for dialing
 */
export function getDirectCallUrl(): string {
  return `tel:${BUSINESS_INFO.phoneRaw}`;
}

