'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertIcon } from '@/app/components/BrandIcons';

const SECTIONS = ['Profil & Shop', 'Adress', 'Bank & Utbetalning'];

export default function SellerSettingsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    shop_url: '',
    shop_bio: '',
    address_line1: '',
    city: '',
    postal_code: '',
    personal_id_number: '',
    bank_name: '',
    bank_clearing: '',
    bank_account: '',
    bank_account_verified: false,
  });

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const res = await fetch(`/api/sellers/${id}/profile`);
        const data = await res.json();
        if (data.seller) setForm(prev => ({ ...prev, ...data.seller }));
        if (data.profile) setProfileForm(prev => ({ ...prev, ...data.profile }));
      } catch (e) {
        setError('Kunde inte hämta säljarinfo');
      } finally {
        setLoading(false);
      }
    };
    fetchSeller();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/sellers/${id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seller: form, profile: profileForm }),
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
          <h1 className="text-3xl font-bold">Säljarinställningar</h1>
          <p className="text-primary-200">{profileForm.full_name || profileForm.email}</p>
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
              <h2 className="text-xl font-bold text-gray-900">Profil & Shop</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Namn</label>
                  <input name="full_name" value={profileForm.full_name || ''} onChange={handleProfileChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Telefon</label>
                  <input name="phone" value={profileForm.phone || ''} onChange={handleProfileChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Shop-URL (unik)</label>
                  <input name="shop_url" value={form.shop_url || ''} onChange={handleChange} placeholder="mitt-shopnamn"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Shop-bio</label>
                  <textarea name="shop_bio" value={form.shop_bio || ''} onChange={handleChange} rows={3}
                    placeholder="Berätta om dig själv..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none resize-none" />
                </div>
              </div>
            </>
          )}

          {activeSection === 1 && (
            <>
              <h2 className="text-xl font-bold text-gray-900">Adress</h2>
              <p className="text-sm text-gray-500">Används för skatteändamål och eventuella leveranser.</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Gatuadress</label>
                  <input name="address_line1" value={form.address_line1 || ''} onChange={handleChange}
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
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Personnummer</label>
                  <input name="personal_id_number" value={form.personal_id_number || ''} onChange={handleChange}
                    placeholder="YYYYMMDD-XXXX"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                  <p className="text-xs text-gray-400 mt-1">Krävs för skattedeklaration vid utbetalning</p>
                </div>
              </div>
            </>
          )}

          {activeSection === 2 && (
            <>
              <h2 className="text-xl font-bold text-gray-900">Bank & Utbetalning</h2>
              <p className="text-sm text-gray-500">Din provision betalas ut till dessa bankuppgifter.</p>
              <div className="grid md:grid-cols-2 gap-4">
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
              </div>
              <div className={`p-4 rounded-xl flex items-center gap-3 ${form.bank_account_verified ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <span className="text-xl">{form.bank_account_verified ? '✅' : '⏳'}</span>
                <div>
                  <p className="font-semibold text-gray-900">
                    {form.bank_account_verified ? 'Bankkonto verifierat' : 'Bankkonto ej verifierat'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {form.bank_account_verified ? 'Utbetalningar är aktiverade' : 'GoalSquad verifierar ditt bankkonto innan utbetalning'}
                  </p>
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
