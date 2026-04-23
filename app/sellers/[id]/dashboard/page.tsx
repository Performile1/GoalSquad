'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { TrophyIcon, UserIcon, DashboardIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface SellerStats {
  fullName: string;
  shopUrl: string;
  xpTotal: number;
  currentLevel: number;
  streakDays: number;
  totalSales: number;
  totalOrders: number;
  totalCommission: number;
  rank: number | null;
  achievements: Achievement[];
  avatarData: AvatarData;
  treasuryBalance: {
    held: number;
    available: number;
    total: number;
  };
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: string;
  unlockedAt: string;
}

interface AvatarData {
  base: string;
  gear: string[];
  background: string;
  unlockedItems: string[];
}

export default function SellerDashboard() {
  const params = useParams();
  const sellerId = params.id as string;
  
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerStats();
  }, [sellerId]);

  const fetchSellerStats = async () => {
    try {
      const response = await apiFetch(`/api/sellers/${sellerId}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch seller stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary-900 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-primary-900 font-semibold">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserIcon size={64} className="text-gray-300 mx-auto mb-4" />
          <p className="text-2xl font-bold text-gray-900">Säljaren hittades inte</p>
        </div>
      </div>
    );
  }

  const xpForNextLevel = getXPForLevel(stats.currentLevel + 1);
  const xpForCurrentLevel = getXPForLevel(stats.currentLevel);
  const xpProgress = stats.xpTotal - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = (xpProgress / xpNeeded) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Välkommen tillbaka, {stats.fullName}!
          </h1>
          <p className="text-gray-600">Din butik: goalsquad.shop/{stats.shopUrl}</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Level Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-primary-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Nivå</h3>
              <TrophyIcon size={36} className="text-primary-900" />
            </div>
            <div className="text-5xl font-bold text-primary-900 mb-2">
              {stats.currentLevel}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-primary-900 to-primary-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              {xpProgress} / {xpNeeded} XP till nivå {stats.currentLevel + 1}
            </p>
          </motion.div>

          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Streak 🔥</h3>
              <div className="text-4xl">🔥</div>
            </div>
            <div className="text-5xl font-bold text-orange-600 mb-2">
              {stats.streakDays}
            </div>
            <p className="text-sm text-gray-600">
              {stats.streakDays > 0 ? 'Fortsätt så!' : 'Starta din streak idag!'}
            </p>
          </motion.div>

          {/* Sales Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-primary-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Total försäljning</h3>
              <div className="text-4xl">💰</div>
            </div>
            <div className="text-3xl font-bold text-primary-900 mb-2">
              {stats.totalSales.toLocaleString()} kr
            </div>
            <p className="text-sm text-gray-600">{stats.totalOrders} ordrar</p>
          </motion.div>

          {/* Rank Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-primary-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Lagets ranking</h3>
              <div className="text-4xl">🏆</div>
            </div>
            <div className="text-5xl font-bold text-primary-900 mb-2">
              #{stats.rank || '-'}
            </div>
            <p className="text-sm text-gray-600">I din förening</p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar & Treasury */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-1"
          >
            {/* Avatar Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Din avatar</h3>
              <div className="relative w-full aspect-square bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl flex items-center justify-center mb-4">
                <div className="text-8xl">👤</div>
              </div>
              <button className="w-full bg-primary-900 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition">
                Anpassa avatar
              </button>
            </div>

            {/* Treasury Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Mitt kassavalv 💎</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tillgängligt</span>
                  <span className="text-2xl font-bold text-primary-900">
                    {stats.treasuryBalance.available.toLocaleString()} kr
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Reserverat (30 dagar)</span>
                  <span className="text-xl font-semibold text-amber-600">
                    {stats.treasuryBalance.held.toLocaleString()} kr
                  </span>
                </div>
                <div className="border-t border-primary-100 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-semibold">Totalt</span>
                    <span className="text-3xl font-bold text-primary-900">
                      {stats.treasuryBalance.total.toLocaleString()} kr
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Achievements & Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2"
          >
            {/* Achievements */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Prestationer ({stats.achievements.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stats.achievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    whileHover={{ scale: 1.05 }}
                    className={`p-4 rounded-xl border-2 ${getRarityColor(achievement.rarity)}`}
                  >
                    <div className="text-4xl mb-2">{achievement.iconUrl || '🏅'}</div>
                    <h4 className="font-bold text-sm mb-1">{achievement.name}</h4>
                    <p className="text-xs text-gray-600">{achievement.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Snabbåtgärder</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="bg-primary-900 text-white py-4 rounded-xl font-semibold hover:bg-primary-700 transition">
                  📦 Mina produkter
                </button>
                <button className="bg-primary-600 text-white py-4 rounded-xl font-semibold hover:bg-primary-700 transition">
                  📊 Se ordrar
                </button>
                <button className="bg-primary-900 text-white py-4 rounded-xl font-semibold hover:bg-primary-700 transition">
                  🎯 Leaderboard
                </button>
                <button className="border-2 border-primary-900 text-primary-900 py-4 rounded-xl font-semibold hover:bg-primary-50 transition">
                  ⚙️ Inställningar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function getXPForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'legendary':
      return 'border-yellow-400 bg-yellow-50';
    case 'epic':
      return 'border-primary-400 bg-primary-50';
    case 'rare':
      return 'border-primary-200 bg-primary-50';
    default:
      return 'border-gray-300 bg-gray-50';
  }
}
