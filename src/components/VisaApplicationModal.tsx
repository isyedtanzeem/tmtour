import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Check, 
  CheckCircle2, 
  Send, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Users, 
  Zap, 
  Copy, 
  FileText, 
  MessageCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { VisaService, VisaApplication } from '../types';
import { sheetsService } from '../services/sheetsService';
import { 
  formatCurrency, 
  formatIndianMobileInput, 
  isValidIndianPhone, 
  getCustomVisaWhatsAppUrl, 
  getVisaFollowUpWhatsAppUrl,
  BUSINESS_INFO 
} from '../utils/formatters';

interface VisaApplicationModalProps {
  visa: VisaService;
  onClose: () => void;
  onApplicationSuccess: (application: VisaApplication) => void;
}

export const VisaApplicationModal: React.FC<VisaApplicationModalProps> = ({
  visa,
  onClose,
  onApplicationSuccess,
}) => {
  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+91 ');
  const [travelDate, setTravelDate] = useState('');
  const [travellersCount, setTravellersCount] = useState('1');
  const [expressProcessing, setExpressProcessing] = useState(false);
  const [notes, setNotes] = useState('');
  
  // UI toggles
  const [showDocumentsList, setShowDocumentsList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedEnquiry, setConfirmedEnquiry] = useState<VisaApplication | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const calculateTotal = () => {
    let fee = visa.totalFee;
    if (expressProcessing && visa.expressAvailable) {
      fee += visa.expressFee;
    }
    const count = parseInt(travellersCount, 10) || 1;
    return fee * count;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerPhone(formatIndianMobileInput(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim() || !travelDate.trim()) {
      alert('Please fill out all required fields (Name, Email, Mobile Number, and Travel Date).');
      return;
    }

    if (!isValidIndianPhone(customerPhone)) {
      alert('Please enter a valid 10-digit Indian mobile number (e.g. +91 98803 71756 or 098803 71756).');
      return;
    }

    setIsSubmitting(true);
    const refNum = `VISA-ENQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newEnquiry: VisaApplication = {
      id: `enq-${Date.now().toString().slice(-6)}`,
      referenceNumber: refNum,
      visaId: visa.id,
      country: visa.country,
      visaType: visa.visaType,
      applicantName: customerName.trim(),
      applicantEmail: customerEmail.trim(),
      applicantPhone: customerPhone.trim(),
      passportNumber: 'Provided upon document collection',
      nationality: 'India',
      travelDate: travelDate.trim(),
      expressProcessing,
      totalAmount: calculateTotal(),
      uploadedDocuments: visa.documentsRequired,
      status: 'Under Review',
      submittedAt: new Date().toISOString(),
      notes: notes.trim() ? `[${travellersCount} Pax] ${notes.trim()}` : `[${travellersCount} Pax] Visa Enquiry submitted`,
    };

    try {
      await sheetsService.createVisaApplication(newEnquiry);
      setConfirmedEnquiry(newEnquiry);
      onApplicationSuccess(newEnquiry);
    } catch (err) {
      console.error('Error saving visa enquiry to Google Sheets', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    if (confirmedEnquiry) {
      navigator.clipboard.writeText(confirmedEnquiry.referenceNumber);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const whatsAppInquiryUrl = getCustomVisaWhatsAppUrl({
    country: visa.country,
    visaType: visa.visaType,
    totalFee: calculateTotal(),
    customerName: customerName.trim() || undefined,
    phone: customerPhone.trim() || undefined,
    travelDate: travelDate.trim() || undefined,
    applicants: parseInt(travellersCount, 10) || 1,
    express: expressProcessing,
    notes: notes.trim() || undefined,
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white rounded-t-3xl border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-1.5 bg-slate-800 rounded-xl">
              {visa.flagEmoji}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Visa Enquiry Desk
                </span>
                <span className="text-xs text-slate-400">• {visa.entryType}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                {visa.country} {visa.visaType}
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-7">
          {confirmedEnquiry ? (
            /* Post-Submission Success State */
            <div className="text-center py-2 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  Visa Enquiry Received!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                  Your visa enquiry for <strong className="text-slate-800">{visa.country} {visa.visaType}</strong> has been received by our visa processing desk.
                </p>
              </div>

              {/* Reference Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2.5 max-w-md mx-auto text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Enquiry Reference ID:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-sm text-emerald-700">
                      {confirmedEnquiry.referenceNumber}
                    </span>
                    <button
                      onClick={handleCopyRef}
                      title="Copy Reference Number"
                      className="p-1 rounded hover:bg-slate-200 text-slate-600 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copiedRef && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
                  </div>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Applicant:</span>
                  <span className="font-semibold text-slate-900">{confirmedEnquiry.applicantName}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Contact Mobile:</span>
                  <span className="font-semibold text-slate-900">{confirmedEnquiry.applicantPhone}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Estimated Total Fee:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatCurrency(confirmedEnquiry.totalAmount)}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Enquiry Logged
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 text-left flex items-start gap-2 max-w-md mx-auto">
                <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Our dedicated visa consultant from {BUSINESS_INFO.name} Bengaluru will contact you via WhatsApp / Call within <strong>2 business hours</strong> with the document checklist and submission guidance.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
                <a
                  href={getVisaFollowUpWhatsAppUrl(confirmedEnquiry.referenceNumber, visa.country, visa.visaType)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Chat on WhatsApp</span>
                </a>
                <button
                  onClick={onClose}
                  className="py-3 px-5 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Main Visa Enquiry Layout */
            <div className="space-y-6">
              {/* 1. Posted Visa Details Overview Card */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Posted Visa Fee
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900">
                        {formatCurrency(visa.totalFee)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">All-Inclusive</span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {visa.category} Visa
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-medium">Processing</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">{visa.processingTime}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-medium">Validity</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">{visa.validity}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-medium">Max Stay</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">{visa.stayDuration}</span>
                  </div>
                </div>

                {/* Required Documents Toggle */}
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowDocumentsList(!showDocumentsList)}
                    className="w-full flex items-center justify-between text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Required Documents Reference ({visa.documentsRequired.length})</span>
                    </span>
                    {showDocumentsList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showDocumentsList && (
                    <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 animate-in fade-in duration-150">
                      {visa.documentsRequired.map((doc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{doc}</span>
                        </li>
                      ))}
                      <li className="text-[11px] text-slate-400 pt-1">
                        * Documents are submitted after consultation; our team verifies each item before embassy processing.
                      </li>
                    </ul>
                  )}
                </div>
              </div>

              {/* 2. Customer Enquiry Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Submit Your Visa Enquiry
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enter your details below to receive a personalized checklist and quote, or enquire directly via WhatsApp.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Enter your full name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile / WhatsApp Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="+91 98803 71756"
                        value={customerPhone}
                        onChange={handlePhoneChange}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Intended Travel Date / Month *
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        required
                        value={travelDate}
                        onChange={(e) => setTravelDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Number of Travellers
                    </label>
                    <div className="relative">
                      <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                        value={travellersCount}
                        onChange={(e) => setTravellersCount(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="1">1 Applicant</option>
                        <option value="2">2 Applicants (Couple / Pair)</option>
                        <option value="3">3 Applicants (Small Family)</option>
                        <option value="4">4 Applicants (Family / Friends)</option>
                        <option value="5">5+ Applicants (Group)</option>
                      </select>
                    </div>
                  </div>

                  {visa.expressAvailable && (
                    <div className="flex items-center">
                      <label className="flex items-center gap-2 p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 cursor-pointer w-full hover:bg-amber-100/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={expressProcessing}
                          onChange={(e) => setExpressProcessing(e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-bold block">Need Express 24-48h?</span>
                          <span className="text-[10px] text-amber-700">+{formatCurrency(visa.expressFee)} / pax</span>
                        </div>
                      </label>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specific Questions or Requirements (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Travelling with family, need flight ticket bookings, or have passport validity questions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Estimated Total Bar */}
                <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Estimated Enquiry Quote:</span>
                    <span className="text-slate-400 text-[10px] block">
                      {travellersCount} Applicant{parseInt(travellersCount, 10) > 1 ? 's' : ''} • All-Inclusive
                    </span>
                  </div>
                  <span className="text-base font-extrabold text-slate-900">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>

                {/* Dual Action Buttons */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href={whatsAppInquiryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    title="Enquire directly on WhatsApp with your entered details"
                  >
                    <MessageCircle className="w-4 h-4 fill-current shrink-0" />
                    <span>Enquire on WhatsApp</span>
                  </a>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Saving Enquiry...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4 shrink-0" />
                        <span>Submit Visa Enquiry</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
