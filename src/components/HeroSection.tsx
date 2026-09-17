import React, { useState } from 'react';
import { 
  Compass, 
  FileCheck, 
  Search, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Users, 
  ArrowRight,
  Sparkles,
  PlaneTakeoff,
  Palmtree,
  Mountain,
  Globe2,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { VisaService, ActiveTabType } from '../types';
import { formatCurrency } from '../utils/formatters';

interface HeroSectionProps {
  onSearchPackages: (destination: string, category: string) => void;
  onSelectVisa: (visaId: string) => void;
  visas: VisaService[];
  setActiveTab: (tab: ActiveTabType) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSearchPackages,
  onSelectVisa,
  visas,
  setActiveTab,
}) => {
  const [heroTab, setHeroTab] = useState<'domestic' | 'international' | 'visas'>('domestic');
  
  // Domestic search state
  const [domesticDestination, setDomesticDestination] = useState('');
  const [domesticCategory, setDomesticCategory] = useState('All');

  // International search state
  const [intlDestination, setIntlDestination] = useState('');
  const [intlCategory, setIntlCategory] = useState('All');

  // Visa search state
  const [selectedVisaCountry, setSelectedVisaCountry] = useState(visas[0]?.id || '');

  const handleDomesticSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchPackages(domesticDestination, 'Domestic');
    setActiveTab('packages');
  };

  const handleIntlSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchPackages(intlDestination, intlCategory === 'All' ? 'International' : intlCategory);
    setActiveTab('packages');
  };

  const handleVisaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVisaCountry) {
      onSelectVisa(selectedVisaCountry);
      setActiveTab('visas');
    }
  };

  return (
    <section 
      aria-label="TripMyTour Hero & Vacation Search"
      className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white"
    >
      {/* Background imagery with subtle dark overlay */}
      <div className="absolute inset-0 z-0 opacity-25 mix-blend-overlay">
        <img
          src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=80"
          alt="Domestic India and international vacation travel destinations"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          loading="eager"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-14 sm:pt-14 sm:pb-20 md:pt-16 md:pb-22">
        {/* Top Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[11px] sm:text-xs font-semibold backdrop-blur-md mb-3 sm:mb-4">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>🇮🇳 Domestic Holidays • ✈️ International Tours • 🛂 Fast-Track Visas</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-4xl leading-tight mb-2.5 sm:mb-4">
          Explore Incredible India & The World With{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-teal-300">
            Curated Holidays & Confirmed Visas
          </span>
        </h1>
        
        <p className="text-slate-300 text-xs sm:text-base max-w-3xl font-normal leading-relaxed mb-6 sm:mb-8">
          Discover breathtaking domestic India holidays from Kashmir to Kerala, handcrafted international tours, and expedited tourist visa assistance directly from verified travel specialists.
        </p>

        {/* Interactive Search Console Widget */}
        <div className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xl border border-slate-100 max-w-4xl backdrop-blur-sm">
          {/* 3 Segmented Tabs: Domestic Holidays | International Tours | Visa Services */}
          <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl sm:rounded-2xl mb-3.5 sm:mb-5 gap-1">
            <button
              type="button"
              onClick={() => setHeroTab('domestic')}
              className={`flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1 sm:px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                heroTab === 'domestic'
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Palmtree className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-orange-600" />
              <span className="truncate">Domestic Holidays</span>
            </button>

            <button
              type="button"
              onClick={() => setHeroTab('international')}
              className={`flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1 sm:px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                heroTab === 'international'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-blue-600" />
              <span className="truncate">International Tours</span>
            </button>

            <button
              type="button"
              onClick={() => setHeroTab('visas')}
              className={`flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1 sm:px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                heroTab === 'visas'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-emerald-600" />
              <span className="truncate">Visa Services</span>
            </button>
          </div>

          {/* Tab 1: Domestic Holidays Search */}
          {heroTab === 'domestic' && (
            <form onSubmit={handleDomesticSearchSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-3.5 items-end">
                <div className="sm:col-span-5">
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Where in India do you want to travel?
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-orange-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g., Kashmir, Kerala, Goa, Manali, Rajasthan..."
                      value={domesticDestination}
                      onChange={(e) => setDomesticDestination(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Domestic Holiday Theme
                  </label>
                  <select
                    value={domesticCategory}
                    onChange={(e) => setDomesticCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 sm:py-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all cursor-pointer font-medium"
                  >
                    <option value="All">All Domestic India Escapes</option>
                    <option value="Hill Stations">Hill Stations & Snow (Kashmir, Himachal)</option>
                    <option value="Beach & Coastal">Beach & Coastal (Goa, Andaman, Kerala)</option>
                    <option value="Royal Heritage">Royal Heritage (Rajasthan Palaces)</option>
                    <option value="Honeymoon">Honeymoon & Romantic Retreats</option>
                    <option value="Houseboat & Nature">Houseboat Cruises & Wildlife</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-sm shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search Domestic</span>
                  </button>
                </div>
              </div>

              {/* Trending Domestic Destination Chips */}
              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-500">
                <span className="font-bold text-slate-700 text-[11px] sm:text-xs">Top Domestic:</span>
                {['Kashmir', 'Kerala', 'Goa', 'Manali (Himachal)', 'Rajasthan (Udaipur)', 'Andaman', 'Ladakh'].map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => {
                      setDomesticDestination(dest.split(' ')[0]);
                      onSearchPackages(dest.split(' ')[0], 'Domestic');
                      setActiveTab('packages');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-orange-50/80 hover:bg-orange-100 text-orange-900 text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer active:scale-95 border border-orange-100"
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </form>
          )}

          {/* Tab 2: International Tours Search */}
          {heroTab === 'international' && (
            <form onSubmit={handleIntlSearchSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-3.5 items-end">
                <div className="sm:col-span-5">
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Where do you want to travel globally?
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-blue-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g., Bali, Dubai, Switzerland, Thailand, Maldives..."
                      value={intlDestination}
                      onChange={(e) => setIntlDestination(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    International Theme
                  </label>
                  <select
                    value={intlCategory}
                    onChange={(e) => setIntlCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 sm:py-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer font-medium"
                  >
                    <option value="All">All International Holidays</option>
                    <option value="Honeymoon">Honeymoon Specials</option>
                    <option value="Luxury">Luxury & Overwater Villas</option>
                    <option value="Budget">Budget Value Tours</option>
                    <option value="International">Popular World Getaways</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search International</span>
                  </button>
                </div>
              </div>

              {/* Trending International Chips */}
              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-500">
                <span className="font-bold text-slate-700 text-[11px] sm:text-xs">Trending Global:</span>
                {['Dubai', 'Bali', 'Thailand', 'Maldives', 'Schengen (Europe)', 'Singapore', 'Vietnam'].map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => {
                      setIntlDestination(dest);
                      onSearchPackages(dest, 'All');
                      setActiveTab('packages');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-50/80 hover:bg-blue-100 text-blue-900 text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer active:scale-95 border border-blue-100"
                  >
                    {dest}
                  </button>
                ))}
              </div>
            </form>
          )}

          {/* Tab 3: Visa Search */}
          {heroTab === 'visas' && (
            <form onSubmit={handleVisaSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-3.5 items-end">
                <div className="sm:col-span-8">
                  <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Select Destination Country for Visa
                  </label>
                  <select
                    value={selectedVisaCountry}
                    onChange={(e) => setSelectedVisaCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 sm:py-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer font-medium"
                  >
                    {visas.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.flagEmoji} {v.country} — {v.visaType} (from {formatCurrency(v.totalFee)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <button
                    type="submit"
                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Check Requirements & Apply</span>
                  </button>
                </div>
              </div>

              {/* Popular Visa Chips */}
              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-500">
                <span className="font-bold text-slate-700 text-[11px] sm:text-xs">Quick Visas:</span>
                {visas.slice(0, 5).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedVisaCountry(v.id);
                      onSelectVisa(v.id);
                      setActiveTab('visas');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer active:scale-95 border border-emerald-100 flex items-center gap-1"
                  >
                    <span>{v.flagEmoji}</span>
                    <span>{v.country}</span>
                  </button>
                ))}
              </div>
            </form>
          )}
        </div>

        {/* Value Highlights */}
        <div className="mt-8 sm:mt-10 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-6 pt-5 sm:pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-0 rounded-xl bg-slate-800/30 sm:bg-transparent">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-400 shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-white leading-tight">99.4%</div>
              <div className="text-[10px] sm:text-xs text-slate-400">Visa Success Rate</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-0 rounded-xl bg-slate-800/30 sm:bg-transparent">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-white leading-tight">24-48h</div>
              <div className="text-[10px] sm:text-xs text-slate-400">Express Processing</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-0 rounded-xl bg-slate-800/30 sm:bg-transparent">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 border border-purple-400/20 flex items-center justify-center text-purple-400 shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-white leading-tight">150,000+</div>
              <div className="text-[10px] sm:text-xs text-slate-400">Happy Travelers</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-0 rounded-xl bg-slate-800/30 sm:bg-transparent">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
              <PlaneTakeoff className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-white leading-tight">24/7 Support</div>
              <div className="text-[10px] sm:text-xs text-slate-400">Dedicated Travel Desk</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
