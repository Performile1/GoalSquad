'use client';

import { useState, useEffect } from 'react';
import SalesCalculator from '@/app/components/SalesCalculator';
import { motion } from 'framer-motion';
import { TrophyIcon, CommunityIcon, UserIcon, SearchIcon, DashboardIcon } from '@/app/components/BrandIcons';

// Sample real companies and products (will be replaced with DB data)
const SAMPLE_PRODUCTS = [
  // Skånska Chips
  {
    id: 'chips-original',
    name: 'Chips Original 200g',
    merchantName: 'Skånska Chips',
    price: 45,
    cost: 30,
    profit: 15,
    profitPercentage: 33.3,
    category: 'Snacks',
    moq: 50,
  },
  {
    id: 'chips-sourcream',
    name: 'Chips Sourcream 200g',
    merchantName: 'Skånska Chips',
    price: 45,
    cost: 30,
    profit: 15,
    profitPercentage: 33.3,
    category: 'Snacks',
    moq: 50,
  },
  
  // Chokladfabriken
  {
    id: 'choco-bar-milk',
    name: 'Mjölkchoklad 100g',
    merchantName: 'Chokladfabriken',
    price: 35,
    cost: 20,
    profit: 15,
    profitPercentage: 42.9,
    category: 'Godis',
    moq: 100,
  },
  {
    id: 'choco-bar-dark',
    name: 'Mörk Choklad 100g',
    merchantName: 'Chokladfabriken',
    price: 40,
    cost: 23,
    profit: 17,
    profitPercentage: 42.5,
    category: 'Godis',
    moq: 100,
  },
  {
    id: 'choco-pralines',
    name: 'Pralinask 250g',
    merchantName: 'Chokladfabriken',
    price: 120,
    cost: 70,
    profit: 50,
    profitPercentage: 41.7,
    category: 'Godis',
    moq: 30,
  },
  
  // Ekologiskt Kaffe AB
  {
    id: 'coffee-medium',
    name: 'Mellanrost Kaffe 500g',
    merchantName: 'Ekologiskt Kaffe AB',
    price: 89,
    cost: 55,
    profit: 34,
    profitPercentage: 38.2,
    category: 'Dryck',
    moq: 80,
  },
  {
    id: 'coffee-dark',
    name: 'Mörkrost Kaffe 500g',
    merchantName: 'Ekologiskt Kaffe AB',
    price: 95,
    cost: 58,
    profit: 37,
    profitPercentage: 38.9,
    category: 'Dryck',
    moq: 80,
  },
  
  // Hälsokost Sverige
  {
    id: 'protein-bar',
    name: 'Proteinbar 60g',
    merchantName: 'Hälsokost Sverige',
    price: 25,
    cost: 15,
    profit: 10,
    profitPercentage: 40,
    category: 'Hälsa',
    moq: 200,
  },
  {
    id: 'energy-balls',
    name: 'Energibollar 12-pack',
    merchantName: 'Hälsokost Sverige',
    price: 65,
    cost: 38,
    profit: 27,
    profitPercentage: 41.5,
    category: 'Hälsa',
    moq: 50,
  },
  
  // Gourmet Nötter
  {
    id: 'mixed-nuts',
    name: 'Blandade Nötter 300g',
    merchantName: 'Gourmet Nötter',
    price: 75,
    cost: 45,
    profit: 30,
    profitPercentage: 40,
    category: 'Snacks',
    moq: 60,
  },
  {
    id: 'cashews',
    name: 'Cashewnötter 250g',
    merchantName: 'Gourmet Nötter',
    price: 85,
    cost: 52,
    profit: 33,
    profitPercentage: 38.8,
    category: 'Snacks',
    moq: 60,
  },
];

export default function CalculatorPage() {
  const [stats, setStats] = useState({
    totalCommunities: 0,
    totalRevenue: 0,
    averageProfit: 0,
  });

  useEffect(() => {
    // Fetch real stats from DB
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats/calculator');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <DashboardIcon size={56} />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-primary-900 mb-4">
            Försäljningskalkylator
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Räkna ut hur mycket din förening kan tjäna med produkter från flera företag
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-center mb-2"><TrophyIcon size={36} /></div>
              <div className="text-3xl font-bold text-primary-900">
                {stats.totalCommunities || '500+'}
              </div>
              <div className="text-sm text-gray-600">Föreningar använder oss</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-center mb-2"><CommunityIcon size={36} /></div>
              <div className="text-3xl font-bold text-primary-900">
                {stats.totalRevenue ? `${(stats.totalRevenue / 1000000).toFixed(1)}M` : '12M+'}
              </div>
              <div className="text-sm text-gray-600">SEK i försäljning</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-center mb-2"><UserIcon size={36} /></div>
              <div className="text-3xl font-bold text-primary-900">
                {stats.averageProfit || '35-45'}%
              </div>
              <div className="text-sm text-gray-600">Genomsnittlig vinst</div>
            </div>
          </div>
        </motion.div>

        {/* Calculator */}
        <SalesCalculator initialProducts={SAMPLE_PRODUCTS} />

        {/* Example Scenarios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-white rounded-2xl shadow-lg p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <CommunityIcon size={28} />
            <h2 className="text-3xl font-bold text-primary-900">Exempel från Riktiga Föreningar</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Example 1 */}
            <div className="border-2 border-primary-200 rounded-xl p-6 bg-primary-50">
              <div className="flex justify-center mb-3"><TrophyIcon size={32} /></div>
              <h3 className="text-xl font-bold text-primary-900 mb-2">
                Vikings Fotboll
              </h3>
              <div className="text-sm text-primary-800 mb-4">
                Stockholm • 45 säljare
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span>Chips (200 påsar)</span>
                  <span className="font-semibold">9,000 kr</span>
                </div>
                <div className="flex justify-between">
                  <span>Choklad (150 st)</span>
                  <span className="font-semibold">5,250 kr</span>
                </div>
                <div className="flex justify-between">
                  <span>Kaffe (100 paket)</span>
                  <span className="font-semibold">8,900 kr</span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-primary-300">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary-900">Total vinst:</span>
                  <span className="text-2xl font-bold text-primary-900">
                    8,650 kr
                  </span>
                </div>
              </div>
            </div>

            {/* Example 2 */}
            <div className="border-2 border-primary-200 rounded-xl p-6 bg-primary-50">
              <div className="flex justify-center mb-3"><TrophyIcon size={32} /></div>
              <h3 className="text-xl font-bold text-primary-900 mb-2">
                Eagles Basket
              </h3>
              <div className="text-sm text-primary-800 mb-4">
                Göteborg • 32 säljare
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span>Proteinbars (300 st)</span>
                  <span className="font-semibold">7,500 kr</span>
                </div>
                <div className="flex justify-between">
                  <span>Nötter (80 påsar)</span>
                  <span className="font-semibold">6,800 kr</span>
                </div>
                <div className="flex justify-between">
                  <span>Choklad (120 st)</span>
                  <span className="font-semibold">4,200 kr</span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-primary-300">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary-900">Total vinst:</span>
                  <span className="text-2xl font-bold text-primary-900">
                    7,240 kr
                  </span>
                </div>
              </div>
            </div>

            {/* Example 3 */}
            <div className="border-2 border-primary-200 rounded-xl p-6 bg-primary-50">
              <div className="flex justify-center mb-3"><UserIcon size={32} /></div>
              <h3 className="text-xl font-bold text-primary-900 mb-2">
                Klass 9B
              </h3>
              <div className="text-sm text-primary-800 mb-4">
                Uppsala • 28 säljare
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span>Chips (150 påsar)</span>
                  <span className="font-semibold">6,750 kr</span>
                </div>
                <div className="flex justify-between">
                  <span>Energibollar (60 pack)</span>
                  <span className="font-semibold">3,900 kr</span>
                </div>
                <div className="flex justify-between">
                  <span>Pralinaskar (40 st)</span>
                  <span className="font-semibold">4,800 kr</span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-primary-300">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary-900">Total vinst:</span>
                  <span className="text-2xl font-bold text-primary-900">
                    5,870 kr
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-primary-50 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <SearchIcon size={20} />
              <h4 className="font-bold text-primary-900 text-lg">Tips för Maximal Vinst</h4>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-primary-900 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Kombinera produkter från flera företag för bredare utbud</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-primary-900 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Välj produkter med hög vinstmarginal (35-45%)</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-primary-900 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Tänk på MOQ - samla beställningar för rabatt</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-primary-900 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Blanda olika kategorier för att nå fler kunder</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="bg-primary-900 rounded-2xl shadow-2xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-4">
              Redo att Starta?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Skapa ett konto och börja sälja idag - helt gratis!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary-900 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg transition">
                Kom Igång Gratis →
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-primary-900 transition">
                Kontakta Oss
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
