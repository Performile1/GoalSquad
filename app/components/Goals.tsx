'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrophyIcon, PlusIcon, CheckIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface Goal {
  id: string;
  goal_type: string;
  goal_title: string;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  end_date: string;
  status: string;
  description?: string;
}

interface GoalsProps {
  entityType?: 'community' | 'seller';
}

export default function Goals({ entityType }: GoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_type: 'revenue',
    goal_title: '',
    target_value: 0,
    unit: 'kr',
    start_date: '',
    end_date: '',
    description: '',
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await apiFetch('/api/goals?status=active');
      const data = await response.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    try {
      const response = await apiFetch('/api/goals', {
        method: 'POST',
        body: JSON.stringify(newGoal),
      });
      const data = await response.json();
      if (data.goal) {
        setGoals([...goals, data.goal]);
        setShowCreateModal(false);
        setNewGoal({
          goal_type: 'revenue',
          goal_title: '',
          target_value: 0,
          unit: 'kr',
          start_date: '',
          end_date: '',
          description: '',
        });
      }
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const getProgressPercentage = (goal: Goal) => {
    return Math.min(100, (goal.current_value / goal.target_value) * 100);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Mål</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
        >
          <PlusIcon size={20} />
          Nytt Mål
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Inga aktiva mål. Skapa ditt första mål!
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal, index) => {
            const progress = getProgressPercentage(goal);
            const daysRemaining = getDaysRemaining(goal.end_date);

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{goal.goal_title}</h3>
                    <p className="text-sm text-gray-600">
                      {goal.current_value} / {goal.target_value} {goal.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      daysRemaining < 0 ? 'bg-red-100 text-red-700' :
                      daysRemaining <= 7 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {daysRemaining < 0 ? 'Uppnått' : `${daysRemaining} dagar kvar`}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`h-3 rounded-full ${
                        progress >= 100 ? 'bg-green-500' :
                        progress >= 75 ? 'bg-blue-500' :
                        progress >= 50 ? 'bg-yellow-500' :
                        'bg-orange-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-600">{progress.toFixed(0)}%</span>
                    <span className="text-xs text-gray-600">
                      {new Date(goal.end_date).toLocaleDateString('sv-SE')}
                    </span>
                  </div>
                </div>

                {goal.description && (
                  <p className="text-sm text-gray-500">{goal.description}</p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Skapa Nytt Mål</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Måltyp
                  </label>
                  <select
                    value={newGoal.goal_type}
                    onChange={(e) => setNewGoal({ ...newGoal, goal_type: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                  >
                    <option value="revenue">Intäkter</option>
                    <option value="products_sold">Sålda produkter</option>
                    <option value="commission">Provision</option>
                    <option value="new_customers">Nya kunder</option>
                    <option value="custom">Anpassat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Titel
                  </label>
                  <input
                    type="text"
                    value={newGoal.goal_title}
                    onChange={(e) => setNewGoal({ ...newGoal, goal_title: e.target.value })}
                    placeholder="T.ex. Sälj 100 chipspåsar"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Målvärde
                    </label>
                    <input
                      type="number"
                      value={newGoal.target_value}
                      onChange={(e) => setNewGoal({ ...newGoal, target_value: parseFloat(e.target.value) || 0 })}
                      placeholder="100"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Enhet
                    </label>
                    <input
                      type="text"
                      value={newGoal.unit}
                      onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                      placeholder="kr, st, etc."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Startdatum
                    </label>
                    <input
                      type="date"
                      value={newGoal.start_date}
                      onChange={(e) => setNewGoal({ ...newGoal, start_date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Slutdatum
                    </label>
                    <input
                      type="date"
                      value={newGoal.end_date}
                      onChange={(e) => setNewGoal({ ...newGoal, end_date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Beskrivning (valfritt)
                  </label>
                  <textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    placeholder="Lägg till detaljer om målet..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={handleCreateGoal}
                    disabled={!newGoal.goal_title || !newGoal.target_value || !newGoal.start_date || !newGoal.end_date}
                    className="flex-1 px-6 py-3 bg-primary-900 text-white rounded-lg font-semibold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Skapa Mål
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
