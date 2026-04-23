'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { DashboardIcon, SearchIcon, MoneyIcon, UserIcon, TruckIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

type SortField = 'created_at' | 'order_number' | 'total_amount' | 'status' | 'customer_name';
type StatusFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

interface OrderSummary {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  seller_id: string | null;
  seller_name: string | null;
  community_id: string | null;
  community_name: string | null;
  merchant_id: string | null;
  merchant_name: string | null;
  created_at: string;
  updated_at: string;
}

interface OrdersData {
  orders: OrderSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export default function AdminOrdersPage() {
  const [data, setData] = useState<OrdersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchOrders = useCallback(async () => {
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
      const res = await apiFetch(`/api/admin/orders?${params}`);
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
    fetchOrders();
  }, [fetchOrders]);

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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Väntande',
      processing: 'Bearbetas',
      shipped: 'Skickad',
      delivered: 'Levererad',
      cancelled: 'Avbruten',
      refunded: 'Återbetald',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      refunded: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

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
              <DashboardIcon size={28} className="text-primary-900" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Ordrar</h1>
              <p className="text-gray-600">Översikt över alla ordrar på plattformen</p>
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
                  placeholder="Ordernummer, kundnamn eller e-post..."
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
                <option value="all">Alla status</option>
                <option value="pending">Väntande</option>
                <option value="processing">Bearbetas</option>
                <option value="shipped">Skickad</option>
                <option value="delivered">Levererad</option>
                <option value="cancelled">Avbruten</option>
                <option value="refunded">Återbetald</option>
              </select>
            </div>

            <button onClick={fetchOrders} className="btn-primary px-6 py-2">
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
                        <button onClick={() => handleSort('order_number')} className="flex items-center gap-1 hover:text-gray-900">
                          Ordernummer <SortArrow field="order_number" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('customer_name')} className="flex items-center gap-1 hover:text-gray-900">
                          Kund <SortArrow field="customer_name" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Säljare</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Förening</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Företag</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('total_amount')} className="flex items-center gap-1 hover:text-gray-900">
                          Belopp <SortArrow field="total_amount" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('status')} className="flex items-center gap-1 hover:text-gray-900">
                          Status <SortArrow field="status" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('created_at')} className="flex items-center gap-1 hover:text-gray-900">
                          Skapad <SortArrow field="created_at" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {!data?.orders?.length ? (
                      <tr>
                        <td colSpan={9} className="px-5 py-16 text-center text-gray-400">
                          Inga ordrar hittades
                        </td>
                      </tr>
                    ) : (
                      data.orders.map((order, i) => (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {/* Order Number */}
                          <td className="px-5 py-4">
                            <span className="font-medium text-gray-900">#{order.order_number}</span>
                          </td>

                          {/* Customer */}
                          <td className="px-5 py-4">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{order.customer_name || '—'}</div>
                              <div className="text-gray-500 text-xs">{order.customer_email || '—'}</div>
                            </div>
                          </td>

                          {/* Seller */}
                          <td className="px-5 py-4 text-sm">
                            {order.seller_name ? (
                              <Link href={`/sellers/${order.seller_id}/dashboard`} className="text-blue-600 hover:underline">
                                {order.seller_name}
                              </Link>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          {/* Community */}
                          <td className="px-5 py-4 text-sm">
                            {order.community_name ? (
                              <Link href={`/communities/${order.community_id}`} className="text-green-700 hover:underline">
                                {order.community_name}
                              </Link>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          {/* Merchant */}
                          <td className="px-5 py-4 text-sm">
                            {order.merchant_name ? (
                              <Link href={`/merchants/${order.merchant_id}/dashboard`} className="text-amber-700 hover:underline">
                                {order.merchant_name}
                              </Link>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                            {order.total_amount.toLocaleString()} kr
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                          </td>

                          {/* Created */}
                          <td className="px-5 py-4 text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('sv-SE')}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/orders/${order.id}`}
                                className="text-xs font-semibold hover:underline"
                                style={{ color: '#003B3D' }}
                              >
                                Visa
                              </Link>
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
