'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckIcon } from '@/app/components/BrandIcons';
import { useCart } from '@/app/hooks/useCart';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api-client';

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
  const [paymentError, setPaymentError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const { items, total, loaded } = useCart();
  const { user, signUp } = useAuth();

  const submitCheckout = async () => {
    if (!items.length || !name || !email || !phone || !address || !postalCode || !city) return;
    setSubmitting(true);
    setPaymentError('');
    try {
      if (!user && createAccount) {
        if (accountPassword.length < 8) throw new Error('Lösenordet måste vara minst 8 tecken.');
        const signup = await signUp(email, accountPassword, name);
        if (signup.error && !signup.error.message.toLowerCase().includes('already registered')) throw signup.error;
      }
      const response = await apiFetch('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          shippingAddress: { name, email, phone, address, city, postalCode, country: 'SE' },
          warehouseId: warehouse?.id || null,
          sellerId: items[0]?.sellerId || null,
          campaignId: items[0]?.campaignId || null,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.sessionUrl) throw new Error(data.error || 'Kunde inte starta betalningen.');
      window.location.assign(data.sessionUrl);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Kunde inte starta betalningen.');
    } finally {
      setSubmitting(false);
    }
  };

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

  if (!loaded) return <div className="min-h-screen flex items-center justify-center text-gray-500">Laddar varukorg...</div>;
  if (!items.length) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4"><h1 className="text-2xl font-bold">Varukorgen är tom</h1><Link href="/products" className="bg-primary-900 text-white px-6 py-3 rounded-xl font-semibold">Till produkterna</Link></div>;

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
                {i < stepIndex ? <CheckIcon size={16} /> : i + 1}
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
                    name="name"
                    autoComplete="name"
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
                    name="tel"
                    autoComplete="tel"
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
                  name="email"
                  autoComplete="email"
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
                  name="address"
                  autoComplete="street-address"
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
                      name="postalCode"
                      autoComplete="postal-code"
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
                    name="city"
                    autoComplete="address-level2"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Stockholm"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Warehouse info */}
              {loadingWarehouse && (
                <div className="p-4 bg-primary-50 rounded-lg text-primary-900 text-sm">
                  Söker närmaste lager...
                </div>
              )}
              {warehouse && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-semibold text-sm">
                    Levereras från {warehouse.name} ({warehouse.city})
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
                { id: 'card', label: 'Kort (Visa / Mastercard)', icon: '' },
                { id: 'swish', label: 'Swish', icon: '' },
                { id: 'invoice', label: 'Faktura (Klarna)', icon: '' },
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
            {!user && (
              <div className="mb-6 rounded-xl border border-primary-100 bg-primary-50 p-4 text-left">
                <label className="flex items-center gap-3 text-sm font-semibold text-primary-900"><input type="checkbox" checked={createAccount} onChange={(event) => setCreateAccount(event.target.checked)} className="h-4 w-4 accent-primary-900" />Skapa konto med dessa uppgifter</label>
                {createAccount && <input type="password" name="new-password" autoComplete="new-password" value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} placeholder="Välj lösenord (minst 8 tecken)" className="mt-3 w-full rounded-lg border-2 border-primary-100 px-4 py-3" />}
              </div>
            )}
            {paymentError && <p className="mb-4 rounded-lg bg-red-50 p-3 text-left text-sm font-semibold text-red-700">{paymentError}</p>}
            <p className="mb-4 text-left text-sm text-gray-600">Att betala: <strong>{total.toLocaleString('sv-SE')} kr</strong></p>
            <button onClick={submitCheckout} disabled={submitting} className="mb-6 w-full rounded-xl bg-primary-900 py-4 font-semibold text-white hover:bg-primary-600 disabled:opacity-50">{submitting ? 'Startar säker betalning...' : 'Fortsätt till säker betalning'}</button>
            <div className="mb-4 flex justify-center"><CheckIcon size={64} className="text-green-600" /></div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Granska din order</h2>
            <p className="text-gray-500 mb-8">
              Du skickas till Stripe för att slutföra betalningen. Bekräftelse skickas till {email}.
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
