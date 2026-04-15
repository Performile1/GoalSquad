'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatarUrl?: string;
  communityName: string;
  totalSales: number;
  totalOrders: number;
  level: number;
}

type Period = 'all_time' | 'month' | 'week';

export default function PublicLeaderboardPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [sellers, setSellers] = useState<LeaderboardEntry[]>([]);
  const [communities, setCommunities] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sellers' | 'communities'>('sellers');

  useEffect(() => {
    fetchLeaderboard();
  }, [period, activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/leaderboard?type=${activeTab}&period=${period}`
      );
      const data = await response.json();
      
      if (activeTab === 'sellers') {
        setSellers(data.leaderboard || []);
      } else {
        setCommunities(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const leaderboardData = activeTab === 'sellers' ? sellers : communities;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold text-center mb-4">
            🏆 GoalSquad Leaderboard
          </h1>
          <p className="text-xl text-center text-blue-100">
            Se vem som leder försäljningen!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('sellers')}
            className={`px-8 py-3 rounded-xl font-semibold transition ${
              activeTab === 'sellers'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            👤 Säljare
          </button>
          <button
            onClick={() => setActiveTab('communities')}
            className={`px-8 py-3 rounded-xl font-semibold transition ${
              activeTab === 'communities'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            👥 Föreningar
          </button>
        </div>

        {/* Period Filter */}
        <div className="flex justify-center gap-3 mb-12">
          {[
            { value: 'week', label: 'Denna Vecka' },
            { value: 'month', label: 'Denna Månad' },
            { value: 'all_time', label: 'Totalt' },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value as Period)}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                period === p.value
                  ? 'bg-cyan-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {!loading && leaderboardData.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
            {/* 2nd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center pt-8"
            >
              <div className="bg-gradient-to-br from-gray-300 to-gray-400 w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                {leaderboardData[1].avatarUrl ? (
                  <img
                    src={leaderboardData[1].avatarUrl}
                    alt=""
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <span className="text-4xl">🥈</span>
                )}
              </div>
              <h3 className="font-bold text-lg mb-1">{leaderboardData[1].name}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {leaderboardData[1].communityName}
              </p>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-2xl font-bold text-gray-700">
                  {leaderboardData[1].totalSales.toLocaleString()} kr
                </div>
                <div className="text-sm text-gray-500">
                  {leaderboardData[1].totalOrders} ordrar
                </div>
              </div>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="text-4xl mb-2">👑</div>
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl border-4 border-yellow-300">
                {leaderboardData[0].avatarUrl ? (
                  <img
                    src={leaderboardData[0].avatarUrl}
                    alt=""
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <span className="text-5xl">🥇</span>
                )}
              </div>
              <h3 className="font-bold text-xl mb-1">{leaderboardData[0].name}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {leaderboardData[0].communityName}
              </p>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 shadow-lg border-2 border-yellow-300">
                <div className="text-3xl font-bold text-yellow-700">
                  {leaderboardData[0].totalSales.toLocaleString()} kr
                </div>
                <div className="text-sm text-yellow-600">
                  {leaderboardData[0].totalOrders} ordrar
                </div>
              </div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center pt-8"
            >
              <div className="bg-gradient-to-br from-orange-300 to-orange-500 w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                {leaderboardData[2].avatarUrl ? (
                  <img
                    src={leaderboardData[2].avatarUrl}
                    alt=""
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <span className="text-4xl">🥉</span>
                )}
              </div>
              <h3 className="font-bold text-lg mb-1">{leaderboardData[2].name}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {leaderboardData[2].communityName}
              </p>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-2xl font-bold text-orange-600">
                  {leaderboardData[2].totalSales.toLocaleString()} kr
                </div>
                <div className="text-sm text-gray-500">
                  {leaderboardData[2].totalOrders} ordrar
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500">
                Laddar leaderboard...
              </div>
            ) : leaderboardData.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                Ingen data tillgänglig än
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {leaderboardData.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 hover:bg-gray-50 transition flex items-center gap-4"
                  >
                    {/* Rank */}
                    <div className="text-2xl font-bold text-gray-400 w-16 text-center">
                      {getMedalEmoji(entry.rank)}
                    </div>

                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {entry.avatarUrl ? (
                        <img
                          src={entry.avatarUrl}
                          alt=""
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        entry.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">
                        {entry.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {entry.communityName}
                      </p>
                      {activeTab === 'sellers' && (
                        <div className="text-xs text-gray-500 mt-1">
                          Level {entry.level}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {entry.totalSales.toLocaleString()} kr
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.totalOrders} ordrar
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
