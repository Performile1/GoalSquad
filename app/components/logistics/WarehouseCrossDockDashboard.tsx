'use client';

import React from 'react';

interface CrossDockInstruction {
  source_merchant: string;
  sku: string;
  product_name: string;
  total_quantity: number;
  target_consolidation_pallet: string;
  final_destinations: string[];
}

export function WarehouseCrossDockDashboard({ instructions }: { instructions: CrossDockInstruction[] }) {
  return (
    <div className="p-6 bg-slate-900 text-slate-100 min-h-screen font-sans">
      <div className="border-b border-slate-700 pb-4 mb-6">
        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Lagerpartner Terminal (Hub 1)</span>
        <h1 className="text-xl font-black text-white mt-1">Cross-Docking & Pall-konsolidering</h1>
        <p className="text-xs text-slate-400 mt-1">Sortera inkommande Merchant-gods direkt till regionala bulk-pallar.</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-850 border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider">
              <th className="p-3">Inkommande från</th>
              <th className="p-3">Artikel</th>
              <th className="p-3 text-center">Totalt Antal</th>
              <th className="p-3 bg-blue-950/40 text-blue-300">Sorteras till Bulk-pall</th>
              <th className="p-3">Slutliga mottagare i led 3</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {instructions.map((inst, idx) => (
              <tr key={idx} className="hover:bg-slate-750 transition-colors">
                <td className="p-3 font-semibold text-amber-400">{inst.source_merchant}</td>
                <td className="p-3">
                  <span className="font-bold block text-white">{inst.product_name}</span>
                  <span className="text-slate-400 text-[11px]">SKU: {inst.sku}</span>
                </td>
                <td className="p-3 text-center font-mono font-bold text-sm">{inst.total_quantity} st</td>
                <td className="p-3 bg-blue-950/20 font-bold text-blue-400 font-mono text-sm">
                  {inst.target_consolidation_pallet}
                </td>
                <td className="p-3 text-slate-400">
                  <div className="flex flex-wrap gap-1">
                    {inst.final_destinations.map((dest, i) => (
                      <span key={i} className="bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                        {dest}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
