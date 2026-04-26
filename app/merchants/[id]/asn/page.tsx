'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface ASNNotice {
  id: string;
  asn_number: string;
  warehouse_id: string;
  status: string;
  expected_arrival_date: string | null;
  actual_arrival_date: string | null;
  total_pallets: number | null;
  total_boxes: number | null;
  notes: string | null;
  created_at: string;
  warehouse_partners?: { partner_name?: string; city?: string };
}

interface Warehouse { id: string; partner_name: string; city?: string }

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-blue-100 text-blue-700',
  received: 'bg-green-100 text-green-700',
  processing: 'bg-purple-100 text-purple-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Väntande', sent: 'Skickad', received: 'Mottagen',
  processing: 'Behandlas', completed: 'Klar', cancelled: 'Avbruten',
};

export default function ASNPage() {
  const { id } = useParams();
  const router = useRouter();
  const [notices, setNotices] = useState<ASNNotice[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({
    warehouse_id: '', expected_arrival_date: '',
    total_pallets: '', total_boxes: '', notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      const [noticesRes, warehousesRes] = await Promise.all([
        fetch(`/api/merchants/${id}/asn`),
        fetch(`/api/warehouses`),
      ]);
      if (noticesRes.ok) setNotices((await noticesRes.json()).notices || []);
      if (warehousesRes.ok) setWarehouses((await warehousesRes.json()).warehouses || []);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/merchants/${id}/asn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          total_pallets: form.total_pallets ? Number(form.total_pallets) : null,
          total_boxes: form.total_boxes ? Number(form.total_boxes) : null,
          expected_arrival_date: form.expected_arrival_date || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotices(prev => [data.notice, ...prev]);
        setShowForm(false);
        setForm({ warehouse_id: '', expected_arrival_date: '', total_pallets: '', total_boxes: '', notes: '' });
      }
    } finally {
      setSaving(false);
    }
  };

  const filtered = statusFilter ? notices.filter(n => n.status === statusFilter) : notices;

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-pulse text-gray-500">Laddar...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-900 to-primary-600 text-white py-10">
        <div className="max-w-6xl mx-auto px-4">
          <button onClick={() => router.back()} className="text-primary-200 hover:text-white text-sm mb-4 block">← Tillbaka</button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">ASN-meddelanden</h1>
              <p className="text-primary-200">Advanced Shipment Notices – Förhandsavisering till lager</p>
            </div>
            <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-white text-primary-900 font-bold rounded-xl hover:bg-primary-50 transition">
              + Ny ASN
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Totalt', value: notices.length },
            { label: 'Skickade', value: notices.filter(n => n.status === 'sent').length },
            { label: 'Mottagna', value: notices.filter(n => n.status === 'received').length },
            { label: 'Väntande', value: notices.filter(n => n.status === 'pending').length },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-primary-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* New ASN Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-2 border-primary-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ny ASN-avisering</h2>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Destinationslager</label>
                <select name="warehouse_id" value={form.warehouse_id} onChange={handleChange} required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none">
                  <option value="">Välj lager...</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.partner_name}{w.city ? ` – ${w.city}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Förväntat ankomstdatum</label>
                <input name="expected_arrival_date" type="date" value={form.expected_arrival_date} onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Antal pallar</label>
                <input name="total_pallets" type="number" min={0} value={form.total_pallets} onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Antal kartonger</label>
                <input name="total_boxes" type="number" min={0} value={form.total_boxes} onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-600 mb-1">Anteckningar</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none resize-none" />
              </div>
              <div className="md:col-span-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition">Avbryt</button>
                <button type="submit" disabled={saving} className="px-6 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50">
                  {saving ? 'Sparar...' : 'Skicka ASN'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {['', 'pending', 'sent', 'received', 'processing', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${statusFilter === s ? 'bg-primary-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {s === '' ? 'Alla' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-lg font-bold text-gray-400 mb-4">ASN</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Inga ASN-meddelanden</h2>
            <p className="text-gray-500">Skicka en förhandsavisering till lagret innan du skickar gods.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(notice => (
              <motion.div key={notice.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-900 font-mono">{notice.asn_number}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[notice.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[notice.status] || notice.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {notice.warehouse_partners?.partner_name}{notice.warehouse_partners?.city && ` – ${notice.warehouse_partners.city}`}
                  </p>
                  {notice.expected_arrival_date && (
                    <p className="text-xs text-gray-400 mt-1">Förväntat: {new Date(notice.expected_arrival_date).toLocaleDateString('sv-SE')}</p>
                  )}
                  {notice.notes && <p className="text-xs text-gray-400">{notice.notes}</p>}
                </div>
                <div className="text-right text-sm text-gray-500">
                  {notice.total_pallets != null && <p>{notice.total_pallets} pallar</p>}
                  {notice.total_boxes != null && <p>{notice.total_boxes} kartonger</p>}
                  <p className="text-xs">{new Date(notice.created_at).toLocaleDateString('sv-SE')}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
