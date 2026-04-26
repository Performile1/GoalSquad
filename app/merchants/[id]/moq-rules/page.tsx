'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface MOQRule {
  id: string;
  product_id: string;
  postal_code_from: string;
  postal_code_to: string;
  moq: number;
  moq_unit: string;
  moq_discount_percentage: number | null;
  warehouse_id: string | null;
  priority: number;
  is_active: boolean;
  description: string | null;
  products?: { name?: string; title?: string; sku?: string };
  warehouse_partners?: { partner_name?: string };
}

interface Product { id: string; name?: string; title?: string; sku?: string }
interface Warehouse { id: string; partner_name: string }

export default function MOQRulesPage() {
  const { id } = useParams();
  const router = useRouter();
  const [rules, setRules] = useState<MOQRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    product_id: '', postal_code_from: '', postal_code_to: '',
    moq: 1, moq_unit: 'pieces', moq_discount_percentage: '',
    warehouse_id: '', priority: 0, description: '', is_active: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      const [rulesRes, productsRes, warehousesRes] = await Promise.all([
        fetch(`/api/merchants/${id}/moq-rules`),
        fetch(`/api/merchants/${id}/products`),
        fetch(`/api/warehouses`),
      ]);
      if (rulesRes.ok) setRules((await rulesRes.json()).rules || []);
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
      const res = await fetch(`/api/merchants/${id}/moq-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          moq: Number(form.moq),
          priority: Number(form.priority),
          moq_discount_percentage: form.moq_discount_percentage ? Number(form.moq_discount_percentage) : null,
          warehouse_id: form.warehouse_id || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRules(prev => [data.rule, ...prev]);
        setShowForm(false);
        setForm({ product_id: '', postal_code_from: '', postal_code_to: '', moq: 1, moq_unit: 'pieces', moq_discount_percentage: '', warehouse_id: '', priority: 0, description: '', is_active: true });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-pulse text-gray-500">Laddar...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-900 to-primary-600 text-white py-10">
        <div className="max-w-6xl mx-auto px-4">
          <button onClick={() => router.back()} className="text-primary-200 hover:text-white text-sm mb-4 block">← Tillbaka</button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Regionala MOQ-regler</h1>
              <p className="text-primary-200">Minimum order-kvantitet baserat på postnummerområde</p>
            </div>
            <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-white text-primary-900 font-bold rounded-xl hover:bg-primary-50 transition">
              + Ny regel
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Totalt', value: rules.length },
            { label: 'Aktiva', value: rules.filter(r => r.is_active).length },
            { label: 'Inaktiva', value: rules.filter(r => !r.is_active).length },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-primary-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* New Rule Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-2 border-primary-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ny MOQ-regel</h2>
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
                <label className="block text-sm font-semibold text-gray-600 mb-1">Lager (valfritt)</label>
                <select name="warehouse_id" value={form.warehouse_id} onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none">
                  <option value="">Inget specifikt lager</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.partner_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Postnummer från</label>
                <input name="postal_code_from" value={form.postal_code_from} onChange={handleChange} required placeholder="10000"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Postnummer till</label>
                <input name="postal_code_to" value={form.postal_code_to} onChange={handleChange} required placeholder="19999"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Minimum antal (MOQ)</label>
                <input name="moq" type="number" min={1} value={form.moq} onChange={handleChange} required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Enhet</label>
                <select name="moq_unit" value={form.moq_unit} onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none">
                  <option value="pieces">Stycken</option>
                  <option value="boxes">Kartonger</option>
                  <option value="pallets">Pallar</option>
                  <option value="kg">Kilogram</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Rabatt vid MOQ (%)</label>
                <input name="moq_discount_percentage" type="number" step="0.01" min={0} max={100} value={form.moq_discount_percentage} onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Prioritet</label>
                <input name="priority" type="number" value={form.priority} onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-600 mb-1">Beskrivning</label>
                <input name="description" value={form.description} onChange={handleChange} placeholder="t.ex. Stockholmsregionen bulk-kampanj"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
              </div>
              <div className="md:col-span-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition">Avbryt</button>
                <button type="submit" disabled={saving} className="px-6 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50">
                  {saving ? 'Sparar...' : 'Spara regel'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Rules List */}
        {rules.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-lg font-bold text-gray-400 mb-4">MOQ</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Inga MOQ-regler ännu</h2>
            <p className="text-gray-500">Lägg till regionala MOQ-regler för att styra minsta orderkvantitet per postnummerområde.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => (
              <motion.div key={rule.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${rule.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <p className="font-bold text-gray-900">{rule.products?.name || rule.products?.title || '–'}</p>
                    {rule.products?.sku && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">SKU: {rule.products.sku}</span>}
                  </div>
                  <p className="text-sm text-gray-600">
                    {rule.postal_code_from}–{rule.postal_code_to}
                    {rule.warehouse_partners?.partner_name && <span className="ml-2 text-gray-400">· {rule.warehouse_partners.partner_name}</span>}
                  </p>
                  {rule.description && <p className="text-xs text-gray-400 mt-1">{rule.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-900">{rule.moq} <span className="text-sm font-normal text-gray-500">{rule.moq_unit}</span></p>
                  {rule.moq_discount_percentage && <p className="text-sm text-green-600 font-semibold">-{rule.moq_discount_percentage}% rabatt</p>}
                  <span className="text-xs text-gray-400">Prio: {rule.priority}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
