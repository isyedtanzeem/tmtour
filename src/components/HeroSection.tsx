import React, { useState } from 'react';
import { 
  Compass, 
  FileCheck, 
  Search, 
  Calendar, 
  MapPin, 
  DollarSign, 
  ShieldCheck, 
  Clock, 
  Users, 
  ArrowRight,
  Sparkles,
  PlaneTakeoff
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
  const [heroTab, setHeroTab] = useState<'packages' | 'visas'>('packages');
  
  // Packages search state
  const [packageDestination, setPackageDestination] = useState('');
  const [packageCategory, setPackageCategory] = useState('All');

  // Visa search state
  const [selectedVisaCountry, setSelectedVisaCountry] = useState(visas[0]?.id || '');

  const handlePackageSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchPackages(packageDestination, packageCategory);
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
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white">
      {/* Background imagery with subtle dark overlay */}
      <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay">
        <img
          src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=80"
          alt="World Travel & Destinations"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-14 sm:pt-14 sm:pb-20 md:pt-18 md:pb-24">
        {/* Top Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[11px] sm:text-xs font-semibold backdrop-blur-md mb-3 sm:mb-5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Verified Tour Packages & Fast-Track Visa Processing</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-3xl leading-tight mb-2.5 sm:mb-4">
          Explore The World With Confirmed{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-teal-300">
            Visas & Curated Holidays
          </span>
        </h1>
        
        <p className="text-slate-300 text-xs sm:text-base max-w-2xl font-normal leading-relaxed mb-5 sm:mb-7">
          Seamless international tour packages and fast-track tourist visa assistance. 
          Handcrafted holiday packages and expedited tourist visa processing directly from verified specialists.
        </p>

        {/* Interactive Search Console Widget */}
        <div className="bg-white text-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xl border border-slate-100 max-w-4xl backdrop-blur-sm">
          {/* Mobile-Aligned Segmented Tab Control */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl sm:rounded-2xl mb-3.5 sm:mb-5 gap-1">
            <button
              type="button"
              onClick={() => setHeroTab('packages')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                heroTab === 'packages'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Compass className="w-4 h-4 shrink-0 text-blue-600" />
              <span className="sm:hidden">Tour Packages</span>
              <span className="hidden sm:inline">Holiday Tour Packages</span>
            </button>

            <button
              type="button"
              onClick={() => setHeroTab('visas')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2 sm:px-4 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                heroTab === 'visas'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FileCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="sm:hidden">Visa Services</span>
              <span className="hidden sm:inline">Tourist & Business Visas</span>
            </button>
          </div>

          {/* Tab 1: Holiday Packages Search */}
          {heroTab === 'packages' && (
            <form onSubmit={handlePackageSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-3.5 items-end">
              <div className="sm:col-span-5">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Where do you want to travel?
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g., Bali, Dubai, Switzerland..."
                    value={packageDestination}
                    onChange={(e) => setPackageDestination(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 sm:py-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Trip Theme / Category
                </label>
                <select
                  value={packageCategory}
                  onChange={(e) => setPackageCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 sm:py-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer font-medium"
                >
                  <option value="All">All Holiday Categories</option>
                  <option value="Domestic">Domestic India Escapes</option>
                  <option value="International">International Getaways</option>
                  <option value="Honeymoon">Honeymoon Specials</option>
                  <option value="Luxury">Luxury & Overwater Villas</option>
                  <option value="Budget">Budget Value Tours</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Tours</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Visa Search */}
          {heroTab === 'visas' && (
            <form onSubmit={handleVisaSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-3.5 items-end">
              <div className="sm:col-span-8">
                <label className="block text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select Destination Country for Visa
                </label>
                <select
                  value={selectedVisaCountry}
                  onChange={(e) => setSelectedVisaCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 sm:py-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer font-medium"
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
                  <span>Explore Visas & Enquire</span>
                </button>
              </div>
            </form>
          )}

          {/* Quick popular chips */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-500">
            <span className="font-bold text-slate-700 text-[11px] sm:text-xs">Trending:</span>
            {['Dubai', 'Bali', 'Kashmir', 'Kerala', 'Schengen (Europe)', 'Thailand', 'Maldives'].map((dest) => (
              <button
                key={dest}
                type="button"
                onClick={() => {
                  setPackageDestination(dest);
                  onSearchPackages(dest, 'All');
                  setActiveTab('packages');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-[11px] sm:text-xs font-medium transition-colors cursor-pointer active:scale-95"
              >
                {dest}
              </button>
            ))}
          </div>
        </div>

        {/* Value Highlights */}
        <div className="mt-8 sm:mt-12 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-6 pt-5 sm:pt-6 border-t border-slate-800/80">
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
              <div className="text-[10px] sm:text-xs text-slate-400">Dedicated Concierge</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
