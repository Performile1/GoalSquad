'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { UserIcon, SearchIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

type Role = 'all' | 'buyer' | 'seller' | 'merchant' | 'admin' | 'warehouse_manager' | 'community_manager';
type SortField = 'created_at' | 'email' | 'display_name' | 'role';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  seller_id: string | null;
  community_id: string | null;
  merchant_id: string | null;
}

interface UsersData {
  users: UserProfile[];
  total: number;
  page: number;
  pageSize: number;
}

const ROLE_LABELS: Record<string, string> = {
  buyer: 'Köpare',
  seller: 'Säljare',
  merchant: 'Företag',
  admin: 'Admin',
  warehouse_manager: 'Lageransvarig',
  community_manager: 'Föreningsledare',
};

const ROLE_COLORS: Record<string, string> = {
  buyer:               'background: rgba(0,59,61,0.08); color: #003B3D;',
  seller:              'background: rgba(59,130,246,0.1); color: #1d4ed8;',
  merchant:            'background: rgba(234,179,8,0.12); color: #92400e;',
  admin:               'background: rgba(239,68,68,0.1); color: #dc2626;',
  warehouse_manager:   'background: rgba(168,85,247,0.1); color: #7c3aed;',
  community_manager:   'background: rgba(16,185,129,0.1); color: #047857;',
};

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [activeOnly, setActiveOnly] = useState(false);
  const pageSize = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortField,
        sortDir,
        ...(search && { search }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(activeOnly && { active: 'true' }),
      });
      const res = await apiFetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortField, sortDir, search, roleFilter, activeOnly]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const SortArrow = ({ field }: { field: SortField }) =>
    sortField === field ? (
      <span className="ml-1 text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>
    ) : null;

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  return (
    <div className="min-h-screen section-light p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/admin/dashboard" className="text-sm font-medium hover:underline" style={{ color: '#003B3D' }}>
                ← Admin
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Användare</h1>
            <p className="text-gray-500 mt-1">
              Alla registrerade användare på plattformen
              {data && <span className="ml-2 badge-petrol">{data.total} totalt</span>}
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="card p-4 mb-6 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <SearchIcon size={16} />
            <input
              type="text"
              placeholder="Sök namn eller e-post..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input"
            />
          </div>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value as Role); setPage(1); }}
            className="input"
            style={{ width: 'auto' }}
          >
            <option value="all">Alla roller</option>
            {Object.entries(ROLE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          {/* Active only toggle */}
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => { setActiveOnly(e.target.checked); setPage(1); }}
              className="rounded"
              style={{ accentColor: '#003B3D' }}
            />
            Endast aktiva
          </label>

          <button onClick={fetchUsers} className="btn-primary px-4 py-2 text-sm">
            Uppdatera
          </button>

          <Link href="/admin/users/create" className="btn-hero px-4 py-2 text-sm flex items-center gap-2">
            <span>+</span> Skapa användare
          </Link>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
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
                        <button onClick={() => handleSort('display_name')} className="flex items-center gap-1 hover:text-gray-900">
                          Användare <SortArrow field="display_name" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('email')} className="flex items-center gap-1 hover:text-gray-900">
                          E-post <SortArrow field="email" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('role')} className="flex items-center gap-1 hover:text-gray-900">
                          Roll <SortArrow field="role" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Kopplad till</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <button onClick={() => handleSort('created_at')} className="flex items-center gap-1 hover:text-gray-900">
                          Registrerad <SortArrow field="created_at" />
                        </button>
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {!data?.users?.length ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-16 text-center text-gray-400">
                          Inga användare hittades
                        </td>
                      </tr>
                    ) : (
                      data.users.map((user, i) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {/* Avatar + Name */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#003B3D' }}>
                                  {(user.display_name || user.email)?.[0]?.toUpperCase() ?? '?'}
                                </div>
                              )}
                              <span className="font-medium text-gray-900">
                                {user.display_name || user.full_name || <span className="text-gray-400 italic">Inget namn</span>}
                              </span>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-5 py-4 text-sm text-gray-600">{user.email}</td>

                          {/* Role badge */}
                          <td className="px-5 py-4">
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                              style={Object.fromEntries(
                                (ROLE_COLORS[user.role] || 'background: #f3f4f6; color: #374151;')
                                  .split(';')
                                  .filter(Boolean)
                                  .map((s) => {
                                    const [k, v] = s.split(':').map((x) => x.trim());
                                    return [k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v];
                                  })
                              ) as React.CSSProperties}
                            >
                              {ROLE_LABELS[user.role] ?? user.role}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              user.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                              {user.is_active ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </td>

                          {/* Linked entity */}
                          <td className="px-5 py-4 text-sm">
                            {user.seller_id && (
                              <Link href={`/sellers/${user.seller_id}/dashboard`} className="text-blue-600 hover:underline">
                                Säljare
                              </Link>
                            )}
                            {user.community_id && (
                              <Link href={`/communities/${user.community_id}`} className="text-green-700 hover:underline">
                                Förening
                              </Link>
                            )}
                            {user.merchant_id && (
                              <Link href={`/merchants/${user.merchant_id}/dashboard`} className="text-amber-700 hover:underline">
                                Företag
                              </Link>
                            )}
                            {!user.seller_id && !user.community_id && !user.merchant_id && (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          {/* Registered */}
                          <td className="px-5 py-4 text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString('sv-SE')}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/users/${user.id}`}
                                className="text-xs font-semibold hover:underline"
                                style={{ color: '#003B3D' }}
                              >
                                Visa
                              </Link>
                              <span className="text-gray-300">|</span>
                              <button
                                className="text-xs font-semibold text-red-500 hover:text-red-700"
                                onClick={() => {
                                  if (confirm(`Inaktivera ${user.display_name || user.email}?`)) {
                                    apiFetch(`/api/admin/users/${user.id}/deactivate`, { method: 'POST' }).then(fetchUsers);
                                  }
                                }}
                              >
                                {user.is_active ? 'Inaktivera' : 'Aktivera'}
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
        </div>
      </div>
    </div>
  );
}
