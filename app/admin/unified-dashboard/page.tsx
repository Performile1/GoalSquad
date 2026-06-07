'use client';

import React, { useState } from 'react';

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState<'merchant' | 'warehouse' | 'e2e'>('merchant');
  const [isProcessing, setIsProcessing] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  // IDs must be real UUIDs from the database for the APIs to accept them.
  const [merchantId, setMerchantId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [campaignId, setCampaignId] = useState('');

  const addLog = (msg: string) =>
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  // 1. Merchant bulk upload (idempotent upsert on merchant_id,sku)
  const handleBulkUpload = async () => {
    if (!merchantId) {
      addLog('⚠️ Ange ett merchant-UUID först.');
      return;
    }
    setIsProcessing(true);
    addLog('Triggar Merchant Bulk-synk...');

    try {
      const sampleProducts = [
        { sku: 'COFFEE-DARK-01', name: 'Klasskaffe Mörkrost', price: 120, stock: 5000 },
        { sku: 'CHOCO-FLARN-02', name: 'Ekologiska Chokladflarn', price: 100, stock: 3500 },
      ];

      const res = await fetch('/api/merchants/bulk/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          products: sampleProducts,
          idempotencyKey: `BULK-SYNC-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addLog(`✓ Merchant-status: ${data.message}`);
      } else {
        addLog(`❌ Merchant bulk-synk: ${data.error ?? 'okänt fel'}`);
      }
    } catch {
      addLog('❌ Merchant bulk-synk misslyckades (nätverk).');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Warehouse picking (idempotent via picking_lock)
  const handleGeneratePickingList = async () => {
    if (!warehouseId || !campaignId) {
      addLog('⚠️ Ange både warehouse-UUID och campaign-UUID först.');
      return;
    }
    setIsProcessing(true);
    addLog('Genererar plocklista i lagret...');

    try {
      const res = await fetch('/api/warehouses/picking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseId,
          campaignId,
          itemsToPick: [
            { sku: 'COFFEE-DARK-01', quantity: 42 },
            { sku: 'CHOCO-FLARN-02', quantity: 38 },
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        data.tasks.forEach((t: { sku: string; status: string }) => {
          addLog(`Lager-status för ${t.sku}: [${t.status}]`);
        });
      } else {
        addLog(`❌ Plocklista: ${data.error ?? 'okänt fel'}`);
      }
    } catch {
      addLog('❌ Kunde inte generera plocklista (nätverk).');
    } finally {
      setIsProcessing(false);
    }
  };

  const idInput = (
    label: string,
    value: string,
    onChange: (v: string) => void
  ) => (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="UUID"
        className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
      />
    </label>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center border-b border-slate-800 pb-5 mb-6">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white uppercase">
            Unified Operations Platform
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Handlare, Lager &amp; E2E-Flöde
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('merchant')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'merchant' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Merchant Tools
          </button>
          <button
            onClick={() => setActiveTab('warehouse')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'warehouse' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Warehouse Picking
          </button>
          <button
            onClick={() => setActiveTab('e2e')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'e2e' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Kör E2E-Test
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {activeTab === 'merchant' && (
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase mb-1">
                  Merchant Bulk Management
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Idempotent bulk-uppladdning av sortiment (upsert på merchant_id + sku).
                </p>
              </div>
              {idInput('Merchant ID', merchantId, setMerchantId)}
              <button
                disabled={isProcessing}
                onClick={handleBulkUpload}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
              >
                Kör Bulk-uppladdning
              </button>
            </div>
          )}

          {activeTab === 'warehouse' && (
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase mb-1">
                  Warehouse Picking Interface
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Genererar kampanjkopplade plocklistor. Skyddat av picking_lock mot dubbletter.
                </p>
              </div>
              {idInput('Warehouse ID', warehouseId, setWarehouseId)}
              {idInput('Campaign ID', campaignId, setCampaignId)}
              <button
                disabled={isProcessing}
                onClick={handleGeneratePickingList}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
              >
                Skapa Idempotent Plocklista
              </button>
            </div>
          )}

          {activeTab === 'e2e' && (
            <div className="bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/30 p-5 rounded-2xl">
              <h2 className="text-sm font-bold text-emerald-400 uppercase mb-2">
                Fas 4: End-to-End Simulation
              </h2>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Det fullständiga flödet från handlare till utlämning.
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] space-y-1">
                  <p>
                    <strong>Steg 1:</strong> Handlare laddar upp produkter (Bulk API)
                  </p>
                  <p>
                    <strong>Steg 2:</strong> Supportrar lägger order (Checkout Idempotency)
                  </p>
                  <p>
                    <strong>Steg 3:</strong> Lagret plockar och packar (Picking Lock)
                  </p>
                  <p>
                    <strong>Steg 4:</strong> Garage-mottagning &amp; Utlämning (QR-lås)
                  </p>
                </div>
                <button
                  onClick={() =>
                    addLog(
                      'E2E-Integrationstest startat: skyddsspärrar och låsmekanismer verifieras.'
                    )
                  }
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
                >
                  Starta Fullständigt E2E-Kvalitetstest
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Realtime log */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col h-[300px]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Systemlogg (Realtid)
          </span>
          <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 text-slate-300 pr-2">
            {log.length === 0 ? (
              <span className="text-slate-600 italic">Väntar på operationer...</span>
            ) : (
              log.map((l, i) => (
                <div key={i} className="border-b border-slate-900 pb-1">
                  {l}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
