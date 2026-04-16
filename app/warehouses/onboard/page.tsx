'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { LogisticsIcon, ShopIcon, DashboardIcon, TrophyIcon } from '@/app/components/BrandIcons';

export default function WarehouseOnboardPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    companyName: '',
    orgNumber: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    city: '',
    country: 'SE',
    capacity: '',
    packagesPerDay: '',
    services: [] as string[],
  });

  const STEPS = ['Uppgifter', 'Tjänster', 'Kontakt', 'Klart'];

  const SERVICES = [
    { id: 'storage', label: 'Lagring', icon: <ShopIcon size={24} /> },
    { id: 'fulfillment', label: 'Orderhantering', icon: <DashboardIcon size={24} /> },
    { id: 'shipping', label: 'Frakt', icon: <LogisticsIcon size={24} /> },
    { id: 'returns', label: 'Returhantering', icon: <ShopIcon size={24} /> },
  ];

  const toggleService = (serviceId: string) => {
    setForm((f) => ({
      ...f,
      services: f.services.includes(serviceId)
        ? f.services.filter((s) => s !== serviceId)
        : [...f.services, serviceId],
    }));
  };

  const handleNext = () => {
    setError('');
    if (step === 0 && (!form.companyName || !form.orgNumber || !form.packagesPerDay)) {
      setError('Fyll i företagsnamn, organisationsnummer och paket per dag');
      return;
    }
    if (step === 1 && form.services.length === 0) {
      setError('Välj minst en tjänst');
      return;
    }
    if (step === 2 && (!form.contactName || !form.contactEmail)) {
      setError('Fyll i kontaktnamn och e-post');
      return;
    }
    if (step < 3) setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/warehouses/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registrering misslyckades');
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary-900 font-semibold hover:text-primary-600 mb-8 transition"
        >
          ← Tillbaka
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <LogisticsIcon size={64} />
          </div>
          <h1 className="text-4xl font-bold text-primary-900 mb-4">Bli Lagerpartner</h1>
          <p className="text-gray-600">
            Registrera ditt lager för att bli en del av GoalSqurets logistiknätverk
          </p>
        </motion.div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                    i < step
                      ? 'bg-primary-900 text-white'
                      : i === step
                      ? 'bg-primary-900 text-white ring-4 ring-primary-200'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {i < step ? <TrophyIcon size={16} className="text-white" /> : i + 1}
                </div>
                <span className="text-xs font-semibold text-gray-600">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-1 transition ${i < step ? 'bg-primary-900' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Company Info */}
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">Företagsinformation</h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Företagsnamn *
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                  placeholder="Ditt företags namn"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Organisationsnummer *
                </label>
                <input
                  type="text"
                  value={form.orgNumber}
                  onChange={(e) => setForm({ ...form, orgNumber: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                  placeholder="XXXXXX-XXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kapacitet
                </label>
                <input
                  type="text"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                  placeholder="T.ex. 10 000 pallplatser"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Paket per dag *
                </label>
                <input
                  type="number"
                  value={form.packagesPerDay}
                  onChange={(e) => setForm({ ...form, packagesPerDay: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                  placeholder="T.ex. 5000"
                  min="0"
                />
              </div>
            </div>
          )}

          {/* Step 2: Services */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">Vilka tjänster erbjuder ni?</h2>
              <div className="grid grid-cols-2 gap-4">
                {SERVICES.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={`p-6 rounded-xl border-2 transition ${
                      form.services.includes(service.id)
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex justify-center mb-3 text-primary-900">
                      {service.icon}
                    </div>
                    <span className="font-semibold text-gray-900">{service.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Contact */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-primary-900 mb-6">Kontaktuppgifter</h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kontaktnamn *
                </label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                  placeholder="Ditt namn"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  E-post *
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                  placeholder="din@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={form.contactPhone}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                  placeholder="+46 XX XXX XX XX"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stad
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                  placeholder="Din stad"
                />
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-primary-900 mb-4">Tack för din registrering!</h2>
              <p className="text-gray-600 mb-8">
                Vi har mottagit din ansökan och återkommer inom kort.
              </p>
              <Link
                href="/"
                className="inline-block px-8 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-700 transition"
              >
                Till startsidan
              </Link>
            </div>
          )}

          {/* Navigation */}
          {step < 3 && (
            <div className="flex gap-4 mt-8">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex-1 px-6 py-3 border-2 border-primary-900 text-primary-900 rounded-xl font-bold hover:bg-primary-50 transition"
                >
                  Tillbaka
                </button>
              )}
              {step === 2 ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {loading ? 'Skickar...' : 'Skicka ansökan'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex-1 px-6 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-700 transition"
                >
                  Nästa
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
