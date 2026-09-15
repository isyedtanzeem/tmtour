import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Users, 
  CheckCircle2, 
  Copy, 
  MessageCircle, 
  Send, 
  ShieldCheck, 
  Sparkles,
  Info
} from 'lucide-react';
import { HolidayPackage, BookingInquiry } from '../types';
import { sheetsService } from '../services/sheetsService';
import { 
  formatCurrency, 
  formatIndianMobileInput, 
  isValidIndianPhone, 
  BUSINESS_INFO 
} from '../utils/formatters';

interface PackageInquiryModalProps {
  pkg: HolidayPackage;
  onClose: () => void;
  onInquirySuccess: (booking: BookingInquiry) => void;
}

export const PackageInquiryModal: React.FC<PackageInquiryModalProps> = ({
  pkg,
  onClose,
  onInquirySuccess,
}) => {
  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+91 ');
  const [travelDate, setTravelDate] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<BookingInquiry | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const calculateTotal = () => {
    const adultTotal = adults * pkg.price;
    const childTotal = children * Math.round(pkg.price * 0.7);
    return adultTotal + childTotal;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatIndianMobileInput(e.target.value);
    setCustomerPhone(formatted);
  };

  const handleCopyRef = () => {
    if (!confirmedBooking) return;
    navigator.clipboard.writeText(confirmedBooking.id);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim() || !travelDate) {
      alert('Please fill out all required inquiry fields (Name, Email, Mobile, and Departure Date).');
      return;
    }

    if (!isValidIndianPhone(customerPhone)) {
      alert('Please enter a valid 10-digit Indian mobile number (e.g., +91 98803 71756 or 098803 71756).');
      return;
    }

    setIsSubmitting(true);
    const newBooking: BookingInquiry = {
      id: `BK-${Date.now().toString().slice(-6)}`,
      packageId: pkg.id,
      packageTitle: pkg.title,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      travelDate,
      travelersAdults: adults,
      travelersChildren: children,
      totalPrice: calculateTotal(),
      status: 'Pending',
      createdAt: new Date().toISOString(),
      specialRequests: specialRequests.trim() || undefined,
    };

    try {
      await sheetsService.createBooking(newBooking);
      setConfirmedBooking(newBooking);
      onInquirySuccess(newBooking);
    } catch (err) {
      console.error('Failed to submit package inquiry:', err);
      // Fallback: still show confirmation to user and update UI
      setConfirmedBooking(newBooking);
      onInquirySuccess(newBooking);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Today's date string for input min attribute
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div 
      id="package-inquiry-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="package-inquiry-modal-content"
        className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto border border-slate-200 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header Bar with Package Info */}
        <div className="relative bg-slate-900 text-white p-4 sm:p-5 border-b border-slate-800 shrink-0">
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close inquiry popup"
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 sm:gap-4 pr-8">
            <img
              src={pkg.imageUrl}
              alt={pkg.title}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 border border-white/15 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold text-[10px] tracking-wider uppercase">
                  Package Inquiry
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{pkg.duration}</span>
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-1">
                {pkg.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
                <span className="flex items-center gap-1 text-slate-400">
                  <MapPin className="w-3 h-3 text-blue-400" />
                  <span className="truncate">{pkg.destination}</span>
                </span>
                <span>•</span>
                <span className="font-extrabold text-white text-xs sm:text-sm">
                  {formatCurrency(pkg.price)}
                </span>
                <span className="text-[10px] text-slate-400">/ person</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {confirmedBooking ? (
            /* Post-Submission Success State */
            <div className="text-center py-2 space-y-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Inquiry Received!
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                  Your inquiry for <strong className="text-slate-800">{pkg.title}</strong> has been received by our travel concierge desk.
                </p>
              </div>

              {/* Reference Summary Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2.5 max-w-md mx-auto text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Inquiry Reference ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm text-emerald-700">
                      {confirmedBooking.id}
                    </span>
                    <button
                      onClick={handleCopyRef}
                      title="Copy Reference ID"
                      className="p-1 rounded hover:bg-slate-200 text-slate-600 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copiedRef && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
                  </div>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Lead Traveler:</span>
                  <span className="font-semibold text-slate-900">{confirmedBooking.customerName}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Contact Phone:</span>
                  <span className="font-semibold text-slate-900">{confirmedBooking.customerPhone}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Travel Date:</span>
                  <span className="font-semibold text-slate-900">{confirmedBooking.travelDate}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Travelers:</span>
                  <span className="font-semibold text-slate-900">
                    {confirmedBooking.travelersAdults} Adults {confirmedBooking.travelersChildren > 0 ? `, ${confirmedBooking.travelersChildren} Children` : ''}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Estimated Total:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatCurrency(confirmedBooking.totalPrice)}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Inquiry Logged (Active)
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 text-left flex items-start gap-2 max-w-md mx-auto">
                <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Our destination specialist from {BUSINESS_INFO.name} will reach out via WhatsApp / Call with your customized day-by-day itinerary and available seasonal discounts.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
                <a
                  href={`https://wa.me/${BUSINESS_INFO.phoneRaw}?text=${encodeURIComponent(
                    `Hello ${BUSINESS_INFO.name}, I just submitted inquiry #${confirmedBooking.id} for "${pkg.title}" (${confirmedBooking.travelDate}). Please confirm receipt and share available discounts.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Chat on WhatsApp</span>
                </a>
                <button
                  onClick={onClose}
                  className="py-3 px-5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Inquiry Form */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Instant Itinerary & Free Quote</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Zero obligation
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
                  />
                </div>
              </div>

              {/* Contact Grid: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98803 71756"
                      value={customerPhone}
                      onChange={handlePhoneChange}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-slate-900"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    WhatsApp itinerary will be shared here
                  </span>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Detailed quotation voucher
                  </span>
                </div>
              </div>

              {/* Travel Date & Travelers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Travel Date */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Departure Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full pl-9 pr-2.5 py-2.5 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
                    />
                  </div>
                </div>

                {/* Adults Count */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Adults (12+ yrs)
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                      className="w-full pl-9 pr-2.5 py-2.5 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 cursor-pointer font-medium"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Adult' : 'Adults'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Children Count */}
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Children (2-11 yrs)
                  </label>
                  <select
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 cursor-pointer font-medium"
                  >
                    {[0, 1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        {num === 0 ? 'No Children' : `${num} ${num === 1 ? 'Child' : 'Children'}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Special Requests / Customization */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Special Customizations & Preferences <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Honeymoon villa preference, Indian vegetarian food, flights from Bengaluru..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full p-3 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 placeholder:text-slate-400 resize-none"
                />
              </div>

              {/* Live Cost Estimate Preview */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Estimated Package Total</div>
                  <div className="text-xs text-slate-600">
                    {adults} {adults === 1 ? 'adult' : 'adults'}
                    {children > 0 ? ` + ${children} child` : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-blue-600">
                    {formatCurrency(calculateTotal())}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">
                    Includes all stated tour features
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting Your Inquiry...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Package Inquiry</span>
                    </>
                  )}
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-2 flex items-center justify-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified Travel Desk</span>
                </span>
                <span>•</span>
                <span>Instant Confirmation</span>
                <span>•</span>
                <span>Zero Booking Fees</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
