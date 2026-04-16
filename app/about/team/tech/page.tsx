'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LaptopIcon, DashboardIcon, SearchIcon, TrophyIcon } from '@/app/components/BrandIcons';

export default function TechTeamPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-primary-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-center mb-4">
              <LaptopIcon size={64} />
            </div>
            <h1 className="text-4xl font-bold mb-4">Tech & Produkt</h1>
            <p className="text-xl text-white/80">
              Hur GoalSquad fungerar tekniskt
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Back link */}
        <Link
          href="/about"
          className="inline-flex items-center gap-2 text-primary-900 hover:text-primary-700 font-semibold mb-8 transition"
        >
          ← Tillbaka till Om oss
        </Link>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-50 rounded-2xl p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-primary-900 mb-4">Hur GoalSquad fungerar</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            GoalSquad är en modern community commerce-plattform som kopplar ihop tre huvudaktörer:
          </p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <TrophyIcon size={16} />
              <span><strong>Föreningar och säljare</strong> registrerar produkter och delar säljlänkar</span>
            </li>
            <li className="flex items-start gap-2">
              <DashboardIcon size={16} />
              <span><strong>Leverantörer</strong> tillhandahåller produkter och hanterar logistik</span>
            </li>
            <li className="flex items-start gap-2">
              <SearchIcon size={16} />
              <span><strong>Kunder</strong> köper produkter via säkra betalningar</span>
            </li>
          </ul>
        </motion.div>

        {/* Tech stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-primary-900 mb-6">Teknisk arkitektur</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <DashboardIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Frontend</h3>
              <p className="text-gray-600 text-sm mb-2">Next.js 14 med App Router för optimal prestanda och SEO</p>
              <p className="text-gray-500 text-xs">React, TypeScript, Tailwind CSS, Framer Motion</p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <SearchIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Backend</h3>
              <p className="text-gray-600 text-sm mb-2">Supabase (PostgreSQL) för databas och autentisering</p>
              <p className="text-gray-500 text-xs">Serverless functions på Vercel för API endpoints</p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <LaptopIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Betalningar</h3>
              <p className="text-gray-600 text-sm mb-2">Stripe för säkra betalningar och automatiserade utbetalningar</p>
              <p className="text-gray-500 text-xs">Kort, Swish, Klarna och andra betalmetoder</p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <DashboardIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Logistik</h3>
              <p className="text-gray-600 text-sm mb-2">Integration med DHL, Instabox, Budbee och andra logistikpartners</p>
              <p className="text-gray-500 text-xs">Automatisk ordergenerering och spårning</p>
            </div>
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-primary-900 rounded-2xl p-8 text-white text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Intresserad av teknik?</h2>
          <p className="text-white/80 mb-6">
            Har du frågor om vår teknik eller vill du veta mer om hur vi jobbar?
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-white text-primary-900 rounded-xl font-bold hover:bg-primary-50 transition"
          >
            Kontakta Tech Teamet
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
