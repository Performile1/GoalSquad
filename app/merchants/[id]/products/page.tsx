'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SearchIcon, MoneyIcon, AlertIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface Product {
  id: string;
  name: string;
  title: string;
  description: string;
  sku: string;
  ean: string;
  category: string;
  brand: string;
  base_price: number;
  retail_price: number;
  weight_grams: number;
  length_mm: number;
  width_mm: number;
  height_mm: number;
  stock_quantity: number;
  stock_location: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function MerchantProducts() {
  const params = useParams();
  const router = useRouter();
  const merchantId = params.id as string;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, [merchantId]);

  const fetchProducts = async () => {
    try {
      const response = await apiFetch(`/api/merchants/${merchantId}/products`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    (product.name || product.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (product.sku || '').toLowerCase().includes(search.toLowerCase())
  ).filter(product =>
    statusFilter === 'all' || product.status === statusFilter
  );

  const totalStock = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
  const totalValue = products.reduce((sum, p) => sum + (p.retail_price * (p.stock_quantity || 0)), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100">
              <MoneyIcon size={32} className="icon-brand" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Produkter</h1>
              <p className="text-gray-600">Hantera företagets produkter</p>
            </div>
          </div>
          <Link
            href={`/merchants/${merchantId}/products/new`}
            className="px-6 py-3 rounded-xl font-semibold text-white transition-colors"
            style={{ backgroundColor: '#003B3D' }}
          >
            + Ny produkt
          </Link>
        </motion.div>

        {/* Stats summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <MoneyIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Totalt produkter</h3>
            </div>
            <p className="text-4xl font-bold text-blue-700">{products.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <MoneyIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Totalt lager</h3>
            </div>
            <p className="text-4xl font-bold text-blue-700">{totalStock} st</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <MoneyIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Lagervärde</h3>
            </div>
            <p className="text-4xl font-bold text-blue-700">{totalValue.toLocaleString()} kr</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <AlertIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Lågt lager</h3>
            </div>
            <p className="text-4xl font-bold text-red-700">
              {products.filter(p => (p.stock_quantity || 0) < 10).length}
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
                  placeholder="Namn, SKU..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none"
              >
                <option value="all">Alla</option>
                <option value="active">Aktiva</option>
                <option value="draft">Utkast</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Products table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0ea5e9', borderTopColor: 'transparent' }} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <MoneyIcon size={64} className="mx-auto mb-4 text-gray-300 icon-brand" />
              <p className="text-lg">Inga produkter hittades</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: '#F8F9FA', borderBottom: '1px solid #EAECEE' }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Produkt</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">SKU</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Kategori</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Pris</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Lager</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Åtgärder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProducts.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{product.name || product.title}</div>
                          {product.brand && <div className="text-sm text-gray-500">{product.brand}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.sku || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.category || '-'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {product.retail_price} kr
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${(product.stock_quantity || 0) < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                            {product.stock_quantity || 0} st
                          </span>
                          {(product.stock_quantity || 0) < 10 && (
                            <AlertIcon size={16} className="text-red-500" />
                          )}
                        </div>
                        {product.stock_location && (
                          <div className="text-xs text-gray-500">{product.stock_location}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                          product.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {product.status === 'active' ? 'Aktiv' : 'Utkast'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/merchants/${merchantId}/products/${product.id}`}
                          className="text-xs font-semibold hover:underline"
                          style={{ color: '#003B3D' }}
                        >
                          Redigera
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
