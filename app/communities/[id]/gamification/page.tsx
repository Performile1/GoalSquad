'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { MilestoneIcon, SquadIcon, BadgeIcon, TierIcon, TrophyIcon, LeaderboardIcon } from '@/app/components/BrandIcons';

interface CommunityMilestone {
  id: string;
  name: string;
  description: string;
  milestone_type: string;
  target_value: number;
  current_value: number;
  is_achieved: boolean;
  achieved_at: string | null;
  reward_description: string;
}

interface SquadTier {
  id: string;
  tier_name: string;
  tier_level: number;
  required_revenue: number | null;
  required_sales: number | null;
  required_members: number | null;
  benefits: Record<string, any>;
  achieved_at: string | null;
}

interface CommunityBadge {
  id: string;
  name: string;
  description: string;
  badge_type: string;
  icon_url: string | null;
  awarded_at: string | null;
}

interface CommunityStats {
  total_revenue: number;
  total_sales: number;
  total_members: number;
  total_xp_earned: number;
}

export default function CommunityGamificationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const communityId = params.id as string;
  const [activeTab, setActiveTab] = useState<'milestones' | 'tiers' | 'badges' | 'leaderboard'>('milestones');
  const [milestones, setMilestones] = useState<CommunityMilestone[]>([]);
  const [squadTiers, setSquadTiers] = useState<SquadTier[]>([]);
  const [badges, setBadges] = useState<CommunityBadge[]>([]);
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user && communityId) {
      fetchData();
    }
  }, [user, loading, communityId]);

  const fetchData = async () => {
    try {
      // Fetch milestones
      const milestonesRes = await fetch(`/api/communities/${communityId}/milestones`);
      if (milestonesRes.ok) {
        const milestonesData = await milestonesRes.json();
        setMilestones(milestonesData);
      }

      // Fetch squad tiers
      const tiersRes = await fetch(`/api/communities/${communityId}/squad-tiers`);
      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setSquadTiers(tiersData);
      }

      // Fetch badges
      const badgesRes = await fetch(`/api/communities/${communityId}/badges`);
      if (badgesRes.ok) {
        const badgesData = await badgesRes.json();
        setBadges(badgesData);
      }

      // Fetch community stats
      const statsRes = await fetch(`/api/communities/${communityId}/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setCommunityStats(statsData);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setFetching(false);
    }
  };

  const getTierColor = (level: number): string => {
    const colors: Record<number, string> = {
      1: 'bg-bronze-100 text-bronze-700',
      2: 'bg-silver-100 text-silver-700',
      3: 'bg-gold-100 text-gold-700',
      4: 'bg-platinum-100 text-platinum-700',
      5: 'bg-diamond-100 text-diamond-700',
      6: 'bg-elite-100 text-elite-700',
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
  };

  const getMilestoneProgress = (milestone: CommunityMilestone): number => {
    if (milestone.target_value === 0) return 0;
    return Math.min((milestone.current_value / milestone.target_value) * 100, 100);
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center animate-pulse"><SquadIcon size={52} /></div>
          <p className="text-gray-500">Laddar gamification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Community Gamification</h1>
          <p className="text-gray-600">Följ ert lagets framsteg, nå milestones och lås upp exklusiva förmåner!</p>
        </div>

        {/* Community Stats Overview */}
        {communityStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <TrophyIcon size={24} />
                </div>
                <span className="text-sm text-gray-500">Total Intäkt</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{communityStats.total_revenue.toLocaleString()} kr</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <SquadIcon size={24} />
                </div>
                <span className="text-sm text-gray-500">Total Försäljning</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{communityStats.total_sales}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <BadgeIcon size={24} />
                </div>
                <span className="text-sm text-gray-500">Medlemmar</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{communityStats.total_members}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <LeaderboardIcon size={24} />
                </div>
                <span className="text-sm text-gray-500">Totalt XP</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{communityStats.total_xp_earned.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Current Tier Display */}
        {squadTiers.length > 0 && (
          <div className="bg-gradient-to-r from-primary-900 to-primary-600 rounded-xl shadow-sm p-6 mb-8 text-white">
            <div className="flex items-center gap-4">
              <TierIcon size={64} />
              <div>
                <h3 className="text-2xl font-bold mb-1">Aktuell Tier: {squadTiers[0].tier_name}</h3>
                <p className="text-white/90">
                  {squadTiers.filter(t => t.achieved_at).length} av {squadTiers.length} tiers upplåsta
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'milestones'
                ? 'bg-primary-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Milestones ({milestones.filter(m => m.is_achieved).length}/{milestones.length})
          </button>
          <button
            onClick={() => setActiveTab('tiers')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'tiers'
                ? 'bg-primary-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Squad Tiers
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'badges'
                ? 'bg-primary-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Märken ({badges.filter(b => b.awarded_at).length})
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'leaderboard'
                ? 'bg-primary-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Leaderboard
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'milestones' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Team Milestones</h2>
            
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <div key={milestone.id} className={`p-6 border-2 rounded-lg ${
                  milestone.is_achieved ? 'border-green-300 bg-green-50' : 'border-gray-200'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${milestone.is_achieved ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <MilestoneIcon size={32} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">{milestone.name}</h3>
                        <p className="text-sm text-gray-600">{milestone.description}</p>
                        {milestone.reward_description && (
                          <p className="text-sm text-primary-700 mt-1">{milestone.reward_description}</p>
                        )}
                      </div>
                    </div>
                    {milestone.is_achieved && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        Uppnådd {milestone.achieved_at ? new Date(milestone.achieved_at).toLocaleDateString('sv-SE') : ''}
                      </span>
                    )}
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all duration-500 ${
                        milestone.is_achieved ? 'bg-green-600' : 'bg-primary-900'
                      }`}
                      style={{ width: `${getMilestoneProgress(milestone)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>{milestone.current_value.toLocaleString()} / {milestone.target_value.toLocaleString()}</span>
                    <span>{getMilestoneProgress(milestone).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>

            {milestones.length === 0 && (
              <div className="text-center py-16">
                <div className="mb-4 flex justify-center"><MilestoneIcon size={72} className="opacity-40" /></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Inga milestones</h2>
                <p className="text-gray-500">Inga milestones har skapats än för detta community.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tiers' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Squad Tiers</h2>
            
            <div className="space-y-4">
              {squadTiers.map((tier) => (
                <div key={tier.id} className={`p-6 border-2 rounded-lg ${
                  tier.achieved_at ? 'border-primary-300 bg-primary-50' : 'border-gray-200 opacity-60'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${tier.achieved_at ? 'bg-primary-100' : 'bg-gray-100'}`}>
                        <TierIcon size={32} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">{tier.tier_name}</h3>
                        <p className="text-sm text-gray-600">Level {tier.tier_level}</p>
                      </div>
                    </div>
                    {tier.achieved_at && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                        Uppnådd {new Date(tier.achieved_at).toLocaleDateString('sv-SE')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {tier.required_revenue && (
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500">Intäkt</p>
                        <p className="font-bold text-gray-900">{tier.required_revenue.toLocaleString()} kr</p>
                      </div>
                    )}
                    {tier.required_sales && (
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500">Försäljning</p>
                        <p className="font-bold text-gray-900">{tier.required_sales}</p>
                      </div>
                    )}
                    {tier.required_members && (
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500">Medlemmar</p>
                        <p className="font-bold text-gray-900">{tier.required_members}</p>
                      </div>
                    )}
                  </div>

                  {tier.benefits && Object.keys(tier.benefits).length > 0 && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-semibold text-gray-900 mb-1">Förmåner:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {Object.entries(tier.benefits).map(([key, value]) => (
                          <li key={key}>{String(value)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {squadTiers.length === 0 && (
              <div className="text-center py-16">
                <div className="mb-4 flex justify-center"><TierIcon size={72} className="opacity-40" /></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Inga squad tiers</h2>
                <p className="text-gray-500">Inga squad tiers har konfigurerats än.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Community Märken</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-6 border-2 rounded-lg text-center ${
                    badge.awarded_at ? 'border-primary-300 bg-primary-50' : 'border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex justify-center mb-4">
                    <BadgeIcon size={64} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{badge.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    badge.awarded_at ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {badge.awarded_at ? 'Uppnådd' : 'Låst'}
                  </span>
                  {badge.awarded_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(badge.awarded_at).toLocaleDateString('sv-SE')}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {badges.length === 0 && (
              <div className="text-center py-16">
                <div className="mb-4 flex justify-center"><BadgeIcon size={72} className="opacity-40" /></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Inga märken</h2>
                <p className="text-gray-500">Inga märken har skapats än för detta community.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Community Leaderboard</h2>
            
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((rank) => (
                <div key={rank} className={`flex items-center justify-between p-4 rounded-lg ${
                  rank === 1 ? 'bg-yellow-50 border-2 border-yellow-300' : 
                  rank === 2 ? 'bg-gray-100 border-2 border-gray-300' :
                  rank === 3 ? 'bg-orange-50 border-2 border-orange-300' :
                  'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold ${
                      rank === 1 ? 'bg-yellow-400 text-white' :
                      rank === 2 ? 'bg-gray-400 text-white' :
                      rank === 3 ? 'bg-orange-400 text-white' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {rank}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Säljare #{rank}</p>
                      <p className="text-sm text-gray-500">Level {10 - rank + 1}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{(50000 - rank * 5000).toLocaleString()} kr</p>
                    <p className="text-sm text-gray-500">{1000 - rank * 100} XP</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 mb-4">Leaderboard uppdateras dagligen</p>
              <button className="px-6 py-2 bg-primary-900 text-white rounded-lg font-semibold hover:bg-primary-600 transition">
                Se full leaderboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
