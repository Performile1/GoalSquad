'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { SupportIcon, BadgeIcon, ImpactIcon, TrophyIcon, CheerIcon } from '@/app/components/BrandIcons';

interface CustomerGamification {
  total_spent: number;
  total_orders: number;
  supported_sellers: Record<string, number>;
  supported_communities: Record<string, number>;
  xp_given_to_sellers: number;
  collector_badges: string[];
  cheer_count: number;
  referral_count: number;
}

export default function CustomerGamificationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [gamification, setGamification] = useState<CustomerGamification | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, loading]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/customer/support-stats');
      if (res.ok) {
        const data = await res.json();
        setGamification(data);
      }
    } catch (err) {
      console.error('Failed to fetch gamification data:', err);
    } finally {
      setFetching(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center animate-pulse"><SupportIcon size={52} /></div>
          <p className="text-gray-500">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">The Supportive Fan</h1>
          <p className="text-gray-600">Din support gör skillnad! Se hur du hjälpt lag, klubbar och säljare.</p>
        </div>

        {/* Stats Overview */}
        {gamification && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <SupportIcon size={24} />
                </div>
                <span className="text-sm text-gray-500">Totalt spenderat</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{gamification.total_spent.toLocaleString()} kr</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <ImpactIcon size={24} />
                </div>
                <span className="text-sm text-gray-500">XP till säljare</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{gamification.xp_given_to_sellers.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <CheerIcon size={24} />
                </div>
                <span className="text-sm text-gray-500">Cheer-meddelanden</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{gamification.cheer_count}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <BadgeIcon size={24} />
                </div>
                <span className="text-sm text-gray-500">Collector badges</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{gamification.collector_badges.length}</p>
            </div>
          </div>
        )}

        {/* Supported Sellers */}
        {gamification && Object.keys(gamification.supported_sellers).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Stöttade Säljare</h2>
            <div className="space-y-3">
              {Object.entries(gamification.supported_sellers).map(([name, amount]) => (
                <div key={name} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-900">{name}</span>
                  <span className="text-primary-900 font-bold">{amount.toLocaleString()} kr</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supported Communities */}
        {gamification && Object.keys(gamification.supported_communities).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Stöttade Föreningar/Klubbar</h2>
            <div className="space-y-3">
              {Object.entries(gamification.supported_communities).map(([name, amount]) => (
                <div key={name} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-900">{name}</span>
                  <span className="text-primary-900 font-bold">{amount.toLocaleString()} kr</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collector Badges */}
        {gamification && gamification.collector_badges.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Collector Badges</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gamification.collector_badges.map((badge) => (
                <div key={badge} className="text-center p-4 bg-primary-50 rounded-lg">
                  <TrophyIcon size={48} />
                  <p className="text-sm font-semibold text-gray-900 mt-2">{badge}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
