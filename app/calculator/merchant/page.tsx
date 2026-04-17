'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShopIcon, TrophyIcon, DashboardIcon, MerchantIcon, UserIcon } from '@/app/components/BrandIcons';
import { useAuth } from '@/lib/auth-context';

export default function MerchantCalculatorPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/calculator/merchant');
    }
  }, [user, loading, router]);

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
  const [products, setProducts] = useState(50);
  const [avgPrice, setAvgPrice] = useState(200);
  const [sellerCount, setSellerCount] = useState(10);
  const [avgSalesPerSeller, setAvgSalesPerSeller] = useState(50);

  const goalSquadCommission = 0.15; // 15% commission
  const totalSalesPerMonth = sellerCount * avgSalesPerSeller;
  const totalRevenue = totalSalesPerMonth * avgPrice;
  const goalSquadEarnings = totalRevenue * goalSquadCommission;
  const merchantEarnings = totalRevenue - goalSquadEarnings;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-primary-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-center mb-4">
              <MerchantIcon size={64} />
            </div>
            <h1 className="text-4xl font-bold mb-4">Företagskalkylator</h1>
            <p className="text-xl text-white/80">
              Räkna ut din potential med flera säljare i föreningar och klubbar
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Back link */}
        <Link
          href="/calculator"
          className="inline-flex items-center gap-2 text-primary-900 hover:text-primary-700 font-semibold mb-8 transition"
        >
          ← Tillbaka till kalkylatorer
        </Link>

        {/* Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-50 rounded-2xl p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-primary-900 mb-6">Beräkna din potential</h2>

          <div className="space-y-8">
            {/* Seller count */}
            <div>
              <label className="block text-sm font-semibold text-primary-900 mb-2">
                Antal säljare i föreningar/klubbar
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={sellerCount}
                onChange={(e) => setSellerCount(Number(e.target.value))}
                className="w-full h-2 bg-primary-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>1</span>
                <span className="font-bold text-primary-900">{sellerCount} säljare</span>
                <span>100</span>
              </div>
            </div>

            {/* Average sales per seller */}
            <div>
              <label className="block text-sm font-semibold text-primary-900 mb-2">
                Genomsnittlig försäljning per säljare (st/mån)
              </label>
              <input
                type="range"
                min="5"
                max="200"
                step="5"
                value={avgSalesPerSeller}
                onChange={(e) => setAvgSalesPerSeller(Number(e.target.value))}
                className="w-full h-2 bg-primary-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>5 st</span>
                <span className="font-bold text-primary-900">{avgSalesPerSeller} st/mån</span>
                <span>200 st</span>
              </div>
            </div>

            {/* Average price */}
            <div>
              <label className="block text-sm font-semibold text-primary-900 mb-2">
                Genomsnittligt produktpris (kr)
              </label>
              <input
                type="range"
                min="50"
                max="1000"
                step="10"
                value={avgPrice}
                onChange={(e) => setAvgPrice(Number(e.target.value))}
                className="w-full h-2 bg-primary-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>50 kr</span>
                <span className="font-bold text-primary-900">{avgPrice} kr</span>
                <span>1000 kr</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-primary-900 rounded-2xl p-8 text-white mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">Din intäktsprognos</h2>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <UserIcon size={28} />
              <p className="text-white/70 text-xs mt-2">Antal säljare</p>
              <p className="text-2xl font-bold mt-1">
                {sellerCount}
              </p>
              <p className="text-white/60 text-xs mt-1">föreningar/klubbar</p>
            </div>

            <div className="bg-white/10 rounded-xl p-4">
              <DashboardIcon size={28} />
              <p className="text-white/70 text-xs mt-2">Total försäljning</p>
              <p className="text-2xl font-bold mt-1">
                {totalSalesPerMonth.toLocaleString('sv-SE')} st
              </p>
              <p className="text-white/60 text-xs mt-1">per månad</p>
            </div>

            <div className="bg-white/10 rounded-xl p-4">
              <ShopIcon size={28} />
              <p className="text-white/70 text-xs mt-2">Ditt intäkter</p>
              <p className="text-2xl font-bold mt-1">
                {merchantEarnings.toLocaleString('sv-SE')} kr
              </p>
              <p className="text-white/60 text-xs mt-1">per månad</p>
            </div>

            <div className="bg-white/10 rounded-xl p-4">
              <TrophyIcon size={28} />
              <p className="text-white/70 text-xs mt-2">GoalSquad provision</p>
              <p className="text-2xl font-bold mt-1">
                {goalSquadEarnings.toLocaleString('sv-SE')} kr
              </p>
              <p className="text-white/60 text-xs mt-1">per månad</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-white/70 text-sm text-center">
              <strong>Årsintäkt för ditt företag:</strong>{' '}
              <span className="text-white font-bold text-xl">
                {(merchantEarnings * 12).toLocaleString('sv-SE')} kr
              </span>
            </p>
          </div>
        </motion.div>

        {/* Example Scenarios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <MerchantIcon size={28} />
            <h2 className="text-3xl font-bold text-primary-900">Exempel från Riktiga Företag</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Example 1 */}
            <div className="border-2 border-primary-200 rounded-xl p-6 bg-primary-50">
              <div className="flex justify-center mb-3"><TrophyIcon size={32} /></div>
              <h3 className="text-xl font-bold text-primary-900 mb-2">
                Skånska Chips
              </h3>
              <div className="text-sm text-primary-800 mb-4">
                25 säljare • 40 st/mån
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span>Antal säljare</span>
                  <span className="font-semibold">25</span>
                </div>
                <div className="flex justify-between">
                  <span>Försäljning per säljare</span>
                  <span className="font-semibold">40 st</span>
                </div>
                <div className="flex justify-between">
                  <span>Genomsnittspris</span>
                  <span className="font-semibold">45 kr</span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-primary-300">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary-900">Månadsintäkt:</span>
                  <span className="text-2xl font-bold text-primary-900">
                    38,250 kr
                  </span>
                </div>
              </div>
            </div>

            {/* Example 2 */}
            <div className="border-2 border-primary-200 rounded-xl p-6 bg-primary-50">
              <div className="flex justify-center mb-3"><TrophyIcon size={32} /></div>
              <h3 className="text-xl font-bold text-primary-900 mb-2">
                Chokladfabriken
              </h3>
              <div className="text-sm text-primary-800 mb-4">
                40 säljare • 35 st/mån
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span>Antal säljare</span>
                  <span className="font-semibold">40</span>
                </div>
                <div className="flex justify-between">
                  <span>Försäljning per säljare</span>
                  <span className="font-semibold">35 st</span>
                </div>
                <div className="flex justify-between">
                  <span>Genomsnittspris</span>
                  <span className="font-semibold">55 kr</span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-primary-300">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary-900">Månadsintäkt:</span>
                  <span className="text-2xl font-bold text-primary-900">
                    65,450 kr
                  </span>
                </div>
              </div>
            </div>

            {/* Example 3 */}
            <div className="border-2 border-primary-200 rounded-xl p-6 bg-primary-50">
              <div className="flex justify-center mb-3"><UserIcon size={32} /></div>
              <h3 className="text-xl font-bold text-primary-900 mb-2">
                Hälsokost Sverige
              </h3>
              <div className="text-sm text-primary-800 mb-4">
                60 säljare • 30 st/mån
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span>Antal säljare</span>
                  <span className="font-semibold">60</span>
                </div>
                <div className="flex justify-between">
                  <span>Försäljning per säljare</span>
                  <span className="font-semibold">30 st</span>
                </div>
                <div className="flex justify-between">
                  <span>Genomsnittspris</span>
                  <span className="font-semibold">35 kr</span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-primary-300">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary-900">Månadsintäkt:</span>
                  <span className="text-2xl font-bold text-primary-900">
                    53,550 kr
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-primary-900 mb-6">Fördelar med GoalSquad</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <MerchantIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Tillgång till engagerade säljare</h3>
              <p className="text-gray-600 text-sm">
                Föreningar och communities säljer dina produkter med passion och lokal kännedom
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <ShopIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Minskad marknadsföringskostnad</h3>
              <p className="text-gray-600 text-sm">
                Vi marknadsför plattformen och du får tillgång till en bred kundbas utan extra kostnad
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <DashboardIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Automatiserad logistik</h3>
              <p className="text-gray-600 text-sm">
                Vi hanterar ordergenerering och integration med logistikpartners
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <TrophyIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Transparens och spårbarhet</h3>
              <p className="text-gray-600 text-sm">
                Få full insyn i försäljning, intäkter och lagerstatus i realtid
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-primary-900 rounded-2xl p-8 text-white text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Redo att komma igång?</h2>
          <p className="text-white/80 mb-6">
            Bli leverantör på GoalSquad och nå nya marknader
          </p>
          <Link
            href="/merchants/onboard"
            className="inline-block px-8 py-3 bg-white text-primary-900 rounded-xl font-bold hover:bg-primary-50 transition"
          >
            Ansök som leverantör
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
