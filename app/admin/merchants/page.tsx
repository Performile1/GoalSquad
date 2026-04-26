'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShoppingBagIcon, SearchIcon, MoneyIcon, DashboardIcon, TruckIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

type SortField = 'created_at' | 'merchant_name' | 'slug' | 'total_products' | 'total_orders' | 'total_revenue';
type StatusFilter = 'all' | 'active' | 'inactive' | 'pending';

interface MerchantSummary {
  id: string;
  user_id: string;
  merchant_name: string;
  slug: string;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  is_active: boolean;
  stripe_account_connected: boolean;
  is_verified: boolean;
  location: string | null;
  created_at: string;
}

interface MerchantsData {
  merchants: MerchantSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export default function AdminMerchantsPage() {
  const [data, setData] = useState<MerchantsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('total_revenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchMerchants = useCallback(async () => {
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
      const res = await apiFetch(`/api/admin/merchants?${params}`);
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
    fetchMerchants();
  }, [fetchMerchants]);

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
            <div className="p-3 rounded-xl bg-orange-100">
              <ShoppingBagIcon size={28} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Företag (Merchants)</h1>
              <p className="text-gray-600">Översikt över alla företag på plattformen</p>
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
                  placeholder="Företagsnamn eller slug..."
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
                <option value="pending">Väntande</option>
              </select>
            </div>

            <button onClick={fetchMerchants} className="btn-primary px-6 py-2">
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
                        <button onClick={() => handleSort('merchant_name')} className="flex items-center gap-1 hover:text-gray-900">
                          Företagsnamn <SortArrow field="merchant_name" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('slug')} className="flex items-center gap-1 hover:text-gray-900">
                          Slug <SortArrow field="slug" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('total_products')} className="flex items-center gap-1 hover:text-gray-900">
                          Produkter <SortArrow field="total_products" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('total_orders')} className="flex items-center gap-1 hover:text-gray-900">
                          Ordrar <SortArrow field="total_orders" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('total_revenue')} className="flex items-center gap-1 hover:text-gray-900">
                          Omsättning <SortArrow field="total_revenue" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Stripe</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Verifierad</th>
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
                    {!data?.merchants?.length ? (
                      <tr>
                        <td colSpan={10} className="px-5 py-16 text-center text-gray-400">
                          Inga företag hittades
                        </td>
                      </tr>
                    ) : (
                      data.merchants.map((merchant, i) => (
                        <motion.tr
                          key={merchant.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {/* Name */}
                          <td className="px-5 py-4">
                            <span className="font-medium text-gray-900">{merchant.merchant_name}</span>
                          </td>

                          {/* Slug */}
                          <td className="px-5 py-4 text-sm text-gray-600">
                            {merchant.slug}
                          </td>

                          {/* Products */}
                          <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                            {merchant.total_products}
                          </td>

                          {/* Orders */}
                          <td className="px-5 py-4 text-sm text-gray-600">
                            {merchant.total_orders}
                          </td>

                          {/* Revenue */}
                          <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                            {merchant.total_revenue.toLocaleString()} kr
                          </td>

                          {/* Stripe */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              merchant.stripe_account_connected
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {merchant.stripe_account_connected ? 'Ansluten' : 'Ej ansluten'}
                            </span>
                          </td>

                          {/* Verified */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              merchant.is_verified
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {merchant.is_verified ? 'Ja' : 'Nej'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              merchant.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${merchant.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                              {merchant.is_active ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </td>

                          {/* Registered */}
                          <td className="px-5 py-4 text-sm text-gray-500">
                            {new Date(merchant.created_at).toLocaleDateString('sv-SE')}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/merchants/${merchant.id}/dashboard`}
                                className="text-xs font-semibold hover:underline"
                                style={{ color: '#003B3D' }}
                              >
                                Dashboard
                              </Link>
                              <span className="text-gray-300">|</span>
                              <button
                                className="text-xs font-semibold text-red-500 hover:text-red-700"
                                onClick={() => {
                                  if (confirm(`${merchant.is_active ? 'Inaktivera' : 'Aktivera'} ${merchant.merchant_name}?`)) {
                                    apiFetch(`/api/admin/merchants/${merchant.id}/${merchant.is_active ? 'deactivate' : 'activate'}`, { method: 'POST' }).then(fetchMerchants);
                                  }
                                }}
                              >
                                {merchant.is_active ? 'Inaktivera' : 'Aktivera'}
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
