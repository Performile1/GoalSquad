'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface PickItem {
  sku: string;
  name: string;
  location: string;
  full_boxes: number;
  loose_units: number;
  total_qty: number;
}

export default function WarehousePickingTerminal() {
  const params = useParams();
  const router = useRouter();
  const picklistId = params.picklistId as string;
  const warehouseId = params.id as string;

  const [items, setItems] = useState<PickItem[]>([]);
  const [confirmedItems, setConfirmedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // 1. Fetch picking tasks for this warehouse + campaign (picklistId)
        const res = await fetch(`/api/warehouses/${warehouseId}/picking-tasks?status=pending`);
        const json = await res.json();
        const tasks = (json.tasks ?? []).filter((t: any) => t.campaign_id === picklistId);

        const skus = tasks.map((t: any) => t.sku);
        if (skus.length === 0) {
          setItems([]);
          setLoading(false);
          return;
        }

        // 2. Enrich with product names
        const { data: products } = await supabase
          .from('products')
          .select('sku, name')
          .in('sku', skus);

        // 3. Enrich with inventory locations
        const { data: inventory } = await supabase
          .from('warehouse_inventory')
          .select('sku, location_code')
          .in('sku', skus)
          .eq('warehouse_id', warehouseId);

        const productMap = new Map((products ?? []).map((p: any) => [p.sku, p.name]));
        const locMap = new Map((inventory ?? []).map((i: any) => [i.sku, i.location_code]));

        const mapped: PickItem[] = tasks.map((t: any) => {
          const qty = t.quantity_to_pick ?? 0;
          return {
            sku: t.sku,
            name: productMap.get(t.sku) || t.sku,
            location: locMap.get(t.sku) || 'A-01',
            full_boxes: Math.floor(qty / 12),
            loose_units: qty % 12,
            total_qty: qty,
          };
        });

        setItems(mapped);
      } catch (e) {
        console.error('Failed to load picking data:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [picklistId, warehouseId]);

  const toggleItemConfirm = async (sku: string, qty: number) => {
    if (confirmedItems.includes(sku)) {
      setConfirmedItems(confirmedItems.filter(id => id !== sku));
      return;
    }

    const res = await fetch('/api/warehouse/terminal/pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bulkShipmentId: picklistId,
        action: 'confirm_item',
        sku,
        quantityPicked: qty,
        pickerId: 'MANUELL-TRUCK-01'
      })
    });

    const data = await res.json();
    if (data.success) {
      setConfirmedItems([...confirmedItems, sku]);
    }
  };

  const finalizePicklist = async () => {
    setIsFinalizing(true);
    try {
      const res = await fetch('/api/warehouse/terminal/pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulkShipmentId: picklistId,
          action: 'finalize_picklist'
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('✓ Plocklista stängd. Pall-etikett utskriven på skrivare: ZEBRA-MAIN-01');
        router.push(`/warehouses/${warehouseId}/dashboard`);
      }
    } catch (err) {
      alert('Kunde inte stänga plocklistan.');
    } finally {
      setIsFinalizing(false);
    }
  };

  if (loading) return <div className="p-6 text-zinc-400 bg-zinc-950 min-h-screen font-mono">Hämtar plockrutter...</div>;

  const allItemsPicked = confirmedItems.length === items.length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono p-4">
      <div className="border-b border-zinc-800 pb-4 mb-4 flex justify-between items-center">
        <div>
          <span className="text-blue-500 font-bold text-xs block">BATCH-PICKING TERMINAL</span>
          <h1 className="text-md font-black text-white uppercase">PLOCKLISTA: {picklistId.slice(0, 8)}</h1>
        </div>
        <div className="text-right">
          <span className="text-xs text-zinc-500 block">STATUS</span>
          <span className="text-xs bg-blue-950 text-blue-400 font-bold px-2 py-0.5 rounded border border-blue-900 uppercase">
            Aktivt Plock
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isPicked = confirmedItems.includes(item.sku);
          return (
            <div
              key={item.sku}
              onClick={() => toggleItemConfirm(item.sku, item.total_qty)}
              className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${
                isPicked
                  ? 'bg-zinc-900/40 border-zinc-800 opacity-40 grayscale'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 active:bg-zinc-850'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="inline-block bg-amber-500 text-zinc-950 font-black px-2 py-0.5 rounded text-xs mb-2">
                    LAGEPLATS: {item.location}
                  </div>
                  <h3 className="text-sm font-black text-white">{item.name}</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">SKU: {item.sku}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 uppercase block">Totalt antal</span>
                  <span className="text-xl font-black text-white">{item.total_qty} <span className="text-xs text-zinc-400 font-normal">st</span></span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between items-center bg-zinc-950/40 p-2 rounded-lg">
                <div className="flex gap-4">
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase block">Hela Lådor</span>
                    <span className="text-sm font-black text-amber-400">{item.full_boxes} <span className="text-[10px] text-zinc-500 font-bold">LÅD</span></span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase block">Stycksaker</span>
                    <span className="text-sm font-black text-blue-400">{item.loose_units} <span className="text-[10px] text-zinc-500 font-bold">ST</span></span>
                  </div>
                </div>
                {isPicked && <span className="text-emerald-400 font-bold text-xs">REDO ✓</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 border-t border-zinc-900 pt-4">
        <button
          onClick={finalizePicklist}
          disabled={!allItemsPicked || isFinalizing}
          className={`w-full py-4 rounded-xl font-black uppercase text-center text-sm transition-all shadow-lg ${
            allItemsPicked && !isFinalizing
              ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 border-b-4 border-emerald-700 active:border-b-0'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
        >
          {isFinalizing ? 'Skriver ut dokumentation...' : allItemsPicked ? 'Färdigställ Pall & Skriv ut Fraktsedel ➔' : 'Plocka alla artiklar först'}
        </button>
      </div>
    </div>
  );
}
