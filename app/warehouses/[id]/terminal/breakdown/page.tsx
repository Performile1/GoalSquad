'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function LocalHubBreakdownTerminal() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params.id as string;

  const [palletInput, setPalletInput] = useState('');
  const [storageBin, setStorageBin] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!palletInput.trim()) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/warehouse/terminal/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          palletId: palletInput.trim(),
          warehouseId: warehouseId,
          storageBin: storageBin.trim() || 'UTLASTNING-MAIN'
        })
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `✓ Pall ${palletInput.slice(0, 8)}... uppdelad! Klassförälder notifierad.` 
        });
        setPalletInput('');
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Ett fel uppstod.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Nätverksfel. Kontrollera anslutningen.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 font-sans select-none">
      {/* Terminal Header */}
      <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4 shadow-md">
        <div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Hub 2 // Terminal</span>
          <h1 className="text-lg font-black tracking-tight">INBOUND BREAKDOWN</h1>
        </div>
        <button 
          onClick={() => router.push(`/warehouses/${warehouseId}/dashboard`)}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold uppercase transition"
        >
          Avbryt
        </button>
      </div>

      {/* Skanningsformulär */}
      <form onSubmit={handleScanSubmit} className="space-y-4">
        {/* Input: Pall-ID */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Skanna Pall-ID (Streckkod)
          </label>
          <input
            type="text"
            value={palletInput}
            onChange={(e) => setPalletInput(e.target.value)}
            placeholder="Klicka här & skanna..."
            disabled={loading}
            autoFocus
            className="w-full bg-slate-950 border-2 border-slate-700 focus:border-emerald-500 rounded-lg p-4 text-xl font-mono text-center text-emerald-400 tracking-wider transition outline-none"
          />
        </div>

        {/* Input: Lagerfack / Utlastningsplats */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Anvisat Utdelningsfack / Sorteringszon (Valfritt)
          </label>
          <input
            type="text"
            value={storageBin}
            onChange={(e) => setStorageBin(e.target.value)}
            placeholder="Ex: FACK-B3"
            disabled={loading}
            className="w-full bg-slate-950 border-2 border-slate-700 focus:border-blue-500 rounded-lg p-3 text-lg font-mono text-center text-slate-200 uppercase tracking-wider transition outline-none"
          />
        </div>

        {/* Statusmeddelande */}
        {statusMessage && (
          <div className={`p-4 rounded-xl border text-center font-bold text-sm shadow-inner transition-all ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400' 
              : 'bg-rose-950/80 border-rose-500 text-rose-400'
          }`}>
            {statusMessage.text}
          </div>
        )}

        {/* Manuell Bekräftelse-knapp */}
        <button
          type="submit"
          disabled={loading || !palletInput.trim()}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-700 border-b-4 border-emerald-700 active:border-b-0 text-slate-950 rounded-xl text-md font-black uppercase tracking-wider transition-all shadow-md"
        >
          {loading ? 'Processar Bulk-pall...' : 'Bekräfta Sortering (Enter) ➔'}
        </button>
      </form>

      {/* Terminal Footer Info */}
      <div className="mt-6 text-center text-slate-500 text-[11px] font-mono">
        Lager-ID: <span className="text-slate-400">{warehouseId}</span>
      </div>
    </div>
  );
}
