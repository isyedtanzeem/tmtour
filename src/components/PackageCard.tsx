import React from 'react';
import { 
  Clock, 
  MapPin, 
  Star, 
  Check, 
  ChevronRight, 
  Mail, 
  MessageCircle,
  Eye
} from 'lucide-react';
import { HolidayPackage } from '../types';
import { formatCurrency, getPackageWhatsAppUrl } from '../utils/formatters';

interface PackageCardProps {
  pkg: HolidayPackage;
  onSelectPackage: (pkg: HolidayPackage) => void;
  onContactPackage: (pkg: HolidayPackage) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  onSelectPackage,
  onContactPackage,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col group h-full">
      {/* Top Image Banner */}
      <div 
        className="relative h-56 overflow-hidden bg-slate-100 cursor-pointer"
        onClick={() => onSelectPackage(pkg)}
      >
        <img
          src={pkg.imageUrl}
          alt={pkg.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Gradient shade overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20 pointer-events-none" />

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/95 text-slate-800 shadow-sm backdrop-blur-md">
            {pkg.category}
          </span>
          {pkg.discountPercent > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-sm tracking-wide">
              {pkg.discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Quick View Button on Image */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectPackage(pkg);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer z-10"
          title="Quick preview package"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Bottom Metadata Badges on Image */}
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
          {/* Duration Badge */}
          <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-white backdrop-blur-md flex items-center gap-1.5 shadow-sm border border-white/10">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{pkg.duration}</span>
          </div>

          {/* Rating Badge */}
          <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-white backdrop-blur-md flex items-center gap-1 shadow-sm border border-white/10">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-white">{pkg.rating.toFixed(1)}</span>
            <span className="text-slate-300 text-[11px] font-normal">({pkg.reviewCount})</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Destination */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 mb-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{pkg.destination}, {pkg.country}</span>
          </div>

          {/* Title */}
          <h3 
            onClick={() => onSelectPackage(pkg)}
            className="text-base sm:text-lg font-bold text-slate-900 leading-snug hover:text-blue-600 cursor-pointer transition-colors line-clamp-2 mb-3.5 min-h-[3rem]"
            title={pkg.title}
          >
            {pkg.title}
          </h3>

          {/* Key Inclusions snippet */}
          <div className="space-y-1.5 mb-4">
            {pkg.inclusions.slice(0, 3).map((inc, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{inc}</span>
              </div>
            ))}
            {pkg.inclusions.length > 3 && (
              <button
                onClick={() => onSelectPackage(pkg)}
                className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1 pt-0.5 cursor-pointer"
              >
                <span>+{pkg.inclusions.length - 3} more inclusions & daily schedule</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Pricing and CTAs - Clean, Two-Tier Balanced Layout */}
        <div className="pt-4 border-t border-slate-100 mt-2">
          {/* Tier 1: Price and Details Link */}
          <div className="flex items-end justify-between gap-2 mb-3.5">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                Starting from
              </span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {formatCurrency(pkg.price)}
                </span>
                {pkg.originalPrice > pkg.price && (
                  <span className="text-xs text-slate-400 line-through font-medium">
                    {formatCurrency(pkg.originalPrice)}
                  </span>
                )}
                <span className="text-xs text-slate-500 font-medium">/ person</span>
              </div>
            </div>

            <button
              onClick={() => onSelectPackage(pkg)}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 py-1.5 px-2.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              title="View full day-by-day itinerary"
            >
              <span>Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tier 2: Action Buttons - 50/50 Grid with Perfect Alignment */}
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={getPackageWhatsAppUrl(pkg)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              title="Inquire directly on WhatsApp with pre-filled package request"
            >
              <MessageCircle className="w-4 h-4 fill-current shrink-0" />
              <span>WhatsApp</span>
            </a>

            <button
              id={`package-inquire-btn-${pkg.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onContactPackage(pkg);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-600/20 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              title="Open inquiry popup form"
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span>Inquire</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
