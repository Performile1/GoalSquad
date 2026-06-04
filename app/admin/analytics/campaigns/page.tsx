'use client';

import React, { useEffect, useState } from 'react';

interface CampaignAnalytics {
  total_campaigns: number;
  moq_success_rate: number;
  succeeded_campaigns: number;
  failed_campaigns: number;
  average_time_to_moq_days: number;
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
    moq_target: number;
    end_date: string;
    created_at: string;
  }>;
}

export default function AdminCampaignAnalytics() {
  const [stats, setStats] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics/campaigns')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.analytics);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-slate-500 font-mono text-xs">Hämtar kampanjdata...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="border-b border-slate-200 pb-5 mb-6">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admin Engine</span>
        <h1 className="text-2xl font-black tracking-tight text-slate-950">KAMPANJANALYTICS & MOQ</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Totalt Kampanjer</span>
          <span className="text-3xl font-black text-slate-900 mt-1 block">{stats?.total_campaigns}</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">MOQ Success Rate</span>
          <span className="text-3xl font-black text-emerald-600 mt-1 block">{stats?.moq_success_rate.toFixed(1)}%</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Lyckade</span>
          <span className="text-3xl font-black text-emerald-500 mt-1 block">{stats?.succeeded_campaigns}</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Misslyckade</span>
          <span className="text-3xl font-black text-rose-500 mt-1 block">{stats?.failed_campaigns}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Senaste Kampanjer</h3>
        <div className="space-y-3">
          {stats?.campaigns.slice(0, 5).map((campaign) => (
            <div key={campaign.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
              <div>
                <span className="text-sm font-bold text-slate-900 block">{campaign.name}</span>
                <span className="text-xs text-slate-500">MOQ: {campaign.moq_target}</span>
              </div>
              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                campaign.status === 'moq_succeeded' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : campaign.status === 'moq_failed'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-slate-100 text-slate-800'
              }`}>
                {campaign.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
