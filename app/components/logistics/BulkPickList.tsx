'use client';

import React from 'react';

interface PickListItem {
  sku: string;
  product_name: string;
  variant_name: string;
  total_quantity: number;
  full_boxes: number;
  loose_units: number;
  warehouse_location: string;
}

export default function BulkPickList({ campaignName, pickList }: { campaignName: string, pickList: PickListItem[] }) {
  return (
    <div className="bg-white p-8 max-w-4xl mx-auto border border-slate-300 shadow-sm font-sans printing:shadow-none printing:border-none">
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Samlingspacksedel (B2B Bulk)</span>
          <h1 className="text-2xl font-black text-slate-950 mt-1">{campaignName}</h1>
          <p className="text-xs text-slate-600 mt-1">Genererad: {new Date().toLocaleDateString('sv-SE')}</p>
        </div>
        <div className="text-right">
          <div className="inline-block bg-slate-100 px-3 py-1 rounded text-xs font-mono font-bold text-slate-700">
            STATUS: REDO FÖR PLOCK
          </div>
        </div>
      </div>

      <div className="mt-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-300 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
              <th className="py-2 px-3 w-24">Plockplats</th>
              <th className="py-2 px-3">SKU / Artikel</th>
              <th className="py-2 px-3 text-right w-24">Hela Lådor</th>
              <th className="py-2 px-3 text-right w-24">Lösa ex</th>
              <th className="py-2 px-3 text-right w-24">Totalt antal</th>
              <th className="py-2 px-3 w-12 text-center">Plockat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {pickList.map((item) => (
              <tr key={item.sku} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-3 font-mono font-bold text-slate-900 bg-slate-50/50">
                  {item.warehouse_location}
                </td>
                <td className="py-3 px-3">
                  <div className="font-semibold text-slate-900">{item.product_name}</div>
                  <div className="text-[11px] text-slate-500">{item.variant_name} • SKU: {item.sku}</div>
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-700">
                  {item.full_boxes > 0 ? (
                    <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                      {item.full_boxes} st
                    </span>
                  ) : '-'}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-600">
                  {item.loose_units > 0 ? `${item.loose_units} st` : '-'}
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-base text-slate-950">
                  {item.total_quantity}
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="w-5 h-5 mx-auto border-2 border-slate-300 rounded bg-white" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 bg-slate-50 p-4 border border-slate-200 rounded-md">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Palleteringsinstruktion</h4>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Denna order ska samlas på mixad EUR-pall. Förslut pallen med sträckfilm och märk utsidan tydligt med medföljande **Community Delivery Label** innehållande kampanjnamn och mottagande lagförälders adress. Blanda ej artiklar från olika kampanjer på samma pall.
        </p>
      </div>
    </div>
  );
}
