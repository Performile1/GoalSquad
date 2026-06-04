'use client';

import React, { useState } from 'react';

interface DiscrepancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  bulkShipmentId: string;
  sku: string;
  productName: string;
  expectedQty: number;
}

export function DiscrepancyReportModal({ isOpen, onClose, bulkShipmentId, sku, productName, expectedQty }: DiscrepancyModalProps) {
  const [actualQty, setActualQty] = useState<number>(expectedQty - 1);
  const [type, setType] = useState<string>('inventory_shortage');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/warehouse/terminal/discrepancy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulkShipmentId,
          sku,
          expectedQty,
          actualQty,
          type,
          notes
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Avvikelse sparad. Systemet har justerats till ${actualQty} st.`);
        onClose();
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-mono text-xs">
      <div className="bg-zinc-900 border-2 border-red-900 w-full max-w-md rounded-lg overflow-hidden shadow-2xl">
        <div className="bg-red-950 border-b border-red-900 p-4 flex items-center gap-2">
          <span className="text-red-500 font-black text-sm">⚠</span>
          <div>
            <h2 className="text-white font-black uppercase tracking-wider">Rapportera Avvikelse</h2>
            <p className="text-[10px] text-zinc-400 mt-0.5">{productName} ({sku})</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-zinc-400 text-[10px] uppercase font-bold block mb-1.5">Faktiskt antal hittat på hyllan:</label>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setActualQty(Math.max(0, actualQty - 1))}
                className="w-12 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-black text-base rounded active:scale-95"
              >
                -
              </button>
              <div className="flex-1 bg-zinc-950 border border-zinc-800 py-3 text-center text-lg font-black text-amber-400 rounded">
                {actualQty} <span className="text-zinc-500 text-xs font-normal">/ {expectedQty} st</span>
              </div>
              <button 
                type="button"
                onClick={() => setActualQty(Math.min(expectedQty, actualQty + 1))}
                className="w-12 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-black text-base rounded active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="text-zinc-400 text-[10px] uppercase font-bold block mb-1.5">Typ av avvikelse:</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded text-zinc-200 font-bold focus:outline-none focus:border-red-900"
            >
              <option value="inventory_shortage">Saldofel / Saknas på hylla</option>
              <option value="damaged_goods">Defekt / Skadat gods</option>
              <option value="wrong_item">Fel artikel på platsen</option>
            </select>
          </div>

          <div>
            <label className="text-zinc-400 text-[10px] uppercase font-bold block mb-1.5">Intern kommentar (Valfri):</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="T.ex. 'Kartongen var trasig vid ankomst'..."
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded text-zinc-300 h-16 focus:outline-none focus:border-zinc-700 resize-none"
            />
          </div>
        </div>

        <div className="p-4 bg-zinc-950 border-t border-zinc-850 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold uppercase rounded border border-zinc-800 transition"
          >
            Avbryt
          </button>
          <button
            type="button"
            disabled={isSubmitting || actualQty === expectedQty}
            onClick={handleSubmit}
            className={`flex-1 py-3 font-bold uppercase rounded transition text-center ${
              actualQty === expectedQty
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-red-700 hover:bg-red-600 text-white cursor-pointer shadow-md shadow-red-950/40'
            }`}
          >
            {isSubmitting ? 'Sparar...' : 'Skicka Rapport ⚠'}
          </button>
        </div>
      </div>
    </div>
  );
}
