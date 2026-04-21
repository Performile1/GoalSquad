'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SaveIcon, GlobeIcon, SearchIcon } from '@/app/components/BrandIcons';

interface SEOSettings {
  id: string;
  site_title: string;
  site_description: string;
  site_keywords: string[];
  default_og_image: string;
  facebook_url: string;
  twitter_handle: string;
  instagram_handle: string;
  linkedin_url: string;
  google_analytics_id: string;
  google_tag_manager_id: string;
  google_site_verification: string;
  bing_site_verification: string;
  robots_txt_content: string;
  sitemap_enabled: boolean;
  sitemap_frequency: string;
  updated_at: string;
}

export default function AdminSEOPage() {
  const [settings, setSettings] = useState<SEOSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/seo');
      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      console.error('Failed to fetch SEO settings:', error);
      setMessage({ type: 'error', text: 'Kunde inte ladda SEO-inställningar' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'SEO-inställningar sparade!' });
        fetchSettings();
      } else {
        setMessage({ type: 'error', text: 'Kunde inte spara SEO-inställningar' });
      }
    } catch (error) {
      console.error('Failed to save SEO settings:', error);
      setMessage({ type: 'error', text: 'Kunde inte spara SEO-inställningar' });
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    if (!settings || !keywordInput.trim()) return;
    setSettings({
      ...settings,
      site_keywords: [...settings.site_keywords, keywordInput.trim()],
    });
    setKeywordInput('');
  };

  const removeKeyword = (index: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      site_keywords: settings.site_keywords.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GlobeIcon size={64} className="animate-bounce text-primary-900 mx-auto mb-4" />
          <p className="text-xl text-primary-900 font-semibold">Laddar SEO-inställningar...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GlobeIcon size={64} className="text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Kunde inte ladda SEO-inställningar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">SEO Inställningar</h1>
          <p className="text-primary-100">Hantera sökmotoroptimering och metadata för hela webbplatsen</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            message.type === 'success' ? 'bg-green-50 border-2 border-green-200 text-green-700' : 'bg-red-50 border-2 border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Basic SEO Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <GlobeIcon size={28} />
              Grundläggande SEO
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Webbplatsens titel
                </label>
                <input
                  type="text"
                  value={settings.site_title}
                  onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="T.ex. GoalSquad - Community Commerce"
                />
                <p className="text-xs text-gray-500 mt-1">Visas i webbläsarens flik och sökresultat</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Webbplatsens beskrivning
                </label>
                <textarea
                  value={settings.site_description}
                  onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  rows={3}
                  placeholder="Kort beskrivning av webbplatsen för sökmotorer"
                />
                <p className="text-xs text-gray-500 mt-1">Visas i sökresultat under titeln (max 160 tecken)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nyckelord
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                    placeholder="Lägg till nyckelord..."
                  />
                  <button
                    onClick={addKeyword}
                    className="px-6 py-3 bg-primary-900 text-white rounded-xl font-semibold hover:bg-primary-700 transition"
                  >
                    Lägg till
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.site_keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="bg-primary-50 text-primary-900 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2"
                    >
                      {keyword}
                      <button
                        onClick={() => removeKeyword(index)}
                        className="text-primary-700 hover:text-red-600 transition"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Standard OG-bild
                </label>
                <input
                  type="url"
                  value={settings.default_og_image}
                  onChange={(e) => setSettings({ ...settings, default_og_image: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="https://example.com/og-image.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">Bild som visas när webbplatsen delas på sociala medier</p>
              </div>
            </div>
          </motion.div>

          {/* Social Media */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sociala Medier</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={settings.facebook_url}
                  onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="https://facebook.com/goalsquad"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Twitter/X Handle
                </label>
                <input
                  type="text"
                  value={settings.twitter_handle}
                  onChange={(e) => setSettings({ ...settings, twitter_handle: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="@goalsquad"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Instagram Handle
                </label>
                <input
                  type="text"
                  value={settings.instagram_handle}
                  onChange={(e) => setSettings({ ...settings, instagram_handle: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="@goalsquad"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={settings.linkedin_url}
                  onChange={(e) => setSettings({ ...settings, linkedin_url: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="https://linkedin.com/company/goalsquad"
                />
              </div>
            </div>
          </motion.div>

          {/* Analytics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <SearchIcon size={28} />
              Analys & Verifiering
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Google Analytics ID
                </label>
                <input
                  type="text"
                  value={settings.google_analytics_id}
                  onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Google Tag Manager ID
                </label>
                <input
                  type="text"
                  value={settings.google_tag_manager_id}
                  onChange={(e) => setSettings({ ...settings, google_tag_manager_id: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="GTM-XXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Google Site Verification
                </label>
                <input
                  type="text"
                  value={settings.google_site_verification}
                  onChange={(e) => setSettings({ ...settings, google_site_verification: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="Google verification code"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bing Site Verification
                </label>
                <input
                  type="text"
                  value={settings.bing_site_verification}
                  onChange={(e) => setSettings({ ...settings, bing_site_verification: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                  placeholder="Bing verification code"
                />
              </div>
            </div>
          </motion.div>

          {/* Sitemap & Robots */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sitemap & Robots.txt</h2>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id="sitemap_enabled"
                  checked={settings.sitemap_enabled}
                  onChange={(e) => setSettings({ ...settings, sitemap_enabled: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded"
                />
                <label htmlFor="sitemap_enabled" className="text-sm font-semibold text-gray-700">
                  Aktivera sitemap
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sitemap uppdateringsfrekvens
                </label>
                <select
                  value={settings.sitemap_frequency}
                  onChange={(e) => setSettings({ ...settings, sitemap_frequency: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                >
                  <option value="hourly">Varje timme</option>
                  <option value="daily">Dagligen</option>
                  <option value="weekly">Veckovis</option>
                  <option value="monthly">Månatligen</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Robots.txt innehåll
                </label>
                <textarea
                  value={settings.robots_txt_content}
                  onChange={(e) => setSettings({ ...settings, robots_txt_content: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none font-mono text-sm"
                  rows={6}
                  placeholder="User-agent: *&#10;Allow: /&#10;Sitemap: https://goalsquad.shop/sitemap.xml"
                />
                <p className="text-xs text-gray-500 mt-1">Kontrollera hur sökmotorer crawlar din webbplats</p>
              </div>
            </div>
          </motion.div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50"
            >
              <SaveIcon size={20} />
              {saving ? 'Sparar...' : 'Spara ändringar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
