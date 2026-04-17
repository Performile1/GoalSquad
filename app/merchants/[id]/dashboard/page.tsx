'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { DashboardIcon, ShoppingBagIcon, MoneyIcon, UserIcon } from '@/app/components/BrandIcons';

interface MerchantStats {
  id: string;
  merchantName: string;
  slug: string;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
  pendingOrders: number;
  stripeAccountConnected: boolean;
}

export default function MerchantDashboard() {
  const params = useParams();
  const router = useRouter();
  const merchantId = params.id as string;
  
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMerchantStats();
  }, [merchantId]);

  const fetchMerchantStats = async () => {
    try {
      const response = await fetch(`/api/merchants/${merchantId}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch merchant stats:', error);
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
          <p className="text-2xl font-bold text-gray-900">Företaget hittades inte</p>
        </div>
      </div>
    );
  }

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
            Välkommen, {stats.merchantName}!
          </h1>
          <p className="text-gray-600">Hantera ditt företag på GoalSquad</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Products Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-primary-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Produkter</h3>
              <ShoppingBagIcon size={36} className="text-primary-900" />
            </div>
            <div className="text-5xl font-bold text-primary-900 mb-2">
              {stats.totalProducts}
            </div>
            <p className="text-sm text-gray-600">{stats.activeProducts} aktiva</p>
          </motion.div>

          {/* Orders Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Ordrar</h3>
              <DashboardIcon size={36} className="text-orange-600" />
            </div>
            <div className="text-5xl font-bold text-orange-600 mb-2">
              {stats.totalOrders}
            </div>
            <p className="text-sm text-gray-600">{stats.pendingOrders} väntar</p>
          </motion.div>

          {/* Revenue Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-primary-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Omsättning</h3>
              <MoneyIcon size={36} className="text-primary-900" />
            </div>
            <div className="text-3xl font-bold text-primary-900 mb-2">
              {stats.totalRevenue.toLocaleString()} kr
            </div>
            <p className="text-sm text-gray-600">Totalt</p>
          </motion.div>

          {/* Stripe Status Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className={`bg-white rounded-2xl shadow-lg p-6 border-2 ${
              stats.stripeAccountConnected ? 'border-green-200' : 'border-yellow-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Stripe</h3>
              <div className={`text-4xl ${stats.stripeAccountConnected ? 'text-green-600' : 'text-yellow-600'}`}>
                {stats.stripeAccountConnected ? '✓' : '⚠️'}
              </div>
            </div>
            <div className={`text-xl font-bold mb-2 ${
              stats.stripeAccountConnected ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {stats.stripeAccountConnected ? 'Ansluten' : 'Inte ansluten'}
            </div>
            <p className="text-sm text-gray-600">
              {stats.stripeAccountConnected ? 'Betalningar aktiva' : 'Anslut för att ta emot betalningar'}
            </p>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Snabbåtgärder</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push(`/merchants/${merchantId}/products`)}
              className="bg-primary-900 text-white py-4 rounded-xl font-semibold hover:bg-primary-700 transition flex items-center justify-center gap-2"
            >
              <ShoppingBagIcon size={20} />
              Produkter
            </button>
            <button
              onClick={() => router.push(`/merchants/${merchantId}/orders`)}
              className="bg-primary-600 text-white py-4 rounded-xl font-semibold hover:bg-primary-700 transition flex items-center justify-center gap-2"
            >
              <DashboardIcon size={20} />
              Ordrar
            </button>
            <button
              onClick={() => router.push(`/merchants/${merchantId}/settings`)}
              className="border-2 border-primary-900 text-primary-900 py-4 rounded-xl font-semibold hover:bg-primary-50 transition flex items-center justify-center gap-2"
            >
              ⚙️ Inställningar
            </button>
            {!stats.stripeAccountConnected && (
              <button className="bg-yellow-500 text-white py-4 rounded-xl font-semibold hover:bg-yellow-600 transition">
                Anslut Stripe
              </button>
            )}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Senaste aktivitet</h3>
          <div className="text-gray-500 text-center py-8">
            Ingen nyligen aktivitet
          </div>
        </motion.div>
      </div>
    </div>
  );
}
