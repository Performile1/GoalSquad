'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardIcon, UserIcon, ShoppingBagIcon, MoneyIcon, TruckIcon, CommunityIcon, AlertIcon, XPIcon, LevelIcon, BadgeIcon, TrophyIcon, MessageIcon } from '@/app/components/BrandIcons';

interface AdminStats {
  totalCommunities: number;
  totalClubs: number;
  totalClasses: number;
  totalSellers: number;
  totalCompanies: number;
  totalWarehouses: number;
  totalSales: number;
  totalOrders: number;
  activeUsers: number;
  pendingReports: number;
  inactiveEntities: number;
  totalXP: number;
  totalLevels: number;
  totalBadges: number;
  totalLootBoxes: number;
}

interface EntitySummary {
  id: string;
  name: string;
  type: 'community' | 'club' | 'class' | 'seller' | 'company' | 'warehouse';
  status: 'active' | 'inactive' | 'pending';
  sales: number;
  orders: number;
  lastLogin: string;
  reported: boolean;
}

interface RecentActivity {
  id: string;
  type: 'login' | 'sale' | 'report' | 'message';
  entity: string;
  description: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [entities, setEntities] = useState<EntitySummary[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'entities' | 'reports' | 'messages'>('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, entitiesRes, activitiesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/entities'),
        fetch('/api/admin/activities'),
      ]);

      const statsData = await statsRes.json();
      const entitiesData = await entitiesRes.json();
      const activitiesData = await activitiesRes.json();

      setStats(statsData);
      setEntities(entitiesData.entities || []);
      setActivities(activitiesData.activities || []);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'community':
      case 'club':
        return CommunityIcon;
      case 'seller':
        return UserIcon;
      case 'company':
        return ShoppingBagIcon;
      case 'warehouse':
        return TruckIcon;
      default:
        return DashboardIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return UserIcon;
      case 'sale':
        return MoneyIcon;
      case 'report':
        return AlertIcon;
      case 'message':
        return DashboardIcon;
      default:
        return DashboardIcon;
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Översikt över hela plattformen</p>
        </motion.div>

        {/* Community Messaging Card */}
        <Link href="/messages" className="block mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-primary-200 hover:border-primary-500 transition cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-xl">
                <MessageIcon size={32} className="text-primary-900" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Community Meddelanden</h2>
                <p className="text-gray-600">Kommunicera med säljare, föreningar och företag</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Föreningar', value: stats?.totalCommunities || 0, icon: CommunityIcon, color: 'primary' },
            { label: 'Klubbar', value: stats?.totalClubs || 0, icon: CommunityIcon, color: 'primary' },
            { label: 'Klasser', value: stats?.totalClasses || 0, icon: UserIcon, color: 'primary' },
            { label: 'Säljare', value: stats?.totalSellers || 0, icon: UserIcon, color: 'primary' },
            { label: 'Företag', value: stats?.totalCompanies || 0, icon: ShoppingBagIcon, color: 'orange' },
            { label: 'Lagerpartner', value: stats?.totalWarehouses || 0, icon: TruckIcon, color: 'orange' },
            { label: 'Försäljning', value: `${(stats?.totalSales || 0).toLocaleString()} kr`, icon: MoneyIcon, color: 'green' },
            { label: 'Ordrar', value: stats?.totalOrders || 0, icon: DashboardIcon, color: 'green' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-2xl shadow-lg p-6 border-2 ${
                stat.color === 'primary' ? 'border-primary-200' :
                stat.color === 'orange' ? 'border-orange-200' :
                'border-green-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">{stat.label}</h3>
                <stat.icon size={36} className="text-primary-900" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Alert Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Aktiva användare', value: stats?.activeUsers || 0, icon: UserIcon },
            { label: 'Väntande rapporter', value: stats?.pendingReports || 0, icon: AlertIcon, alert: true },
            { label: 'Inaktiva entiteter', value: stats?.inactiveEntities || 0, icon: AlertIcon, alert: true },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className={`bg-white rounded-2xl shadow-lg p-6 border-2 ${
                stat.alert ? 'border-red-200' : 'border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">{stat.label}</h3>
                <stat.icon size={36} className={stat.alert ? 'text-red-600' : 'text-blue-600'} />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Gamification Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Totalt XP', value: `${(stats?.totalXP || 0).toLocaleString()}`, icon: XPIcon, color: 'purple' },
            { label: 'Genomsnittlig Level', value: stats?.totalLevels ? (stats.totalLevels / (stats.totalSellers || 1)).toFixed(1) : '0', icon: LevelIcon, color: 'purple' },
            { label: 'Totala Märken', value: stats?.totalBadges || 0, icon: BadgeIcon, color: 'purple' },
            { label: 'Loot Boxes', value: stats?.totalLootBoxes || 0, icon: TrophyIcon, color: 'purple' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1 + index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">{stat.label}</h3>
                <stat.icon size={36} className="text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex gap-4 mb-6">
            {['overview', 'entities', 'reports', 'messages'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-3 rounded-xl font-semibold transition ${
                  activeTab === tab
                    ? 'bg-primary-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Senaste aktivitet</h2>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Ingen nyligen aktivitet
                  </div>
                ) : (
                  activities.slice(0, 10).map((activity, index) => {
                    const ActivityIcon = getActivityIcon(activity.type);
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl"
                      >
                        <div className="bg-primary-100 rounded-lg p-3">
                          <ActivityIcon size={24} className="text-primary-900" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{activity.entity}</p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(activity.timestamp).toLocaleString('sv-SE')}
                        </span>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Entities Tab */}
          {activeTab === 'entities' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Alla entiteter</h2>
                <select className="px-4 py-2 border-2 border-gray-200 rounded-xl">
                  <option>Alla typer</option>
                  <option>Föreningar</option>
                  <option>Klubbar</option>
                  <option>Klasser</option>
                  <option>Säljare</option>
                  <option>Företag</option>
                  <option>Lagerpartner</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Namn</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Typ</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Försäljning</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ordrar</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Senast inloggad</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rapporterad</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entities.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          Inga entiteter hittades
                        </td>
                      </tr>
                    ) : (
                      entities.map((entity, index) => (
                        <motion.tr
                          key={entity.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-100 hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4 font-semibold text-gray-900">{entity.name}</td>
                          <td className="px-6 py-4 capitalize text-gray-700">{entity.type}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(entity.status)}`}>
                              {entity.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700">{entity.sales.toLocaleString()} kr</td>
                          <td className="px-6 py-4 text-gray-700">{entity.orders}</td>
                          <td className="px-6 py-4 text-gray-600">
                            {new Date(entity.lastLogin).toLocaleDateString('sv-SE')}
                          </td>
                          <td className="px-6 py-4">
                            {entity.reported ? (
                              <span className="text-red-600 font-semibold">Ja</span>
                            ) : (
                              <span className="text-green-600">Nej</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button className="text-primary-900 font-semibold hover:text-primary-600 transition mr-2">
                              Visa
                            </button>
                            <button className="text-red-600 font-semibold hover:text-red-700 transition">
                              Ta bort
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Rapporter</h2>
              <div className="text-center py-8 text-gray-500">
                Inga rapporter
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Meddelanden</h2>
              <div className="text-center py-8 text-gray-500">
                Inga meddelanden
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
