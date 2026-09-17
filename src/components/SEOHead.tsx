import React, { useEffect } from 'react';
import { ActiveTabType, HolidayPackage, VisaService } from '../types';

interface SEOHeadProps {
  activeTab: ActiveTabType;
  selectedPackage?: HolidayPackage | null;
  selectedVisa?: VisaService | null;
  searchQuery?: string;
  categoryFilter?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  activeTab,
  selectedPackage,
  selectedVisa,
  searchQuery,
  categoryFilter,
}) => {
  useEffect(() => {
    let title = 'TripMyTour – Domestic Holidays, International Tour Packages & Fast-Track Visas';
    let description =
      'Curated domestic India holidays, international tour packages, and expedited tourist visa services with verified travel desk assistance.';
    let ogType = 'website';
    let ogImage =
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&h=630&q=80';

    if (selectedPackage) {
      title = `${selectedPackage.title} (${selectedPackage.duration}) | TripMyTour Holidays`;
      description = `Book ${selectedPackage.title} in ${selectedPackage.destination}, ${selectedPackage.country}. ${selectedPackage.inclusions.slice(0, 3).join(', ')}. Guaranteed best rates with verified hotel stays.`;
      ogType = 'article';
      ogImage = selectedPackage.imageUrl;
    } else if (selectedVisa) {
      title = `${selectedVisa.country} ${selectedVisa.visaType} Assistance | Fast-Track Visa Desk`;
      description = `Apply for ${selectedVisa.country} tourist visa online. Processing in ${selectedVisa.processingTime}. Full embassy document review and expert Indian traveler assistance.`;
      ogType = 'article';
    } else if (activeTab === 'packages') {
      if (categoryFilter === 'Domestic' || searchQuery?.toLowerCase().includes('india') || searchQuery?.toLowerCase().includes('kashmir') || searchQuery?.toLowerCase().includes('kerala')) {
        title = 'Domestic Holidays & Tour Packages in India | Kashmir, Kerala, Goa, Manali | TripMyTour';
        description = 'Explore handcrafted domestic holiday packages across India: Kashmir snow valleys, Kerala backwaters, Goa beaches, Himachal trails, Rajasthan palaces, and Andaman islands.';
      } else {
        title = 'Domestic & International Tour Packages | Handcrafted Holidays | TripMyTour';
        description = 'Explore curated domestic India getaways and international vacation packages with 4-star & 5-star resort stays, guided sightseeing, and flights.';
      }
    } else if (activeTab === 'visas') {
      title = 'Fast-Track Tourist Visa Services | UAE, Schengen, UK, USA, Singapore | TripMyTour';
      description = 'Expedited tourist and business visa assistance for Indian passport holders. 99.4% approval rate, paperless submission, and express 24-48h processing.';
    } else if (activeTab === 'contact') {
      title = 'Contact Travel Desk & Concierge | TripMyTour Support';
      description = 'Get in touch with TripMyTour holiday specialists via WhatsApp (+91 98803 71756), phone, or email for custom domestic itineraries and visa inquiries.';
    } else if (activeTab === 'admin') {
      title = 'Staff Portal & Sheet Sync Terminal | TripMyTour';
      description = 'TripMyTour internal operations and data synchronization console.';
    }

    // Update document title
    document.title = title;

    // Helper to set meta content
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const [key, val] = selector.replace('meta[', '').replace(']', '').split('=');
        el.setAttribute(key.trim(), val.replace(/"/g, '').trim());
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    // Update standard meta tags
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:type"]', 'content', ogType);
    setMeta('meta[property="og:image"]', 'content', ogImage);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', ogImage);

    // Update canonical link
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) {
      canonicalEl.setAttribute('href', window.location.href.split('?')[0]);
    }
  }, [activeTab, selectedPackage, selectedVisa, searchQuery, categoryFilter]);

  return null;
};
