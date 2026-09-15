import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2, 
  MessageSquare, 
  Sparkles, 
  Calendar, 
  Users, 
  Compass, 
  FileCheck, 
  ArrowLeft,
  ShieldCheck,
  Headphones,
  MessageCircle
} from 'lucide-react';
import { HolidayPackage, BookingInquiry } from '../types';
import { sheetsService } from '../services/sheetsService';
import { BUSINESS_INFO, formatCurrency, formatIndianMobileInput, isValidIndianPhone, getPackageWhatsAppUrl, getGeneralWhatsAppUrl } from '../utils/formatters';

interface ContactFormPageProps {
  preselectedPackage?: HolidayPackage | null;
  onClearPreselectedPackage?: () => void;
  onBackToPackages?: () => void;
  packages: HolidayPackage[];
  onInquirySubmitted?: (inquiry: BookingInquiry) => void;
}

export const ContactFormPage: React.FC<ContactFormPageProps> = ({
  preselectedPackage,
  onClearPreselectedPackage,
  onBackToPackages,
  packages,
  onInquirySubmitted,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [selectedPackageId, setSelectedPackageId] = useState(preselectedPackage?.id || '');
  const [customDestination, setCustomDestination] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [travelersAdults, setTravelersAdults] = useState(2);
  const [travelersChildren, setTravelersChildren] = useState(0);
  const [inquiryType, setInquiryType] = useState<'Holiday Tour Package' | 'Visa Assistance' | 'Custom Itinerary' | 'Corporate / Group' | 'General Question'>('Holiday Tour Package');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<BookingInquiry | null>(null);

  useEffect(() => {
    if (preselectedPackage) {
      setSelectedPackageId(preselectedPackage.id);
      setInquiryType('Holiday Tour Package');
    }
  }, [preselectedPackage]);

  const activePackage = packages.find((p) => p.id === selectedPackageId) || preselectedPackage;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatIndianMobileInput(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      alert('Please fill out your name, email, and mobile number.');
      return;
    }

    if (!isValidIndianPhone(phone)) {
      alert('Please enter a valid 10-digit Indian mobile number (e.g., +91 98803 71756 or 098803 71756).');
      return;
    }

    setIsSubmitting(true);
    const inqId = `INQ-${Date.now().toString().slice(-6)}`;
    const packageTitle = activePackage ? activePackage.title : (customDestination ? `Custom Trip: ${customDestination}` : `${inquiryType} Inquiry`);
    const estPrice = activePackage ? (activePackage.price * travelersAdults + Math.round(activePackage.price * 0.7) * travelersChildren) : 0;

    const fullMessage = [
      `[Inquiry Type: ${inquiryType}]`,
      message ? `Message: ${message}` : '',
      customDestination ? `Target Destination: ${customDestination}` : '',
    ].filter(Boolean).join(' | ');

    const newInquiry: BookingInquiry = {
      id: inqId,
      packageId: activePackage?.id || 'custom',
      packageTitle,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      travelDate: travelDate || 'Flexible / To be confirmed',
      travelersAdults,
      travelersChildren,
      totalPrice: estPrice,
      specialRequests: fullMessage,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    try {
      await sheetsService.createBooking(newInquiry);
      setSubmittedInquiry(newInquiry);
      if (onInquirySubmitted) {
        onInquirySubmitted(newInquiry);
      }
    } catch (err) {
      console.error('Error sending inquiry to Google Sheets:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedInquiry(null);
    setName('');
    setEmail('');
    setPhone('+91 ');
    setMessage('');
    if (onClearPreselectedPackage) onClearPreselectedPackage();
  };

  return (
    <div className="py-10 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Top Breadcrumb / Back button */}
      {onBackToPackages && (
        <button
          onClick={onBackToPackages}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Holiday Packages</span>
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Contact Information & Office Details */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-4">
              <Headphones className="w-3.5 h-3.5" />
              <span>Dedicated Concierge Desk</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
              Contact {BUSINESS_INFO.name}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
              Have questions about an upcoming holiday package, customized itineraries, 
              or tourist visa processing? Fill out the form, and our Bengaluru travel experts will contact you within 2 hours.
            </p>

            <div className="space-y-4 text-xs pt-4 border-t border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Call / Contact Number</div>
                  <a href={`tel:${BUSINESS_INFO.phone}`} className="text-blue-400 hover:underline mt-0.5 font-bold block text-sm">
                    {BUSINESS_INFO.phone}
                  </a>
                  <div className="text-[11px] text-slate-400">Mobile: {BUSINESS_INFO.phoneInternational}</div>
                </div>
              </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white">WhatsApp Support</div>
                    <a 
                      href={activePackage ? getPackageWhatsAppUrl(activePackage) : getGeneralWhatsAppUrl()}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-emerald-400 hover:underline mt-0.5 font-bold block"
                    >
                      {activePackage ? `Chat about "${activePackage.title}" →` : 'Chat directly on WhatsApp →'}
                    </a>
                  </div>
                </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Email Inquiries</div>
                  <div className="text-slate-400 mt-0.5">{BUSINESS_INFO.email}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Office Address (Bengaluru)</div>
                  <div className="text-slate-300 mt-0.5 leading-relaxed">
                    {BUSINESS_INFO.address}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Operating Hours</div>
                  <div className="text-slate-400 mt-0.5">{BUSINESS_INFO.operatingHours}</div>
                </div>
              </div>
            </div>

            {/* Travel Desk Assurance Badge */}
            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Fast response from our dedicated travel desk</span>
            </div>
          </div>

          {/* Value Assurance Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Why Inquire With {BUSINESS_INFO.name}?
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero-obligation itinerary planning</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Domestic & International curated packages in INR (₹)</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-700">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Full visa documentation assistance for Indian passport holders</span>
            </div>
          </div>
        </div>

        {/* Right Side: The Contact Form */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
            {submittedInquiry ? (
              /* Success confirmation state */
              <div className="text-center py-8 space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    Inquiry Received by {BUSINESS_INFO.name}!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong className="text-slate-800">{submittedInquiry.customerName}</strong>. 
                    Your inquiry has been logged with our travel desk. 
                    Our travel specialist will call or WhatsApp you shortly at <strong className="text-slate-800">{submittedInquiry.customerPhone}</strong>.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-md mx-auto text-left text-xs space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Inquiry Reference Number:</span>
                    <span className="font-mono font-bold text-sm text-blue-700">{submittedInquiry.id}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Subject / Package:</span>
                    <span className="font-semibold text-slate-900 text-right line-clamp-1">{submittedInquiry.packageTitle}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Contact Number:</span>
                    <span className="font-semibold text-slate-900">{submittedInquiry.customerPhone}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Contact Email:</span>
                    <span className="font-semibold text-slate-900">{submittedInquiry.customerEmail}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Preferred Travel Date:</span>
                    <span className="font-semibold text-slate-900">{submittedInquiry.travelDate}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Database Status:</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      Inquiry Received ({submittedInquiry.status})
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                  <a
                    href={`https://wa.me/${BUSINESS_INFO.phoneRaw}?text=${encodeURIComponent(`Hello ${BUSINESS_INFO.name}, I have just submitted contact inquiry #${submittedInquiry.id} regarding "${submittedInquiry.packageTitle}" for date: ${submittedInquiry.travelDate}. Please share details and availability.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Follow Up on WhatsApp</span>
                  </a>

                  <button
                    onClick={handleResetForm}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Submit Another Inquiry
                  </button>

                  {onBackToPackages && (
                    <button
                      onClick={onBackToPackages}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                    >
                      Browse More Packages
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Contact Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    Get in Touch with {BUSINESS_INFO.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Fill out your contact details and travel preferences. Our Bengaluru team will prepare tailored options for you.
                  </p>
                </div>

                {/* Preselected Package banner if user clicked Contact on a package */}
                {activePackage && (
                  <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={activePackage.imageUrl}
                        alt={activePackage.title}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                          Inquiring About Selected Package:
                        </span>
                        <div className="text-sm font-bold text-slate-900">
                          {activePackage.title}
                        </div>
                        <span className="text-xs text-slate-600 font-medium">
                          {activePackage.destination}, {activePackage.country} • {formatCurrency(activePackage.price)}/person
                        </span>
                      </div>
                    </div>

                    {onClearPreselectedPackage && (
                      <button
                        type="button"
                        onClick={onClearPreselectedPackage}
                        className="text-xs text-slate-500 hover:text-slate-900 font-medium underline self-start sm:self-center cursor-pointer"
                      >
                        Change / Clear
                      </button>
                    )}
                  </div>
                )}

                {/* Personal Information */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mobile Phone (India +91) *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="+91 98803 71756"
                        value={phone}
                        onChange={handlePhoneChange}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono font-medium"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      🇮🇳 10-digit Indian Mobile (e.g. 098803 71756)
                    </span>
                  </div>
                </div>

                {/* Trip & Package Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Holiday Tour Package
                    </label>
                    <select
                      value={selectedPackageId}
                      onChange={(e) => setSelectedPackageId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer font-medium text-slate-800"
                    >
                      <option value="">-- Or choose custom destination below --</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.title} ({pkg.destination} - {formatCurrency(pkg.price)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Inquiry Category
                    </label>
                    <select
                      value={inquiryType}
                      onChange={(e) => setInquiryType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer font-medium text-slate-800"
                    >
                      <option value="Holiday Tour Package">Holiday Tour Package Inquiry</option>
                      <option value="Visa Assistance">Tourist / Business Visa Consultation</option>
                      <option value="Custom Itinerary">Custom Tailor-Made Itinerary</option>
                      <option value="Corporate / Group">Corporate Retreat or Group Booking</option>
                      <option value="General Question">General Travel Question</option>
                    </select>
                  </div>
                </div>

                {/* Destination & Travel Timing */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Preferred Travel Date / Month
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        value={travelDate}
                        onChange={(e) => setTravelDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Adult Travelers (12+ yrs)
                    </label>
                    <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setTravelersAdults(Math.max(1, travelersAdults - 1))}
                        className="px-3 py-2 text-slate-600 hover:bg-slate-200 font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center text-xs font-bold text-slate-900">
                        {travelersAdults} Adult{travelersAdults > 1 ? 's' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTravelersAdults(travelersAdults + 1)}
                        className="px-3 py-2 text-slate-600 hover:bg-slate-200 font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Children (0 - 11 yrs)
                    </label>
                    <div className="flex items-center border border-slate-200 bg-slate-50 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setTravelersChildren(Math.max(0, travelersChildren - 1))}
                        className="px-3 py-2 text-slate-600 hover:bg-slate-200 font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="flex-1 text-center text-xs font-bold text-slate-900">
                        {travelersChildren} Child{travelersChildren === 1 ? '' : 'ren'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTravelersChildren(travelersChildren + 1)}
                        className="px-3 py-2 text-slate-600 hover:bg-slate-200 font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Message / Details */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Your Message / Specific Questions & Requirements
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe your travel plans, flight questions from Bengaluru/Mumbai/Delhi, hotel preferences, food preferences, or visa requirements..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  ></textarea>
                </div>

                {/* Submit button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Your privacy is protected. Call / WhatsApp within 2 hours.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Submitting Inquiry...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Contact Inquiry</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
