'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { UserIcon, SearchIcon, TrophyIcon, MoneyIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface Seller {
  id: string;
  fullName: string;
  shopUrl: string;
  totalSales: number;
  totalOrders: number;
  xpTotal: number;
  currentLevel: number;
  isActive: boolean;
  joinedAt: string;
}

export default function CommunitySellers() {
  const params = useParams();
  const communityId = params.id as string;
  
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('sales');

  useEffect(() => {
    fetchSellers();
  }, [communityId]);

  const fetchSellers = async () => {
    try {
      const response = await apiFetch(`/api/communities/${communityId}/sellers`);
      const data = await response.json();
      setSellers(data.sellers || []);
    } catch (error) {
      console.error('Failed to fetch sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = sellers
    .filter(seller => {
      const matchesSearch = seller.fullName.toLowerCase().includes(search.toLowerCase()) ||
        seller.shopUrl.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && seller.isActive) ||
        (statusFilter === 'inactive' && !seller.isActive);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'sales':
          return b.totalSales - a.totalSales;
        case 'orders':
          return b.totalOrders - a.totalOrders;
        case 'level':
          return b.currentLevel - a.currentLevel;
        case 'name':
          return a.fullName.localeCompare(b.fullName);
        default:
          return 0;
      }
    });

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
              <UserIcon size={32} className="icon-brand" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Mina säljare</h1>
              <p className="text-gray-600">Översikt över alla säljare i föreningen</p>
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
              <UserIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Totalt säljare</h3>
            </div>
            <p className="text-4xl font-bold text-green-700">{sellers.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <MoneyIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Total försäljning</h3>
            </div>
            <p className="text-4xl font-bold text-green-700">
              {sellers.reduce((sum, s) => sum + s.totalSales, 0).toLocaleString()} kr
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <TrophyIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Aktiva säljare</h3>
            </div>
            <p className="text-4xl font-bold text-green-700">{sellers.filter(s => s.isActive).length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <TrophyIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Genomsnittsnivå</h3>
            </div>
            <p className="text-4xl font-bold text-green-700">
              {sellers.length > 0 ? (sellers.reduce((sum, s) => sum + s.currentLevel, 0) / sellers.length).toFixed(1) : '0'}
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
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sök</label>
              <div className="relative">
                <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 icon-brand" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Namn eller shop URL..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none"
              >
                <option value="all">Alla</option>
                <option value="active">Aktiva</option>
                <option value="inactive">Inaktiva</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sortera</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none"
              >
                <option value="sales">Försäljning</option>
                <option value="orders">Ordrar</option>
                <option value="level">Nivå</option>
                <option value="name">Namn</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Sellers list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} />
            </div>
          ) : filteredSellers.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <UserIcon size={64} className="mx-auto mb-4 text-gray-300 icon-brand" />
              <p className="text-lg">Inga säljare hittades</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: '#F8F9FA', borderBottom: '1px solid #EAECEE' }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Säljare</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Shop</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Försäljning</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Ordrar</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Nivå</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Gick med</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Åtgärder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSellers.map((seller, index) => (
                    <motion.tr
                      key={seller.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                            {seller.fullName[0]}
                          </div>
                          <span className="font-medium text-gray-900">{seller.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/sellers/${seller.id}/shop`}
                          target="_blank"
                          className="text-green-700 hover:underline text-sm"
                        >
                          goalsquad.shop/{seller.shopUrl}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {seller.totalSales.toLocaleString()} kr
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {seller.totalOrders}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TrophyIcon size={16} className="text-amber-500" />
                          <span className="text-sm font-semibold text-gray-900">Lvl {seller.currentLevel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                          seller.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${seller.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                          {seller.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(seller.joinedAt).toLocaleDateString('sv-SE')}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/sellers/${seller.id}/dashboard`}
                          className="text-xs font-semibold hover:underline"
                          style={{ color: '#003B3D' }}
                        >
                          Visa
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
