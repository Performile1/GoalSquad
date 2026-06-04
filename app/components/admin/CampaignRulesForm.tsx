'use client';

import React, { useState } from 'react';

export default function CampaignRulesForm({ campaignId, initialData }: { campaignId: string, initialData: any }) {
  const [gracePeriod, setGracePeriod] = useState(initialData.grace_period_hours || 0);
  const [autoExtend, setAutoExtend] = useState(initialData.auto_extend_enabled || false);
  const [extendDays, setExtendDays] = useState(initialData.auto_extend_days || 3);
  const [threshold, setThreshold] = useState(initialData.auto_extend_threshold_pct || 90);
  const [manualDispense, setManualDispense] = useState(initialData.manual_dispense_granted || false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateRules = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/rules`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grace_period_hours: gracePeriod,
          auto_extend_enabled: autoExtend,
          auto_extend_days: extendDays,
          auto_extend_threshold_pct: threshold,
          manual_dispense_granted: manualDispense
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Regler sparade!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Kunde inte spara regler' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Kunde inte uppdatera affärsregler' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden max-w-xl">
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dynamiska Affärsregler</h3>
      </div>
      
      <div className="p-6 space-y-4">
        {message && (
          <div className={`p-3 rounded text-xs ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Regel: Grace Period */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-800 uppercase">Tidsbuffert (Grace Period)</label>
          <p className="text-xs text-slate-500">Antal timmar efter officiellt slutdatum som systemet väntar innan ordrar stängs.</p>
          <div className="flex items-center gap-2 mt-1">
            <input 
              type="number" 
              value={gracePeriod} 
              onChange={e => setGracePeriod(Number(e.target.value))}
              className="w-20 px-2 py-1 border border-slate-300 rounded font-mono text-xs focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-slate-600 font-medium">timmar</span>
          </div>
        </div>

        {/* Regel: Auto-Extend Switch */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase">Aktivera intelligent förlängning</label>
            <p className="text-xs text-slate-500 mt-0.5">Låt systemet ge gruppen mer tid automatiskt om de är nära sitt MOQ-mål.</p>
          </div>
          <input 
            type="checkbox" 
            checked={autoExtend} 
            onChange={e => setAutoExtend(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-slate-300 cursor-pointer"
          />
        </div>

        {autoExtend && (
          <div className="bg-slate-50 p-4 border border-slate-200/60 rounded-md space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs text-slate-700 font-medium">Krav på måluppfyllnad för att trigga:</label>
              <div className="flex items-center gap-1">
                <input 
                  type="number" 
                  value={threshold} 
                  onChange={e => setThreshold(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 border border-slate-300 rounded text-xs font-mono text-right focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-slate-500">%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <label className="text-xs text-slate-700 font-medium">Förlängningsperiodens längd:</label>
              <div className="flex items-center gap-1">
                <input 
                  type="number" 
                  value={extendDays} 
                  onChange={e => setExtendDays(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 border border-slate-300 rounded text-xs font-mono text-right focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-slate-500">dagar</span>
              </div>
            </div>
          </div>
        )}

        {/* Regel: Manuell Dispense */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase">Manuell dispens (Admin)</label>
            <p className="text-xs text-slate-500 mt-0.5">Godkänn kampanjen manuellt trots missat MOQ-mål.</p>
          </div>
          <input 
            type="checkbox" 
            checked={manualDispense} 
            onChange={e => setManualDispense(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-slate-300 cursor-pointer"
          />
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleUpdateRules}
            disabled={saving}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition disabled:opacity-50"
          >
            {saving ? 'Sparar...' : 'Spara regelverk'}
          </button>
        </div>
      </div>
    </div>
  );
}
