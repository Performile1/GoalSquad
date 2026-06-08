'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrophyIcon, ShoppingBagIcon, UserIcon, LeaderboardIcon,
  CartIcon, CheckIcon
} from '@/app/components/BrandIcons';

interface Campaign {
  id: string;
  title: string;
  description: string;
  status: string;
  moq_target: number;
  end_date: string;
  featured_image_url?: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  stock: number;
  sellerName: string;
}

interface TopSeller {
  rank: number;
  name: string;
  avatarUrl?: string;
  totalSales: number;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    fetchCampaign();
  }, [campaignId]);

  const fetchCampaign = async () => {
    setLoading(true);
    try {
      // Campaign details
      const res = await fetch(`/api/campaigns/${campaignId}`);
      const data = await res.json();
      setCampaign(data.campaign || null);

      // Products in campaign
      const prodRes = await fetch(`/api/campaigns/${campaignId}/products`);
      const prodData = await prodRes.json();
      setProducts(prodData.products || []);

      // Leaderboard for this campaign
      const lbRes = await fetch(`/api/campaigns/${campaignId}/leaderboard`);
      const lbData = await lbRes.json();
      setTopSellers(lbData.leaderboard?.slice(0, 5) || []);
    } catch (e) {
      console.error('Failed to fetch campaign:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) setJoined(true);
    } catch (e) {
      console.error('Join failed:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Laddar kampanj...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <ShoppingBagIcon size={64} className="text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Kampanj hittades inte</h1>
        <Link href="/marketplace" className="text-primary-900 font-semibold hover:underline">Till marknadsplatsen →</Link>
      </div>
    );
  }

  const moqProgress = campaign.moq_target
    ? Math.min(100, (((campaign as any).moq_current || 0) / campaign.moq_target) * 100)
    : 0;

  const daysLeft = campaign.end_date
    ? Math.max(0, Math.ceil((new Date(campaign.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-primary-900 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-white/15 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                {campaign.status}
              </span>
              {daysLeft !== null && (
                <span className="flex items-center gap-1 text-white/70 text-sm">
                  &#9201; {daysLeft} dagar kvar
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{campaign.title}</h1>
            <p className="text-xl text-white/75 max-w-2xl">{campaign.description}</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* MOQ Progress */}
        {campaign.moq_target && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrophyIcon size={24} className="text-yellow-600" />
                Försäljningsmål (MOQ)
              </h2>
              <span className="text-2xl font-bold text-primary-900">
                {(campaign as any).moq_current || 0} / {campaign.moq_target}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${moqProgress}%` }}
                transition={{ duration: 1 }}
                className="bg-gradient-to-r from-primary-600 to-primary-900 h-4 rounded-full"
              />
            </div>
            <p className="text-sm text-gray-500">{moqProgress.toFixed(1)}% av målet uppnått</p>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Products */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBagIcon size={28} className="text-primary-900" />
              Produkter i kampanjen
            </h2>
            {products.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-gray-500">
                Inga produkter än
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 hover:border-primary-300 transition overflow-hidden"
                  >
                    <div className="h-40 bg-primary-50 overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">Bild</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900">{product.title}</h3>
                      <p className="text-sm text-gray-500">av {product.sellerName}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xl font-bold text-primary-900">{product.price.toLocaleString()} kr</span>
                        <Link
                          href={`/products/${product.id}`}
                          className="px-4 py-2 bg-primary-900 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition"
                        >
                          Köp
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join CTA */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Vill du sälja?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Gå med som säljare i denna kampanj och tjäna pengar till din förening.
              </p>
              <button
                onClick={handleJoin}
                disabled={joined}
                className={`w-full py-3 rounded-xl font-bold transition ${
                  joined
                    ? 'bg-green-100 text-green-700'
                    : 'bg-primary-900 text-white hover:bg-primary-700'
                }`}
              >
                {joined ? <span className="flex items-center justify-center gap-2"><CheckIcon size={18} /> Du är med!</span> : 'Gå med i kampanj →'}
              </button>
            </div>

            {/* Top Sellers */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <LeaderboardIcon size={20} className="text-primary-900" />
                Toppsäljare
              </h3>
              {topSellers.length === 0 ? (
                <p className="text-sm text-gray-500">Inga säljare än</p>
              ) : (
                <div className="space-y-3">
                  {topSellers.map((seller) => (
                    <div key={seller.rank} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        seller.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                        seller.rank === 2 ? 'bg-gray-100 text-gray-700' :
                        seller.rank === 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {seller.rank}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{seller.name}</p>
                      </div>
                      <span className="font-bold text-primary-900 text-sm">{seller.totalSales.toLocaleString()} kr</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
