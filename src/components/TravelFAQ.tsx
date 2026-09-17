import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, MessageCircle } from 'lucide-react';
import { BUSINESS_INFO } from '../utils/formatters';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'What domestic holiday packages are available across India?',
    answer:
      'TripMyTour offers handcrafted domestic holiday packages across India, including Kashmir (Srinagar Dal Lake houseboats, Gulmarg gondola & Pahalgam valleys), Kerala (Munnar tea hills, Alleppey backwaters houseboat cruise), Goa (North & South Goa beachfront resorts, Mandovi river cruise), Himachal Pradesh (Shimla Mall Road, Kullu & Manali snow trails), Royal Rajasthan (Jaipur, Jodhpur & Udaipur palace tours), and Andaman Islands (Port Blair, Havelock Island & Radhanagar beach). All packages include verified 4★/5★ stays, private chauffeured AC vehicles, daily breakfast, and sightseeing.',
  },
  {
    question: 'How fast can I get a tourist visa processed through TripMyTour?',
    answer:
      'Processing times depend on the destination country. UAE / Dubai 30-Day and 60-Day e-Visas are typically processed in 24 to 48 hours with our Express service. Singapore eVisas take 2 to 3 working days. Schengen Area visas and UK visitor visas typically take 10 to 15 working days subject to embassy appointment slots. Our visa officers pre-screen all documents to maintain a 99.4% approval success rate.',
  },
  {
    question: 'Can I customize my domestic or international holiday itinerary?',
    answer:
      'Absolutely. Every package can be tailored to your group size, travel dates, preferred hotel class (4-Star, 5-Star, or private villas), flight origins, and dietary requirements (Jain, Pure Vegetarian, or special meals). Simply tap WhatsApp or Enquire on any package to receive a custom day-wise itinerary quotation.',
  },
  {
    question: 'What documents are required to apply for an international tourist visa?',
    answer:
      'For most e-visas (like Dubai, Singapore, Thailand), you only need a clear passport front & back scan with at least 6 months validity, a recent passport-size photograph with white background, and return flight tickets. For Schengen, UK, and US visas, additional documents such as 6-month bank statements, employment letters, ITR acknowledgement, and hotel vouchers are required. We assist you with complete document checklists and preparation.',
  },
  {
    question: 'Are domestic flights and airport transfers included in packages?',
    answer:
      'All our packages include seamless roundtrip airport or railway station pick-up and drop-off in private chauffeured vehicles. Flights can be bundled upon request with transparent live airline fares and preferred departure slots from your home city (Bengaluru, Mumbai, Delhi, Hyderabad, Chennai, etc.).',
  },
  {
    question: 'How do I book and what are the payment terms?',
    answer:
      'You can book online or via WhatsApp with a nominal booking advance. We accept UPI, Credit/Debit Cards, Net Banking, and direct bank transfers. Once confirmed, you receive an official booking confirmation voucher, day-wise travel pass, hotel vouchers, and 24/7 dedicated concierge contact details.',
  },
];

export const TravelFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Structured Data for Google Rich Results (Schema.org FAQPage)
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_DATA.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <section 
      aria-label="Frequently Asked Questions"
      className="py-16 px-4 sm:px-8 bg-slate-50 border-t border-slate-200"
    >
      {/* Inject FAQ Schema for Rich Search Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-3 border border-blue-100">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Travel & Visa FAQ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Travel & Visa Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto">
            Everything you need to know about booking domestic India holidays, international tour packages, and expedited tourist visa processing.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_DATA.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.question}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left py-4 px-5 sm:px-6 flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base hover:text-blue-600 transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="leading-snug">{item.question}</span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen ? 'bg-blue-50 text-blue-600 rotate-180' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Contact Prompt */}
        <div className="mt-8 p-4 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <div className="text-xs sm:text-sm font-bold text-blue-900">
              Have a specific domestic holiday or visa question?
            </div>
            <div className="text-[11px] sm:text-xs text-blue-700">
              Our travel specialists respond within minutes on WhatsApp.
            </div>
          </div>
          <a
            href={`https://wa.me/${BUSINESS_INFO.phoneRaw}?text=${encodeURIComponent('Hello TripMyTour! I have a question regarding domestic holiday packages and visa services.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all shrink-0"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  );
};
