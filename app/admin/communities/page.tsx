'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CommunityIcon, SearchIcon, MoneyIcon, UserIcon, TrophyIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

type SortField = 'created_at' | 'name' | 'slug' | 'total_members' | 'total_sales' | 'total_commission';
type StatusFilter = 'all' | 'active' | 'inactive';
type TypeFilter = 'all' | 'forening' | 'klubb' | 'klass';

interface CommunitySummary {
  id: string;
  name: string;
  slug: string;
  community_type: string;
  total_members: number;
  total_sales: number;
  total_commission: number;
  treasury_available: number;
  treasury_held: number;
  is_active: boolean;
  location: string | null;
  created_at: string;
}

interface CommunitiesData {
  communities: CommunitySummary[];
  total: number;
  page: number;
  pageSize: number;
}

export default function AdminCommunitiesPage() {
  const [data, setData] = useState<CommunitiesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sortField, setSortField] = useState<SortField>('total_sales');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortField,
        sortDir,
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
      });
      const res = await apiFetch(`/api/admin/communities?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortField, sortDir, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'forening': return 'Förening';
      case 'klubb': return 'Klubb';
      case 'klass': return 'Klass';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'forening': return 'bg-green-100 text-green-700';
      case 'klubb': return 'bg-blue-100 text-blue-700';
      case 'klass': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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
            <div className="p-3 rounded-xl bg-green-100">
              <CommunityIcon size={28} className="text-green-900" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Föreningar & Klubbar</h1>
              <p className="text-gray-600">Översikt över alla föreningar, klubbar och klasser</p>
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
                  placeholder="Namn eller slug..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Type filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value as TypeFilter); setPage(1); }}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
              >
                <option value="all">Alla typer</option>
                <option value="forening">Föreningar</option>
                <option value="klubb">Klubbar</option>
                <option value="klass">Klasser</option>
              </select>
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

            <button onClick={fetchCommunities} className="btn-primary px-6 py-2">
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
                        <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-gray-900">
                          Namn <SortArrow field="name" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('slug')} className="flex items-center gap-1 hover:text-gray-900">
                          Slug <SortArrow field="slug" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Typ</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('total_members')} className="flex items-center gap-1 hover:text-gray-900">
                          Medlemmar <SortArrow field="total_members" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('total_sales')} className="flex items-center gap-1 hover:text-gray-900">
                          Försäljning <SortArrow field="total_sales" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('total_commission')} className="flex items-center gap-1 hover:text-gray-900">
                          Commission <SortArrow field="total_commission" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Treasury</th>
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
                    {!data?.communities?.length ? (
                      <tr>
                        <td colSpan={10} className="px-5 py-16 text-center text-gray-400">
                          Inga föreningar hittades
                        </td>
                      </tr>
                    ) : (
                      data.communities.map((community, i) => (
                        <motion.tr
                          key={community.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {/* Name */}
                          <td className="px-5 py-4">
                            <span className="font-medium text-gray-900">{community.name}</span>
                          </td>

                          {/* Slug */}
                          <td className="px-5 py-4 text-sm text-gray-600">
                            {community.slug}
                          </td>

                          {/* Type */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${getTypeColor(community.community_type)}`}>
                              {getTypeLabel(community.community_type)}
                            </span>
                          </td>

                          {/* Members */}
                          <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                            {community.total_members}
                          </td>

                          {/* Sales */}
                          <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                            {community.total_sales.toLocaleString()} kr
                          </td>

                          {/* Commission */}
                          <td className="px-5 py-4 text-sm text-gray-600">
                            {community.total_commission.toLocaleString()} kr
                          </td>

                          {/* Treasury */}
                          <td className="px-5 py-4 text-sm">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-green-600 font-semibold">{community.treasury_available.toLocaleString()} kr</span>
                              <span className="text-orange-600 text-xs">({community.treasury_held.toLocaleString()} kr held)</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              community.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${community.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                              {community.is_active ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </td>

                          {/* Registered */}
                          <td className="px-5 py-4 text-sm text-gray-500">
                            {new Date(community.created_at).toLocaleDateString('sv-SE')}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/communities/${community.id}/dashboard`}
                                className="text-xs font-semibold hover:underline"
                                style={{ color: '#003B3D' }}
                              >
                                Dashboard
                              </Link>
                              <span className="text-gray-300">|</span>
                              <button
                                className="text-xs font-semibold text-red-500 hover:text-red-700"
                                onClick={() => {
                                  if (confirm(`${community.is_active ? 'Inaktivera' : 'Aktivera'} ${community.name}?`)) {
                                    apiFetch(`/api/admin/communities/${community.id}/${community.is_active ? 'deactivate' : 'activate'}`, { method: 'POST' }).then(fetchCommunities);
                                  }
                                }}
                              >
                                {community.is_active ? 'Inaktivera' : 'Aktivera'}
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
