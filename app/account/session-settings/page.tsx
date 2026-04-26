'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function SessionSettingsPage() {
  const { profile, updateProfile } = useAuth();
  const [timeoutMinutes, setTimeoutMinutes] = useState(
    profile?.metadata?.session_timeout || 30
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    
    try {
      await updateProfile({
        metadata: {
          ...profile?.metadata,
          session_timeout: timeoutMinutes,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save session timeout:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Sessionsinställningar</h1>
        
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Inaktivitets-tidsgräns</h2>
          
          <p className="text-gray-600 mb-6">
            Välj hur lång tid du kan vara inaktiv innan du loggas ut automatiskt. 
            Detta hjälper att skydda ditt konto om du glömmer att logga ut.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tidsgräns (minuter)
            </label>
            <select
              value={timeoutMinutes}
              onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
              className="w-full max-w-xs px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-900 focus:outline-none"
            >
              <option value={15}>15 minuter</option>
              <option value={30}>30 minuter (standard)</option>
              <option value={60}>1 timme</option>
              <option value={120}>2 timmar</option>
              <option value={180}>3 timmar</option>
              <option value={240}>4 timmar</option>
              <option value={480}>8 timmar</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-primary-900 text-white rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Sparar...' : 'Spara inställningar'}
            </button>
            
            {saved && (
              <span className="text-green-600 font-semibold">Inställningar sparade!</span>
            )}
          </div>
        </div>

        <div className="bg-blue-50 rounded-2xl p-6">
          <h3 className="font-bold text-blue-900 mb-2">Tips för olika användare</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• <strong>Konsumenter:</strong> 30-60 minuter rekommenderas</li>
            <li>• <strong>Säljare:</strong> 1-2 timmar om du arbetar aktivt</li>
            <li>• <strong>Lagerpartners:</strong> 2-4 timmar vid orderhantering</li>
            <li>• <strong>Merchants:</strong> 1-2 timmar vid orderhantering</li>
            <li>• <strong>Föreningar:</strong> 30-60 minuter rekommenderas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
