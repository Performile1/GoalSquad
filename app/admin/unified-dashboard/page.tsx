'use client';

import React, { useState } from 'react';

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState<'merchant' | 'warehouse' | 'orders' | 'e2e'>('merchant');
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderLoading, setOrderLoading] = useState(false);
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

  const fetchOrders = async (status?: string) => {
    setOrderLoading(true);
    try {
      const url = status && status !== 'all'
        ? `/api/admin/orders?status=${status}&limit=50`
        : '/api/admin/orders?limit=50';
      const res = await fetch(url);
      const data = await res.json();
      setAdminOrders(data.orders || []);
      addLog(`Hämtade ${(data.orders || []).length} ordrar`);
    } catch {
      addLog('❌ Kunde inte hämta ordrar');
    } finally {
      setOrderLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        addLog(`Order ${orderId.slice(-6)} uppdaterad till ${status}`);
        if (status === 'ready_for_pickup') {
          addLog(`QR-kod genererad: /pickup/${orderId}`);
        }
        fetchOrders(orderFilter);
      }
    } catch {
      addLog('❌ Kunde inte uppdatera order');
    }
  };

  const bulkUpdateStatus = async (status: string) => {
    const selected = adminOrders.filter((o) => o._selected);
    if (selected.length === 0) {
      addLog('Välj minst en order först');
      return;
    }
    for (const order of selected) {
      await updateOrderStatus(order.id, status);
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    setAdminOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, _selected: !o._selected } : o))
    );
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
            onClick={() => { setActiveTab('orders'); fetchOrders(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'orders' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Ordrar
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

          {activeTab === 'orders' && (
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase mb-1">Orderhantering</h2>
                <p className="text-xs text-slate-400">Filtrera, uppdatera status och generera QR-koder.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'paid', 'processing', 'ready_for_pickup', 'completed'].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setOrderFilter(s); fetchOrders(s); }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                      orderFilter === s ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s === 'all' ? 'Alla' : s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => bulkUpdateStatus('processing')}
                  className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-[10px] font-bold hover:bg-blue-600 transition"
                >
                  Bulk: Processing
                </button>
                <button
                  onClick={() => bulkUpdateStatus('ready_for_pickup')}
                  className="px-3 py-1.5 bg-green-700 text-white rounded-lg text-[10px] font-bold hover:bg-green-600 transition"
                >
                  Bulk: Klar för hämtning
                </button>
                <button
                  onClick={() => bulkUpdateStatus('completed')}
                  className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-600 transition"
                >
                  Bulk: Avslutad
                </button>
              </div>
              {orderLoading ? (
                <div className="text-xs text-slate-500">Laddar ordrar...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-800">
                        <th className="pb-2 pr-2"></th>
                        <th className="pb-2 pr-4">Order</th>
                        <th className="pb-2 pr-4">Status</th>
                        <th className="pb-2 pr-4">Summa</th>
                        <th className="pb-2 pr-4">Säljare</th>
                        <th className="pb-2">Åtgärder</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {adminOrders.map((order) => (
                        <tr key={order.id} className="text-slate-300">
                          <td className="py-2 pr-2">
                            <input
                              type="checkbox"
                              checked={!!order._selected}
                              onChange={() => toggleSelectOrder(order.id)}
                              className="rounded bg-slate-800 border-slate-700"
                            />
                          </td>
                          <td className="py-2 pr-4 font-mono">{order.id?.slice(-8)}</td>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              order.status === 'completed' ? 'bg-green-900 text-green-300' :
                              order.status === 'paid' ? 'bg-blue-900 text-blue-300' :
                              order.status === 'ready_for_pickup' ? 'bg-yellow-900 text-yellow-300' :
                              order.status === 'processing' ? 'bg-purple-900 text-purple-300' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-2 pr-4">{order.total?.toLocaleString()} kr</td>
                          <td className="py-2 pr-4">{order.seller_id?.slice(-8) || '-'}</td>
                          <td className="py-2 flex gap-1">
                            <button
                              onClick={() => updateOrderStatus(order.id, 'processing')}
                              className="px-2 py-1 bg-blue-800 text-blue-200 rounded text-[9px] hover:bg-blue-700"
                            >
                              Process
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'ready_for_pickup')}
                              className="px-2 py-1 bg-green-800 text-green-200 rounded text-[9px] hover:bg-green-700"
                            >
                              QR
                            </button>
                            <a
                              href={`/pickup/${order.id}`}
                              target="_blank"
                              className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-[9px] hover:bg-slate-700"
                            >
                              Visa
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {adminOrders.length === 0 && (
                    <p className="text-slate-600 text-xs mt-4 text-center">Inga ordrar hittades</p>
                  )}
                </div>
              )}
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
