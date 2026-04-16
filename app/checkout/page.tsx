'use client';

import { useState } from 'react';
import Link from 'next/link';

type Step = 'delivery' | 'payment' | 'confirm';

export default function CheckoutPage() {
  const [step, setStep] = useState<Step>('delivery');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [warehouse, setWarehouse] = useState<any>(null);
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);
  const [warehouseError, setWarehouseError] = useState('');

  const findWarehouse = async () => {
    if (!postalCode || postalCode.length < 4) return;
    setLoadingWarehouse(true);
    setWarehouseError('');
    try {
      const res = await fetch(`/api/warehouses/find?postalCode=${postalCode}&country=SE`);
      const data = await res.json();
      if (data.warehouse) {
        setWarehouse(data.warehouse);
      } else {
        setWarehouseError('Ingen aktiv lagerplats hittades för detta postnummer.');
      }
    } catch {
      setWarehouseError('Kunde inte hämta lagerinfo. Försök igen.');
    } finally {
      setLoadingWarehouse(false);
    }
  };

  const steps: { id: Step; label: string }[] = [
    { id: 'delivery', label: 'Leverans' },
    { id: 'payment', label: 'Betalning' },
    { id: 'confirm', label: 'Bekräftelse' },
  ];

  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Kassa</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  i <= stepIndex
                    ? 'bg-primary-900 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < stepIndex ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium ${i <= stepIndex ? 'text-primary-900' : 'text-gray-400'}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 ml-2 ${i < stepIndex ? 'bg-primary-900' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step: Delivery */}
        {step === 'delivery' && (
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Leveransuppgifter</h2>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Förnamn & Efternamn</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Anna Andersson"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="070-123 45 67"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">E-post</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@email.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Adress</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Storgatan 1"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Postnummer</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      onBlur={findWarehouse}
                      placeholder="123 45"
                      maxLength={6}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Stad</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Stockholm"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Warehouse info */}
              {loadingWarehouse && (
                <div className="p-4 bg-blue-50 rounded-lg text-blue-600 text-sm">
                  Söker närmaste lager...
                </div>
              )}
              {warehouse && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-semibold text-sm">
                    ✓ Levereras från {warehouse.name} ({warehouse.city})
                  </p>
                  <p className="text-green-600 text-xs mt-1">
                    Leveranstid: 2–4 vardagar
                  </p>
                </div>
              )}
              {warehouseError && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                  {warehouseError}
                </div>
              )}
            </div>

            <button
              onClick={() => setStep('payment')}
              disabled={!name || !email || !address || !postalCode || !city}
              className="mt-8 w-full bg-primary-900 text-white font-semibold py-4 rounded-xl hover:bg-primary-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Fortsätt till betalning →
            </button>
          </div>
        )}

        {/* Step: Payment */}
        {step === 'payment' && (
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Betalning</h2>
            <div className="space-y-4">
              {[
                { id: 'card', label: 'Kort (Visa / Mastercard)', icon: '💳' },
                { id: 'swish', label: 'Swish', icon: '📱' },
                { id: 'invoice', label: 'Faktura (Klarna)', icon: '📄' },
              ].map((method) => (
                <label
                  key={method.id}
                  className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-primary-600 transition"
                >
                  <input type="radio" name="payment" value={method.id} className="accent-primary-900" />
                  <span className="text-2xl">{method.icon}</span>
                  <span className="font-medium text-gray-800">{method.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setStep('delivery')}
                className="flex-1 py-4 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                ← Tillbaka
              </button>
              <button
                onClick={() => setStep('confirm')}
                className="flex-1 bg-primary-900 text-white font-semibold py-4 rounded-xl hover:bg-primary-600 transition"
              >
                Granska order →
              </button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="text-7xl mb-4">✅</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Order lagd!</h2>
            <p className="text-gray-500 mb-8">
              Tack {name}! Du får en bekräftelse till {email}.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/orders"
                className="px-6 py-3 bg-primary-900 text-white font-semibold rounded-xl hover:bg-primary-600 transition"
              >
                Mina ordrar
              </Link>
              <Link
                href="/products"
                className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
              >
                Fortsätt handla
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
