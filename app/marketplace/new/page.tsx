'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrophyIcon, UserIcon, CommunityIcon, SearchIcon, DashboardIcon, JerseyIcon, HandmadeIcon, EquipmentIcon, FoodIcon } from '@/app/components/BrandIcons';

const PLATFORM_FEE = 12;

const CATEGORIES = [
  { id: 'jersey', label: 'Tröjor & Kläder', icon: JerseyIcon },
  { id: 'handmade', label: 'Eget hantverk', icon: HandmadeIcon },
  { id: 'equipment', label: 'Utrustning', icon: EquipmentIcon },
  { id: 'food', label: 'Mat & Dryck', icon: FoodIcon },
  { id: 'other', label: 'Övrigt', icon: DashboardIcon },
];

const SELLER_TYPES = [
  { id: 'community', label: 'Förening / Klubb', icon: TrophyIcon },
  { id: 'class', label: 'Klass / Skolgrupp', icon: CommunityIcon },
  { id: 'individual', label: 'Privatperson / Säljare', icon: UserIcon },
];

export default function NewMarketplaceListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'jersey',
    sellerType: 'community',
    sellerName: '',
    communityName: '',
    location: '',
    stock: '1',
    shippingInfo: '',
    contactEmail: '',
  });

  const price = parseFloat(form.price) || 0;
  const feeAmount = price * (PLATFORM_FEE / 100);
  const sellerReceives = price - feeAmount;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/community-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          stock: parseInt(form.stock),
          platformFeePercent: PLATFORM_FEE,
        }),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const d = await res.json();
        alert(d.error || 'Något gick fel');
      }
    } catch {
      alert('Nätverksfel, försök igen');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full text-center bg-white border-2 border-primary-100 rounded-2xl p-12"
        >
          <div className="flex justify-center mb-4 bg-primary-50 rounded-full p-4">
            <TrophyIcon size={48} />
          </div>
          <h2 className="text-3xl font-bold text-primary-900 mb-3">Annons inskickad!</h2>
          <p className="text-gray-600 mb-2">
            Din produkt är nu under granskning av GoalSquad. Vi godkänner vanligtvis inom 1 arbetsdag.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Du får en bekräftelse till <strong>{form.contactEmail}</strong> när produkten är live.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/marketplace" className="px-6 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-700 transition">
              Se Marketplace →
            </Link>
            <button
              onClick={() => { setSuccess(false); setForm({ title: '', description: '', price: '', category: 'jersey', sellerType: 'community', sellerName: '', communityName: '', location: '', stock: '1', shippingInfo: '', contactEmail: '' }); setImagePreviews([]); setStep(1); }}
              className="px-6 py-3 border-2 border-primary-200 text-primary-900 rounded-xl font-semibold hover:bg-primary-50 transition"
            >
              Lägg upp ytterligare en produkt
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-900 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/marketplace" className="text-white/70 hover:text-white text-sm font-semibold mb-4 inline-block transition">
            ← Tillbaka till Marketplace
          </Link>
          <h1 className="text-4xl font-extrabold mb-2">Lägg upp din produkt</h1>
          <p className="text-white/70">
            Sätt ditt pris. GoalSquad tar {PLATFORM_FEE}% i förmedlingsavgift och hanterar betalningen säkert.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Fee info card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-primary-200 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <SearchIcon size={20} />
            <h3 className="font-bold text-primary-900 text-lg">Hur avgiften fungerar</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="bg-primary-50 rounded-xl p-4">
              <p className="text-3xl font-extrabold text-primary-900">
                {price > 0 ? `${price.toFixed(0)} kr` : '—'}
              </p>
              <p className="text-sm text-gray-600 mt-1">Kundens pris</p>
            </div>
            <div className="bg-primary-100 rounded-xl p-4">
              <p className="text-3xl font-extrabold text-primary-900">
                {price > 0 ? `${feeAmount.toFixed(0)} kr` : `${PLATFORM_FEE}%`}
              </p>
              <p className="text-sm text-gray-600 mt-1">GoalSquad-avgift ({PLATFORM_FEE}%)</p>
            </div>
            <div className="bg-primary-900 rounded-xl p-4">
              <p className="text-3xl font-extrabold text-white">
                {price > 0 ? `${sellerReceives.toFixed(0)} kr` : '—'}
              </p>
              <p className="text-sm text-white/70 mt-1">Du får utbetalt</p>
            </div>
          </div>
          {price <= 0 && (
            <p className="text-xs text-gray-400 mt-3 text-center">Ange ett pris nedan för att se beräkning</p>
          )}
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border-2 border-gray-100 p-8 space-y-8"
        >
          {/* Section 1: Säljare */}
          <div>
            <h2 className="text-xl font-bold text-primary-900 mb-5 pb-2 border-b border-gray-100">
              1. Vem säljer?
            </h2>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {SELLER_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setForm({ ...form, sellerType: t.id })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition ${
                    form.sellerType === t.id
                      ? 'border-primary-900 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <t.icon size={24} />
                  <span className="text-xs font-semibold text-primary-900 text-center">{t.label}</span>
                </button>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ditt namn / Säljarens namn *</label>
                <input required type="text" value={form.sellerName} onChange={(e) => setForm({ ...form, sellerName: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" placeholder="Anna Andersson" />
              </div>
              {(form.sellerType === 'community' || form.sellerType === 'class') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {form.sellerType === 'community' ? 'Föreningens namn' : 'Klassens / Skolans namn'}
                  </label>
                  <input type="text" value={form.communityName} onChange={(e) => setForm({ ...form, communityName: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" placeholder={form.sellerType === 'community' ? 'IFK Göteborg' : 'Klass 9B, Lundaskolan'} />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">E-post för avisering *</label>
                <input required type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" placeholder="din@email.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ort (valfritt)</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" placeholder="Stockholm" />
              </div>
            </div>
          </div>

          {/* Section 2: Produkt */}
          <div>
            <h2 className="text-xl font-bold text-primary-900 mb-5 pb-2 border-b border-gray-100">
              2. Produktinformation
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Produktnamn *</label>
                <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" placeholder="T.ex. IFK Göteborgs matchställ 2025" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Beskrivning *</label>
                <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none resize-none" placeholder="Beskriv produkten: material, storlekar, vad som ingår..." />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori *</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat.id })}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition ${
                        form.category === cat.id
                          ? 'border-primary-900 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <cat.icon size={20} />
                      <span className="text-xs font-semibold text-primary-900 text-center">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pris (kr) *</label>
                  <input required type="number" min="10" step="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" placeholder="299" />
                  {price > 0 && (
                    <p className="text-xs text-primary-700 mt-1 font-semibold">
                      Du får: {sellerReceives.toFixed(0)} kr per försäljning
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Antal tillgängliga *</label>
                  <input required type="number" min="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" placeholder="10" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Bilder */}
          <div>
            <h2 className="text-xl font-bold text-primary-900 mb-5 pb-2 border-b border-gray-100">
              3. Bilder
            </h2>
            <div
              className="border-2 border-dashed border-primary-300 rounded-xl p-8 text-center cursor-pointer hover:bg-primary-50 transition"
              onClick={() => document.getElementById('img-upload')?.click()}
            >
              <input id="img-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              <div className="flex justify-center mb-2">
                <DashboardIcon size={40} />
              </div>
              <p className="font-semibold text-primary-900">Klicka för att ladda upp bilder</p>
              <p className="text-sm text-gray-500">Max 5 bilder, JPG/PNG/WEBP</p>
            </div>
            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative w-24 h-24">
                    <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setImagePreviews(imagePreviews.filter((_, j) => j !== i))}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Frakt */}
          <div>
            <h2 className="text-xl font-bold text-primary-900 mb-5 pb-2 border-b border-gray-100">
              4. Leverans & frakt
            </h2>
            <div className="bg-primary-50 rounded-xl p-4 mb-4 text-sm text-primary-900">
              <strong>Viktigt:</strong> För egna produkter sköter du som säljare leveransen direkt till kunden. 
              GoalSquad hanterar betalningen och förmedlar sedan pengarna till dig minus {PLATFORM_FEE}% avgift.
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Leveransinformation för kunden *
              </label>
              <textarea
                required
                rows={3}
                value={form.shippingInfo}
                onChange={(e) => setForm({ ...form, shippingInfo: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none resize-none"
                placeholder="T.ex. 'Skickas inom 3-5 dagar via PostNord. Frakt 59 kr.' eller 'Upphämtning i Göteborg, kontakta mig för tid.'"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Skickar in annons...' : 'Skicka in för granskning →'}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              Annonsen granskas av GoalSquad innan den publiceras. Vanligtvis inom 1 arbetsdag.
            </p>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
