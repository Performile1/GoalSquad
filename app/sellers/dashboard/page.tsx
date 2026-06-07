'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShareIcon, MessageIcon, FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, ShoppingBagIcon,
  MoneyIcon, TrophyIcon, XPIcon, OrdersIcon, UserIcon, LeaderboardIcon, CartIcon
} from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [customText, setCustomText] = useState('');
  const [sellerLink, setSellerLink] = useState('');
  const [productLink, setProductLink] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [showProductShare, setShowProductShare] = useState(false);
  const [isWarehousePartner, setIsWarehousePartner] = useState(false);
  const [warehouseConfig, setWarehouseConfig] = useState({
    storageCostPerUnit: 0,
    handlingCostPerUnit: 0,
    shippingCostType: 'goalsquad',
    shippingCostPerUnit: 0,
  });

  // Stats
  const [stats, setStats] = useState<any>(null);
  const [xpData, setXpData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [payoutRequested, setPayoutRequested] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/sellers/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setSellerLink(`https://goal-squad.vercel.app/seller/${user.id}`);
      fetchProducts();
      fetchSellerStats();
    }
  }, [user]);

  const fetchSellerStats = async () => {
    if (!user) return;
    setStatsLoading(true);
    try {
      // Get seller profile id from user_id
      const { data: profile } = await supabaseAdmin
        .from('seller_profiles')
        .select('id, community_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        setStatsLoading(false);
        return;
      }

      const sellerProfileId = profile.id;

      // Stats
      const statsRes = await apiFetch(`/api/sellers/${sellerProfileId}/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // XP
      const xpRes = await apiFetch(`/api/sellers/xp`);
      if (xpRes.ok) {
        const xpJson = await xpRes.json();
        setXpData(xpJson);
      }

      // Orders
      const ordersRes = await apiFetch(`/api/sellers/${sellerProfileId}/orders?limit=5`);
      if (ordersRes.ok) {
        const ordersJson = await ordersRes.json();
        setOrders(ordersJson.orders || []);
      }

      // Campaigns
      if (profile.community_id) {
        const campRes = await apiFetch(`/api/communities/${profile.community_id}/campaigns`);
        if (campRes.ok) {
          const campJson = await campRes.json();
          setCampaigns(campJson.campaigns || []);
        }
      }
    } catch (e) {
      console.error('Failed to fetch seller stats:', e);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    try {
      const res = await apiFetch('/api/stripe/connect/request-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: stats?.availableBalance || 0 }),
      });
      if (res.ok) {
        setPayoutRequested(true);
      }
    } catch (e) {
      console.error('Payout request failed:', e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await apiFetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    setProductLink(`https://goal-squad.vercel.app/products/${productId}`);
    setShowProductShare(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getShareMessage = () => {
    const defaultMessage = 'Hej! Jag säljer produkter för att stödja min förening. Titta gärna på min shop:';
    return customText ? `${customText}\n\n${defaultMessage}` : defaultMessage;
  };

  const getProductShareMessage = () => {
    const product = products.find(p => p.id === selectedProduct);
    const defaultMessage = `Hej! Kolla in denna produkt: ${product?.title || ''}. Jag säljer den för att stödja min förening.`;
    return customText ? `${customText}\n\n${defaultMessage}` : defaultMessage;
  };

  const shareViaFacebook = () => {
    const message = getShareMessage();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sellerLink)}&quote=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const shareProductViaFacebook = () => {
    const message = getProductShareMessage();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productLink)}&quote=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const shareViaInstagram = () => {
    navigator.clipboard.writeText(`${getShareMessage()}\n\n${sellerLink}`);
    alert('Länk kopierad! Klistra in den i din Instagram Story eller post.');
  };

  const shareProductViaInstagram = () => {
    navigator.clipboard.writeText(`${getProductShareMessage()}\n\n${productLink}`);
    alert('Länk kopierad! Klistra in den i din Instagram Story eller post.');
  };

  const shareViaMessenger = () => {
    const message = getShareMessage();
    const url = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(sellerLink)}&app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(sellerLink)}`;
    window.open(url, '_blank');
  };

  const shareProductViaMessenger = () => {
    const message = getProductShareMessage();
    const url = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(productLink)}&app_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(productLink)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const message = getShareMessage();
    const subject = 'Titta på min shop hos GoalSquad';
    const body = `${message}\n\n${sellerLink}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const shareProductViaEmail = () => {
    const message = getProductShareMessage();
    const product = products.find(p => p.id === selectedProduct);
    const subject = `Kolla in ${product?.title || 'denna produkt'} hos GoalSquad`;
    const body = `${message}\n\n${productLink}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const shareViaSMS = () => {
    const message = getShareMessage();
    const body = `${message}\n\n${sellerLink}`;
    window.location.href = `sms:?body=${encodeURIComponent(body)}`;
  };

  const shareProductViaSMS = () => {
    const message = getProductShareMessage();
    const body = `${message}\n\n${productLink}`;
    window.location.href = `sms:?body=${encodeURIComponent(body)}`;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(sellerLink);
    alert('Länk kopierad!');
  };

  const copyProductLink = () => {
    navigator.clipboard.writeText(productLink);
    alert('Produktlänk kopierad!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Säljar-dashboard</h1>

        {/* Stats Overview */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <MoneyIcon size={24} className="text-green-600" />
                <span className="text-sm text-gray-500 font-medium">Total försäljning</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{(stats.totalSales || 0).toLocaleString()} kr</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <OrdersIcon size={24} className="text-primary-600" />
                <span className="text-sm text-gray-500 font-medium">Ordrar</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrophyIcon size={24} className="text-yellow-600" />
                <span className="text-sm text-gray-500 font-medium">Level</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{xpData?.currentLevel || stats?.level || 1}</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((xpData?.currentXp || 0) % 100))}%` }} />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <XPIcon size={24} className="text-purple-600" />
                <span className="text-sm text-gray-500 font-medium">XP</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{xpData?.currentXp || stats?.xp || 0}</p>
            </motion.div>
          </div>
        ) : null}

        {/* Payout + Quick Actions */}
        {stats && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Tillgängligt för utbetalning</p>
                <p className="text-3xl font-bold text-green-600">{(stats.availableBalance || 0).toLocaleString()} kr</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRequestPayout}
                  disabled={payoutRequested || (stats.availableBalance || 0) <= 0}
                  className={`px-6 py-3 rounded-xl font-bold transition ${
                    payoutRequested
                      ? 'bg-green-100 text-green-700'
                      : (stats.availableBalance || 0) <= 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {payoutRequested ? 'Utbetalning begärd ✓' : 'Begär utbetalning'}
                </button>
                <Link href="/sellers/orders" className="px-6 py-3 bg-primary-100 text-primary-900 rounded-xl font-bold hover:bg-primary-200 transition">
                  Se alla ordrar
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        {orders.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CartIcon size={22} className="text-primary-900" />
              Senaste ordrar
            </h2>
            <div className="divide-y divide-gray-100">
              {orders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Order #{order.id?.slice(-6)}</p>
                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('sv-SE')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                    <span className="font-bold text-gray-900">{order.total?.toLocaleString()} kr</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Campaigns */}
        {campaigns.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <LeaderboardIcon size={22} className="text-primary-900" />
              Aktiva kampanjer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.filter((c: any) => c.status === 'active').slice(0, 4).map((campaign: any) => (
                <Link key={campaign.id} href={`/campaign/${campaign.id}`} className="block border-2 border-gray-100 rounded-xl p-4 hover:border-primary-300 transition">
                  <h3 className="font-bold text-gray-900">{campaign.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{campaign.description?.slice(0, 60)}...</p>
                  {campaign.moq_target && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${Math.min(100, ((campaign.moq_current || 0) / campaign.moq_target) * 100)}%` }} />
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">MOQ-mål: {campaign.moq_target}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Community Messaging Card */}
        <Link href="/messages" className="block mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-primary-200 hover:border-primary-500 transition cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-xl">
                <MessageIcon size={32} className="text-primary-900" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Community Meddelanden</h2>
                <p className="text-gray-600">Kommunicera med andra säljare och din community</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Warehouse Partner Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Bli lagerpartner</h2>
          <p className="text-gray-600 mb-6">Tjäna extra pengar genom att erbjuda lagerhållning, hantering och frakt av produkter.</p>

          <label className="flex items-center gap-4 cursor-pointer mb-6">
            <input
              type="checkbox"
              checked={isWarehousePartner}
              onChange={(e) => setIsWarehousePartner(e.target.checked)}
              className="w-6 h-6 text-primary-900 rounded focus:ring-2 focus:ring-primary-600"
            />
            <div>
              <div className="font-semibold text-gray-900">
                Aktivera lagerpartnerskap
              </div>
              <div className="text-sm text-gray-600">
                Sätt dina kostnader för lagertjänster
              </div>
            </div>
          </label>

          {isWarehousePartner && (
            <div className="space-y-6 p-6 bg-primary-50 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Lagerhållningskostnad (kr/enhet)
                  </label>
                  <input
                    type="number"
                    value={warehouseConfig.storageCostPerUnit}
                    onChange={(e) => setWarehouseConfig({ ...warehouseConfig, storageCostPerUnit: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                    placeholder="0.50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hanteringskostnad (kr/enhet)
                  </label>
                  <input
                    type="number"
                    value={warehouseConfig.handlingCostPerUnit}
                    onChange={(e) => setWarehouseConfig({ ...warehouseConfig, handlingCostPerUnit: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                    placeholder="0.30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vem står för fraktkostnaden?
                </label>
                <select
                  value={warehouseConfig.shippingCostType}
                  onChange={(e) => setWarehouseConfig({ ...warehouseConfig, shippingCostType: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                >
                  <option value="goalsquad">GoalSquad står för frakten</option>
                  <option value="partner">Jag står för frakten</option>
                  <option value="hybrid">Hybrid (delad kostnad)</option>
                </select>
              </div>

              {warehouseConfig.shippingCostType !== 'goalsquad' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fraktkostnad (kr/enhet)
                  </label>
                  <input
                    type="number"
                    value={warehouseConfig.shippingCostPerUnit}
                    onChange={(e) => setWarehouseConfig({ ...warehouseConfig, shippingCostPerUnit: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                    placeholder="1.00"
                  />
                </div>
              )}

              <button className="w-full bg-primary-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-600 transition">
                Spara lagerpartner-inställningar
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dela din shop</h2>
          <p className="text-gray-600 mb-6">Dela din personliga shop via olika kanaler för att nå fler kunder.</p>
          
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Lägg till personligt meddelande (valfritt)</label>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Lägg till ett personligt meddelande..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
            />
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Din personliga länk</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sellerLink}
                readOnly
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-700"
              />
              <button
                onClick={copyLink}
                className="px-6 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-600 transition flex items-center gap-2"
              >
                <ShareIcon size={20} />
                Kopiera
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button
              onClick={shareViaFacebook}
              className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition"
            >
              <FacebookIcon size={32} className="text-primary-900" />
              <span className="text-sm font-semibold text-gray-700">Facebook</span>
            </button>
            <button
              onClick={shareViaInstagram}
              className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition"
            >
              <InstagramIcon size={32} className="text-primary-900" />
              <span className="text-sm font-semibold text-gray-700">Instagram</span>
            </button>
            <button
              onClick={shareViaMessenger}
              className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition"
            >
              <MessageIcon size={32} className="text-primary-900" />
              <span className="text-sm font-semibold text-gray-700">Messenger</span>
            </button>
            <button
              onClick={shareViaEmail}
              className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition"
            >
              <MailIcon size={32} className="text-primary-900" />
              <span className="text-sm font-semibold text-gray-700">E-post</span>
            </button>
            <button
              onClick={shareViaSMS}
              className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition"
            >
              <PhoneIcon size={32} className="text-primary-900" />
              <span className="text-sm font-semibold text-gray-700">SMS</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingBagIcon size={28} className="text-primary-900" />
            Dela en specifik produkt
          </h2>
          <p className="text-gray-600 mb-6">Välj en produkt att dela för att öka försäljningen.</p>

          {!showProductShare ? (
            <>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Välj produkt</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                >
                  <option value="">Välj en produkt...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title} - {product.price} kr
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vald produkt</label>
                <p className="text-gray-900 font-semibold mb-2">
                  {products.find(p => p.id === selectedProduct)?.title}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={productLink}
                    readOnly
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-700"
                  />
                  <button
                    onClick={copyProductLink}
                    className="px-6 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-600 transition flex items-center gap-2"
                  >
                    <ShareIcon size={20} />
                    Kopiera
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lägg till personligt meddelande (valfritt)</label>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Lägg till ett personligt meddelande..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <button
                  onClick={shareProductViaFacebook}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition"
                >
                  <FacebookIcon size={32} className="text-primary-900" />
                  <span className="text-sm font-semibold text-gray-700">Facebook</span>
                </button>
                <button
                  onClick={shareProductViaInstagram}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition"
                >
                  <InstagramIcon size={32} className="text-primary-900" />
                  <span className="text-sm font-semibold text-gray-700">Instagram</span>
                </button>
                <button
                  onClick={shareProductViaMessenger}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition"
                >
                  <MessageIcon size={32} className="text-primary-900" />
                  <span className="text-sm font-semibold text-gray-700">Messenger</span>
                </button>
                <button
                  onClick={shareProductViaEmail}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition"
                >
                  <MailIcon size={32} className="text-primary-900" />
                  <span className="text-sm font-semibold text-gray-700">E-post</span>
                </button>
                <button
                  onClick={shareProductViaSMS}
                  className="flex flex-col items-center gap-2 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-300 transition"
                >
                  <PhoneIcon size={32} className="text-primary-900" />
                  <span className="text-sm font-semibold text-gray-700">SMS</span>
                </button>
              </div>

              <button
                onClick={() => setShowProductShare(false)}
                className="border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-primary-300 transition"
              >
                Välj annan produkt
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
