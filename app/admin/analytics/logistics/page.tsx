'use client';

import React, { useEffect, useState } from 'react';

interface LogisticsStats {
  total_tracked_segments: number;
  performance: { hub_to_hub_efficiency_score: number; average_transit_hours: number };
  discrepancies: { total: number; pending: number; ratio: number };
}

export default function AdminLogisticsAnalytics() {
  const [stats, setStats] = useState<LogisticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics/logistics')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.analytics);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-slate-500 font-mono text-xs">Kör ruttanalys...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="border-b border-slate-200 pb-5 mb-6">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admin Engine</span>
        <h1 className="text-2xl font-black tracking-tight text-slate-950">LOGISTIK & RUTTPRESTANDA</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Rutteffektivitet (Nätverk)</span>
          <span className="text-3xl font-black text-slate-900 mt-1 block">{stats?.performance.hub_to_hub_efficiency_score}%</span>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">✓ Inom uppsatta tidsfönster</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Genomsnittlig Ledtid</span>
          <span className="text-3xl font-black text-slate-900 mt-1 block">{stats?.performance.average_transit_hours}h</span>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Från Merchant till Slutdestination</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Aktiva Avvikelser / Saldofel</span>
          <span className="text-3xl font-black text-amber-500 mt-1 block">{stats?.discrepancies.pending} st</span>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Av {stats?.discrepancies.total} totalt</p>
        </div>
      </div>
    </div>
  );
}
