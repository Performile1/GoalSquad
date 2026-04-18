'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MessageIcon } from '@/app/components/BrandIcons';

interface CommunityStats {
  name: string;
  slug: string;
  communityType: string;
  totalMembers: number;
  totalSales: number;
  totalCommission: number;
  activeCampaigns: Campaign[];
  topSellers: TopSeller[];
  treasuryBalance: {
    held: number;
    available: number;
    total: number;
  };
}

interface Campaign {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  salesGoal: number;
  totalSales: number;
  status: string;
}

interface TopSeller {
  id: string;
  fullName: string;
  totalSales: number;
  totalOrders: number;
}

export default function CommunityDashboard() {
  const params = useParams();
  const communityId = params.id as string;
  
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityStats();
  }, [communityId]);

  const fetchCommunityStats = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch community stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-green-600">Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-red-600">Community not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {stats.name} Dashboard
          </h1>
          <p className="text-gray-600">Community Type: {stats.communityType}</p>
        </motion.div>

        {/* Community Messaging Card */}
        <Link href="/messages" className="block mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200 hover:border-green-500 transition cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <MessageIcon size={32} className="text-green-900" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Community Meddelanden</h2>
                <p className="text-gray-600">Kommunicera med säljare och medlemmar</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="text-4xl mb-2">👥</div>
            <div className="text-3xl font-bold text-primary-900">{stats.totalMembers}</div>
            <div className="text-sm text-gray-600">Active Members</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="text-4xl mb-2">💰</div>
            <div className="text-3xl font-bold text-green-600">
              {stats.totalSales.toLocaleString()} NOK
            </div>
            <div className="text-sm text-gray-600">Total Sales</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-3xl font-bold text-primary-900">
              {stats.totalCommission.toLocaleString()} NOK
            </div>
            <div className="text-sm text-gray-600">Total Commission</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="text-4xl mb-2">📊</div>
            <div className="text-3xl font-bold text-orange-600">
              {stats.activeCampaigns.length}
            </div>
            <div className="text-sm text-gray-600">Active Campaigns</div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Treasury */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Treasury 💎</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Available for Payout</div>
                <div className="text-3xl font-bold text-green-600">
                  {stats.treasuryBalance.available.toLocaleString()} NOK
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Pending (30 days)</div>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.treasuryBalance.held.toLocaleString()} NOK
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="text-sm text-gray-600 mb-1">Total Balance</div>
                <div className="text-4xl font-bold text-primary-900">
                  {stats.treasuryBalance.total.toLocaleString()} NOK
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition">
                Request Payout
              </button>
            </div>
          </motion.div>

          {/* Campaigns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Active Campaigns</h3>
              <button className="bg-primary-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-800 transition">
                + New Campaign
              </button>
            </div>
            <div className="space-y-4">
              {stats.activeCampaigns.map((campaign) => {
                const progress = campaign.salesGoal > 0 
                  ? (campaign.totalSales / campaign.salesGoal) * 100 
                  : 0;
                
                return (
                  <div key={campaign.id} className="border rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-lg">{campaign.name}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold">
                          {campaign.totalSales.toLocaleString()} / {campaign.salesGoal.toLocaleString()} NOK
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {stats.activeCampaigns.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-gray-600">No active campaigns</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Top Sellers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6 bg-white rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Top Sellers 🏆</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.topSellers.slice(0, 3).map((seller, index) => (
              <div key={seller.id} className="border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <div>
                    <h4 className="font-bold">{seller.fullName}</h4>
                    <p className="text-sm text-gray-600">{seller.totalOrders} orders</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {seller.totalSales.toLocaleString()} NOK
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
