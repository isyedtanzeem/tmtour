import React from 'react';
import { MessageCircle } from 'lucide-react';
import { BUSINESS_INFO, getGeneralWhatsAppUrl } from '../utils/formatters';

interface FloatingMobileContactProps {
  onOpenContactPage?: () => void;
}

export const FloatingMobileContact: React.FC<FloatingMobileContactProps> = () => {
  return (
    <aside 
      id="floating-whatsapp-container"
      aria-label="WhatsApp live support"
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40"
    >
      <a
        id="floating-whatsapp-btn"
        href={getGeneralWhatsAppUrl()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp with TripMyTour travel specialist"
        title="Chat on WhatsApp (Live Support)"
        className="group relative flex items-center justify-center w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white shadow-lg shadow-emerald-950/20 hover:shadow-xl hover:shadow-emerald-600/30 transition-all duration-200 cursor-pointer"
      >
        {/* Animated Live Online Indicator */}
        <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-300 border-2 border-white shadow-xs" />
        </span>

        {/* WhatsApp Icon */}
        <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 fill-current text-white transition-transform group-hover:scale-110" />

        {/* Desktop Hover Tooltip */}
        <span className="hidden sm:flex absolute right-full mr-3 top-1/2 -translate-y-1/2 items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-150">
          <span>Chat on WhatsApp</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
        </span>
      </a>
    </aside>
  );
};

