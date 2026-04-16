'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShopIcon, TrophyIcon, DashboardIcon, MerchantIcon } from '@/app/components/BrandIcons';

export default function MerchantCalculatorPage() {
  const [products, setProducts] = useState(50);
  const [avgPrice, setAvgPrice] = useState(200);
  const [salesPerMonth, setSalesPerMonth] = useState(500);

  const goalSquadCommission = 0.15; // 15% commission
  const totalRevenue = products * avgPrice * salesPerMonth;
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
              Räkna ut hur mycket ditt företag kan tjäna med GoalSquad
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
            {/* Products */}
            <div>
              <label className="block text-sm font-semibold text-primary-900 mb-2">
                Antal produkter i sortimentet
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={products}
                onChange={(e) => setProducts(Number(e.target.value))}
                className="w-full h-2 bg-primary-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>10</span>
                <span className="font-bold text-primary-900">{products} produkter</span>
                <span>200</span>
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

            {/* Sales per month */}
            <div>
              <label className="block text-sm font-semibold text-primary-900 mb-2">
                Förväntade försäljningar per månad
              </label>
              <input
                type="range"
                min="100"
                max="2000"
                step="50"
                value={salesPerMonth}
                onChange={(e) => setSalesPerMonth(Number(e.target.value))}
                className="w-full h-2 bg-primary-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>100</span>
                <span className="font-bold text-primary-900">{salesPerMonth} st/mån</span>
                <span>2000</span>
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

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-xl p-6">
              <DashboardIcon size={32} />
              <p className="text-white/70 text-sm mt-2">Total omsättning</p>
              <p className="text-3xl font-bold mt-1">
                {totalRevenue.toLocaleString('sv-SE')} kr
              </p>
              <p className="text-white/60 text-xs mt-1">per månad</p>
            </div>

            <div className="bg-white/10 rounded-xl p-6">
              <ShopIcon size={32} />
              <p className="text-white/70 text-sm mt-2">Ditt intäkter</p>
              <p className="text-3xl font-bold mt-1">
                {merchantEarnings.toLocaleString('sv-SE')} kr
              </p>
              <p className="text-white/60 text-xs mt-1">per månad</p>
            </div>

            <div className="bg-white/10 rounded-xl p-6">
              <TrophyIcon size={32} />
              <p className="text-white/70 text-sm mt-2">GoalSquad provision</p>
              <p className="text-3xl font-bold mt-1">
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

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
