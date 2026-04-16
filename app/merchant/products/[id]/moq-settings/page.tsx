'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MOQSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Product info
  const [productName, setProductName] = useState('');

  // MOQ Settings
  const [moqEnabled, setMoqEnabled] = useState(false);
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState(10);
  const [moqUnit, setMoqUnit] = useState('pieces');
  const [moqDiscountPercentage, setMoqDiscountPercentage] = useState(0);
  const [allowPartialOrders, setAllowPartialOrders] = useState(true);
  const [consolidationRequired, setConsolidationRequired] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      const data = await response.json();

      setProductName(data.product.name);
      setMoqEnabled(data.product.moq_enabled || false);
      setMinimumOrderQuantity(data.product.minimum_order_quantity || 10);
      setMoqUnit(data.product.moq_unit || 'pieces');
      setMoqDiscountPercentage(data.product.moq_discount_percentage || 0);
      setAllowPartialOrders(data.product.allow_partial_orders !== false);
      setConsolidationRequired(data.product.consolidation_required || false);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/products/${params.id}/moq`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moqEnabled,
          minimumOrderQuantity,
          moqUnit,
          moqDiscountPercentage,
          allowPartialOrders,
          consolidationRequired,
        }),
      });

      if (response.ok) {
        alert('MOQ-inställningar sparade! ✅');
        router.push(`/merchant/products/${params.id}`);
      } else {
        alert('Kunde inte spara inställningar');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Ett fel uppstod');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="text-6xl mb-4 animate-bounce">📦</div>
          <p className="text-xl text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-primary-900 hover:text-primary-900 font-semibold mb-4"
          >
            ← Tillbaka
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📦 MOQ-inställningar
          </h1>
          <p className="text-gray-600">{productName}</p>
        </div>

        {/* Enable MOQ */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <label className="flex items-start gap-4 cursor-pointer">
            <input
              type="checkbox"
              checked={moqEnabled}
              onChange={(e) => setMoqEnabled(e.target.checked)}
              className="w-6 h-6 text-primary-900 rounded mt-1"
            />
            <div className="flex-1">
              <div className="font-bold text-lg text-gray-900 mb-2">
                Aktivera minsta beställning (MOQ)
              </div>
              <p className="text-sm text-gray-600">
                Kräv att ett visst antal enheter beställs innan produkten skickas.
                Detta möjliggör sambeställningar och lägre priser.
              </p>
            </div>
          </label>
        </div>

        {/* MOQ Settings */}
        {moqEnabled && (
          <>
            {/* Minimum Quantity */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Minsta antal
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Minsta beställning *
                  </label>
                  <input
                    type="number"
                    value={minimumOrderQuantity}
                    onChange={(e) => setMinimumOrderQuantity(parseInt(e.target.value))}
                    min="1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Enhet
                  </label>
                  <select
                    value={moqUnit}
                    onChange={(e) => setMoqUnit(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                  >
                    <option value="pieces">Stycken</option>
                    <option value="boxes">Lådor</option>
                    <option value="pallets">Pallar</option>
                    <option value="kg">Kilogram</option>
                    <option value="liters">Liter</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-primary-800">
                  💡 Produkten skickas först när <strong>{minimumOrderQuantity} {moqUnit}</strong> har beställts
                  till samma konsolideringslager (baserat på postnummer).
                </p>
              </div>
            </div>

            {/* Discount */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Rabatt vid MOQ
              </h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rabatt när MOQ uppnås (%)
                </label>
                <input
                  type="number"
                  value={moqDiscountPercentage}
                  onChange={(e) => setMoqDiscountPercentage(parseFloat(e.target.value))}
                  min="0"
                  max="50"
                  step="0.5"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Ge kunder rabatt som incitament att nå MOQ
                </p>
              </div>

              {moqDiscountPercentage > 0 && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ Kunder får <strong>{moqDiscountPercentage}%</strong> rabatt när MOQ uppnås
                  </p>
                </div>
              )}
            </div>

            {/* Advanced Options */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Avancerade inställningar
              </h2>

              <div className="space-y-6">
                <label className="flex items-start gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowPartialOrders}
                    onChange={(e) => setAllowPartialOrders(e.target.checked)}
                    className="w-5 h-5 text-primary-900 rounded mt-1"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      Tillåt partiella beställningar
                    </div>
                    <p className="text-sm text-gray-600">
                      Kunder kan beställa mindre än MOQ, men leveransen sker först när MOQ uppnås
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consolidationRequired}
                    onChange={(e) => setConsolidationRequired(e.target.checked)}
                    className="w-5 h-5 text-primary-900 rounded mt-1"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      Kräv konsolidering
                    </div>
                    <p className="text-sm text-gray-600">
                      Produkten MÅSTE gå via konsolideringslager (kan inte skickas direkt)
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Example Calculation */}
            <div className="bg-primary-50 rounded-2xl p-8 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                📊 Exempel
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">MOQ:</span>
                  <span className="font-bold">{minimumOrderQuantity} {moqUnit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Rabatt:</span>
                  <span className="font-bold">{moqDiscountPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Partiella beställningar:</span>
                  <span className="font-bold">{allowPartialOrders ? 'Ja' : 'Nej'}</span>
                </div>
                <div className="pt-3 border-t border-primary-200">
                  <p className="text-gray-700">
                    När <strong>{minimumOrderQuantity}</strong> enheter beställts till samma område
                    skickas alla beställningar med <strong>{moqDiscountPercentage}%</strong> rabatt.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-800 transition disabled:opacity-50 shadow-lg"
          >
            {saving ? 'Sparar...' : '💾 Spara inställningar'}
          </button>
        </div>
      </div>
    </div>
  );
}
