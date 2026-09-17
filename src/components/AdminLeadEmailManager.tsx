import React, { useState, useEffect } from 'react';
import {
  Mail,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Bell,
  Send,
  User,
  Compass,
  FileCheck,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Copy,
  ExternalLink,
  Phone,
  MessageCircle,
  ToggleLeft,
  ToggleRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { leadEmailService } from '../services/leadEmailService';
import { LeadEmailRecipient, LeadEmailSettings, LeadNotificationLog } from '../types';

export const AdminLeadEmailManager: React.FC = () => {
  const [settings, setSettings] = useState<LeadEmailSettings>(leadEmailService.getSettings());
  const [logs, setLogs] = useState<LeadNotificationLog[]>(leadEmailService.getLogs());

  // Form State for Adding / Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [receiveHoliday, setReceiveHoliday] = useState(true);
  const [receiveVisa, setReceiveVisa] = useState(true);
  const [receiveContact, setReceiveContact] = useState(true);

  // UI state
  const [previewTab, setPreviewTab] = useState<'holiday' | 'visa'>('holiday');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  // Settings form
  const [subjectPrefix, setSubjectPrefix] = useState(settings.alertSubjectPrefix);
  const [senderName, setSenderName] = useState(settings.senderDisplayName);
  const [includePhone, setIncludePhone] = useState(settings.includeCustomerPhone);
  const [includeDetails, setIncludeDetails] = useState(settings.includeFullDetails);

  useEffect(() => {
    const unsubscribe = leadEmailService.subscribe(() => {
      setSettings(leadEmailService.getSettings());
      setLogs(leadEmailService.getLogs());
    });
    return () => unsubscribe();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleResetForm = () => {
    setEditingId(null);
    setEmailInput('');
    setNameInput('');
    setNotesInput('');
    setReceiveHoliday(true);
    setReceiveVisa(true);
    setReceiveContact(true);
  };

  const handleEditClick = (rec: LeadEmailRecipient) => {
    setEditingId(rec.id);
    setEmailInput(rec.email);
    setNameInput(rec.name);
    setNotesInput(rec.notes || '');
    setReceiveHoliday(rec.receiveHolidayLeads);
    setReceiveVisa(rec.receiveVisaLeads);
    setReceiveContact(rec.receiveContactLeads);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleSubmitRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      showToast('Please enter an email address', 'error');
      return;
    }

    if (!receiveHoliday && !receiveVisa && !receiveContact) {
      showToast('Please select at least one lead category (Holiday, Visa, or Contact)', 'error');
      return;
    }

    if (editingId) {
      const ok = leadEmailService.updateRecipient(editingId, {
        email: emailInput,
        name: nameInput.trim() || emailInput.split('@')[0],
        notes: notesInput.trim(),
        receiveHolidayLeads: receiveHoliday,
        receiveVisaLeads: receiveVisa,
        receiveContactLeads: receiveContact,
      });

      if (ok) {
        showToast(`Recipient updated successfully!`);
        handleResetForm();
      } else {
        showToast('Failed to update recipient', 'error');
      }
    } else {
      const result = leadEmailService.addRecipient({
        email: emailInput,
        name: nameInput.trim() || emailInput.split('@')[0],
        notes: notesInput.trim(),
        receiveHolidayLeads: receiveHoliday,
        receiveVisaLeads: receiveVisa,
        receiveContactLeads: receiveContact,
        active: true,
      });

      if (result.success) {
        showToast(result.message, 'success');
        handleResetForm();
      } else {
        showToast(result.message, 'error');
      }
    }
  };

  const handleDeleteRecipient = (id: string, email: string) => {
    if (window.confirm(`Are you sure you want to remove "${email}" from receiving leads?`)) {
      leadEmailService.removeRecipient(id);
      showToast(`Removed ${email} from recipients`);
    }
  };

  const handleToggleActive = (id: string) => {
    leadEmailService.toggleRecipientActive(id);
  };

  const handleToggleGlobal = () => {
    leadEmailService.updateSettings({ enabled: !settings.enabled });
    showToast(
      !settings.enabled
        ? 'Lead email notifications enabled! Inquiries will trigger alerts.'
        : 'Lead email notifications paused.'
    );
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    leadEmailService.updateSettings({
      alertSubjectPrefix: subjectPrefix,
      senderDisplayName: senderName,
      includeCustomerPhone: includePhone,
      includeFullDetails: includeDetails,
    });
    showToast('Preferences saved successfully!');
  };

  const handleSendTest = async (email: string, type: 'holiday' | 'visa') => {
    setIsTesting(true);
    setTestSuccessMessage(null);
    try {
      const res = await leadEmailService.sendTestAlert(email, type);
      if (res.success) {
        setTestSuccessMessage(res.message);
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch {
      showToast('Failed to dispatch test lead', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const activeHolidayRecipients = settings.recipients.filter((r) => r.active && r.receiveHolidayLeads);
  const activeVisaRecipients = settings.recipients.filter((r) => r.active && r.receiveVisaLeads);
  const activeCount = settings.recipients.filter((r) => r.active).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold transition-all ${
            toastType === 'success'
              ? 'bg-slate-900 text-white border-emerald-500/40 shadow-emerald-500/10'
              : 'bg-rose-950 text-rose-100 border-rose-500/40'
          }`}
        >
          {toastType === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Master Switch Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-md border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/15 via-purple-500/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                <Bell className="w-3 h-3" />
                Lead Notification Engine
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 border ${
                  settings.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${settings.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                {settings.enabled ? 'Live & Routing Leads' : 'Notifications Paused'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Manage Lead Recipient Emails
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Configure recipient email addresses to receive instant notifications whenever a customer inquires about a
              <strong className="text-white"> Holiday Tour Package</strong> or submits a <strong className="text-white">Visa Application</strong>.
            </p>
          </div>

          {/* Master Enable/Disable Control & Metrics */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15">
            <div className="text-left sm:text-right">
              <div className="text-xs text-slate-300 font-medium">Automatic Alerts</div>
              <div className="text-sm font-bold text-white">
                {settings.enabled ? 'Enabled' : 'Paused'}
              </div>
            </div>

            <button
              onClick={handleToggleGlobal}
              className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                settings.enabled
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-sm'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              {settings.enabled ? (
                <>
                  <ToggleRight className="w-5 h-5 text-slate-950" />
                  <span>Turn Off Alerts</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-slate-300" />
                  <span>Turn On Alerts</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Summary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/40">
            <div className="text-[11px] text-slate-400 font-medium">Active Recipients</div>
            <div className="text-lg font-extrabold text-white mt-0.5 flex items-baseline gap-1">
              <span>{activeCount}</span>
              <span className="text-xs text-slate-400 font-normal">/ {settings.recipients.length} total</span>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/40">
            <div className="text-[11px] text-blue-300 font-medium flex items-center gap-1">
              <Compass className="w-3 h-3" />
              Holiday Leads
            </div>
            <div className="text-lg font-extrabold text-blue-400 mt-0.5">
              {activeHolidayRecipients.length} Recipient{activeHolidayRecipients.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/40">
            <div className="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
              <FileCheck className="w-3 h-3" />
              Visa Leads
            </div>
            <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
              {activeVisaRecipients.length} Recipient{activeVisaRecipients.length === 1 ? '' : 's'}
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/40">
            <div className="text-[11px] text-purple-300 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Recent Dispatches
            </div>
            <div className="text-lg font-extrabold text-purple-400 mt-0.5">
              {logs.length} logged
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Add / Manage Recipients (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Recipient Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingId ? 'Edit Email Recipient' : 'Add Email to Receive Leads'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure which travel services send inquiries to this address.
                  </p>
                </div>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmitRecipient} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. leads@tripmytour.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                    />
                  </div>
                </div>

                {/* Recipient Name / Role */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Recipient Name / Department
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. Syed Tanzeem / Holiday Desk"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Service Selection: Which leads should this email receive? */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Lead Categories for this Email *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Holiday Packages */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      receiveHoliday
                        ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                        : 'bg-slate-50/40 border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={receiveHoliday}
                      onChange={(e) => setReceiveHoliday(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-blue-600" />
                        <span>Holiday Tours</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Package inquiries, bookings, custom itineraries
                      </div>
                    </div>
                  </label>

                  {/* Visa Services */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      receiveVisa
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50/40 border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={receiveVisa}
                      onChange={(e) => setReceiveVisa(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Visa Services</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Visa applications, document uploads, express visas
                      </div>
                    </div>
                  </label>

                  {/* General Contact Forms */}
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      receiveContact
                        ? 'bg-purple-50/60 border-purple-200 text-purple-900'
                        : 'bg-slate-50/40 border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={receiveContact}
                      onChange={(e) => setReceiveContact(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                        <span>Contact Page</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        General inquiries from contact form page
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Internal Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior holiday consultant in charge of Southeast Asia & Dubai inquiries"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-slate-400">
                  {editingId ? 'Updating existing recipient' : 'New recipient will be activated immediately'}
                </div>

                <div className="flex items-center gap-2">
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingId ? 'Save Recipient Changes' : 'Add Recipient Email'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* List of Configured Recipient Emails */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Configured Lead Email Recipients ({settings.recipients.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Inquiries are immediately dispatched to these verified email inboxes.
                </p>
              </div>

              <span className="text-[11px] font-bold text-slate-500">
                {activeCount} Active
              </span>
            </div>

            {settings.recipients.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Mail className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-700">No email recipients configured yet</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Add an email address above to begin receiving instant alerts for holiday bookings and visa applications.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {settings.recipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      recipient.active ? 'hover:bg-slate-50/80' : 'bg-slate-50/40 opacity-70'
                    }`}
                  >
                    {/* Left: Email Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-extrabold ${
                          recipient.active
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {recipient.name ? recipient.name.charAt(0).toUpperCase() : 'E'}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {recipient.email}
                          </span>
                          {recipient.name && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                              {recipient.name}
                            </span>
                          )}
                          {!recipient.active && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                              Inactive / Paused
                            </span>
                          )}
                        </div>

                        {recipient.notes && (
                          <div className="text-xs text-slate-500 truncate">{recipient.notes}</div>
                        )}

                        {/* Category Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {recipient.receiveHolidayLeads && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                              <Compass className="w-3 h-3" />
                              Holiday Leads
                            </span>
                          )}
                          {recipient.receiveVisaLeads && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <FileCheck className="w-3 h-3" />
                              Visa Leads
                            </span>
                          )}
                          {recipient.receiveContactLeads && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              Contact Form
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {/* Send Test Alert Button */}
                      <div className="flex items-center gap-1">
                        {recipient.receiveHolidayLeads && (
                          <button
                            type="button"
                            disabled={isTesting}
                            onClick={() => handleSendTest(recipient.email, 'holiday')}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 transition-colors disabled:opacity-50"
                            title="Send sample Holiday package inquiry to this email"
                          >
                            <Send className="w-3 h-3" />
                            <span>Test Holiday</span>
                          </button>
                        )}
                        {recipient.receiveVisaLeads && (
                          <button
                            type="button"
                            disabled={isTesting}
                            onClick={() => handleSendTest(recipient.email, 'visa')}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 transition-colors disabled:opacity-50"
                            title="Send sample Visa service application to this email"
                          >
                            <Send className="w-3 h-3" />
                            <span>Test Visa</span>
                          </button>
                        )}
                      </div>

                      {/* Active Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(recipient.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          recipient.active
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title={recipient.active ? 'Pause notifications' : 'Resume notifications'}
                      >
                        {recipient.active ? (
                          <ToggleRight className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleEditClick(recipient)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Recipient"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteRecipient(recipient.id, recipient.email)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Recipient"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notification Email Content Customizer */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">
                Email Content & Delivery Customization
              </h3>
              <p className="text-[11px] text-slate-500">
                Adjust how lead alert emails appear in your email client (Gmail, Outlook, Apple Mail).
              </p>
            </div>

            <form onSubmit={handleSavePreferences} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Subject Line Prefix
                  </label>
                  <input
                    type="text"
                    value={subjectPrefix}
                    onChange={(e) => setSubjectPrefix(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="[TripMyTour Lead]"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Helps with inbox filters and automatic email sorting.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="TripMyTour Lead Engine"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Shown as the sender name in the manager's inbox.
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePhone}
                    onChange={(e) => setIncludePhone(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Include direct click-to-WhatsApp and click-to-Call buttons in alert emails</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDetails}
                    onChange={(e) => setIncludeDetails(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Include full itinerary breakdowns & required visa documentation lists</span>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Save Email Preferences
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Email Template Preview & Notification Log (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Test Status Banner */}
          {testSuccessMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-950">Test Alert Dispatched!</div>
                <div className="text-emerald-800 mt-0.5">{testSuccessMessage}</div>
              </div>
            </div>
          )}

          {/* Interactive Live Email Preview Mockup */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Interactive Alert Preview
                </h3>
                <p className="text-[11px] text-slate-500">
                  Exact HTML email format delivered to configured recipients.
                </p>
              </div>

              {/* Tab selector between Holiday and Visa */}
              <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewTab('holiday')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    previewTab === 'holiday' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  🌴 Holiday
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('visa')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    previewTab === 'visa' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  🛂 Visa
                </button>
              </div>
            </div>

            {/* Email Shell Header */}
            <div className="bg-slate-100 p-3.5 border-b border-slate-200 text-xs space-y-1 text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400 w-12 text-right">From:</span>
                <span className="font-medium text-slate-800">
                  {senderName} &lt;alerts@tripmytour.com&gt;
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400 w-12 text-right">To:</span>
                <span className="font-mono text-slate-800 text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 truncate">
                  {previewTab === 'holiday'
                    ? (activeHolidayRecipients.map((r) => r.email).join(', ') || 'No active recipients')
                    : (activeVisaRecipients.map((r) => r.email).join(', ') || 'No active recipients')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400 w-12 text-right">Subject:</span>
                <span className="font-bold text-slate-900 truncate">
                  {previewTab === 'holiday'
                    ? `${subjectPrefix} 🌴 New Holiday Inquiry: Royal Dubai Odyssey (Rahul Verma)`
                    : `${subjectPrefix} 🛂 New Visa Application: UAE 30 Days Tourist (Priya Sharma)`}
                </span>
              </div>
            </div>

            {/* Email Mock Body */}
            <div className="p-4 bg-slate-50/50 max-h-96 overflow-y-auto">
              {previewTab === 'holiday' ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden text-xs">
                  <div className="bg-gradient-to-r from-blue-500 via-rose-500 to-purple-600 p-4 text-white">
                    <div className="font-extrabold text-sm tracking-tight">TripMyTour · New Holiday Lead</div>
                    <div className="text-[11px] opacity-90 mt-0.5">Package inquiry submitted from portal</div>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Customer Box */}
                    <div className="bg-slate-100 p-3 rounded-lg space-y-1">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Customer Contact</div>
                      <div className="text-sm font-extrabold text-slate-900">Rahul Verma</div>
                      <div className="text-slate-700 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-blue-600" />
                        <span>+91 98803 71756</span>
                      </div>
                      <div className="text-slate-700 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-blue-600" />
                        <span>rahul.verma@example.com</span>
                      </div>
                    </div>

                    {/* Booking Details Table */}
                    <div className="divide-y divide-slate-100 text-slate-700">
                      <div className="py-1.5 flex justify-between">
                        <span className="text-slate-500">Tour Package</span>
                        <span className="font-bold text-blue-600 text-right">Royal Dubai & Abu Dhabi Odyssey</span>
                      </div>
                      <div className="py-1.5 flex justify-between">
                        <span className="text-slate-500">Travel Date</span>
                        <span className="font-medium text-right">15 Oct 2026</span>
                      </div>
                      <div className="py-1.5 flex justify-between">
                        <span className="text-slate-500">Travelers</span>
                        <span className="font-medium text-right">2 Adults, 1 Child</span>
                      </div>
                      <div className="py-1.5 flex justify-between font-bold">
                        <span className="text-slate-700">Estimated Total</span>
                        <span className="text-emerald-600 text-sm">₹1,68,000</span>
                      </div>
                    </div>

                    {/* Action buttons inside email */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 bg-emerald-600 text-white font-bold py-2 rounded-lg text-center flex items-center justify-center gap-1 text-[11px]">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Direct WhatsApp Reply</span>
                      </div>
                      <div className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg text-center flex items-center justify-center gap-1 text-[11px]">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Customer</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden text-xs">
                  <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 p-4 text-white">
                    <div className="font-extrabold text-sm tracking-tight">TripMyTour · New Visa Application</div>
                    <div className="text-[11px] opacity-90 mt-0.5">Documentation ready for embassy filing</div>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Applicant Box */}
                    <div className="bg-slate-100 p-3 rounded-lg space-y-1">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Applicant Details</div>
                      <div className="text-sm font-extrabold text-slate-900">Priya Sharma</div>
                      <div className="text-slate-700 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>+91 98803 71756</span>
                      </div>
                      <div className="text-slate-700 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-emerald-600" />
                        <span>priya.sharma@example.com</span>
                      </div>
                    </div>

                    {/* Visa Details Table */}
                    <div className="divide-y divide-slate-100 text-slate-700">
                      <div className="py-1.5 flex justify-between">
                        <span className="text-slate-500">Country & Visa</span>
                        <span className="font-bold text-emerald-700 text-right">UAE · 30 Days Tourist eVisa</span>
                      </div>
                      <div className="py-1.5 flex justify-between">
                        <span className="text-slate-500">Processing Tier</span>
                        <span className="font-bold text-amber-700 text-right">⚡ Express Processing</span>
                      </div>
                      <div className="py-1.5 flex justify-between">
                        <span className="text-slate-500">Reference No.</span>
                        <span className="font-mono text-slate-800 text-right">VISA-2026-9812</span>
                      </div>
                      <div className="py-1.5 flex justify-between font-bold">
                        <span className="text-slate-700">Total Visa Fee</span>
                        <span className="text-emerald-600 text-sm">₹8,499</span>
                      </div>
                    </div>

                    {/* Action buttons inside email */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 bg-emerald-600 text-white font-bold py-2 rounded-lg text-center flex items-center justify-center gap-1 text-[11px]">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Direct WhatsApp Reply</span>
                      </div>
                      <div className="flex-1 bg-emerald-700 text-white font-bold py-2 rounded-lg text-center flex items-center justify-center gap-1 text-[11px]">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call Applicant</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Dispatch Audit Log */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Lead Dispatch History ({logs.length})
                </h3>
              </div>

              {logs.length > 0 && (
                <button
                  type="button"
                  onClick={() => leadEmailService.clearLogs()}
                  className="text-[11px] font-semibold text-slate-400 hover:text-rose-600"
                >
                  Clear History
                </button>
              )}
            </div>

            {logs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No alerts dispatched yet. Dispatches will be logged here in real time as leads arrive.
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {logs.map((log) => (
                  <div key={log.id} className="p-3.5 hover:bg-slate-50 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.type === 'holiday'
                            ? 'bg-blue-100 text-blue-800'
                            : log.type === 'visa'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.type === 'contact'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {log.type.toUpperCase()} LEAD
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="font-bold text-slate-800 truncate">
                      {log.serviceTitle} · {log.customerName}
                    </div>

                    <div className="text-[11px] text-slate-500 truncate">
                      Routed to: {log.recipientEmails.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Google Apps Script Integration Note */}
          <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-200 text-xs text-blue-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-blue-950">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Google Apps Script Automated Email Dispatch</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              When your Google Sheet is connected in the <strong>Cloud Database & Sync Setup</strong> tab, your linked Google Apps Script will also automatically dispatch Google emails via <code className="bg-blue-100 px-1 py-0.5 rounded text-[10px] font-mono">MailApp.sendEmail()</code> to these exact configured recipients whenever a customer submits an inquiry!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
