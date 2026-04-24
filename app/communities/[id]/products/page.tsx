'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { SearchIcon, MoneyIcon, TrophyIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface Product {
  id: string;
  name: string;
  title: string;
  description: string;
  price: number;
  image_urls: string[];
}

interface Merchant {
  id: string;
  business_name: string;
  company_description: string;
}

interface CommunityProduct {
  id: string;
  product_id: string;
  merchant_id: string;
  status: string;
  commission_percent: number;
  is_featured: boolean;
  priority: number;
  notes: string;
  products: Product;
  merchants: Merchant;
}

export default function CommunityProducts() {
  const params = useParams();
  const communityId = params.id as string;
  
  const [products, setProducts] = useState<CommunityProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, [communityId]);

  const fetchProducts = async () => {
    try {
      const response = await apiFetch(`/api/communities/${communityId}/products`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(cp =>
    cp.products.title.toLowerCase().includes(search.toLowerCase()) ||
    cp.merchants.business_name.toLowerCase().includes(search.toLowerCase())
  ).filter(cp =>
    statusFilter === 'all' || cp.status === statusFilter
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-green-100">
              <TrophyIcon size={32} className="icon-brand" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Våra produkter</h1>
              <p className="text-gray-600">Hantera vilka produkter föreningen säljer</p>
            </div>
          </div>
        </motion.div>

        {/* Stats summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <TrophyIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Totalt produkter</h3>
            </div>
            <p className="text-4xl font-bold text-green-700">{products.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <TrophyIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Aktiva</h3>
            </div>
            <p className="text-4xl font-bold text-green-700">{products.filter(p => p.status === 'active').length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <TrophyIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Utvalda</h3>
            </div>
            <p className="text-4xl font-bold text-green-700">{products.filter(p => p.is_featured).length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <MoneyIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Genomsnittlig provision</h3>
            </div>
            <p className="text-4xl font-bold text-green-700">
              {products.length > 0 ? (products.reduce((sum, p) => sum + p.commission_percent, 0) / products.length).toFixed(1) : '0'}%
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sök</label>
              <div className="relative">
                <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 icon-brand" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Produkt eller företag..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none"
              >
                <option value="all">Alla</option>
                <option value="active">Aktiva</option>
                <option value="pending">Väntande</option>
                <option value="hidden">Dolda</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Products grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl shadow-lg text-gray-500">
              <TrophyIcon size={64} className="mx-auto mb-4 text-gray-300 icon-brand" />
              <p className="text-lg">Inga produkter hittades</p>
            </div>
          ) : (
            filteredProducts.map((cp, index) => (
              <motion.div
                key={cp.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 ${cp.is_featured ? 'border-yellow-400' : 'border-green-200'}`}
              >
                {cp.products.image_urls && cp.products.image_urls.length > 0 && (
                  <div className="h-48 bg-gray-100 relative">
                    <img
                      src={cp.products.image_urls[0]}
                      alt={cp.products.title}
                      className="w-full h-full object-cover"
                    />
                    {cp.is_featured && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-white px-3 py-1 rounded-full text-xs font-bold">
                        ⭐ Utvald
                      </div>
                    )}
                  </div>
                )}
                
                <div className="p-6">
                  <div className="mb-3">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{cp.products.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{cp.merchants.business_name}</p>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-green-700">{cp.products.price} kr</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                      cp.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : cp.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {cp.status === 'active' ? 'Aktiv' : 
                       cp.status === 'pending' ? 'Väntande' : cp.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500 block">Provision</span>
                      <span className="font-semibold text-gray-900">{cp.commission_percent}%</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Prioritet</span>
                      <span className="font-semibold text-gray-900">{cp.priority}</span>
                    </div>
                  </div>

                  {cp.notes && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{cp.notes}</p>
                  )}

                  <button
                    className="w-full py-2 px-4 rounded-xl font-semibold transition-colors"
                    style={{ backgroundColor: '#003B3D', color: 'white' }}
                  >
                    Hantera
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
