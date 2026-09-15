import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  Tag, 
  ArrowRight, 
  Filter, 
  Search,
  Sparkles
} from 'lucide-react';
import { HolidayPackage } from '../types';
import { PackageCard } from './PackageCard';

interface HolidayPackagesListProps {
  packages: HolidayPackage[];
  onSelectPackage: (pkg: HolidayPackage) => void;
  onContactPackage: (pkg: HolidayPackage) => void;
  onBookPackage?: (pkg: HolidayPackage) => void;
  initialSearchQuery?: string;
  initialCategory?: string;
}

export const HolidayPackagesList: React.FC<HolidayPackagesListProps> = ({
  packages,
  onSelectPackage,
  onContactPackage,
  onBookPackage,
  initialSearchQuery = '',
  initialCategory = 'All',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating' | 'duration'>('featured');

  const categories = ['All', 'Domestic', 'International', 'Honeymoon', 'Luxury', 'Budget'];

  const filteredPackages = useMemo(() => {
    let result = packages.filter((pkg) => {
      const matchesSearch =
        searchQuery === '' ||
        pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.country.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' || pkg.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'duration') {
      result.sort((a, b) => b.days - a.days);
    } else {
      // featured
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, [packages, searchQuery, selectedCategory, sortBy]);

  return (
    <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Curated International & Domestic Escapes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Handcrafted Holiday Packages
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Complete vacation packages with verified 4★ & 5★ luxury stays, guided excursions, transfers, and daily dining.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search destination or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52 sm:w-64"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="py-2 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="featured">Sort: Featured First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rated (★)</option>
            <option value="duration">Trip Duration</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {cat === 'All' ? 'All Packages' : cat}
          </button>
        ))}
        <span className="text-xs text-slate-400 ml-auto hidden sm:inline-block">
          Showing {filteredPackages.length} package{filteredPackages.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Packages Grid */}
      {filteredPackages.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No holiday packages matched your criteria</h3>
          <p className="text-sm text-slate-400 mt-1 mb-4">Try clearing your search query or selecting a different category.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onSelectPackage={onSelectPackage}
              onContactPackage={(p) => (onContactPackage || onBookPackage!)(p)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
