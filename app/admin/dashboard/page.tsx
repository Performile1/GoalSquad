'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api-client';
import { DashboardIcon, UserIcon, UsersIcon, ShoppingBagIcon, MoneyIcon, TruckIcon, CommunityIcon, AlertIcon, OrdersIcon, MerchantIcon, BuildingIcon, MessageIcon, TrophyIcon } from '@/app/components/BrandIcons';
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

  const COLORS = ['#003B3D', '#B68B2C', '#4A7BA7', '#67A890', '#D97745'];

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
        apiFetch('/api/admin/stats'),
        apiFetch('/api/admin/entities'),
        apiFetch('/api/admin/activities'),
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

  const metricCards = [
    { key: 'sales' as const, label: 'Försäljning', value: `${(stats?.totalSales || 0).toLocaleString('sv-SE')} kr`, icon: MoneyIcon, tone: 'bg-[#FFF8DF] text-[#8A6818]' },
    { key: 'users' as const, label: 'Användare', value: (stats?.activeUsers || 0).toLocaleString('sv-SE'), icon: UsersIcon, tone: 'bg-[#E8F4F1] text-[#006568]' },
    { key: 'warehouses' as const, label: 'Lagerpartners', value: (stats?.totalWarehouses || 0).toLocaleString('sv-SE'), icon: TruckIcon, tone: 'bg-[#EEF1FA] text-[#3B4E8A]' },
    { key: 'orders' as const, label: 'Ordrar', value: (stats?.totalOrders || 0).toLocaleString('sv-SE'), icon: OrdersIcon, tone: 'bg-[#FFF0E9] text-[#A64C25]' },
    { key: 'returns' as const, label: 'Returer', value: '0', icon: AlertIcon, tone: 'bg-[#F3EDF7] text-[#74448A]' },
  ];

  const quickLinks = [
    { href: '/admin/users', icon: UsersIcon, title: 'Användare', value: stats?.activeUsers || 0 },
    { href: '/admin/sellers', icon: UserIcon, title: 'Säljare', value: stats?.totalSellers || 0 },
    { href: '/admin/merchants', icon: MerchantIcon, title: 'Företag', value: stats?.totalCompanies || 0 },
    { href: '/admin/communities', icon: CommunityIcon, title: 'Föreningar & klubbar', value: stats?.totalCommunities || 0 },
    { href: '/admin/warehouses', icon: BuildingIcon, title: 'Lagerpartners', value: stats?.totalWarehouses || 0 },
    { href: '/admin/orders', icon: OrdersIcon, title: 'Ordrar', value: stats?.totalOrders || 0 },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F5]">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#B68B2C]"><DashboardIcon size={16} /> Plattformöversikt</div>
            <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A] sm:text-4xl">Admin dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">En samlad vy över GoalSquads försäljning, användare och drift.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Senast uppdaterad</p>
            <p className="mt-1 text-sm font-bold text-[#003B3D]">{new Date().toLocaleDateString('sv-SE')}</p>
          </div>
        </motion.header>

        <section className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Nyckeltal">
          {metricCards.map((stat, index) => (
            <motion.button key={stat.label} type="button" onClick={() => setSelectedMetric(stat.key)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={`rounded-xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${selectedMetric === stat.key ? 'border-[#003B3D] ring-2 ring-[#003B3D]/10' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-3"><span className={`rounded-lg p-2.5 ${stat.tone}`}><stat.icon size={22} /></span><span className="text-xs font-bold text-emerald-600">+12%</span></div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
              <p className="mt-1 text-2xl font-black tracking-tight text-[#1A1A1A]">{stat.value}</p>
            </motion.button>
          ))}
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B68B2C]">Utveckling</p><h2 className="mt-1 text-xl font-black text-[#1A1A1A]">{getChartTitle()}</h2></div>
              <div className="flex flex-wrap gap-2">
                <select aria-label="Välj metric" value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value as typeof selectedMetric)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#003B3D]">
                  <option value="sales">Försäljning</option><option value="users">Användare</option><option value="warehouses">Lagerpartners</option><option value="orders">Ordrar</option><option value="returns">Returer</option>
                </select>
                <select aria-label="Välj tidsperiod" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value as typeof timeFilter)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#003B3D]">
                  <option value="7d">Senaste 7 dagar</option><option value="30d">Senaste 30 dagar</option><option value="90d">Senaste 90 dagar</option><option value="1y">Senaste året</option>
                </select>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={getChartData()} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
                <CartesianGrid stroke="#E8ECEB" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} /><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #DCE5E2', boxShadow: '0 8px 24px rgba(0,59,61,.12)' }} /><Line type="monotone" dataKey="value" stroke="#003B3D" strokeWidth={3} dot={{ r: 3, fill: '#FFD700', stroke: '#003B3D', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#FFD700', stroke: '#003B3D', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-slate-200 bg-[#003B3D] p-5 text-white shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#FFD700]">Snabbstatistik</p><h2 className="mt-1 text-xl font-black">Plattformen</h2></div><TrophyIcon size={34} className="text-[#FFD700]" /></div>
            <div className="space-y-4">{quickLinks.slice(0, 4).map((item) => <Link key={item.href} href={item.href} className="flex items-center justify-between border-b border-white/10 pb-3 transition hover:text-[#FFD700]"><span className="flex items-center gap-3 text-sm font-semibold"><item.icon size={20} className="text-[#FFD700]" />{item.title}</span><span className="text-lg font-black">{item.value}</span></Link>)}</div>
            <Link href="/admin/analytics" className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FFD700]">Öppna full analys <span aria-hidden="true">→</span></Link>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B68B2C]">Fördelning</p><h2 className="mt-1 text-lg font-black text-[#1A1A1A]">Entitetsfördelning</h2></div><CommunityIcon size={28} className="icon-brand" /></div><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={entityDistribution} cx="50%" cy="50%" innerRadius={52} outerRadius={88} paddingAngle={3} dataKey="value">{entityDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #DCE5E2' }} /><Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B68B2C]">Kapacitet</p><h2 className="mt-1 text-lg font-black text-[#1A1A1A]">Lagerpartners status</h2></div><TruckIcon size={28} className="icon-brand" /></div><ResponsiveContainer width="100%" height={250}><BarChart data={warehouseData} margin={{ left: -20, right: 8 }}><CartesianGrid stroke="#E8ECEB" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} /><Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #DCE5E2' }} /><Bar dataKey="value" radius={[5, 5, 0, 0]} fill="#003B3D" /></BarChart></ResponsiveContainer></div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B68B2C]">Liveflöde</p><h2 className="mt-1 text-lg font-black text-[#1A1A1A]">Senaste aktivitet</h2></div><Link href="/admin/users" className="text-xs font-bold text-[#003B3D] hover:text-[#B68B2C]">Visa alla</Link></div><div className="divide-y divide-slate-100">{activities.length === 0 ? <div className="py-8 text-center text-sm text-slate-500">Ingen nyligen aktivitet</div> : activities.slice(0, 5).map((activity, index) => { const ActivityIcon = getActivityIcon(activity.type); return <motion.div key={activity.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center gap-3 py-3"><div className="rounded-lg bg-[#E8F4F1] p-2.5 text-[#003B3D]"><ActivityIcon size={20} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{activity.entity}</p><p className="truncate text-xs text-slate-500">{activity.description}</p></div><time className="hidden text-xs font-medium text-slate-400 sm:block">{new Date(activity.timestamp).toLocaleString('sv-SE')}</time></motion.div>; })}</div></section>
      </div>
    </div>
  );
}
