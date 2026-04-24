'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertIcon } from '@/app/components/BrandIcons';

const SECTIONS = ['Lagerinfo', 'Kontakt & Adress', 'Postnummer & Territorium', 'API & Integrationer'];

export default function WarehouseSettingsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    partner_name: '',
    partner_code: '',
    hub_type: 'both',
    territory: 'SE',
    contact_email: '',
    contact_phone: '',
    address_line1: '',
    city: '',
    postal_code: '',
    country: 'SE',
    postal_code_ranges: '' as string,
    webhook_url: '',
    sla_throughput_hours: 24,
    sla_accuracy_percent: 99.8,
    price_per_inbound: 0,
    price_per_pallet: 0,
    price_per_split: 0,
  });

  useEffect(() => {
    const fetchWarehouse = async () => {
      try {
        const res = await fetch(`/api/warehouses/${id}`);
        const data = await res.json();
        if (data.warehouse) {
          const w = data.warehouse;
          setForm(prev => ({
            ...prev,
            ...w,
            postal_code_ranges: Array.isArray(w.postal_code_ranges)
              ? w.postal_code_ranges.join(', ')
              : (w.postal_code_ranges || ''),
          }));
        }
      } catch (e) {
        setError('Kunde inte hämta lagerinfo');
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouse();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...form,
        postal_code_ranges: form.postal_code_ranges
          ? form.postal_code_ranges.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        sla_throughput_hours: Number(form.sla_throughput_hours),
        sla_accuracy_percent: Number(form.sla_accuracy_percent),
        price_per_inbound: Number(form.price_per_inbound),
        price_per_pallet: Number(form.price_per_pallet),
        price_per_split: Number(form.price_per_split),
      };
      const res = await fetch(`/api/warehouses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Misslyckades');
      setSuccess('Inställningar sparade!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('Kunde inte spara inställningar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-gray-500">Laddar...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-900 to-primary-600 text-white py-10">
        <div className="max-w-4xl mx-auto px-4">
          <button onClick={() => router.back()} className="text-primary-200 hover:text-white text-sm mb-4 block">← Tillbaka</button>
          <h1 className="text-3xl font-bold">Lagerinställningar</h1>
          <p className="text-primary-200">{form.partner_name}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {SECTIONS.map((s, i) => (
            <button key={s} onClick={() => setActiveSection(i)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                activeSection === i ? 'bg-primary-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}>
              {s}
            </button>
          ))}
        </div>

        {success && <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-xl text-green-700 font-semibold">{success}</div>}
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl text-red-700 flex items-center gap-2"><AlertIcon size={16} />{error}</div>}

        <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm p-8 space-y-6">

          {activeSection === 0 && (
            <>
              <h2 className="text-xl font-bold text-gray-900">Lagerinfo</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Lagernamn</label>
                  <input name="partner_name" value={form.partner_name} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Lagerkod</label>
                  <input name="partner_code" value={form.partner_code || ''} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Hub-typ</label>
                  <select name="hub_type" value={form.hub_type} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none">
                    <option value="consolidation">Konsolidering</option>
                    <option value="split">Splitting</option>
                    <option value="both">Båda</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">SLA leveranstid (timmar)</label>
                  <input name="sla_throughput_hours" type="number" value={form.sla_throughput_hours} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">SLA noggrannhet (%)</label>
                  <input name="sla_accuracy_percent" type="number" step="0.1" value={form.sla_accuracy_percent} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 pt-2">Prissättning</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[['price_per_inbound', 'Pris per inbound (kr)'], ['price_per_pallet', 'Pris per pall (kr)'], ['price_per_split', 'Pris per split (kr)']].map(([name, label]) => (
                  <div key={name}>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">{label}</label>
                    <input name={name} type="number" step="0.01" value={(form as any)[name]} onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                  </div>
                ))}
              </div>
            </>
          )}

          {activeSection === 1 && (
            <>
              <h2 className="text-xl font-bold text-gray-900">Kontakt & Adress</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">E-post</label>
                  <input name="contact_email" type="email" value={form.contact_email || ''} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Telefon</label>
                  <input name="contact_phone" value={form.contact_phone || ''} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Adress</label>
                  <input name="address_line1" value={form.address_line1 || ''} onChange={handleChange} placeholder="Gatuadress"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Postnummer</label>
                  <input name="postal_code" value={form.postal_code || ''} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Ort</label>
                  <input name="city" value={form.city || ''} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
              </div>
            </>
          )}

          {activeSection === 2 && (
            <>
              <h2 className="text-xl font-bold text-gray-900">Postnummer & Territorium</h2>
              <p className="text-sm text-gray-500">Definiera vilka postnummer detta lager hanterar för MOQ och leveransrutter.</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Territorium (landskod)</label>
                  <select name="territory" value={form.territory} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none">
                    <option value="SE">Sverige</option>
                    <option value="NO">Norge</option>
                    <option value="DK">Danmark</option>
                    <option value="FI">Finland</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Postnummerintervall (kommaseparerade)</label>
                  <input name="postal_code_ranges" value={form.postal_code_ranges} onChange={handleChange}
                    placeholder="10000-19999, 20000-29999"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                  <p className="text-xs text-gray-400 mt-1">Används för automatisk lagerval vid MOQ-beställningar</p>
                </div>
              </div>
            </>
          )}

          {activeSection === 3 && (
            <>
              <h2 className="text-xl font-bold text-gray-900">API & Integrationer</h2>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Webhook URL</label>
                  <input name="webhook_url" value={form.webhook_url || ''} onChange={handleChange} placeholder="https://"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                  <p className="text-xs text-gray-400 mt-1">GoalSquad skickar order- och lagerhändelser till denna URL</p>
                </div>
              </div>
            </>
          )}
        </motion.div>

        <div className="mt-6 flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="px-8 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50">
            {saving ? 'Sparar...' : 'Spara inställningar'}
          </button>
        </div>
      </div>
    </div>
  );
}
