'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { TrophyIcon, SearchIcon, MoneyIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface Product {
  id: string;
  name: string;
  title: string;
}

interface ProductGoal {
  id: string;
  product_id: string;
  goal_type: string;
  goal_title: string;
  target_value: number;
  current_value: number;
  unit: string;
  period: string;
  status: string;
  start_date: string;
  end_date: string;
  description: string;
  products: Product;
}

export default function CommunityProductGoals() {
  const params = useParams();
  const communityId = params.id as string;
  
  const [goals, setGoals] = useState<ProductGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchGoals();
  }, [communityId]);

  const fetchGoals = async () => {
    try {
      const response = await apiFetch(`/api/communities/${communityId}/product-goals`);
      const data = await response.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGoals = goals.filter(goal =>
    goal.goal_title.toLowerCase().includes(search.toLowerCase()) ||
    goal.products?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const progressPercent = (goal: ProductGoal) => {
    if (goal.target_value === 0) return 0;
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-green-100">
              <TrophyIcon size={32} className="icon-brand" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Produktmål</h1>
              <p className="text-gray-600">Sätt och följ upp mål per produkt</p>
            </div>
          </div>
        </motion.div>

        {/* Stats summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <TrophyIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Totalt mål</h3>
            </div>
            <p className="text-4xl font-bold text-green-700">{goals.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <TrophyIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Aktiva mål</h3>
            </div>
            <p className="text-4xl font-bold text-green-700">{goals.filter(g => g.status === 'active').length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <TrophyIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Uppnådda</h3>
            </div>
            <p className="text-4xl font-bold text-green-700">{goals.filter(g => g.status === 'achieved').length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <MoneyIcon size={28} className="icon-brand" />
              <h3 className="text-lg font-semibold text-gray-700">Totalt värde</h3>
            </div>
            <p className="text-4xl font-bold text-green-700">
              {goals.reduce((sum, g) => sum + g.target_value, 0).toLocaleString()} {goals[0]?.unit || 'kr'}
            </p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sök mål</label>
              <div className="relative">
                <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 icon-brand" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Målnamn eller produkt..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Goals list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-2xl shadow-lg">
              <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} />
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg text-gray-500">
              <TrophyIcon size={64} className="mx-auto mb-4 text-gray-300 icon-brand" />
              <p className="text-lg">Inga mål hittades</p>
            </div>
          ) : (
            filteredGoals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{goal.goal_title}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {goal.products?.title || 'Okänd produkt'}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                    goal.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : goal.status === 'achieved'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {goal.status === 'active' ? 'Aktiv' : 
                     goal.status === 'achieved' ? 'Uppnådd' : goal.status}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Framsteg</span>
                    <span className="font-semibold">{progressPercent(goal).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${progressPercent(goal)}%`,
                        backgroundColor: progressPercent(goal) >= 100 ? '#16a34a' : '#003B3D'
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
                    <span>{goal.current_value.toLocaleString()} {goal.unit}</span>
                    <span>av {goal.target_value.toLocaleString()} {goal.unit}</span>
                  </div>
                </div>

                {/* Goal details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block">Typ</span>
                    <span className="font-semibold text-gray-900">{goal.goal_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Period</span>
                    <span className="font-semibold text-gray-900">{goal.period}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Startdatum</span>
                    <span className="font-semibold text-gray-900">{new Date(goal.start_date).toLocaleDateString('sv-SE')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Slutdatum</span>
                    <span className="font-semibold text-gray-900">{goal.end_date ? new Date(goal.end_date).toLocaleDateString('sv-SE') : '-'}</span>
                  </div>
                </div>

                {goal.description && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">{goal.description}</p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
