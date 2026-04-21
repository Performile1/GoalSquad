'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrophyIcon, JerseyIcon, MerchantIcon, TruckIcon, UserIcon, CommunityIcon } from '@/app/components/BrandIcons';

export const dynamic = 'force-dynamic';

const USER_TYPES = [
  {
    id: 'seller',
    title: 'Säljare',
    description: 'Sälj produkter för att stödja din förening, klass eller klubb',
    icon: TrophyIcon,
    href: '/sellers/join',
    badge: 'För säljare',
  },
  {
    id: 'forening',
    title: 'Förening / Klubb',
    description: 'Registrera din idrottsförening, klubb eller scout-grupp',
    icon: JerseyIcon,
    href: '/join/community',
    badge: 'För organisationer',
  },
  {
    id: 'klass',
    title: 'Klass / Skolgrupp',
    description: 'Fyll på klasskassan inför resor, aktiviteter och utrustning',
    icon: CommunityIcon,
    href: '/join/community?type=class',
    badge: 'För skolor',
  },
  {
    id: 'merchant',
    title: 'Företag / Varumärke',
    description: 'Nå tusentals föreningssäljare med dina produkter',
    icon: MerchantIcon,
    href: '/merchants/onboard',
    badge: 'För företag',
  },
  {
    id: 'warehouse',
    title: 'Lagerpartner',
    description: 'Hantera lager och logistik för GoalSquad',
    icon: TruckIcon,
    href: '/warehouses/join',
    badge: 'För logistik',
  },
  {
    id: 'customer',
    title: 'Kund',
    description: 'Köp produkter och stöd lokala föreningar',
    icon: UserIcon,
    href: '/auth/register',
    badge: 'För kunder',
  },
];

export default function RegisterSelectPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-600 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white font-semibold mb-8 transition"
          >
            ← Tillbaka till logga in
          </Link>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
            Vad vill du registrera dig som?
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Välj den typ av konto som passar dig bäst så att vi kan ge dig rätt upplevelse
          </p>
        </motion.div>

        {/* User Type Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {USER_TYPES.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={type.href}
                className="block bg-white rounded-2xl p-8 hover:shadow-2xl transition h-full border-2 border-transparent hover:border-primary-300 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-primary-50 rounded-xl group-hover:bg-primary-100 transition">
                    <type.icon size={40} />
                  </div>
                  {type.badge && (
                    <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full uppercase tracking-wider">
                      {type.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-900 transition">
                  {type.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {type.description}
                </p>
                <div className="mt-6 flex items-center text-primary-900 font-semibold group-hover:text-primary-600 transition">
                  Välj
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-white/70 text-sm mb-4">
            Osäker på vad du ska välja?
          </p>
          <Link
            href="/how-it-works"
            className="inline-block px-6 py-3 bg-white/10 backdrop-blur border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition"
          >
            Läs hur GoalSquad fungerar →
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
