'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SearchIcon, UserIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface Product {
  id: string;
  name: string;
  title: string;
  price: number;
}

interface Community {
  id: string;
  name: string;
  location: string;
}

interface ProductPreference {
  id: string;
  product_id: string;
  preferred_community_id: string;
  reason: string;
  created_at: string;
  products: Product;
  preferred_community: Community;
}

export default function ProductPreferences() {
  const [preferences, setPreferences] = useState<ProductPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await apiFetch('/api/user/product-preferences');
      const data = await response.json();
      setPreferences(data.preferences || []);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPreferences = preferences.filter(pref =>
    pref.products.title.toLowerCase().includes(search.toLowerCase()) ||
    pref.preferred_community?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-blue-100">
              <UserIcon size={32} className="icon-brand" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Mina preferenser</h1>
              <p className="text-gray-600">Välj vilken förening som tjänar på dina köp</p>
            </div>
          </div>
        </motion.div>

        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-blue-100 border-2 border-blue-200 rounded-2xl p-6 mb-8"
        >
          <p className="text-blue-900">
            <strong>Hur det fungerar:</strong> När du köper en produkt kan du välja vilken förening, klass eller klubb som ska tjäna på försäljningen. 
            Välj en närliggande förening eller en som du vill stödja extra.
          </p>
        </motion.div>

        {/* Stats summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <UserIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Totalt preferenser</h3>
            </div>
            <p className="text-4xl font-bold text-blue-700">{preferences.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <UserIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Föreningar stödda</h3>
            </div>
            <p className="text-4xl font-bold text-blue-700">
              {new Set(preferences.map(p => p.preferred_community_id)).size}
            </p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sök preferenser</label>
              <div className="relative">
                <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 icon-brand" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Produkt eller förening..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Preferences list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-2xl shadow-lg">
              <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0ea5e9', borderTopColor: 'transparent' }} />
            </div>
          ) : filteredPreferences.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg text-gray-500">
              <UserIcon size={64} className="mx-auto mb-4 text-gray-300 icon-brand" />
              <p className="text-lg">Inga preferenser hittades</p>
              <p className="text-sm mt-2">Du kan lägga till preferenser när du köper produkter</p>
            </div>
          ) : (
            filteredPreferences.map((pref, index) => (
              <motion.div
                key={pref.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{pref.products.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{pref.products.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-700">{pref.products.price} kr</p>
                  </div>
                </div>

                {/* Preferred community */}
                <div className="bg-blue-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-500 block">Föredragen förening</span>
                      <span className="font-semibold text-gray-900 text-lg">{pref.preferred_community?.name || 'Ingen vald'}</span>
                      {pref.preferred_community?.location && (
                        <span className="text-sm text-gray-600 block">{pref.preferred_community.location}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-primary-900">#1</span>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                {pref.reason && (
                  <div className="mb-4 pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-500 block">Anledning</span>
                    <p className="text-gray-700">{pref.reason}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-200">
                  <span>Skapad {new Date(pref.created_at).toLocaleDateString('sv-SE')}</span>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
