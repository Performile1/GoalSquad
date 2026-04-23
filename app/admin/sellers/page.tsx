'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { UserIcon, SearchIcon, TrophyIcon, MoneyIcon, DashboardIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

type SortField = 'created_at' | 'full_name' | 'shop_url' | 'total_sales' | 'total_orders';
type StatusFilter = 'all' | 'active' | 'inactive';

interface SellerSummary {
  id: string;
  user_id: string;
  full_name: string;
  shop_url: string;
  total_sales: number;
  total_orders: number;
  xp_total: number;
  current_level: number;
  is_active: boolean;
  community_id: string | null;
  community_name: string | null;
  created_at: string;
}

interface SellersData {
  sellers: SellerSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export default function AdminSellersPage() {
  const [data, setData] = useState<SellersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('total_sales');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortField,
        sortDir,
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
      const res = await apiFetch(`/api/admin/sellers?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortField, sortDir, search, statusFilter]);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const SortArrow = ({ field }: { field: SortField }) =>
    sortField === field ? (
      <span className="ml-1 text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>
    ) : null;

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary-100">
              <UserIcon size={28} className="text-primary-900" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Säljare</h1>
              <p className="text-gray-600">Översikt över alla säljare på plattformen</p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex flex-wrap gap-4 items-end">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sök</label>
              <div className="relative">
                <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Namn eller shop URL..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
              >
                <option value="all">Alla</option>
                <option value="active">Aktiva</option>
                <option value="inactive">Inaktiva</option>
              </select>
            </div>

            <button onClick={fetchSellers} className="btn-primary px-6 py-2">
              Uppdatera
            </button>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#003B3D', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ background: '#F8F9FA', borderBottom: '1px solid #EAECEE' }}>
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('full_name')} className="flex items-center gap-1 hover:text-gray-900">
                          Namn <SortArrow field="full_name" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('shop_url')} className="flex items-center gap-1 hover:text-gray-900">
                          Shop URL <SortArrow field="shop_url" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('total_sales')} className="flex items-center gap-1 hover:text-gray-900">
                          Försäljning <SortArrow field="total_sales" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('total_orders')} className="flex items-center gap-1 hover:text-gray-900">
                          Ordrar <SortArrow field="total_orders" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Nivå</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Förening</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('created_at')} className="flex items-center gap-1 hover:text-gray-900">
                          Registrerad <SortArrow field="created_at" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {!data?.sellers?.length ? (
                      <tr>
                        <td colSpan={9} className="px-5 py-16 text-center text-gray-400">
                          Inga säljare hittades
                        </td>
                      </tr>
                    ) : (
                      data.sellers.map((seller, i) => (
                        <motion.tr
                          key={seller.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {/* Name */}
                          <td className="px-5 py-4">
                            <span className="font-medium text-gray-900">{seller.full_name}</span>
                          </td>

                          {/* Shop URL */}
                          <td className="px-5 py-4 text-sm">
                            <Link
                              href={`/sellers/${seller.id}/shop`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-900 hover:underline"
                            >
                              goalsquad.shop/{seller.shop_url}
                            </Link>
                          </td>

                          {/* Sales */}
                          <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                            {seller.total_sales.toLocaleString()} kr
                          </td>

                          {/* Orders */}
                          <td className="px-5 py-4 text-sm text-gray-600">
                            {seller.total_orders}
                          </td>

                          {/* Level */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <TrophyIcon size={16} className="text-amber-500" />
                              <span className="text-sm font-semibold text-gray-900">Lvl {seller.current_level}</span>
                            </div>
                          </td>

                          {/* Community */}
                          <td className="px-5 py-4 text-sm">
                            {seller.community_name ? (
                              <Link
                                href={`/communities/${seller.community_id}`}
                                className="text-green-700 hover:underline"
                              >
                                {seller.community_name}
                              </Link>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              seller.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${seller.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                              {seller.is_active ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </td>

                          {/* Registered */}
                          <td className="px-5 py-4 text-sm text-gray-500">
                            {new Date(seller.created_at).toLocaleDateString('sv-SE')}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/sellers/${seller.id}/dashboard`}
                                className="text-xs font-semibold hover:underline"
                                style={{ color: '#003B3D' }}
                              >
                                Dashboard
                              </Link>
                              <span className="text-gray-300">|</span>
                              <button
                                className="text-xs font-semibold text-red-500 hover:text-red-700"
                                onClick={() => {
                                  if (confirm(`${seller.is_active ? 'Inaktivera' : 'Aktivera'} ${seller.full_name}?`)) {
                                    apiFetch(`/api/admin/sellers/${seller.id}/${seller.is_active ? 'deactivate' : 'activate'}`, { method: 'POST' }).then(fetchSellers);
                                  }
                                }}
                              >
                                {seller.is_active ? 'Inaktivera' : 'Aktivera'}
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Visar {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data?.total ?? 0)} av {data?.total ?? 0}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40"
                    >
                      ← Föregående
                    </button>
                    <span className="text-sm font-medium text-gray-700">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="btn-outline px-3 py-1.5 text-xs disabled:opacity-40"
                    >
                      Nästa →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
