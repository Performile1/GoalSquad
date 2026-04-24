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

interface Profile {
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  personal_id_number?: string;
  email_notifications?: boolean;
  sms_notifications?: boolean;
}

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'returns' | 'support'>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [supportStats, setSupportStats] = useState<SupportStats | null>(null);
  const [fetching, setFetching] = useState(true);
  const [profile, setProfile] = useState<Profile>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchData();
      fetchProfile();
    }
  }, [user, loading]);

  const fetchProfile = async () => {
    try {
      const res = await apiFetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile || {});
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setProfile(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileSuccess('');
    try {
      const res = await apiFetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setProfileSuccess('Profilen sparad!');
        setTimeout(() => setProfileSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

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
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { key: 'profile', label: 'Min profil' },
            { key: 'orders', label: `Ordrar (${orders.length})` },
            { key: 'returns', label: `Returer (${returns.length})` },
            { key: 'support', label: 'Support-statistik' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 rounded-xl font-semibold transition whitespace-nowrap ${
                activeTab === tab.key ? 'bg-primary-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
            {profileSuccess && (
              <div className="p-4 bg-green-50 border border-green-300 rounded-xl text-green-700 font-semibold">{profileSuccess}</div>
            )}

            {/* Basic info */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Personuppgifter</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Namn</label>
                  <input name="full_name" value={profile.full_name || ''} onChange={handleProfileChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">E-post</label>
                  <input value={user?.email || ''} disabled
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Telefon</label>
                  <input name="phone" value={profile.phone || ''} onChange={handleProfileChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Födelsedatum</label>
                  <input name="date_of_birth" type="date" value={profile.date_of_birth || ''} onChange={handleProfileChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Personnummer</label>
                  <input name="personal_id_number" value={profile.personal_id_number || ''} onChange={handleProfileChange}
                    placeholder="YYYYMMDD-XXXX"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                  <p className="text-xs text-gray-400 mt-1">Krävs för BankID-verifiering och skatteändamål</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Leveransadress</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Gatuadress</label>
                  <input name="address_line1" value={profile.address_line1 || ''} onChange={handleProfileChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none mb-2" />
                  <input name="address_line2" value={profile.address_line2 || ''} onChange={handleProfileChange}
                    placeholder="Adressrad 2 (valfritt)"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Postnummer</label>
                  <input name="postal_code" value={profile.postal_code || ''} onChange={handleProfileChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Ort</label>
                  <input name="city" value={profile.city || ''} onChange={handleProfileChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Land</label>
                  <select name="country" value={profile.country || 'SE'} onChange={handleProfileChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none">
                    <option value="SE">Sverige</option>
                    <option value="NO">Norge</option>
                    <option value="DK">Danmark</option>
                    <option value="FI">Finland</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Notifikationer</h2>
              <div className="space-y-3">
                {[
                  { name: 'email_notifications', label: 'E-postnotifikationer' },
                  { name: 'sms_notifications', label: 'SMS-notifikationer' },
                ].map(({ name, label }) => (
                  <label key={name} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name={name}
                      checked={(profile as any)[name] ?? true}
                      onChange={handleProfileChange}
                      className="w-5 h-5 rounded accent-primary-900" />
                    <span className="text-gray-700 font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={handleSaveProfile} disabled={savingProfile}
                className="px-8 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50">
                {savingProfile ? 'Sparar...' : 'Spara profil'}
              </button>
            </div>
          </div>
        )}

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
