'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShopIcon, SaveIcon, TrophyIcon } from '@/app/components/BrandIcons';

interface Team {
  id: string;
  name: string;
  team_type: string;
  age_group?: string;
  gender?: string;
  is_warehouse_partner: boolean;
  warehouse_config: {
    storageCostPerUnit: number;
    handlingCostPerUnit: number;
    shippingCostType: string;
    shippingCostPerUnit: number;
  };
  storage_capacity?: number;
  packages_per_day?: number;
  total_earnings: number;
  status: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  location_address?: string;
  location_city?: string;
  location_postal_code?: string;
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;
  const teamId = params.teamId as string;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [warehouseConfig, setWarehouseConfig] = useState({
    storageCostPerUnit: 0,
    handlingCostPerUnit: 0,
    shippingCostType: 'goalsquad',
    shippingCostPerUnit: 0,
  });
  const [contactInfo, setContactInfo] = useState({
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    location_address: '',
    location_city: '',
    location_postal_code: '',
    storage_capacity: 0,
    packages_per_day: 0,
  });

  useEffect(() => {
    fetchTeam();
  }, [communityId, teamId]);

  const fetchTeam = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/teams/${teamId}`);
      const data = await response.json();
      setTeam(data);
      setWarehouseConfig(data.warehouse_config || warehouseConfig);
      setContactInfo({
        contact_person: data.contact_person || '',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
        location_address: data.location_address || '',
        location_city: data.location_city || '',
        location_postal_code: data.location_postal_code || '',
        storage_capacity: data.storage_capacity || 0,
        packages_per_day: data.packages_per_day || 0,
      });
    } catch (error) {
      console.error('Failed to fetch team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/communities/${communityId}/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouse_config: warehouseConfig,
          ...contactInfo,
        }),
      });

      if (response.ok) {
        alert('Inställningar sparade! ✅');
        fetchTeam();
      } else {
        alert('Kunde inte spara');
      }
    } catch (error) {
      console.error('Failed to save team settings:', error);
      alert('Ett fel uppstod');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <TrophyIcon size={64} className="animate-bounce text-primary-900 mx-auto mb-4" />
          <p className="text-xl text-primary-900 font-semibold">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-700">Lag hittades inte</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-primary-200 hover:text-white mb-4 inline-block"
          >
            ← Tillbaka till lag
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
              <p className="text-primary-100">
                {team.team_type === 'sports_team' ? '🏆 Sportlag' : team.team_type === 'class' ? '📚 Klass' : team.team_type === 'group' ? '👥 Grupp' : 'Annat'}
                {team.age_group && ` • ${team.age_group}`}
                {team.gender && ` • ${team.gender === 'male' ? 'Pojkar' : team.gender === 'female' ? 'Flickor' : 'Mixad'}`}
              </p>
            </div>
            {team.is_warehouse_partner && (
              <span className="bg-orange-100 text-orange-900 px-4 py-2 rounded-full font-semibold flex items-center gap-2">
                <ShopIcon size={20} />
                Lagerpartner
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Earnings Summary */}
        {team.is_warehouse_partner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 rounded-2xl shadow-lg p-6 mb-8"
          >
            <h2 className="text-2xl font-bold text-green-900 mb-4">💰 Intäkter</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-sm text-green-700 mb-1">Lagring</div>
                <div className="text-xl font-bold text-green-900">
                  {team.warehouse_config?.storageCostPerUnit || 0} kr/enhet
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-sm text-green-700 mb-1">Hantering</div>
                <div className="text-xl font-bold text-green-900">
                  {team.warehouse_config?.handlingCostPerUnit || 0} kr/enhet
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-sm text-green-700 mb-1">Frakt</div>
                <div className="text-xl font-bold text-green-900">
                  {team.warehouse_config?.shippingCostType === 'goalsquad' ? 'GoalSquad' : team.warehouse_config?.shippingCostType}
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <div className="text-sm text-green-700 mb-1">Totalt tjänat</div>
                <div className="text-2xl font-bold text-green-900">
                  {team.total_earnings.toLocaleString()} kr
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Warehouse Partner Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📦 Lagerpartner-konfiguration</h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lagerhållningskostnad (kr/enhet)
                </label>
                <input
                  type="number"
                  value={warehouseConfig.storageCostPerUnit}
                  onChange={(e) => setWarehouseConfig({ ...warehouseConfig, storageCostPerUnit: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="0.50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hanteringskostnad (kr/enhet)
                </label>
                <input
                  type="number"
                  value={warehouseConfig.handlingCostPerUnit}
                  onChange={(e) => setWarehouseConfig({ ...warehouseConfig, handlingCostPerUnit: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="0.30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Vem står för fraktkostnaden?
              </label>
              <select
                value={warehouseConfig.shippingCostType}
                onChange={(e) => setWarehouseConfig({ ...warehouseConfig, shippingCostType: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
              >
                <option value="goalsquad">GoalSquad står för frakten</option>
                <option value="partner">Laget står för frakten</option>
                <option value="hybrid">Hybrid (delad kostnad)</option>
              </select>
            </div>

            {warehouseConfig.shippingCostType !== 'goalsquad' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fraktkostnad (kr/enhet)
                </label>
                <input
                  type="number"
                  value={warehouseConfig.shippingCostPerUnit}
                  onChange={(e) => setWarehouseConfig({ ...warehouseConfig, shippingCostPerUnit: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="1.00"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📞 Kontaktinformation</h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kontaktperson
                </label>
                <input
                  type="text"
                  value={contactInfo.contact_person}
                  onChange={(e) => setContactInfo({ ...contactInfo, contact_person: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="Namn på ansvarig"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  E-post
                </label>
                <input
                  type="email"
                  value={contactInfo.contact_email}
                  onChange={(e) => setContactInfo({ ...contactInfo, contact_email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="email@exempel.se"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={contactInfo.contact_phone}
                onChange={(e) => setContactInfo({ ...contactInfo, contact_phone: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                placeholder="07X-XXX XX XX"
              />
            </div>
          </div>
        </motion.div>

        {/* Location & Capacity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📍 Plats och Kapacitet</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={contactInfo.location_address}
                onChange={(e) => setContactInfo({ ...contactInfo, location_address: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                placeholder="Gatuaddress"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stad
                </label>
                <input
                  type="text"
                  value={contactInfo.location_city}
                  onChange={(e) => setContactInfo({ ...contactInfo, location_city: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="Stad"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Postnummer
                </label>
                <input
                  type="text"
                  value={contactInfo.location_postal_code}
                  onChange={(e) => setContactInfo({ ...contactInfo, location_postal_code: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="XXX XX"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lagerkapacitet (enheter)
                </label>
                <input
                  type="number"
                  value={contactInfo.storage_capacity}
                  onChange={(e) => setContactInfo({ ...contactInfo, storage_capacity: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Paket per dag
                </label>
                <input
                  type="number"
                  value={contactInfo.packages_per_day}
                  onChange={(e) => setContactInfo({ ...contactInfo, packages_per_day: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="50"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-end gap-4"
        >
          <button
            onClick={() => router.back()}
            className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-primary-300 transition"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-600 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SaveIcon size={20} />
            {saving ? 'Sparar...' : 'Spara ändringar'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
