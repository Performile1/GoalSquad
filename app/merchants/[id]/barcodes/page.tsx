'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface Barcode {
  id: string;
  product_id: string;
  barcode_type: string;
  barcode_value: string;
  is_primary: boolean;
  created_at: string;
  products?: { name?: string; title?: string; sku?: string };
}

interface Product { id: string; name?: string; title?: string; sku?: string }

const BARCODE_TYPES = ['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E', 'Code128', 'QR', 'ITF-14', 'GS1-128'];

export default function BarcodesPage() {
  const { id } = useParams();
  const router = useRouter();
  const [barcodes, setBarcodes] = useState<Barcode[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    product_id: '', barcode_type: 'EAN-13', barcode_value: '', is_primary: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      const [barcodesRes, productsRes] = await Promise.all([
        fetch(`/api/merchants/${id}/barcodes`),
        fetch(`/api/merchants/${id}/products`),
      ]);
      if (barcodesRes.ok) setBarcodes((await barcodesRes.json()).barcodes || []);
      if (productsRes.ok) setProducts((await productsRes.json()).products || []);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/merchants/${id}/barcodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setBarcodes(prev => [data.barcode, ...prev]);
        setShowForm(false);
        setForm({ product_id: '', barcode_type: 'EAN-13', barcode_value: '', is_primary: false });
      }
    } finally {
      setSaving(false);
    }
  };

  const filtered = barcodes.filter(b =>
    b.barcode_value.toLowerCase().includes(search.toLowerCase()) ||
    (b.products?.name || b.products?.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.products?.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-pulse text-gray-500">Laddar...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-900 to-primary-600 text-white py-10">
        <div className="max-w-6xl mx-auto px-4">
          <button onClick={() => router.back()} className="text-primary-200 hover:text-white text-sm mb-4 block">← Tillbaka</button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Streckkoder</h1>
              <p className="text-primary-200">Hantera EAN/UPC/QR-koder för dina produkter</p>
            </div>
            <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-white text-primary-900 font-bold rounded-xl hover:bg-primary-50 transition">
              + Lägg till streckkod
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Totalt', value: barcodes.length },
            { label: 'Primära', value: barcodes.filter(b => b.is_primary).length },
            { label: 'Produkter med kod', value: new Set(barcodes.map(b => b.product_id)).size },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-primary-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Add Barcode Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-2 border-primary-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lägg till streckkod</h2>
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
                <label className="block text-sm font-semibold text-gray-600 mb-1">Typ</label>
                <select name="barcode_type" value={form.barcode_type} onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none">
                  {BARCODE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-600 mb-1">Streckkodsvalue</label>
                <input name="barcode_value" value={form.barcode_value} onChange={handleChange} required
                  placeholder="t.ex. 7318690075557"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none font-mono" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" name="is_primary" checked={form.is_primary} onChange={handleChange} className="w-5 h-5 accent-primary-900" />
                <label className="font-semibold text-gray-700">Primär streckkod för produkten</label>
              </div>
              <div className="md:col-span-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition">Avbryt</button>
                <button type="submit" disabled={saving} className="px-6 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50">
                  {saving ? 'Sparar...' : 'Spara streckkod'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Search */}
        <div className="mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök på streckkod, produkt eller SKU..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none bg-white" />
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-4xl mb-4">🔢</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{search ? 'Inga träffar' : 'Inga streckkoder ännu'}</h2>
            <p className="text-gray-500">{search ? 'Prova ett annat sökord.' : 'Lägg till EAN, UPC eller QR-koder för dina produkter.'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Produkt', 'Typ', 'Streckkod', 'Status'].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-sm font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{b.products?.name || b.products?.title || '–'}</p>
                      <p className="text-xs text-gray-400">{b.products?.sku}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-primary-50 text-primary-900 rounded text-sm font-mono font-semibold">{b.barcode_type}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-900 text-sm">{b.barcode_value}</td>
                    <td className="px-6 py-4">
                      {b.is_primary && <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-900 rounded-full font-semibold">Primär</span>}
                    </td>
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
