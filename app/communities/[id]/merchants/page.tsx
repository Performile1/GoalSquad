'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { UserIcon, SearchIcon, MoneyIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface Merchant {
  id: string;
  business_name: string;
  company_description: string;
}

interface CommunityMerchant {
  id: string;
  merchant_id: string;
  status: string;
  commission_percent: number;
  terms_accepted: boolean;
  merchants: Merchant;
}

export default function CommunityMerchants() {
  const params = useParams();
  const communityId = params.id as string;
  
  const [relationships, setRelationships] = useState<CommunityMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMerchants();
  }, [communityId]);

  const fetchMerchants = async () => {
    try {
      const response = await apiFetch(`/api/communities/${communityId}/merchants`);
      const data = await response.json();
      setRelationships(data.relationships || []);
    } catch (error) {
      console.error('Failed to fetch merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMerchants = relationships.filter(rm =>
    rm.merchants.business_name.toLowerCase().includes(search.toLowerCase())
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
              <UserIcon size={32} className="icon-brand" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Våra företag</h1>
              <p className="text-gray-600">Hantera vilka företag föreningen arbetar med</p>
            </div>
          </div>
        </motion.div>

        {/* Stats summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <UserIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Totalt företag</h3>
            </div>
            <p className="text-4xl font-bold text-green-700">{relationships.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <UserIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Aktiva företag</h3>
            </div>
            <p className="text-4xl font-bold text-green-700">{relationships.filter(r => r.status === 'active').length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <MoneyIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Genomsnittlig provision</h3>
            </div>
            <p className="text-4xl font-bold text-green-700">
              {relationships.length > 0 ? (relationships.reduce((sum, r) => sum + r.commission_percent, 0) / relationships.length).toFixed(1) : '0'}%
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Sök företag</label>
              <div className="relative">
                <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 icon-brand" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Företagsnamn..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Merchants list */}
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
          ) : filteredMerchants.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <UserIcon size={64} className="mx-auto mb-4 text-gray-300 icon-brand" />
              <p className="text-lg">Inga företag hittades</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: '#F8F9FA', borderBottom: '1px solid #EAECEE' }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Företag</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Beskrivning</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Provision</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Villkor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredMerchants.map((rm, index) => (
                    <motion.tr
                      key={rm.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                            {rm.merchants.business_name[0]}
                          </div>
                          <span className="font-medium text-gray-900">{rm.merchants.business_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {rm.merchants.company_description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {rm.commission_percent}%
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                          rm.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : rm.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            rm.status === 'active' ? 'bg-green-500' : 
                            rm.status === 'pending' ? 'bg-yellow-500' : 'bg-red-400'
                          }`} />
                          {rm.status === 'active' ? 'Aktiv' : 
                           rm.status === 'pending' ? 'Väntar' : rm.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                          rm.terms_accepted
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {rm.terms_accepted ? 'Godkända' : 'Ej godkända'}
                        </span>
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
