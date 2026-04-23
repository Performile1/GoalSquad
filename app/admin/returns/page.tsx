'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { DashboardIcon, SearchIcon, AlertIcon, UserIcon, TruckIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

type SortField = 'created_at' | 'return_number' | 'status' | 'customer_name';
type StatusFilter = 'all' | 'requested' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled';

interface ReturnSummary {
  id: string;
  return_number: string;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  order_id: string | null;
  order_number: string | null;
  reason: string | null;
  refund_amount: number | null;
  warehouse_id: string | null;
  warehouse_name: string | null;
  created_at: string;
  updated_at: string;
}

interface ReturnsData {
  returns: ReturnSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export default function AdminReturnsPage() {
  const [data, setData] = useState<ReturnsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchReturns = useCallback(async () => {
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
      const res = await apiFetch(`/api/admin/returns?${params}`);
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
    fetchReturns();
  }, [fetchReturns]);

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
      requested: 'Efterfrågad',
      approved: 'Godkänd',
      rejected: 'Avvisad',
      processing: 'Bearbetas',
      completed: 'Slutförd',
      cancelled: 'Avbruten',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      requested: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-700',
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
            <div className="p-3 rounded-xl bg-red-100">
              <AlertIcon size={28} className="text-red-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Returer</h1>
              <p className="text-gray-600">Översikt över alla returer på plattformen</p>
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
                  placeholder="Returnummer, kundnamn eller ordernummer..."
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
                <option value="requested">Efterfrågad</option>
                <option value="approved">Godkänd</option>
                <option value="rejected">Avvisad</option>
                <option value="processing">Bearbetas</option>
                <option value="completed">Slutförd</option>
                <option value="cancelled">Avbruten</option>
              </select>
            </div>

            <button onClick={fetchReturns} className="btn-primary px-6 py-2">
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
                        <button onClick={() => handleSort('return_number')} className="flex items-center gap-1 hover:text-gray-900">
                          Returnummer <SortArrow field="return_number" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('customer_name')} className="flex items-center gap-1 hover:text-gray-900">
                          Kund <SortArrow field="customer_name" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Order</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Orsak</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Återbetalning</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Lager</th>
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
                    {!data?.returns?.length ? (
                      <tr>
                        <td colSpan={9} className="px-5 py-16 text-center text-gray-400">
                          Inga returer hittades
                        </td>
                      </tr>
                    ) : (
                      data.returns.map((ret, i) => (
                        <motion.tr
                          key={ret.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {/* Return Number */}
                          <td className="px-5 py-4">
                            <span className="font-medium text-gray-900">#{ret.return_number}</span>
                          </td>

                          {/* Customer */}
                          <td className="px-5 py-4">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{ret.customer_name || '—'}</div>
                              <div className="text-gray-500 text-xs">{ret.customer_email || '—'}</div>
                            </div>
                          </td>

                          {/* Order */}
                          <td className="px-5 py-4 text-sm">
                            {ret.order_number ? (
                              <Link href={`/orders/${ret.order_id}`} className="text-blue-600 hover:underline">
                                #{ret.order_number}
                              </Link>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          {/* Reason */}
                          <td className="px-5 py-4 text-sm text-gray-600 max-w-[200px] truncate">
                            {ret.reason || '—'}
                          </td>

                          {/* Refund Amount */}
                          <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                            {ret.refund_amount ? `${ret.refund_amount.toLocaleString()} kr` : '—'}
                          </td>

                          {/* Warehouse */}
                          <td className="px-5 py-4 text-sm">
                            {ret.warehouse_name ? (
                              <Link href={`/warehouses/${ret.warehouse_id}/dashboard`} className="text-purple-700 hover:underline">
                                {ret.warehouse_name}
                              </Link>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(ret.status)}`}>
                              {getStatusLabel(ret.status)}
                            </span>
                          </td>

                          {/* Created */}
                          <td className="px-5 py-4 text-sm text-gray-500">
                            {new Date(ret.created_at).toLocaleDateString('sv-SE')}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/returns/${ret.id}`}
                                className="text-xs font-semibold hover:underline"
                                style={{ color: '#003B3D' }}
                              >
                                Visa
                              </Link>
                              {ret.status === 'requested' && (
                                <>
                                  <span className="text-gray-300">|</span>
                                  <button
                                    className="text-xs font-semibold text-green-600 hover:text-green-700"
                                    onClick={() => {
                                      if (confirm('Godkänn retur?')) {
                                        apiFetch(`/api/admin/returns/${ret.id}/approve`, { method: 'POST' }).then(fetchReturns);
                                      }
                                    }}
                                  >
                                    Godkänn
                                  </button>
                                </>
                              )}
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
