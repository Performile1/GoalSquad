'use client';

import React, { useEffect, useState } from 'react';

interface LeaderboardEntry {
  campaign_id: string;
  seller_id: string;
  seller_name: string;
  total_units_sold: number;
  total_revenue_sek: number;
  updated_at: string;
}

interface Badge {
  id: string;
  campaign_id: string;
  seller_id: string;
  badge_type: string;
  created_at: string;
}

export default function CampaignLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const campaignId = 'camp-9b-vair';
    
    Promise.all([
      fetch(`/api/gamification/leaderboard?campaignId=${campaignId}`).then(r => r.json()),
    ]).then(([data]) => {
      if (data.success) {
        setLeaderboard(data.leaderboard);
        setBadges(data.badges);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-slate-500 font-mono text-xs">Laddar leaderboard...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 font-sans p-4">
      <div className="max-w-2xl mx-auto">
        
        <div className="text-center mb-8">
          <span className="text-[10px] font-black tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase">
            Gamification Engine
          </span>
          <h1 className="text-3xl font-black text-slate-950 mt-3 tracking-tight">Klass 9B Leaderboard</h1>
          <p className="text-sm text-slate-500 mt-1">Topp 10 säljare i kampanjen</p>
        </div>

        <div className="space-y-3">
          {leaderboard.map((entry, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;
            const userBadges = badges.filter(b => b.seller_id === entry.seller_id);

            return (
              <div 
                key={entry.seller_id} 
                className={`bg-white border-2 rounded-2xl p-4 shadow-sm transition-all ${
                  isTop3 
                    ? 'border-amber-300 shadow-amber-100/50' 
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${
                    rank === 1 ? 'bg-amber-400 text-amber-950' :
                    rank === 2 ? 'bg-slate-300 text-slate-700' :
                    rank === 3 ? 'bg-amber-600 text-amber-100' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {rank}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{entry.seller_name}</h3>
                    <div className="flex gap-2 mt-1">
                      {userBadges.map((badge) => (
                        <span key={badge.id} className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase">
                          {badge.badge_type.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-lg font-black text-slate-900">{entry.total_units_sold}</span>
                    <span className="text-[10px] text-slate-500 font-medium">sålda</span>
                  </div>

                  <div className="text-right">
                    <span className="block text-lg font-black text-emerald-600">{entry.total_revenue_sek.toLocaleString('sv-SE')}</span>
                    <span className="text-[10px] text-slate-500 font-medium">kr</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs text-slate-500">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Live-uppdateringar aktiverade
          </div>
        </div>
      </div>
    </div>
  );
}
