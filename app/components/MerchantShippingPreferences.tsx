'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TruckIcon, SaveIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface ShippingPreferences {
  id?: string;
  allows_individual_shipments: boolean;
  allows_bulk_shipments: boolean;
  individual_shipment_cost: number;
  bulk_shipment_cost: number;
  minimum_bulk_quantity: number;
  shipping_regions: string[];
  delivery_time_days: number;
  notes?: string;
}

export default function MerchantShippingPreferences() {
  const [preferences, setPreferences] = useState<ShippingPreferences>({
    allows_individual_shipments: false,
    allows_bulk_shipments: true,
    individual_shipment_cost: 0,
    bulk_shipment_cost: 0,
    minimum_bulk_quantity: 10,
    shipping_regions: [],
    delivery_time_days: 7,
    notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRegion, setNewRegion] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await apiFetch('/api/shipping/preferences');
      const data = await response.json();
      if (data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Failed to fetch shipping preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiFetch('/api/shipping/preferences', {
        method: 'POST',
        body: JSON.stringify(preferences),
      });
      const data = await response.json();
      if (data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Failed to save shipping preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRegion = () => {
    if (newRegion && !preferences.shipping_regions.includes(newRegion)) {
      setPreferences({
        ...preferences,
        shipping_regions: [...preferences.shipping_regions, newRegion],
      });
      setNewRegion('');
    }
  };

  const handleRemoveRegion = (region: string) => {
    setPreferences({
      ...preferences,
      shipping_regions: preferences.shipping_regions.filter((r) => r !== region),
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
        <div className="text-center text-gray-500">Laddar...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Leveransinställningar</h2>
        <TruckIcon size={28} className="text-primary-900" />
      </div>

      <div className="space-y-6">
        {/* Shipping Options */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-4">Leveransalternativ</h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.allows_individual_shipments}
                onChange={(e) => setPreferences({ ...preferences, allows_individual_shipments: e.target.checked })}
                className="w-5 h-5 text-primary-900 rounded focus:ring-primary-900"
              />
              <span className="text-gray-700">Tillåt enstaka försändelser till slutkonsument</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.allows_bulk_shipments}
                onChange={(e) => setPreferences({ ...preferences, allows_bulk_shipments: e.target.checked })}
                className="w-5 h-5 text-primary-900 rounded focus:ring-primary-900"
              />
              <span className="text-gray-700">Tillåt samlade leveranser till föreningar/kontaktpersoner</span>
            </label>
          </div>
        </div>

        {/* Shipping Costs */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-4">Leveranskostnader</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Enstaka försändelse (kr)
              </label>
              <input
                type="number"
                value={preferences.individual_shipment_cost}
                onChange={(e) => setPreferences({ ...preferences, individual_shipment_cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                disabled={!preferences.allows_individual_shipments}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Samlad leverans (kr)
              </label>
              <input
                type="number"
                value={preferences.bulk_shipment_cost}
                onChange={(e) => setPreferences({ ...preferences, bulk_shipment_cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                disabled={!preferences.allows_bulk_shipments}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Minsta antal för samlad leverans
            </label>
            <input
              type="number"
              value={preferences.minimum_bulk_quantity}
              onChange={(e) => setPreferences({ ...preferences, minimum_bulk_quantity: parseInt(e.target.value) || 10 })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
              disabled={!preferences.allows_bulk_shipments}
            />
          </div>
        </div>

        {/* Shipping Regions */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-4">Leveransområden</h3>
          
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newRegion}
              onChange={(e) => setNewRegion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRegion()}
              placeholder="T.ex. Stockholm, Göteborg"
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
            />
            <button
              onClick={handleAddRegion}
              className="px-6 py-3 bg-primary-900 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
            >
              Lägg till
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {preferences.shipping_regions.map((region) => (
              <motion.div
                key={region}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-2 bg-primary-100 text-primary-900 rounded-lg"
              >
                {region}
                <button
                  onClick={() => handleRemoveRegion(region)}
                  className="text-primary-900 hover:text-red-600 font-bold"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Delivery Time */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-4">Leveranstid</h3>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Leveranstid (dagar)
            </label>
            <input
              type="number"
              value={preferences.delivery_time_days}
              onChange={(e) => setPreferences({ ...preferences, delivery_time_days: parseInt(e.target.value) || 7 })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h3 className="font-bold text-gray-900 mb-4">Anteckningar</h3>
          
          <textarea
            value={preferences.notes}
            onChange={(e) => setPreferences({ ...preferences, notes: e.target.value })}
            placeholder="Lägg till ytterligare information om dina leveranser..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none resize-none"
            rows={3}
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-900 text-white rounded-lg font-semibold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SaveIcon size={20} />
          {saving ? 'Sparar...' : 'Spara Inställningar'}
        </button>
      </div>
    </div>
  );
}
