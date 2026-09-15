import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  Star, 
  Check, 
  AlertCircle, 
  Hotel, 
  Calendar, 
  Users, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  CheckCircle2, 
  DollarSign,
  Mail,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { HolidayPackage, BookingInquiry } from '../types';
import { sheetsService } from '../services/sheetsService';
import { formatCurrency, formatIndianMobileInput, isValidIndianPhone, getPackageWhatsAppUrl, BUSINESS_INFO } from '../utils/formatters';

interface HolidayPackageDetailModalProps {
  pkg: HolidayPackage;
  onClose: () => void;
  onBookingSuccess: (booking: BookingInquiry) => void;
  onOpenFullContactPage?: (pkg: HolidayPackage) => void;
}

export const HolidayPackageDetailModal: React.FC<HolidayPackageDetailModalProps> = ({
  pkg,
  onClose,
  onBookingSuccess,
  onOpenFullContactPage,
}) => {
  const [activeTab, setActiveTab] = useState<'itinerary' | 'inclusions' | 'hotel'>('itinerary');
  const [selectedImage, setSelectedImage] = useState(pkg.imageUrl);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);

  // Booking Form State
  const [travelDate, setTravelDate] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+91 ');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<BookingInquiry | null>(null);

  const calculateTotal = () => {
    const adultTotal = adults * pkg.price;
    const childTotal = children * Math.round(pkg.price * 0.7);
    return adultTotal + childTotal;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!travelDate || !customerName || !customerEmail || !customerPhone) {
      alert('Please fill out all required booking fields.');
      return;
    }

    if (!isValidIndianPhone(customerPhone)) {
      alert('Please enter a valid 10-digit Indian mobile number (e.g. +91 98803 71756 or 098803 71756).');
      return;
    }

    setIsSubmitting(true);
    const newBooking: BookingInquiry = {
      id: `BK-${Date.now().toString().slice(-6)}`,
      packageId: pkg.id,
      packageTitle: pkg.title,
      customerName,
      customerEmail,
      customerPhone,
      travelDate,
      travelersAdults: adults,
      travelersChildren: children,
      totalPrice: calculateTotal(),
      specialRequests,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    try {
      await sheetsService.createBooking(newBooking);
      setBookingConfirmed(newBooking);
      onBookingSuccess(newBooking);
    } catch (err) {
      console.error('Error saving booking to Google Sheets', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative flex flex-col">
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gallery / Hero top banner */}
        <div className="relative bg-slate-900 text-white">
          <div className="h-64 sm:h-80 w-full overflow-hidden relative">
            <img
              src={selectedImage}
              alt={pkg.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

            {/* Bottom info on hero image */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-8 sm:right-8">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-600 text-white">
                  {pkg.category}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-white/20 text-white backdrop-blur-md flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {pkg.duration}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/90 text-slate-950 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-slate-950" />
                  {pkg.rating.toFixed(1)} ({pkg.reviewCount} verified reviews)
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                {pkg.title}
              </h1>
              <div className="flex items-center gap-1 text-slate-300 text-xs sm:text-sm mt-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>{pkg.destination}, {pkg.country}</span>
              </div>
            </div>
          </div>

          {/* Gallery thumbnails */}
          {pkg.galleryImages && pkg.galleryImages.length > 0 && (
            <div className="px-4 sm:px-8 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
              <span className="text-xs text-slate-400 mr-2 font-medium">Photos:</span>
              {[pkg.imageUrl, ...pkg.galleryImages].map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === img ? 'border-blue-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Main Content */}
        <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Details & Itinerary */}
          <div className="lg:col-span-7 space-y-6">
            {/* Overview */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
                Tour Overview
              </h2>
              <p className="text-slate-700 text-sm leading-relaxed">
                {pkg.overview}
              </p>
            </div>

            {/* Navigation Tabs for details */}
            <div className="border-b border-slate-200 flex gap-4">
              <button
                onClick={() => setActiveTab('itinerary')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === 'itinerary'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Day-by-Day Itinerary ({pkg.itinerary.length} Days)
              </button>

              <button
                onClick={() => setActiveTab('inclusions')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === 'inclusions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Inclusions & Exclusions
              </button>

              <button
                onClick={() => setActiveTab('hotel')}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === 'hotel'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Accommodations
              </button>
            </div>

            {/* Tab 1: Itinerary */}
            {activeTab === 'itinerary' && (
              <div className="space-y-3">
                {pkg.itinerary.map((item) => {
                  const isOpen = expandedDay === item.day;
                  return (
                    <div
                      key={item.day}
                      className="border border-slate-200 rounded-xl overflow-hidden transition-all bg-white"
                    >
                      <button
                        onClick={() => setExpandedDay(isOpen ? null : item.day)}
                        className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 bg-slate-50/70 hover:bg-slate-100"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            D{item.day}
                          </span>
                          <span className="text-sm font-bold text-slate-800">
                            {item.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.meals && (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              {item.meals}
                            </span>
                          )}
                          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="p-4 text-xs sm:text-sm text-slate-600 bg-white border-t border-slate-100 leading-relaxed">
                          {item.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 2: Inclusions & Exclusions */}
            {activeTab === 'inclusions' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Included in This Package</span>
                  </h3>
                  <ul className="space-y-2">
                    {pkg.inclusions.map((inc, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-rose-50/50 border border-rose-200/70 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <X className="w-4 h-4 text-rose-600" />
                    <span>Excluded (Optional)</span>
                  </h3>
                  <ul className="space-y-2">
                    {pkg.exclusions.map((exc, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 3: Hotel */}
            {activeTab === 'hotel' && (
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Hotel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{pkg.hotelName}</h3>
                  <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{pkg.hotelRating} Star Verified Luxury Stay</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Features private air-conditioned rooms, complimentary high-speed Wi-Fi, 
                    daily housekeeping, and swimming pool / spa amenities.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Interactive Booking Form */}
          <div className="lg:col-span-5">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sticky top-4 shadow-sm">
              {bookingConfirmed ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Inquiry Received!
                  </h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Your request has been recorded and assigned to our holiday travel concierge desk.
                  </p>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-left text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Inquiry Reference:</span>
                      <span className="font-mono font-bold text-slate-900">{bookingConfirmed.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contact Name:</span>
                      <span className="font-semibold text-slate-900">{bookingConfirmed.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date of Travel:</span>
                      <span className="font-semibold text-slate-900">{bookingConfirmed.travelDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estimated Total:</span>
                      <span className="font-bold text-emerald-600 text-sm">{formatCurrency(bookingConfirmed.totalPrice)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <a
                      href={`https://wa.me/${BUSINESS_INFO.phoneRaw}?text=${encodeURIComponent(`Hello ${BUSINESS_INFO.name}, I just submitted inquiry #${bookingConfirmed.id} for "${pkg.title}" (${bookingConfirmed.travelDate}). Please confirm receipt and share available discounts.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>Follow Up on WhatsApp Now</span>
                    </a>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setBookingConfirmed(null)}
                        className="w-full py-2.5 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        Inquire Another Date
                      </button>
                      <button
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Contact Specialist</div>
                      <div className="text-[11px] text-slate-500">Package pricing & custom inquiry</div>
                    </div>
                    {onOpenFullContactPage && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenFullContactPage(pkg);
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Full Form Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 font-medium">Starting Price</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">{formatCurrency(pkg.price)}</span>
                        <span className="text-xs text-slate-500">/ adult</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                      ✓ Instant quote & Zero-obligation customized itinerary
                    </div>
                  </div>

                  {/* Travel Date */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Departure Date *
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        required
                        value={travelDate}
                        onChange={(e) => setTravelDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Traveler counters */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Adults (12+ yrs)
                      </label>
                      <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center text-xs font-bold text-slate-900">
                          {adults}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAdults(adults + 1)}
                          className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Children (2-11 yrs)
                      </label>
                      <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center text-xs font-bold text-slate-900">
                          {children}
                        </span>
                        <button
                          type="button"
                          onClick={() => setChildren(children + 1)}
                          className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Lead Passenger Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter your full name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="name@example.com"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Mobile Phone (India +91) *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="+91 98803 71756"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(formatIndianMobileInput(e.target.value))}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          🇮🇳 10-digit Indian Mobile
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Special Requests (Optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Pure veg / Jain meals, twin/king bed preference, airport pickup notes..."
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      ></textarea>
                    </div>
                  </div>

                  {/* Pricing Total Summary */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>{adults} Adult{adults > 1 ? 's' : ''} × {formatCurrency(pkg.price)}</span>
                      <span>{formatCurrency(adults * pkg.price)}</span>
                    </div>
                    {children > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>{children} Child{children > 1 ? 'ren' : ''} × {formatCurrency(Math.round(pkg.price * 0.7))}</span>
                        <span>{formatCurrency(children * Math.round(pkg.price * 0.7))}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline font-bold text-slate-900 text-sm">
                      <span>Estimated Total:</span>
                      <span className="text-lg text-blue-600">{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Submitting Inquiry...</span>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Send Contact Inquiry</span>
                      </>
                    )}
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">or instant response</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <a
                    href={getPackageWhatsAppUrl(pkg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    title="Send pre-filled WhatsApp request for this package"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Direct WhatsApp Inquiry</span>
                  </a>

                  <div className="text-[11px] text-center text-slate-400">
                    No payment required. Our travel specialist will reach out with customized options.
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
