'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';

interface PlatformSettings {
  id: string;
  platform_fee_percentage: number;
  min_order_value: number;
  max_order_value: number;
  currency: string;
  default_language: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  metadata: any;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  id: 'global', platform_fee_percentage: 0, min_order_value: 0, max_order_value: 0,
  currency: 'SEK', default_language: 'sv', maintenance_mode: false, registration_enabled: true,
  metadata: { seller_margin_percentage: 10, warehouse_handling_fee: 0, warehouse_payout_days: 7, default_shipping_fee: 49, free_shipping_threshold: 1000, free_shipping_delivery_methods: [], free_shipping_single_warehouse: false, free_shipping_waive_handling: false, stripe_mode: 'live', stripe_payment_enabled: true, gamification_enabled: true, xp_per_order: 100, leaderboard_enabled: true },
};

interface ApiKey {
  id: string;
  name: string;
  masked_key: string;
  status: 'active' | 'revoked';
  created_at: string;
  last_used_at: string | null;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'apikeys'>('settings');

  useEffect(() => {
    fetchSettings();
    fetchApiKeys();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiFetch('/api/admin/settings/global');
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Kunde inte hämta inställningar');
      const raw = data.settings || {};
      setSettings({ ...DEFAULT_SETTINGS, ...raw, metadata: { ...DEFAULT_SETTINGS.metadata, ...(raw.metadata || {}) } });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const response = await apiFetch('/api/admin/settings/apikeys');
      const data = await response.json();
      if (data.success) {
        setApiKeys(data.keys || []);
      }
    } catch (err) {
      console.error('Kunde inte hämta API-nycklar', err);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const response = await apiFetch('/api/admin/settings/global', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Kunde inte spara inställningar');
      
      setMessage({ type: 'success', text: 'Inställningar sparade!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;

    try {
      const res = await apiFetch('/api/admin/settings/apikeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedKey(data.apiKey);
        setNewKeyName('');
        fetchApiKeys();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Laddar inställningar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Plattformsinställningar</h1>
            <p className="text-sm text-slate-500 mt-1">Hantera globala inställningar och API-nycklar för GoalSquad</p>
          </div>
          <div className="flex gap-2">
            <div className="inline-flex p-1 bg-slate-100 rounded-md">
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Inställningar
              </button>
              <button
                onClick={() => setActiveTab('apikeys')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'apikeys' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                API-nycklar
              </button>
            </div>
            {activeTab === 'settings' && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Sparar...' : 'Spara'}
              </button>
            )}
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {activeTab === 'settings' && settings && (
          <div className="space-y-6">
            
            {/* Fees & Pricing */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Avgifter och Priser</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Plattformsavgift (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={settings.platform_fee_percentage}
                    onChange={(e) => setSettings({ ...settings, platform_fee_percentage: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Minsta ordervärde (SEK)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.min_order_value}
                    onChange={(e) => setSettings({ ...settings, min_order_value: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Högsta ordervärde (SEK)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.max_order_value}
                    onChange={(e) => setSettings({ ...settings, max_order_value: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Standardvaluta
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SEK">SEK - Svenska kronor</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="USD">USD - US Dollar</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payouts & warehouse payments */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Utbetalningar och lager</h2>
              <p className="text-sm text-slate-500 mb-4">Styr marginaler och när ersättning betalas ut till säljare och lagerpartners.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Säljarmarginal (%)</label>
                  <input type="number" step="0.1" min="0" max="100" value={settings.metadata.seller_margin_percentage} onChange={(e) => setSettings({ ...settings, metadata: { ...settings.metadata, seller_margin_percentage: Number(e.target.value) } })} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#003B3D]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Lagerhantering (SEK)</label>
                  <input type="number" step="0.01" min="0" value={settings.metadata.warehouse_handling_fee} onChange={(e) => setSettings({ ...settings, metadata: { ...settings.metadata, warehouse_handling_fee: Number(e.target.value) } })} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#003B3D]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Utbetalning efter (dagar)</label>
                  <input type="number" min="0" value={settings.metadata.warehouse_payout_days} onChange={(e) => setSettings({ ...settings, metadata: { ...settings.metadata, warehouse_payout_days: Number(e.target.value) } })} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#003B3D]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Standardfrakt (SEK)</label>
                  <input type="number" step="0.01" min="0" value={settings.metadata.default_shipping_fee} onChange={(e) => setSettings({ ...settings, metadata: { ...settings.metadata, default_shipping_fee: Number(e.target.value) } })} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#003B3D]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Fri frakt över (SEK)</label>
                  <input type="number" step="0.01" min="0" value={settings.metadata.free_shipping_threshold} onChange={(e) => setSettings({ ...settings, metadata: { ...settings.metadata, free_shipping_threshold: Number(e.target.value) } })} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#003B3D]" />
                </div>
                <div className="md:col-span-3">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Gratis frakt för leveranssätt</p>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    {([['home', 'Hemleverans'], ['club_distribution', 'Klubbutdelning'], ['single_distributor', 'En distributör']] as const).map(([value, label]) => <label key={value} className="flex items-center gap-2"><input type="checkbox" checked={(settings.metadata.free_shipping_delivery_methods || []).includes(value)} onChange={(e) => { const methods = settings.metadata.free_shipping_delivery_methods || []; setSettings({ ...settings, metadata: { ...settings.metadata, free_shipping_delivery_methods: e.target.checked ? [...methods, value] : methods.filter((method: string) => method !== value) } }); }} className="h-4 w-4 accent-[#003B3D]" />{label}</label>)}
                  </div>
                </div>
                <label className="md:col-span-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={settings.metadata.free_shipping_single_warehouse} onChange={(e) => setSettings({ ...settings, metadata: { ...settings.metadata, free_shipping_single_warehouse: e.target.checked } })} className="h-4 w-4 accent-[#003B3D]" />Gratis frakt när ordern skickas från ett lager</label>
                <label className="md:col-span-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={settings.metadata.free_shipping_waive_handling} onChange={(e) => setSettings({ ...settings, metadata: { ...settings.metadata, free_shipping_waive_handling: e.target.checked } })} className="h-4 w-4 accent-[#003B3D]" />Ta även bort hanteringskostnad vid fri frakt</label>
              </div>
            </div>

            {/* Payments */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Betalningsinställningar</h2>
              <p className="text-sm text-slate-500 mb-4">Stripe används för betalningar och utbetalningar. Hemliga nycklar hanteras i miljövariabler.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Stripe-läge</label>
                  <select value={settings.metadata.stripe_mode} onChange={(e) => setSettings({ ...settings, metadata: { ...settings.metadata, stripe_mode: e.target.value } })} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#003B3D]"><option value="test">Test</option><option value="live">Live</option></select>
                </div>
                <label className="flex items-center justify-between rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-700">Stripe-betalningar aktiverade<input type="checkbox" checked={settings.metadata.stripe_payment_enabled} onChange={(e) => setSettings({ ...settings, metadata: { ...settings.metadata, stripe_payment_enabled: e.target.checked } })} className="h-4 w-4 accent-[#003B3D]" /></label>
              </div>
            </div>

            {/* Gamification */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Gamification</h2>
              <p className="text-sm text-slate-500 mb-4">Bestäm om XP och topplistor ska vara aktiva på plattformen.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div><label className="block text-sm font-semibold text-slate-700 mb-2">XP per order</label><input type="number" min="0" value={settings.metadata.xp_per_order} onChange={(e) => setSettings({ ...settings, metadata: { ...settings.metadata, xp_per_order: Number(e.target.value) } })} className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#003B3D]" /></div>
                <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={settings.metadata.gamification_enabled} onChange={(e) => setSettings({ ...settings, metadata: { ...settings.metadata, gamification_enabled: e.target.checked } })} className="h-4 w-4 accent-[#003B3D]" />Gamification aktiv</label>
                <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={settings.metadata.leaderboard_enabled} onChange={(e) => setSettings({ ...settings, metadata: { ...settings.metadata, leaderboard_enabled: e.target.checked } })} className="h-4 w-4 accent-[#003B3D]" />Topplistor aktiv</label>
              </div>
            </div>

            {/* Localization */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Lokalisering</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Standardspråk
                  </label>
                  <select
                    value={settings.default_language}
                    onChange={(e) => setSettings({ ...settings, default_language: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sv">Svenska</option>
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                    <option value="fi">Suomi</option>
                  </select>
                </div>
              </div>
            </div>

            {/* System Controls */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Systemkontroller</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900">Underhållsläge</p>
                    <p className="text-sm text-slate-500">Inaktivera plattformen för underhåll</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenance_mode}
                      onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900">Registrering aktiverad</p>
                    <p className="text-sm text-slate-500">Tillåt nya användare att registrera sig</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.registration_enabled}
                      onChange={(e) => setSettings({ ...settings, registration_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'apikeys' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Aktivt API-nyckelregister</h2>
              </div>
              
              <div className="p-6 space-y-6">
                <form onSubmit={handleCreateApiKey} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Skriv ändamål (t.ex. Fortnox Sync)..."
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500 bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition shadow-sm"
                  >
                    Generera Nyckel
                  </button>
                </form>

                {generatedKey && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-md space-y-2">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide">Viktigt säkerhetsmeddelande</h4>
                    <p className="text-xs text-amber-700">Kopiera nyckeln nedan omedelbart. Av säkerhetsskäl kommer den aldrig att kunna visas igen.</p>
                    <div className="p-2 bg-white border border-amber-300 rounded font-mono text-xs text-slate-800 break-all select-all">
                      {generatedKey}
                    </div>
                  </div>
                )}

                <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 font-sans">
                  {apiKeys.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">Inga API-nycklar genererade än.</div>
                  ) : (
                    apiKeys.map((key) => (
                      <div key={key.id} className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition text-xs">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800">{key.name}</p>
                          <p className="font-mono text-slate-500 text-[11px]">{key.masked_key}</p>
                          <p className="text-[10px] text-slate-400">
                            Skapad: {new Date(key.created_at).toLocaleDateString('sv-SE')} | Senast använd: {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString('sv-SE') : 'Aldrig'}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-[4px] font-semibold uppercase tracking-wide text-[10px] ${
                          key.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {key.status === 'active' ? 'Aktiv' : 'Återkallad'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
