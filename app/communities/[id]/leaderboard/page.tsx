'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  totalSales: number;
  totalOrders: number;
  level: number;
  xp: number;
}

export default function Leaderboard() {
  const params = useParams();
  const communityId = params.id as string;
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('all_time');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [communityId, period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/communities/${communityId}/leaderboard?period=${period}`);
      const data = await response.json();
      setLeaderboard(data.rankings || []);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-orange-400 to-orange-600';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🏆 Leaderboard
          </h1>
          <p className="text-xl text-gray-600">
            See who's crushing it in your community!
          </p>
        </motion.div>

        {/* Period Selector */}
        <div className="flex justify-center gap-4 mb-8">
          {(['daily', 'weekly', 'monthly', 'all_time'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                period === p
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {p === 'all_time' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-2xl font-bold text-purple-600">Loading...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry, index) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-2xl shadow-lg p-6 ${
                  entry.rank <= 3 ? 'border-2 border-yellow-400' : ''
                }`}
              >
                <div className="flex items-center gap-6">
                  {/* Rank */}
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getRankColor(entry.rank)} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                    {entry.rank <= 3 ? getMedalEmoji(entry.rank) : `#${entry.rank}`}
                  </div>

                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-3xl">
                    {entry.avatarUrl ? (
                      <img src={entry.avatarUrl} alt={entry.fullName} className="w-full h-full rounded-full" />
                    ) : (
                      '👤'
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{entry.fullName}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-600">
                        Level {entry.level}
                      </span>
                      <span className="text-sm text-gray-600">
                        {entry.xp.toLocaleString()} XP
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {entry.totalSales.toLocaleString()} NOK
                    </div>
                    <div className="text-sm text-gray-600">
                      {entry.totalOrders} orders
                    </div>
                  </div>
                </div>

                {/* Trophy Animation for Top 3 */}
                {entry.rank <= 3 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 + 0.2, type: 'spring' }}
                    className="absolute -top-2 -right-2 text-4xl"
                  >
                    {getMedalEmoji(entry.rank)}
                  </motion.div>
                )}
              </motion.div>
            ))}

            {leaderboard.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No rankings yet
                </h3>
                <p className="text-gray-600">
                  Be the first to make a sale and claim the top spot!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
