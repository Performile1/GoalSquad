'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SearchIcon, FilterIcon, CheckIcon, AlertIcon, ShoppingBagIcon } from '@/app/components/BrandIcons';

interface ApprovedProduct {
  id: string;
  name: string;
  category: string;
  company: string;
  approvedAt: string;
  status: 'approved' | 'pending' | 'rejected';
  restrictions: string[];
  minAge: number | null;
  requiresParentalConsent: boolean;
}

export default function ApprovedProductsPage() {
  const [products, setProducts] = useState<ApprovedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/approved-products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch approved products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.company.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Godkänd';
      case 'pending':
        return 'Väntar';
      case 'rejected':
        return 'Avvisad';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary-900 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-primary-900 font-semibold">Laddar...</p>
        </div>
      </div>
    );
  }

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Godkända Produkter</h1>
          <p className="text-gray-600">Hantera produkter som är godkända att sälja på GoalSquad</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Sök efter produkt eller företag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
            >
              <option value="all">Alla status</option>
              <option value="approved">Godkänd</option>
              <option value="pending">Väntar</option>
              <option value="rejected">Avvisad</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
            >
              <option value="all">Alla kategorier</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
        >
          {[
            { label: 'Godkända', value: products.filter(p => p.status === 'approved').length, color: 'green' },
            { label: 'Väntande', value: products.filter(p => p.status === 'pending').length, color: 'yellow' },
            { label: 'Avvisade', value: products.filter(p => p.status === 'rejected').length, color: 'red' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`bg-white rounded-2xl shadow-lg p-6 border-2 ${
                stat.color === 'green' ? 'border-green-200' :
                stat.color === 'yellow' ? 'border-yellow-200' :
                'border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">{stat.label}</h3>
                <stat.color === 'green' ? <CheckIcon size={36} className="text-green-600" /> :
                 stat.color === 'yellow' ? <AlertIcon size={36} className="text-yellow-600" /> :
                 <AlertIcon size={36} className="text-red-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Products Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Produkt</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Kategori</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Företag</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ålder</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Föräldragodkännande</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Restriktioner</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Godkänd</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      Inga produkter hittades
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, index) => (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary-100 rounded-lg p-2">
                            <ShoppingBagIcon size={20} className="text-primary-900" />
                          </div>
                          <span className="font-semibold text-gray-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{product.category}</td>
                      <td className="px-6 py-4 text-gray-700">{product.company}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(product.status)}`}>
                          {getStatusLabel(product.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {product.minAge ? `${product.minAge}+` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {product.requiresParentalConsent ? (
                          <span className="text-orange-600 font-semibold">Ja</span>
                        ) : (
                          <span className="text-green-600">Nej</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {product.restrictions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {product.restrictions.slice(0, 2).map((r, i) => (
                              <span key={i} className="bg-gray-100 px-2 py-1 rounded text-xs">
                                {r}
                              </span>
                            ))}
                            {product.restrictions.length > 2 && (
                              <span className="text-xs text-gray-500">+{product.restrictions.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(product.approvedAt).toLocaleDateString('sv-SE')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {product.status === 'pending' && (
                            <>
                              <button className="text-green-600 font-semibold hover:text-green-700 transition">
                                Godkänn
                              </button>
                              <button className="text-red-600 font-semibold hover:text-red-700 transition">
                              Avvisa
                              </button>
                            </>
                          )}
                          <button className="text-primary-900 font-semibold hover:text-primary-600 transition">
                            Detaljer
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
