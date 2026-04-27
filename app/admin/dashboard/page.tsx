'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { DashboardIcon, UserIcon, ShoppingBagIcon, MoneyIcon, TruckIcon, CommunityIcon, AlertIcon, XPIcon, LevelIcon, BadgeIcon, TrophyIcon, MessageIcon } from '@/app/components/BrandIcons';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [entities, setEntities] = useState<EntitySummary[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'entities' | 'reports' | 'messages'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<'sales' | 'users' | 'warehouses' | 'orders' | 'returns'>('sales');
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Mock data for charts - replace with real API data
  const salesData = [
    { name: 'Jan', value: 40000 },
    { name: 'Feb', value: 30000 },
    { name: 'Mar', value: 20000 },
    { name: 'Apr', value: 27800 },
    { name: 'Maj', value: 18900 },
    { name: 'Jun', value: 23900 },
    { name: 'Jul', value: 34900 },
  ];

  const usersData = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 200 },
    { name: 'Apr', value: 278 },
    { name: 'Maj', value: 189 },
    { name: 'Jun', value: 239 },
    { name: 'Jul', value: 349 },
  ];

  const ordersData = [
    { name: 'Jan', value: 2400 },
    { name: 'Feb', value: 1398 },
    { name: 'Mar', value: 9800 },
    { name: 'Apr', value: 3908 },
    { name: 'Maj', value: 4800 },
    { name: 'Jun', value: 3800 },
    { name: 'Jul', value: 4300 },
  ];

  const returnsData = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 200 },
    { name: 'Apr', value: 278 },
    { name: 'Maj', value: 189 },
    { name: 'Jun', value: 239 },
    { name: 'Jul', value: 349 },
  ];

  const warehouseData = [
    { name: 'Aktiva', value: 45 },
    { name: 'Inaktiva', value: 12 },
    { name: 'Väntande', value: 8 },
  ];

  const entityDistribution = [
    { name: 'Föreningar', value: 35 },
    { name: 'Klubbar', value: 28 },
    { name: 'Säljare', value: 45 },
    { name: 'Företag', value: 22 },
    { name: 'Lager', value: 45 },
  ];

  const COLORS = ['#1e3a5f', '#2d5a87', '#4a7ba7', '#6b9dc7', '#8bbce8'];

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      // Allow access for gs_admin role or admin@goalsquad.se email
      if (!profile || (profile.role !== 'gs_admin' && user.email !== 'admin@goalsquad.se')) {
        router.push('/dashboard');
        return;
      }
      fetchData();
    }
  }, [user, profile, loading, router]);

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
      setLoadingData(false);
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

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary-900 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-primary-900 font-semibold">Laddar...</p>
        </div>
      </div>
    );
  }

  const getChartData = () => {
    switch (selectedMetric) {
      case 'sales':
        return salesData;
      case 'users':
        return usersData;
      case 'orders':
        return ordersData;
      case 'returns':
        return returnsData;
      case 'warehouses':
        return warehouseData;
      default:
        return salesData;
    }
  };

  const getChartTitle = () => {
    switch (selectedMetric) {
      case 'sales':
        return 'Försäljning (kr)';
      case 'users':
        return 'Användare';
      case 'orders':
        return 'Ordrar';
      case 'returns':
        return 'Returer';
      case 'warehouses':
        return 'Lagerpartners';
      default:
        return 'Försäljning (kr)';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Content Area */}
      <div className="flex-1 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Översikt över hela plattformen</p>
        </motion.div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Försäljning', value: `${(stats?.totalSales || 0).toLocaleString()} kr`, icon: MoneyIcon, change: '+12%' },
            { label: 'Användare', value: stats?.activeUsers || 0, icon: UserIcon, change: '+8%' },
            { label: 'Lagerpartner', value: stats?.totalWarehouses || 0, icon: TruckIcon, change: '+5%' },
            { label: 'Ordrar', value: stats?.totalOrders || 0, icon: DashboardIcon, change: '+15%' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl shadow-sm p-6 border-2 border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">{stat.label}</h3>
                <stat.icon size={24} className="icon-brand" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-green-600 font-semibold">{stat.change}</div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-2 border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Metric</label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl"
              >
                <option value="sales">Försäljning</option>
                <option value="users">Användare</option>
                <option value="warehouses">Lagerpartners</option>
                <option value="orders">Ordrar</option>
                <option value="returns">Returer</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Tidsperiod</label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl"
              >
                <option value="7d">Senaste 7 dagar</option>
                <option value="30d">Senaste 30 dagar</option>
                <option value="90d">Senaste 90 dagar</option>
                <option value="1y">Senaste året</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border-2 border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{getChartTitle()}</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#1e3a5f" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Entitetsfördelning</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={entityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {entityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lagerpartners Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={warehouseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#1e3a5f" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Senaste aktivitet</h2>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Ingen nyligen aktivitet
              </div>
            ) : (
              activities.slice(0, 5).map((activity, index) => {
                const ActivityIcon = getActivityIcon(activity.type);
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl bg-white"
                  >
                    <div className="bg-primary-50 rounded-lg p-3">
                      <ActivityIcon size={24} className="icon-brand" />
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
      </div>

      {/* Right Sidebar Menu */}
      <div className="w-80 bg-white border-l-2 border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Navigering</h2>
        <div className="space-y-2">
          {[
            { href: '/admin/users', icon: UserIcon, title: 'Användare' },
            { href: '/admin/sellers', icon: UserIcon, title: 'Säljare' },
            { href: '/admin/merchants', icon: ShoppingBagIcon, title: 'Företag' },
            { href: '/admin/communities', icon: CommunityIcon, title: 'Föreningar & Klubbar' },
            { href: '/admin/warehouses', icon: TruckIcon, title: 'Lagerpartners' },
            { href: '/admin/orders', icon: DashboardIcon, title: 'Ordrar' },
            { href: '/admin/returns', icon: AlertIcon, title: 'Returer' },
            { href: '/messages', icon: MessageIcon, title: 'Community Meddelanden' },
            { href: '/admin/blog', icon: DashboardIcon, title: 'Blogg' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition cursor-pointer">
                <item.icon size={20} className="icon-brand" />
                <span className="font-semibold text-gray-700">{item.title}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 pt-8 border-t-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Snabbstatistik</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Föreningar</span>
              <span className="font-semibold text-gray-900">{stats?.totalCommunities || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Säljare</span>
              <span className="font-semibold text-gray-900">{stats?.totalSellers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Företag</span>
              <span className="font-semibold text-gray-900">{stats?.totalCompanies || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Väntande rapporter</span>
              <span className="font-semibold text-red-600">{stats?.pendingReports || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
