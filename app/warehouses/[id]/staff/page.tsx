'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertIcon, CheckIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface StaffMember {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  staff_role: string;
  is_active: boolean;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  picker: 'Plockare',
  supervisor: 'Arbetsledare',
  warehouse_admin: 'Lageradmin',
  driver: 'Chaufför',
};

export default function WarehouseStaffPage() {
  const params = useParams();
  const warehouseId = params.id as string;

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', staff_role: 'picker', pin_code: '' });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/warehouses/${warehouseId}/staff`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kunde inte hämta personal');
      setStaff(data.staff || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [warehouseId]);

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`/api/warehouses/${warehouseId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kunde inte lägga till personal');
      setForm({ full_name: '', email: '', phone: '', staff_role: 'picker', pin_code: '' });
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const removeStaff = async (id: string) => {
    if (!confirm('Ta bort denna person?')) return;
    try {
      const res = await apiFetch(`/api/warehouses/${warehouseId}/staff?staffId=${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Kunde inte ta bort'); }
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Personalregister</h1>
          <p className="text-gray-600">Hantera personalen som arbetar på detta lager</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-2 text-red-700">
            <AlertIcon size={18} /> {error}
          </div>
        )}

        {/* Add form */}
        <form onSubmit={addStaff} className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Lägg till personal</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Fullständigt namn"
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
            <select value={form.staff_role} onChange={(e) => setForm({ ...form, staff_role: e.target.value })}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none">
              <option value="picker">Plockare</option>
              <option value="supervisor">Arbetsledare</option>
              <option value="warehouse_admin">Lageradmin</option>
              <option value="driver">Chaufför</option>
            </select>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="E-post (valfritt)"
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Telefon (valfritt)"
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
            <input value={form.pin_code} onChange={(e) => setForm({ ...form, pin_code: e.target.value })}
              placeholder="PIN-kod för plockdator (valfritt)" maxLength={10}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={saving}
              className="px-6 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50">
              {saving ? 'Sparar...' : 'Lägg till'}
            </button>
          </div>
        </form>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-4 border-primary-900 border-t-transparent animate-spin" />
          </div>
        ) : staff.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-500">
            Ingen personal registrerad ännu
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs uppercase text-gray-400">
                  <th className="px-6 py-3">Namn</th>
                  <th className="px-6 py-3">Roll</th>
                  <th className="px-6 py-3">Kontakt</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.map((m) => (
                  <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{m.full_name}</td>
                    <td className="px-6 py-4 text-gray-700">{ROLE_LABELS[m.staff_role] || m.staff_role}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {m.email || '-'}{m.phone ? ` · ${m.phone}` : ''}
                    </td>
                    <td className="px-6 py-4">
                      {m.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">
                          <CheckIcon size={12} /> Aktiv
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600">Inaktiv</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => removeStaff(m.id)} className="text-xs font-semibold text-red-600 hover:underline">
                        Ta bort
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
