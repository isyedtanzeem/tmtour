import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  FileCheck, 
  Database, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Sparkles,
  PlaneTakeoff,
  MessageSquare
} from 'lucide-react';
import { ActiveTabType } from '../types';
import { BUSINESS_INFO } from '../utils/formatters';

interface FooterProps {
  setActiveTab: (tab: ActiveTabType) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    return localStorage.getItem('custom_logo_data') || '/logo.png';
  });

  useEffect(() => {
    const handleLogoUpdate = () => {
      setLogoUrl(localStorage.getItem('custom_logo_data') || `/logo.png?v=${Date.now()}`);
    };
    window.addEventListener('logo-updated', handleLogoUpdate);
    return () => window.removeEventListener('logo-updated', handleLogoUpdate);
  }, []);

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
        {/* Brand Col */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setActiveTab('home')}>
            <div className="bg-white p-2 rounded-xl shadow-md inline-flex items-center justify-center group-hover:bg-slate-50 transition-colors">
              <img
                src={logoUrl}
                alt="TripMyTour Logo"
                className="h-8 sm:h-9 w-auto max-w-[190px] object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="hidden w-8 h-8 bg-blue-600 rounded-lg items-center justify-center text-white">
                <PlaneTakeoff className="w-4 h-4" />
              </div>
            </div>
          </div>

          <p className="text-slate-400 leading-relaxed max-w-sm">
            Curated domestic & international holiday tours, premium visa documentation for Indian travelers, and dedicated 24/7 travel concierge assistance.
          </p>

          <div className="space-y-2.5 pt-2 text-slate-300">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-xs leading-snug">
                {BUSINESS_INFO.address}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <a href={`tel:${BUSINESS_INFO.phone}`} className="text-xs text-white hover:underline font-semibold">
                {BUSINESS_INFO.phone} / {BUSINESS_INFO.phoneInternational}
              </a>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-slate-400">
                {BUSINESS_INFO.operatingHours}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300 font-medium text-xs">
              Booking Desk: 24/7 Active & Verified
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-4">
            Holiday Escapes
          </h4>
          <ul className="space-y-2.5">
            <li>
              <button onClick={() => setActiveTab('packages')} className="hover:text-white transition-colors">
                Kashmir & Himachal
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('packages')} className="hover:text-white transition-colors">
                Kerala Backwaters
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('packages')} className="hover:text-white transition-colors">
                Bali & Thailand Vacations
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('packages')} className="hover:text-white transition-colors">
                Dubai & Abu Dhabi
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('packages')} className="hover:text-white transition-colors">
                Swiss & Paris Romance
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('contact')} className="hover:text-white transition-colors text-blue-400 font-medium">
                Contact Travel Specialist →
              </button>
            </li>
          </ul>
        </div>

        {/* Visas */}
        <div>
          <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-4">
            Visa Services (India)
          </h4>
          <ul className="space-y-2.5">
            <li>
              <button onClick={() => setActiveTab('visas')} className="hover:text-white transition-colors">
                Dubai 30-Day Tourist Visa
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('visas')} className="hover:text-white transition-colors">
                Schengen Visa (Europe)
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('visas')} className="hover:text-white transition-colors">
                Singapore e-Visa
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('visas')} className="hover:text-white transition-colors">
                Thailand Visa Assistance
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('visas')} className="hover:text-white transition-colors">
                USA B1/B2 Slot Booking
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('visas')} className="hover:text-white transition-colors text-blue-400 font-medium">
                All Visa Services →
              </button>
            </li>
          </ul>
        </div>

        {/* Connect & Admin */}
        <div>
          <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-4">
            Connect & Admin
          </h4>
          <ul className="space-y-2.5">
            <li>
              <a 
                href={`https://wa.me/${BUSINESS_INFO.phoneRaw}?text=${encodeURIComponent('Hello TripMyTour, I would like to inquire about tour packages and visa services.')}`}
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp</span>
              </a>
            </li>
            <li>
              <a href={`tel:${BUSINESS_INFO.phone}`} className="hover:text-white transition-colors">
                Call: {BUSINESS_INFO.phone}
              </a>
            </li>
            <li>
              <button onClick={() => setActiveTab('contact')} className="hover:text-white transition-colors">
                BTM Layout Office
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('admin')} className="hover:text-white transition-colors text-blue-400 font-semibold">
                Admin Console
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('admin')} className="hover:text-white transition-colors">
                Travel Desk Portal
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
        <div>
          © {new Date().getFullYear()} {BUSINESS_INFO.name} Travel & Visa Services. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <span>Verified Travel & Visa Concierge</span>
          <span>•</span>
          <span>Bengaluru, Karnataka 560076</span>
          <span>•</span>
          <button onClick={() => setActiveTab('admin')} className="text-blue-400 hover:underline">
            Admin Login
          </button>
        </div>
      </div>
    </footer>
  );
};
