'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface QueueItem {
  id: string;
  campaign_id: string;
  bulk_shipment_id: string;
  status: 'pending' | 'processed' | 'failed';
  assigned_bin: string;
  created_at: string;
  processed_at: string | null;
}

export default function CrossDockQueueManagement() {
  const params = useParams();
  const warehouseId = params.id as string;

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const res = await fetch(`/api/warehouse/terminal/queue?warehouseId=${warehouseId}`);
      const data = await res.json();
      if (data.success) {
        setQueue(data.queue);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Kunde inte hämta kön från servern.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, [warehouseId]);

  const handleAction = async (queueItemId: string, action: 'force_process' | 'flag_discrepancy') => {
    setActioningId(queueItemId);
    try {
      const res = await fetch('/api/warehouse/terminal/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueItemId, action, note: 'Åtgärdad via Queue Dashboard.' })
      });
      const data = await res.json();
      if (data.success) {
        fetchQueue();
      } else {
        alert(`Fel: ${data.error}`);
      }
    } catch (err) {
      alert('Nätverksfel vid hantering av kö-objekt.');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-100 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">CROSS-DOCK QUEUE MANAGEMENT</h1>
          <p className="text-slate-400 text-sm">Realtidsöversikt över inkommande bulkpallar och sorteringsköer.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchQueue} 
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-semibold rounded-lg border border-slate-700 transition"
          >
            Uppdatera Nu ↻
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-rose-950/50 border border-rose-500 rounded-xl text-rose-400 font-medium text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-mono text-sm">Laddar terminalkö...</div>
      ) : queue.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 rounded-xl border border-dashed border-slate-800">
          <p className="text-slate-400 font-medium">Kön är tom.</p>
          <p className="text-slate-600 text-xs mt-1">Inga väntande bulkpallar just nu.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4">Pall-ID</th>
                <th className="p-4">Kampanj-ID</th>
                <th className="p-4">Ankom</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Åtgärder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {queue.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-mono font-bold text-emerald-400 text-xs">
                    {item.id.slice(0, 8)}...
                  </td>
                  <td className="p-4 font-mono text-slate-300 text-xs">
                    {item.campaign_id.slice(0, 8)}...
                  </td>
                  <td className="p-4 text-slate-400 font-mono text-xs">
                    {new Date(item.created_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Väntar på breakdown
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      disabled={actioningId !== null}
                      onClick={() => handleAction(item.id, 'force_process')}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded transition"
                    >
                      Forcera ✓
                    </button>
                    <button
                      disabled={actioningId !== null}
                      onClick={() => handleAction(item.id, 'flag_discrepancy')}
                      className="px-3 py-1 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 border border-slate-700 hover:border-rose-900 text-slate-400 font-bold text-xs rounded transition"
                    >
                      Flagga Avvikelse ⚠
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
