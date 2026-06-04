'use client';

import React, { useState } from 'react';

export default function HubScanner() {
  const [qrInput, setQrInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await fetch('/api/hub/delivery/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: 'camp-9b-vair',
          sellerId: qrInput.trim(),
          scannedBy: 'hub-admin-01'
        })
      });

      const data = await res.json();

      if (res.status === 409) {
        setScanResult({
          type: 'error',
          text: `Säkerhetsspärr: ${data.message}`
        });
      } else if (data.success) {
        setScanResult({
          type: 'success',
          text: '✓ Utdelning registrerad. QR-kvittens genererat och skickat till förälder.'
        });
        setQrInput('');
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setScanResult({ type: 'error', text: err.message || 'Kunde inte verifiera QR-kod.' });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono p-4 flex flex-col items-center justify-center">
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Hub Scanner // QR Verification</span>
          <h1 className="text-2xl font-black text-white mt-2">SCANNA KVITTON</h1>
          <p className="text-xs text-slate-500 mt-1">Använd kamera eller streckkodsläsare för att verifiera utdelning.</p>
        </div>

        <form onSubmit={handleScanSubmit} className="space-y-4">
          <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6">
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">QR-kod / Seller-ID</label>
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Väntar på skanning..."
              disabled={isScanning}
              autoFocus
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-lg font-mono text-center text-emerald-400 outline-none focus:border-emerald-500 transition"
            />
          </div>

          {scanResult && (
            <div className={`p-4 rounded-xl border text-center text-sm font-bold ${
              scanResult.type === 'success' 
                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' 
                : 'bg-rose-950/40 border-rose-500 text-rose-400'
            }`}>
              {scanResult.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isScanning || !qrInput.trim()}
            className={`w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition ${
              isScanning || !qrInput.trim()
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-900/20 active:scale-[0.99]'
            }`}
          >
            {isScanning ? 'Verifierar...' : 'Verifiera Utdelning ➔'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-800">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] text-slate-400 font-medium">Hubb: Stockholm Central</span>
          </div>
        </div>
      </div>
    </div>
  );
}
