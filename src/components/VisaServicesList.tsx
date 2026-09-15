import React, { useState, useMemo } from 'react';
import { 
  FileCheck, 
  Clock, 
  ShieldCheck, 
  Zap, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  Info,
  DollarSign,
  ArrowRight,
  MessageCircle,
  Send
} from 'lucide-react';
import { VisaService } from '../types';
import { formatCurrency, getVisaWhatsAppUrl } from '../utils/formatters';

interface VisaServicesListProps {
  visas: VisaService[];
  onSelectVisa: (visa: VisaService) => void;
  onApplyVisa: (visa: VisaService) => void;
  initialSearch?: string;
}

export const VisaServicesList: React.FC<VisaServicesListProps> = ({
  visas,
  onSelectVisa,
  onApplyVisa,
  initialSearch = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Tourist' | 'Business' | 'Express'>('All');

  const filteredVisas = useMemo(() => {
    return visas.filter((visa) => {
      const matchesSearch =
        searchQuery === '' ||
        visa.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        visa.visaType.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (categoryFilter === 'Express') {
        return visa.expressAvailable;
      }
      if (categoryFilter === 'Tourist' || categoryFilter === 'Business') {
        return visa.category === categoryFilter;
      }
      return true;
    });
  }, [visas, searchQuery, categoryFilter]);

  return (
    <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-2">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Fast-Track Embassy Authorized Visa Desk</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            International Visa Processing Services
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Get hassle-free tourist, business, and transit visas with 99.4% approval rate and verified documentation assistance.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search destination country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-56 sm:w-72"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
        {(['All', 'Tourist', 'Business', 'Express'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              categoryFilter === cat
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {cat === 'All' ? 'All Destinations' : cat === 'Express' ? '⚡ 24h-48h Express Visas' : `${cat} Visas`}
          </button>
        ))}
      </div>

      {/* Visa Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVisas.map((visa) => (
          <div
            key={visa.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:border-emerald-200"
          >
            <div>
              {/* Top country info */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl leading-none p-1 bg-slate-50 rounded-xl border border-slate-100">
                    {visa.flagEmoji}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-700 transition-colors">
                      {visa.country}
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      {visa.entryType}
                    </span>
                  </div>
                </div>

                {visa.expressAvailable && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>Express</span>
                  </span>
                )}
              </div>

              {/* Visa Type */}
              <div className="bg-slate-50 rounded-xl p-3 mb-4">
                <div className="text-xs font-bold text-slate-800 line-clamp-1">
                  {visa.visaType}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {visa.description}
                </div>
              </div>

              {/* Key Specs */}
              <div className="space-y-2 mb-4 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Processing Time:</span>
                  </span>
                  <span className="font-semibold text-slate-800">{visa.processingTime}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Visa Validity:</span>
                  </span>
                  <span className="font-semibold text-slate-800">{visa.validity}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Length of Stay:</span>
                  </span>
                  <span className="font-semibold text-slate-800">{visa.stayDuration}</span>
                </div>
              </div>

              {/* Document checklist preview */}
              <div className="mb-4 pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Required Documents ({visa.documentsRequired.length})
                </span>
                <ul className="space-y-1">
                  {visa.documentsRequired.slice(0, 2).map((doc, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom pricing and CTAs - Two-Tier Balanced Layout */}
            <div className="pt-4 border-t border-slate-100 mt-2">
              {/* Tier 1: Price and Checklist Link */}
              <div className="flex items-end justify-between gap-2 mb-3.5">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                    All-Inclusive Fee
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {formatCurrency(visa.totalFee)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Govt + Service Fee</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectVisa(visa)}
                  className="text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-50 py-1.5 px-2.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  <span>Checklist</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tier 2: Action Buttons - 50/50 Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={getVisaWhatsAppUrl(visa)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  title="Inquire about this visa on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 fill-current shrink-0" />
                  <span>WhatsApp</span>
                </a>

                <button
                  onClick={() => onApplyVisa(visa)}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-600/20 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enquire Now</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
