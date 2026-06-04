'use client';

import React from 'react';

export function WarehousePalletLabel({ campaignName, totalBoxes, weightKg }: { campaignName: string, totalBoxes: number, weightKg: number }) {
  return (
    <div className="w-[100mm] h-[150mm] border-4 border-black p-4 mx-auto flex flex-col justify-between bg-white font-mono text-black select-none">
      <div className="text-center border-b-2 border-black pb-2">
        <span className="text-xs uppercase font-bold tracking-widest">Plattforms-Distribution</span>
        <h2 className="text-xl font-black mt-1">SAMLESÄNDNING</h2>
      </div>

      <div className="space-y-1 my-4">
        <span className="text-[10px] uppercase font-bold text-gray-650 block">Mottagande Community / Lag:</span>
        <div className="text-lg font-black bg-black text-white p-2 text-center uppercase tracking-tight">
          {campaignName}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t-2 border-b-2 border-black py-2 text-center">
        <div>
          <span className="text-[9px] uppercase font-bold block">Totalt antal kollin</span>
          <span className="text-xl font-black">{totalBoxes} ST</span>
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold block">Beräknad vikt</span>
          <span className="text-xl font-black">{weightKg} KG</span>
        </div>
      </div>

      <div className="flex flex-col items-center pt-2">
        <div className="w-full h-14 bg-[repeating-linear-gradient(90deg,black,black_2px,transparent_2px,transparent_6px)]" />
        <span className="text-[10px] font-bold mt-1">*{campaignName.substring(0,8).toUpperCase()}*</span>
      </div>
    </div>
  );
}
