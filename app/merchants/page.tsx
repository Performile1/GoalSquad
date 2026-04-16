'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MerchantIcon, SearchIcon, TrophyIcon } from '@/app/components/BrandIcons';

interface Merchant {
  id: string;
  name: string;
  logoUrl?: string;
  description: string;
  totalProducts: number;
  totalSold: number;
  totalRevenue: number;
  categories: string[];
  featured: boolean;
}

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const response = await fetch('/api/merchants/showcase');
      const data = await response.json();
      setMerchants(data.merchants || []);
    } catch (error) {
      console.error('Failed to fetch merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'all',
    ...Array.from(new Set(merchants.flatMap((m) => m.categories))),
  ];

  const filteredMerchants = merchants.filter((merchant) => {
    const matchesSearch = merchant.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || merchant.categories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const featuredMerchants = filteredMerchants.filter((m) => m.featured);
  const regularMerchants = filteredMerchants.filter((m) => !m.featured);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <MerchantIcon size={56} className="opacity-90" />
          </div>
          <h1 className="text-5xl font-bold mb-3">Våra Företagspartners</h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto">
            Upptäck företag som stödjer lokala föreningar och klasser
          </p>
          <div className="mt-8">
            <Link
              href="/merchants/onboard"
              className="inline-block px-6 py-3 bg-white text-primary-900 rounded-xl font-bold hover:bg-primary-50 transition text-sm shadow-lg"
            >
              Bli leverantör →
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Search & Filter */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            {/* Search */}
            <div className="mb-5">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <SearchIcon size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Sök företag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none text-base"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition border-2 ${
                    selectedCategory === category
                      ? 'bg-primary-900 text-white border-primary-900'
                      : 'bg-white text-primary-900 border-primary-200 hover:bg-primary-50'
                  }`}
                >
                  {category === 'all' ? 'Alla kategorier' : category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Merchants */}
        {featuredMerchants.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <TrophyIcon size={28} />
              <h2 className="text-2xl font-bold text-primary-900">Utvalda Partners</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredMerchants.map((merchant, index) => (
                <MerchantCard key={merchant.id} merchant={merchant} index={index} featured />
              ))}
            </div>
          </div>
        )}

        {/* All Merchants */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary-900">
              Alla Företag
              <span className="ml-2 text-base font-normal text-gray-400">
                ({regularMerchants.length})
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-4 animate-bounce">
                <MerchantIcon size={56} />
              </div>
              <p className="text-lg text-primary-900 font-semibold">Laddar företag...</p>
            </div>
          ) : regularMerchants.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="flex justify-center mb-4">
                <SearchIcon size={48} />
              </div>
              <p className="text-xl font-bold text-primary-900 mb-2">Inga företag hittades</p>
              <p className="text-gray-500">Prova ett annat sökord eller kategori</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularMerchants.map((merchant, index) => (
                <MerchantCard key={merchant.id} merchant={merchant} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MerchantCard({
  merchant,
  index,
  featured = false,
}: {
  merchant: Merchant;
  index: number;
  featured?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-2xl overflow-hidden transition hover:shadow-xl ${
        featured
          ? 'border-2 border-primary-900 shadow-lg'
          : 'border border-gray-100 shadow-md'
      }`}
    >
      {/* Logo area */}
      <div className="h-44 bg-primary-50 flex items-center justify-center p-8">
        {merchant.logoUrl ? (
          <img
            src={merchant.logoUrl}
            alt={merchant.name}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-primary-900 flex items-center justify-center text-white text-4xl font-extrabold">
            {merchant.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {featured && (
          <div className="inline-flex items-center gap-1.5 bg-primary-900 text-white px-3 py-1 rounded-full text-xs font-bold mb-3">
            <TrophyIcon size={14} />
            Utvald Partner
          </div>
        )}

        <h3 className="text-xl font-bold text-primary-900 mb-1.5">
          {merchant.name}
        </h3>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
          {merchant.description}
        </p>

        {/* Categories */}
        {merchant.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {merchant.categories.slice(0, 3).map((category) => (
              <span
                key={category}
                className="bg-primary-50 text-primary-900 border border-primary-100 px-3 py-1 rounded-full text-xs font-semibold"
              >
                {category}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 py-4 border-t border-primary-50 mb-4">
          <div className="text-center">
            <div className="text-xl font-bold text-primary-900">
              {merchant.totalProducts}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Produkter</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-primary-900">
              {merchant.totalSold.toLocaleString()}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Sålda</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-primary-900">
              {(merchant.totalRevenue / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-gray-400 mt-0.5">kr Totalt</div>
          </div>
        </div>

        {/* CTA */}
        <button className="w-full bg-primary-900 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition text-sm">
          Se Produkter →
        </button>
      </div>
    </motion.div>
  );
}
