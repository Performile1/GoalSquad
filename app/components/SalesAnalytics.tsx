'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MoneyIcon, TrophyIcon, ShopIcon } from '@/app/components/BrandIcons';

interface AnalyticsItem {
  key: string;
  name: string;
  quantity: number;
  revenue: number;
  commission: number;
}

interface SalesAnalyticsProps {
  period?: number;
  groupBy?: 'product' | 'category' | 'date';
}

export default function SalesAnalytics({ period = 30, groupBy = 'product' }: SalesAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsItem[]>([]);
  const [totals, setTotals] = useState({ totalQuantity: 0, totalRevenue: 0, totalCommission: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [selectedGroupBy, setSelectedGroupBy] = useState(groupBy);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod, selectedGroupBy]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics/sales?period=${selectedPeriod}&groupBy=${selectedGroupBy}`);
      const data = await response.json();
      setAnalytics(data.analytics || []);
      setTotals(data.totals || { totalQuantity: 0, totalRevenue: 0, totalCommission: 0 });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(value);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
        <div className="text-center text-gray-500">Laddar...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Försäljningsanalys</h2>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-primary-900 focus:outline-none"
          >
            <option value="7">7 dagar</option>
            <option value="30">30 dagar</option>
            <option value="90">90 dagar</option>
            <option value="365">365 dagar</option>
          </select>
          <select
            value={selectedGroupBy}
            onChange={(e) => setSelectedGroupBy(e.target.value as 'product' | 'category' | 'date')}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-primary-900 focus:outline-none"
          >
            <option value="product">Produkt</option>
            <option value="category">Kategori</option>
            <option value="date">Datum</option>
          </select>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-primary-50 rounded-lg p-4 text-center">
          <ShopIcon size={24} className="text-primary-900 mx-auto mb-2" />
          <div className="text-2xl font-bold text-primary-900">{totals.totalQuantity}</div>
          <div className="text-sm text-gray-600">Sålda</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <MoneyIcon size={24} className="text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalRevenue)}</div>
          <div className="text-sm text-gray-600">Intäkter</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <TrophyIcon size={24} className="text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(totals.totalCommission)}</div>
          <div className="text-sm text-gray-600">Provision</div>
        </div>
      </div>

      {/* Analytics List */}
      {analytics.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Inga försäljningsdata för vald period
        </div>
      ) : (
        <div className="space-y-3">
          {analytics.slice(0, 5).map((item, index) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600">{item.quantity} sålda</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatCurrency(item.revenue)}</p>
                <p className="text-sm text-green-600">{formatCurrency(item.commission)} provision</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
