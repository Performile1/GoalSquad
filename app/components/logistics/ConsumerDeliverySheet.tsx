'use client';

import React from 'react';

interface CustomerDelivery {
  customer_name: string;
  delivery_address: string;
  phone: string;
  seller_child_name: string;
  items: {
    product_name: string;
    variant_name: string;
    quantity: number;
  }[];
}

export function ConsumerDeliverySheet({ campaignName, deliveries }: { campaignName: string, deliveries: CustomerDelivery[] }) {
  return (
    <div className="p-6 bg-white max-w-4xl mx-auto space-y-8 font-sans printing:p-0">
      <div className="border-b-2 border-slate-900 pb-4">
        <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight">Slutkundsfordelning / Utdelningssedel</h1>
        <p className="text-xs text-slate-500">Kampanj: {campaignName} • Sorterad per säljare för enkel utlämning.</p>
      </div>

      {deliveries.map((delivery, index) => (
        <div key={index} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm space-y-3 page-break-inside-avoid">
          <div className="flex flex-col sm:flex-row justify-between border-b border-slate-150 pb-2 bg-slate-50 p-2 rounded">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase">Säljare (Barn)</span>
              <p className="text-sm font-bold text-slate-900">{delivery.seller_child_name}</p>
            </div>
            <div className="sm:text-right mt-2 sm:mt-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Levereras till slutkund</span>
              <p className="text-xs font-semibold text-slate-800">{delivery.customer_name} ({delivery.phone})</p>
              <p className="text-[11px] text-slate-500">{delivery.delivery_address}</p>
            </div>
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 text-left">
                <th className="pb-1">Produkt / Variant</th>
                <th className="pb-1 text-right w-20">Antal</th>
                <th className="pb-1 w-12 text-center">Utdelad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {delivery.items.map((item, idx) => (
                <tr key={idx} className="text-slate-700">
                  <td className="py-2">
                    <span className="font-medium text-slate-950">{item.product_name}</span>
                    <span className="text-slate-500 block text-[11px]">{item.variant_name}</span>
                  </td>
                  <td className="py-2 text-right font-mono font-bold text-sm text-slate-900">{item.quantity} st</td>
                  <td className="py-2"><div className="w-4 h-4 mx-auto border border-slate-300 rounded" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
