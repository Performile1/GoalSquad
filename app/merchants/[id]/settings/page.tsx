'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MerchantIcon, AlertIcon } from '@/app/components/BrandIcons';

const SECTIONS = ['Företagsinfo', 'Kontakt & Adress', 'Ekonomi & Bank', 'Verifiering'];

export default function MerchantSettingsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    merchant_name: '',
    business_name: '',
    description: '',
    logo_url: '',
    website: '',
    // Contact
    email: '',
    phone: '',
    contact_person: '',
    // Address
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: 'SE',
    // Finance
    org_number: '',
    vat_number: '',
    bank_name: '',
    bank_clearing: '',
    bank_account: '',
    iban: '',
    bic: '',
    verification_status: '',
  });

  useEffect(() => {
    const fetchMerchant = async () => {
      try {
        const res = await fetch(`/api/merchants/${id}`);
        const data = await res.json();
        if (data.merchant) {
          setForm(prev => ({ ...prev, ...data.merchant }));
        }
      } catch (e) {
        setError('Kunde inte hämta företagsinfo');
      } finally {
        setLoading(false);
      }
    };
    fetchMerchant();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/merchants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
          <div className="flex items-center gap-4">
            <MerchantIcon size={40} />
            <div>
              <h1 className="text-3xl font-bold">Inställningar</h1>
              <p className="text-primary-200">{form.merchant_name || form.business_name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Section tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {SECTIONS.map((s, i) => (
            <button
              key={s}
              onClick={() => setActiveSection(i)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                activeSection === i
                  ? 'bg-primary-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-xl text-green-700 font-semibold">{success}</div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-xl text-red-700 flex items-center gap-2">
            <AlertIcon size={16} />{error}
          </div>
        )}

        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm p-8 space-y-6"
        >
          {/* 0: Företagsinfo */}
          {activeSection === 0 && (
            <>
              <h2 className="text-xl font-bold text-gray-900">Företagsinfo</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Företagsnamn</label>
                  <input name="merchant_name" value={form.merchant_name} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Visningsnamn</label>
                  <input name="business_name" value={form.business_name || ''} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Beskrivning</label>
                  <textarea name="description" value={form.description || ''} onChange={handleChange} rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Webbplats</label>
                  <input name="website" value={form.website || ''} onChange={handleChange} placeholder="https://"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Logo URL</label>
                  <input name="logo_url" value={form.logo_url || ''} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
              </div>
            </>
          )}

          {/* 1: Kontakt & Adress */}
          {activeSection === 1 && (
            <>
              <h2 className="text-xl font-bold text-gray-900">Kontakt & Adress</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">E-post</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Telefon</label>
                  <input name="phone" value={form.phone || ''} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Kontaktperson</label>
                  <input name="contact_person" value={form.contact_person || ''} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Land</label>
                  <select name="country" value={form.country} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none">
                    <option value="SE">Sverige</option>
                    <option value="NO">Norge</option>
                    <option value="DK">Danmark</option>
                    <option value="FI">Finland</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Adress</label>
                  <input name="address_line1" value={form.address_line1 || ''} onChange={handleChange} placeholder="Gatuadress"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none mb-2" />
                  <input name="address_line2" value={form.address_line2 || ''} onChange={handleChange} placeholder="Adressrad 2 (valfritt)"
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

          {/* 2: Ekonomi & Bank */}
          {activeSection === 2 && (
            <>
              <h2 className="text-xl font-bold text-gray-900">Ekonomi & Bank</h2>
              <p className="text-sm text-gray-500">Bankuppgifter används för utbetalning av försäljningsintäkter.</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Organisationsnummer</label>
                  <input name="org_number" value={form.org_number || ''} onChange={handleChange} placeholder="556xxx-xxxx"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Momsregistreringsnummer</label>
                  <input name="vat_number" value={form.vat_number || ''} onChange={handleChange} placeholder="SE556xxxxxxxx01"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Bank</label>
                  <input name="bank_name" value={form.bank_name || ''} onChange={handleChange} placeholder="t.ex. Swedbank"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Clearingnummer</label>
                  <input name="bank_clearing" value={form.bank_clearing || ''} onChange={handleChange} placeholder="8105-3"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Kontonummer</label>
                  <input name="bank_account" value={form.bank_account || ''} onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">IBAN (internationellt)</label>
                  <input name="iban" value={form.iban || ''} onChange={handleChange} placeholder="SE45 5000 0000 0583 9825 7466"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">BIC/SWIFT</label>
                  <input name="bic" value={form.bic || ''} onChange={handleChange} placeholder="SWEDSESS"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
              </div>
            </>
          )}

          {/* 3: Verifiering */}
          {activeSection === 3 && (
            <>
              <h2 className="text-xl font-bold text-gray-900">Verifieringsstatus</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Företagsverifiering</p>
                    <p className="text-sm text-gray-500">GoalSquad verifierar organisationsnummer och momsregistrering</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    form.verification_status === 'approved' ? 'bg-green-100 text-green-700' :
                    form.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {form.verification_status === 'approved' ? '✓ Godkänd' :
                     form.verification_status === 'pending' ? 'Väntar' : 'Ej verifierad'}
                  </span>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {activeSection !== 3 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50"
            >
              {saving ? 'Sparar...' : 'Spara inställningar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
