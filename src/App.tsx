import React, { useState, useEffect, useCallback } from 'react';
import { 
  Compass, 
  FileCheck, 
  Database, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Star, 
  Clock, 
  CheckCircle2, 
  PlaneTakeoff, 
  RefreshCw,
  Users,
  Building,
  HeartHandshake,
  Mail,
  MessageCircle,
  ChevronRight,
  Palmtree
} from 'lucide-react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { HolidayPackagesList } from './components/HolidayPackagesList';
import { HolidayPackageDetailModal } from './components/HolidayPackageDetailModal';
import { PackageInquiryModal } from './components/PackageInquiryModal';
import { VisaServicesList } from './components/VisaServicesList';
import { VisaApplicationModal } from './components/VisaApplicationModal';
import { AdminPortal } from './components/AdminPortal';
import { AdminLoginGate } from './components/AdminLoginGate';
import { ContactFormPage } from './components/ContactFormPage';
import { FloatingMobileContact } from './components/FloatingMobileContact';
import { PackageCard } from './components/PackageCard';
import { TravelFAQ } from './components/TravelFAQ';
import { SEOHead } from './components/SEOHead';
import { Footer } from './components/Footer';
import { sheetsService } from './services/sheetsService';
import { adminAuthService } from './services/adminAuthService';
import { HolidayPackage, VisaService, BookingInquiry, VisaApplication, GoogleSheetsConfig, ActiveTabType, AdminUser } from './types';
import { formatCurrency, BUSINESS_INFO, getPackageWhatsAppUrl, getVisaWhatsAppUrl } from './utils/formatters';

const checkUrlForAdmin = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (
      path.startsWith('/admin') ||
      search.includes('admin') ||
      search.includes('portal=admin') ||
      hash.includes('admin')
    );
  } catch (err) {
    return false;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTabType>(() => {
    return checkUrlForAdmin() ? 'admin' : 'home';
  });
  const [packages, setPackages] = useState<HolidayPackage[]>([]);
  const [visas, setVisas] = useState<VisaService[]>([]);
  const [bookings, setBookings] = useState<BookingInquiry[]>([]);
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(sheetsService.getConfig());
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => adminAuthService.getCurrentUser());
  
  // Modals & Selected states
  const [selectedPackage, setSelectedPackage] = useState<HolidayPackage | null>(null);
  const [inquiryPackage, setInquiryPackage] = useState<HolidayPackage | null>(null);
  const [selectedVisa, setSelectedVisa] = useState<VisaService | null>(null);
  const [contactPreselectedPackage, setContactPreselectedPackage] = useState<HolidayPackage | null>(null);

  // Search queries passed between tabs
  const [packageSearchQuery, setPackageSearchQuery] = useState('');
  const [packageCategory, setPackageCategory] = useState('All');

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  const handleExitAdmin = () => {
    setActiveTab('home');
    try {
      window.history.pushState(null, '', '/');
    } catch (e) {
      // fallback
    }
    showToast('Returned to public website');
  };

  const loadData = useCallback(() => {
    setPackages(sheetsService.getPackages());
    setVisas(sheetsService.getVisas());
    setBookings(sheetsService.getBookings());
    setApplications(sheetsService.getApplications());
    setSheetsConfig(sheetsService.getConfig());
  }, []);

  // Listen to popstate and hashchange for direct URL routing
  useEffect(() => {
    const handleUrlChange = () => {
      if (checkUrlForAdmin()) {
        setActiveTab('admin');
      } else if (activeTab === 'admin') {
        setActiveTab('home');
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [activeTab]);

  // Sync address bar when on admin tab so direct URL can be copied/shared by admin
  useEffect(() => {
    if (activeTab === 'admin') {
      const search = window.location.search;
      const path = window.location.pathname;
      const hash = window.location.hash;
      const alreadyHasAdmin = path.startsWith('/admin') || search.includes('admin') || hash.includes('admin');
      if (!alreadyHasAdmin) {
        try {
          window.history.pushState(null, '', '/?admin=true');
        } catch (e) {}
      }
    }
  }, [activeTab]);

  // Global staff shortcut: Ctrl + Shift + A (or Cmd + Shift + A)
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setActiveTab((prev) => {
          const next = prev === 'admin' ? 'home' : 'admin';
          if (next === 'admin') {
            try {
              window.history.pushState(null, '', '/?admin=true');
            } catch (e) {}
            showToast('Admin Portal accessed (Staff shortcut)');
          } else {
            try {
              window.history.pushState(null, '', '/');
            } catch (e) {}
            showToast('Returned to public website');
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    // Initial data load
    loadData();

    // Auto-sync with Google Sheets in background if valid custom URL is configured
    sheetsService.syncWithGoogleSheets().then((res) => {
      loadData();
      if (res && res.success && sheetsService.getConfig().isCustomUrlActive) {
        console.log('Synchronized successfully with Google Sheets backend.');
      }
    });

    const unsubAuth = adminAuthService.subscribe(() => {
      setAdminUser(adminAuthService.getCurrentUser());
    });

    return () => unsubAuth();
  }, [loadData]);

  const handleSearchPackages = (destination: string, category: string) => {
    setPackageSearchQuery(destination);
    setPackageCategory(category);
    setActiveTab('packages');
  };

  const handleSelectVisaCountry = (visaId: string) => {
    const found = visas.find((v) => v.id === visaId);
    if (found) {
      setSelectedVisa(found);
    }
  };

  const handleContactPackage = (pkg: HolidayPackage) => {
    setInquiryPackage(pkg);
  };

  const handleManualSync = () => {
    sheetsService.syncWithGoogleSheets().then((res) => {
      loadData();
      if (res && res.success && sheetsService.getConfig().isCustomUrlActive) {
        showToast('Data synchronized successfully!');
      } else {
        showToast('Database up to date');
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Dynamic SEO Head Management */}
      <SEOHead
        activeTab={activeTab}
        selectedPackage={selectedPackage}
        selectedVisa={selectedVisa}
        searchQuery={packageSearchQuery}
        categoryFilter={packageCategory}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-sm bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sheetsConfig={sheetsConfig}
        onSyncClick={handleManualSync}
        isSyncing={sheetsConfig.syncStatus === 'syncing'}
        isAdminAuthenticated={!!adminUser}
        onExitAdmin={handleExitAdmin}
      />

      {/* Main Body content according to active tab */}
      <main className="flex-1">
        {/* ========================================================= */}
        {/* TAB: HOME */}
        {/* ========================================================= */}
        {activeTab === 'home' && (
          <div>
            {/* Hero Section with Search & Live Filters */}
            <HeroSection
              onSearchPackages={handleSearchPackages}
              onSelectVisa={handleSelectVisaCountry}
              visas={visas}
              setActiveTab={setActiveTab}
            />

            {/* Incredible India: Curated Domestic Holidays Section */}
            <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto border-b border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full mb-2 border border-orange-100">
                    <Palmtree className="w-3.5 h-3.5" />
                    <span>Incredible India Domestic Holidays</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Curated Domestic Holiday Packages
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Handcrafted escapes across India with verified 4★/5★ stays, private chauffeured vehicles, and local experiences.
                  </p>
                </div>

                <button
                  onClick={() => {
                    handleSearchPackages('', 'Domestic');
                  }}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 hover:gap-3 transition-all cursor-pointer"
                >
                  <span>Explore All Domestic Holidays</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Domestic Packages Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages
                  .filter((p) => p.category === 'Domestic' || p.country.toLowerCase() === 'india')
                  .slice(0, 3)
                  .map((pkg) => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      onSelectPackage={setSelectedPackage}
                      onContactPackage={handleContactPackage}
                    />
                  ))}
              </div>
            </section>

            {/* Featured International Holiday Packages Preview */}
            <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-2 border border-blue-100">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Global Destinations</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Featured International Tour Packages
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    All-inclusive trips with guaranteed 4★/5★ accommodations, guided excursions, and visa assistance.
                  </p>
                </div>

                <button
                  onClick={() => {
                    handleSearchPackages('', 'International');
                  }}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 hover:gap-3 transition-all cursor-pointer"
                >
                  <span>Explore All International Tours</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* International Packages Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {packages
                  .filter((p) => p.category !== 'Domestic' && p.country.toLowerCase() !== 'india')
                  .slice(0, 3)
                  .map((pkg) => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      onSelectPackage={setSelectedPackage}
                      onContactPackage={handleContactPackage}
                    />
                  ))}
              </div>
            </section>

            {/* Popular Visa Destinations Preview */}
            <section className="py-16 px-4 sm:px-8 bg-slate-100/70 border-y border-slate-200">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-2">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Embassy Authorized</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      Popular Visa Services with Expert Assistance
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      99.4% approval rate with end-to-end document verification and express processing options.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('visas')}
                    className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 hover:gap-3 transition-all"
                  >
                    <span>View All {visas.length} Visas</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {visas.slice(0, 3).map((v) => (
                    <div
                      key={v.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:border-emerald-200"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl p-1 bg-slate-50 rounded-lg">{v.flagEmoji}</span>
                            <div>
                              <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                                {v.country}
                              </h3>
                              <span className="text-[11px] text-slate-400 font-medium">{v.entryType}</span>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-slate-900 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                            {formatCurrency(v.totalFee)}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-slate-800 mb-1">
                          {v.visaType}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">
                          {v.description}
                        </p>

                        <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Processing:</span>
                            <span className="font-semibold">{v.processingTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Stay Duration:</span>
                            <span className="font-semibold">{v.stayDuration}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-slate-500 font-medium">All-Inclusive Govt + Service Fee</span>
                          <button
                            onClick={() => setSelectedVisa(v)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Checklist</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <a
                            href={getVisaWhatsAppUrl(v)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            title="Inquire about this visa on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-current shrink-0" />
                            <span>WhatsApp</span>
                          </a>
                          <button
                            onClick={() => setSelectedVisa(v)}
                            className="w-full py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <span>Enquire</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Why Choose Us & Service Advantages */}
            <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full mb-3">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>The {BUSINESS_INFO.name} Advantage</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Seamless Travel, Zero Friction
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2">
                  We bridge travelers with verified destinations and expedited visa assistance. 
                  Every itinerary and consultation is backed by dedicated personal attention.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                    <Compass className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    Prompt Travel Consultation
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Zero waiting periods. Detailed day-wise itinerary vouchers, real-time availability, and all-inclusive pricing quotes are sent directly via WhatsApp & Email.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    99.4% Visa Success Rate
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Prior to embassy submission, our authorized visa officers review your documents, photographs, 
                    and passports to eliminate common rejection errors.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                    <HeartHandshake className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    24/7 Dedicated Concierge
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Real-time flight updates, personalized sightseeing customizers, 
                    and verified documentation assistance with WhatsApp & Call support.
                  </p>
                </div>
              </div>
            </section>

            {/* Comprehensive SEO-Optimized Travel & Visa FAQ Section */}
            <TravelFAQ />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: PACKAGES */}
        {/* ========================================================= */}
        {activeTab === 'packages' && (
          <HolidayPackagesList
            packages={packages}
            onSelectPackage={(pkg) => setSelectedPackage(pkg)}
            onContactPackage={handleContactPackage}
            initialSearchQuery={packageSearchQuery}
            initialCategory={packageCategory}
          />
        )}

        {/* ========================================================= */}
        {/* TAB: CONTACT FORM PAGE */}
        {/* ========================================================= */}
        {activeTab === 'contact' && (
          <ContactFormPage
            preselectedPackage={contactPreselectedPackage}
            onClearPreselectedPackage={() => setContactPreselectedPackage(null)}
            onBackToPackages={() => setActiveTab('packages')}
            packages={packages}
            onInquirySubmitted={(inquiry) => {
              loadData();
              showToast(`Contact inquiry #${inquiry.id} submitted! Our team will contact you shortly.`);
            }}
          />
        )}

        {/* ========================================================= */}
        {/* TAB: VISAS */}
        {/* ========================================================= */}
        {activeTab === 'visas' && (
          <VisaServicesList
            visas={visas}
            onSelectVisa={(visa) => setSelectedVisa(visa)}
            onApplyVisa={(visa) => setSelectedVisa(visa)}
          />
        )}

        {/* ========================================================= */}
        {/* TAB: ADMIN PORTAL */}
        {/* ========================================================= */}
        {activeTab === 'admin' && (
          !adminUser ? (
            <AdminLoginGate
              onLoginSuccess={(user) => {
                setAdminUser(user);
                showToast(`Authenticated as ${user.name}`);
              }}
              onBackToSite={handleExitAdmin}
            />
          ) : (
            <AdminPortal
              packages={packages}
              visas={visas}
              bookings={bookings}
              applications={applications}
              sheetsConfig={sheetsConfig}
              onRefresh={loadData}
              currentUser={adminUser}
              onLogout={() => {
                adminAuthService.logout();
                setAdminUser(null);
                showToast('Admin logged out. Terminal locked.');
              }}
              onProfileUpdated={(user) => {
                setAdminUser(user);
                showToast('Admin profile saved successfully.');
              }}
              onExitToSite={handleExitAdmin}
            />
          )
        )}
      </main>

      {/* Detail & Booking Modal for Holiday Packages */}
      {selectedPackage && (
        <HolidayPackageDetailModal
          pkg={selectedPackage}
          onClose={() => setSelectedPackage(null)}
          onOpenFullContactPage={handleContactPackage}
          onBookingSuccess={(booking) => {
            loadData();
            showToast(`Inquiry #${booking.id} submitted! Our team will contact you shortly.`);
          }}
        />
      )}

      {/* Quick Package Inquiry Form Popup Modal */}
      {inquiryPackage && (
        <PackageInquiryModal
          pkg={inquiryPackage}
          onClose={() => setInquiryPackage(null)}
          onInquirySuccess={(booking) => {
            loadData();
            showToast(`Inquiry #${booking.id} submitted! Our team will contact you shortly.`);
          }}
        />
      )}

      {/* Enquiry Modal for Visa Services */}
      {selectedVisa && (
        <VisaApplicationModal
          visa={selectedVisa}
          onClose={() => setSelectedVisa(null)}
          onApplicationSuccess={(app) => {
            loadData();
            showToast(`Visa enquiry #${app.referenceNumber} submitted! Our specialist will call you shortly.`);
          }}
        />
      )}

      {/* Global Footer (shown on public site, hidden when staff is in admin portal) */}
      {activeTab !== 'admin' && <Footer setActiveTab={setActiveTab} />}

      {/* Floating Direct Call & WhatsApp Action for Mobile & Desktop (hidden in admin portal) */}
      {activeTab !== 'admin' && (
        <FloatingMobileContact onOpenContactPage={() => setActiveTab('contact')} />
      )}
    </div>
  );
}
