'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold text-center mb-4">
            🏪 Våra Företagspartners
          </h1>
          <p className="text-xl text-center text-purple-100">
            Upptäck företag som stödjer lokala föreningar
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Search & Filter */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Sök företag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedCategory === category
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'Alla' : category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Merchants */}
        {featuredMerchants.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              ⭐ Utvalda Partners
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredMerchants.map((merchant, index) => (
                <MerchantCard key={merchant.id} merchant={merchant} index={index} featured />
              ))}
            </div>
          </div>
        )}

        {/* All Merchants */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Alla Företag ({regularMerchants.length})
          </h2>
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Laddar företag...
            </div>
          ) : regularMerchants.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl text-gray-600">Inga företag hittades</p>
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
      className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition overflow-hidden ${
        featured ? 'border-2 border-purple-500' : ''
      }`}
    >
      {/* Logo */}
      <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-8">
        {merchant.logoUrl ? (
          <img
            src={merchant.logoUrl}
            alt={merchant.name}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-5xl font-bold">
            {merchant.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {featured && (
          <div className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold mb-3">
            ⭐ Utvald Partner
          </div>
        )}

        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {merchant.name}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-2">
          {merchant.description}
        </p>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-4">
          {merchant.categories.slice(0, 3).map((category) => (
            <span
              key={category}
              className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
            >
              {category}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {merchant.totalProducts}
            </div>
            <div className="text-xs text-gray-500">Produkter</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600">
              {merchant.totalSold.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Sålda</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(merchant.totalRevenue / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-gray-500">kr Totalt</div>
          </div>
        </div>

        {/* CTA */}
        <button className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition">
          Se Produkter →
        </button>
      </div>
    </motion.div>
  );
}
