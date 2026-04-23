'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { AlertIcon, SearchIcon, UserIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface Return {
  id: string;
  returnNumber: string;
  orderNumber: string;
  customerName: string;
  sellerName: string;
  reason: string;
  refundAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function CommunityReturns() {
  const params = useParams();
  const communityId = params.id as string;
  
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchReturns();
  }, [communityId]);

  const fetchReturns = async () => {
    try {
      const response = await apiFetch(`/api/communities/${communityId}/returns`);
      const data = await response.json();
      setReturns(data.returns || []);
    } catch (error) {
      console.error('Failed to fetch returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = ret.returnNumber.toLowerCase().includes(search.toLowerCase()) ||
      ret.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      ret.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (ret.sellerName && ret.sellerName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || ret.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-200 text-green-900';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'requested':
        return 'Efterfrågad';
      case 'approved':
        return 'Godkänd';
      case 'rejected':
        return 'Avvisad';
      case 'processing':
        return 'Bearbetas';
      case 'completed':
        return 'Slutförd';
      case 'cancelled':
        return 'Avbruten';
      default:
        return status;
    }
  };

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
            <div className="p-3 rounded-xl bg-red-100">
              <AlertIcon size={32} className="icon-brand" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Returer</h1>
              <p className="text-gray-600">Översikt över returer från föreningens säljare</p>
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
              <AlertIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Totalt returer</h3>
            </div>
            <p className="text-4xl font-bold text-green-700">{returns.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <AlertIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Väntande</h3>
            </div>
            <p className="text-4xl font-bold text-yellow-600">{returns.filter(r => r.status === 'requested').length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <AlertIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Bearbetas</h3>
            </div>
            <p className="text-4xl font-bold text-blue-600">{returns.filter(r => r.status === 'processing').length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <AlertIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Slutförda</h3>
            </div>
            <p className="text-4xl font-bold text-green-600">{returns.filter(r => r.status === 'completed').length}</p>
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
                  placeholder="Returnummer, order, kund eller säljare..."
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
                <option value="all">Alla status</option>
                <option value="requested">Efterfrågad</option>
                <option value="approved">Godkänd</option>
                <option value="rejected">Avvisad</option>
                <option value="processing">Bearbetas</option>
                <option value="completed">Slutförd</option>
                <option value="cancelled">Avbruten</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Returns list */}
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
          ) : filteredReturns.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <AlertIcon size={64} className="mx-auto mb-4 text-gray-300 icon-brand" />
              <p className="text-lg">Inga returer hittades</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: '#F8F9FA', borderBottom: '1px solid #EAECEE' }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Returnummer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Order</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Säljare</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Kund</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Orsak</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Återbetalning</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Datum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredReturns.map((ret, index) => (
                    <motion.tr
                      key={ret.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">#{ret.returnNumber}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        #{ret.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {ret.sellerName || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {ret.customerName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">
                        {ret.reason}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {ret.refundAmount ? `${ret.refundAmount.toLocaleString()} kr` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(ret.status)}`}>
                          {getStatusLabel(ret.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(ret.createdAt).toLocaleDateString('sv-SE')}
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
