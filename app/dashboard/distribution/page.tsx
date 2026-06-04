'use client';

import React, { useState } from 'react';

interface SellerDistribution {
  sellerName: string;
  parentName: string;
  phoneNumber: string;
  totalItems: number;
  breakdown: { productName: string; qty: number }[];
}

export default function ClassHubDistribution() {
  const [distributions, setDistributions] = useState<SellerDistribution[]>([
    {
      sellerName: 'Scarlett Wigrund',
      parentName: 'Rickard Wigrund',
      phoneNumber: '070-123 45 67',
      totalItems: 24,
      breakdown: [
        { productName: 'Arvid Nordquist Gran Dia (6-pack)', qty: 3 },
        { productName: 'Mormors Chokladflarn', qty: 6 }
      ]
    },
    {
      sellerName: 'William Wigrund',
      parentName: 'Rickard Wigrund',
      phoneNumber: '070-123 45 67',
      totalItems: 12,
      breakdown: [
        { productName: 'Sura Nappar Bulkbox', qty: 4 }
      ]
    }
  ]);

  const [pickedSellers, setPickedSellers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSellerPicked = (sellerName: string) => {
    if (pickedSellers.includes(sellerName)) {
      setPickedSellers(pickedSellers.filter(name => name !== sellerName));
    } else {
      setPickedSellers([...pickedSellers, sellerName]);
    }
  };

  const filteredDistributions = distributions.filter(d => 
    d.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.parentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 pb-12">
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm mb-4">
        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Utdelningsläge // Garage & Klassrum</span>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 mt-0.5">Hämta varor för laget</h1>
        <p className="text-xs text-slate-500 mt-1">Bocka av familjerna när de kommer och hämtar sina kassar.</p>
      </div>

      <div className="mb-4">
        <input 
          type="text"
          placeholder="Sök på barnets eller förälderns namn..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-sm outline-none focus:border-slate-400 shadow-sm transition"
        />
      </div>

      <div className="space-y-3">
        {filteredDistributions.map((dist) => {
          const isDone = pickedSellers.includes(dist.sellerName);
          return (
            <div 
              key={dist.sellerName}
              className={`bg-white border rounded-2xl p-4 transition shadow-sm ${
                isDone ? 'border-emerald-200 bg-emerald-50/20 opacity-60' : 'border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{dist.sellerName}</h3>
                  <p className="text-xs text-slate-500 font-medium">Anvarig: {dist.parentName} ({dist.phoneNumber})</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono ${
                  isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {dist.totalItems} st varor
                </span>
              </div>

              <div className="mt-3 bg-slate-50 border border-slate-150 rounded-xl p-3 space-y-2">
                {dist.breakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-medium">{item.productName}</span>
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      x{item.qty}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => toggleSellerPicked(dist.sellerName)}
                className={`w-full mt-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-[0.99] text-center ${
                  isDone 
                    ? 'bg-slate-200 text-slate-600' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-900/10'
                }`}
              >
                {isDone ? '✓ Hämtat & Kvitterat' : 'Markera som hämtad ➔'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
