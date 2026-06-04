'use client';

import React, { useState } from 'react';

interface StagedSettlement {
  campaignId: string;
  name: string;
  revenue: number;
  cut: number;
  payout: number;
}

export default function FinancialLedgerEngine() {
  const [staged, setStaged] = useState<StagedSettlement[]>([
    { campaignId: 'camp-9b-vair', name: 'Klass 9B – Kaffekampanj Vår', revenue: 42500, cut: 8500, payout: 34000 },
    { campaignId: 'camp-mora-p12', name: 'Mora IK P12 – Chokladflarn', revenue: 18200, cut: 3640, payout: 14560 }
  ]);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [systemMessage, setSystemMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const executeSettlement = async (item: StagedSettlement) => {
    setProcessingId(item.campaignId);
    setSystemMessage(null);

    try {
      const res = await fetch('/api/admin/finance/settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: item.campaignId,
          totalRevenue: item.revenue,
          platformCut: item.cut,
          payoutClass: item.payout
        })
      });

      const data = await res.json();

      if (res.status === 409) {
        setSystemMessage({
          type: 'error',
          text: `Säkerhetsspärr utlöst: ${data.message}` 
        });
        setStaged(staged.filter(s => s.campaignId !== item.campaignId));
      } else if (data.success) {
        setSystemMessage({
          type: 'success',
          text: `✓ ${item.name} har låsts i huvudboken. Bankunderlag genererat!` 
        });
        setStaged(staged.filter(s => s.campaignId !== item.campaignId));
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setSystemMessage({ type: 'error', text: err.message || 'Kunde inte exekvera avräkning.' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 bg-zinc-950 min-h-screen text-zinc-100 font-mono text-xs">
      <div className="border-b border-zinc-800 pb-5 mb-6">
        <span className="text-amber-500 font-bold uppercase block text-[10px]">Financial Settlement Ledger</span>
        <h1 className="text-xl font-black text-white uppercase">Slutavräkningar & Utbetalningar</h1>
      </div>

      {systemMessage && (
        <div className={`p-4 mb-6 rounded-xl border font-sans text-sm ${
          systemMessage.type === 'success' 
            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400' 
            : 'bg-rose-950/40 border-rose-500 text-rose-400'
        }`}>
          {systemMessage.text}
        </div>
      )}

      {staged.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
          Inga stängda kampanjer väntar på avräkning just nu.
        </div>
      ) : (
        <div className="space-y-4">
          {staged.map((item) => (
            <div key={item.campaignId} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-bold text-white text-sm">{item.name}</h3>
                <p className="text-zinc-500 mt-1">ID: {item.campaignId}</p>
              </div>

              <div className="flex gap-6 text-right">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Brutto</span>
                  <span className="font-bold text-white">{item.revenue.toLocaleString('sv-SE')} kr</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Vår Cut</span>
                  <span className="font-bold text-amber-500">{item.cut.toLocaleString('sv-SE')} kr</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase">Till Laget</span>
                  <span className="font-bold text-emerald-400">{item.payout.toLocaleString('sv-SE')} kr</span>
                </div>
              </div>

              <div>
                <button
                  disabled={processingId === item.campaignId}
                  onClick={() => executeSettlement(item)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-black rounded-lg transition"
                >
                  {processingId === item.campaignId ? 'Verifierar...' : 'Godkänn & Lås Utbetalning'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
