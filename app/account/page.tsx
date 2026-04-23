'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { OrdersIcon, SupportIcon, ImpactIcon, BadgeIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  currency: string;
  items_count: number;
}

interface Return {
  id: string;
  return_number: string;
  status: string;
  refund_amount: number;
  requested_at: string;
}

interface SupportStats {
  total_spent: number;
  total_orders: number;
  supported_sellers: Record<string, number>;
  supported_communities: Record<string, number>;
  xp_given_to_sellers: number;
  collector_badges: string[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-primary-100 text-primary-900',
  shipped: 'bg-primary-50 text-primary-900',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Väntar',
  processing: 'Behandlas',
  shipped: 'Skickad',
  delivered: 'Levererad',
  cancelled: 'Avbruten',
};

const RETURN_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  in_transit: 'bg-purple-100 text-purple-700',
  received: 'bg-indigo-100 text-indigo-700',
  processed: 'bg-green-100 text-green-700',
  refunded: 'bg-emerald-100 text-emerald-700',
};

const RETURN_STATUS_LABELS: Record<string, string> = {
  pending: 'Väntande',
  approved: 'Godkänd',
  rejected: 'Avslagen',
  in_transit: 'På väg',
  received: 'Mottagen',
  processed: 'Behandlad',
  refunded: 'Återbetald',
};

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'orders' | 'returns' | 'support'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [supportStats, setSupportStats] = useState<SupportStats | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, loading]);

  const fetchData = async () => {
    try {
      // Fetch orders
      const ordersRes = await apiFetch('/api/orders');
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);
      }

      // Fetch returns
      const returnsRes = await apiFetch('/api/returns');
      if (returnsRes.ok) {
        const returnsData = await returnsRes.json();
        setReturns(returnsData.returns || []);
      }

      // Fetch support stats
      const statsRes = await apiFetch('/api/customer/support-stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setSupportStats(statsData);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setFetching(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center animate-pulse"><OrdersIcon size={52} /></div>
          <p className="text-gray-500">Laddar...</p>
        </div>
      </div>
    );
  }

  const totalSupportedSellers = Object.keys(supportStats?.supported_sellers || {}).length;
  const totalSupportedCommunities = Object.keys(supportStats?.supported_communities || {}).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mitt konto</h1>
          <p className="text-gray-600">Se dina ordrar, returer och hur du har stöttat lag och föreningar</p>
        </div>

        {/* Support Stats Overview */}
        {supportStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <ImpactIcon size={24} />
                </div>
                <span className="text-sm text-gray-500">Totalt spenderat</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{supportStats.total_spent.toLocaleString()} kr</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <OrdersIcon size={24} />
                </div>
                <span className="text-sm text-gray-500">Antal ordrar</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{supportStats.total_orders}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <SupportIcon size={24} />
                </div>
                <span className="text-sm text-gray-500">Säljare stöttade</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalSupportedSellers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <BadgeIcon size={24} />
                </div>
                <span className="text-sm text-gray-500">XP delat</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{supportStats.xp_given_to_sellers.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'orders'
                ? 'bg-primary-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Ordrar ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'returns'
                ? 'bg-primary-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Returer ({returns.length})
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'support'
                ? 'bg-primary-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Support-statistik
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-4 flex justify-center"><OrdersIcon size={72} className="opacity-40" /></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Inga ordrar än</h2>
                <p className="text-gray-500 mb-8">Dina ordrar visas här när du har handlat.</p>
                <Link
                  href="/products"
                  className="inline-block px-8 py-4 bg-primary-900 text-white font-semibold rounded-xl hover:bg-primary-600 transition"
                >
                  Gå till shoppen
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}/flow`}
                    className="block border border-gray-200 rounded-xl hover:border-primary-300 transition p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="font-bold text-gray-900 text-lg">
                          {order.total_amount?.toLocaleString()} {order.currency || 'SEK'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(order.created_at).toLocaleDateString('sv-SE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                          {order.items_count ? ` · ${order.items_count} produkter` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                            STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'returns' && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            {returns.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-4 flex justify-center"><ImpactIcon size={72} className="opacity-40" /></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Inga returer än</h2>
                <p className="text-gray-500 mb-8">Dina returer visas här när du har skapat en retur.</p>
                <Link
                  href="/returns"
                  className="inline-block px-8 py-4 bg-primary-900 text-white font-semibold rounded-xl hover:bg-primary-600 transition"
                >
                  Skapa retur
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {returns.map((ret) => (
                  <Link
                    key={ret.id}
                    href={`/returns/${ret.id}`}
                    className="block border border-gray-200 rounded-xl hover:border-primary-300 transition p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          {ret.return_number}
                        </p>
                        <p className="font-bold text-gray-900 text-lg">
                          {ret.refund_amount?.toLocaleString()} kr
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Begärt: {new Date(ret.requested_at).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                            RETURN_STATUS_COLORS[ret.status] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {RETURN_STATUS_LABELS[ret.status] || ret.status}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'support' && supportStats && (
          <div className="space-y-6">
            {/* Supported Communities */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Föreningar du har stöttat</h2>
              {totalSupportedCommunities === 0 ? (
                <p className="text-gray-500 text-center py-8">Du har inte stöttat några föreningar än</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(supportStats.supported_communities).map(([communityId, amount]) => (
                    <div key={communityId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">Förening #{communityId.slice(0, 8)}</p>
                        <p className="text-sm text-gray-500">Totalt stöd</p>
                      </div>
                      <p className="font-bold text-primary-900">{amount.toLocaleString()} kr</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Supported Sellers */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Säljare du har stöttat</h2>
              {totalSupportedSellers === 0 ? (
                <p className="text-gray-500 text-center py-8">Du har inte stöttat några säljare än</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(supportStats.supported_sellers).map(([sellerId, amount]) => (
                    <div key={sellerId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">Säljare #{sellerId.slice(0, 8)}</p>
                        <p className="text-sm text-gray-500">Totalt stöd</p>
                      </div>
                      <p className="font-bold text-primary-900">{amount.toLocaleString()} kr</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Collector Badges */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Samlar-märken</h2>
              {supportStats.collector_badges.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Du har inte tjänat några märken än</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {supportStats.collector_badges.map((badgeId) => (
                    <div key={badgeId} className="text-center p-4 bg-primary-50 rounded-lg">
                      <BadgeIcon size={48} />
                      <p className="text-sm font-semibold text-gray-900 mt-2">Märke #{badgeId.slice(0, 8)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
