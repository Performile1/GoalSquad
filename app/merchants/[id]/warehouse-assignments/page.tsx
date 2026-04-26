'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface Assignment {
  id: string;
  product_id: string;
  warehouse_id: string;
  stock_quantity: number;
  is_primary: boolean;
  is_active: boolean;
  priority: number;
  notes: string | null;
  products?: { name?: string; title?: string; sku?: string; status?: string };
  warehouse_partners?: { partner_name?: string; city?: string; territory?: string };
}

interface Product { id: string; name?: string; title?: string; sku?: string }
interface Warehouse { id: string; partner_name: string; city?: string }

export default function WarehouseAssignmentsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    product_id: '', warehouse_id: '', stock_quantity: 0,
    is_primary: false, priority: 0, notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      const [assignRes, productsRes, warehousesRes] = await Promise.all([
        fetch(`/api/merchants/${id}/warehouse-assignments`),
        fetch(`/api/merchants/${id}/products`),
        fetch(`/api/warehouses`),
      ]);
      if (assignRes.ok) setAssignments((await assignRes.json()).assignments || []);
      if (productsRes.ok) setProducts((await productsRes.json()).products || []);
      if (warehousesRes.ok) setWarehouses((await warehousesRes.json()).warehouses || []);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/merchants/${id}/warehouse-assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          stock_quantity: Number(form.stock_quantity),
          priority: Number(form.priority),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(prev => [data.assignment, ...prev.filter(a => !(a.product_id === form.product_id && a.warehouse_id === form.warehouse_id))]);
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-pulse text-gray-500">Laddar...</div></div>;

  const primaryCount = assignments.filter(a => a.is_primary).length;
  const activeCount = assignments.filter(a => a.is_active).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-900 to-primary-600 text-white py-10">
        <div className="max-w-6xl mx-auto px-4">
          <button onClick={() => router.back()} className="text-primary-200 hover:text-white text-sm mb-4 block">← Tillbaka</button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Produkt–Lager Tilldelningar</h1>
              <p className="text-primary-200">Tilldela dina produkter till lagerpartners</p>
            </div>
            <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-white text-primary-900 font-bold rounded-xl hover:bg-primary-50 transition">
              + Ny tilldelning
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[{ label: 'Totalt', value: assignments.length }, { label: 'Primära', value: primaryCount }, { label: 'Aktiva', value: activeCount }].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-primary-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-2 border-primary-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ny tilldelning</h2>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Produkt</label>
                <select name="product_id" value={form.product_id} onChange={handleChange} required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none">
                  <option value="">Välj produkt...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name || p.title} ({p.sku})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Lager</label>
                <select name="warehouse_id" value={form.warehouse_id} onChange={handleChange} required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none">
                  <option value="">Välj lager...</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.partner_name}{w.city ? ` – ${w.city}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Lagersaldo</label>
                <input name="stock_quantity" type="number" min={0} value={form.stock_quantity} onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Prioritet</label>
                <input name="priority" type="number" value={form.priority} onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" name="is_primary" checked={form.is_primary} onChange={handleChange} className="w-5 h-5 accent-primary-900" />
                <label className="font-semibold text-gray-700">Primärt lager för produkten</label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-600 mb-1">Anteckningar</label>
                <input name="notes" value={form.notes} onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
              </div>
              <div className="md:col-span-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition">Avbryt</button>
                <button type="submit" disabled={saving} className="px-6 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50">
                  {saving ? 'Sparar...' : 'Spara tilldelning'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {assignments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-lg font-bold text-gray-400 mb-4">Lager</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Inga tilldelningar ännu</h2>
            <p className="text-gray-500">Tilldela produkter till lagerpartners för att optimera leveranser.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Produkt', 'Lager', 'Saldo', 'Status', 'Prioritet'].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-sm font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignments.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{a.products?.name || a.products?.title || '–'}</p>
                      <p className="text-xs text-gray-400">{a.products?.sku}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{a.warehouse_partners?.partner_name || '–'}</p>
                      <p className="text-xs text-gray-400">{a.warehouse_partners?.city}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">{a.stock_quantity}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {a.is_primary && <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-900 rounded-full font-semibold w-fit">Primärt</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold w-fit ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {a.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{a.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
