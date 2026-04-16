'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CommunityIcon, MerchantIcon, TrophyIcon, ShopIcon } from '@/app/components/BrandIcons'

const card = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

export default function JoinPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-600 flex flex-col items-center justify-center px-4 py-20">
      {/* Header */}
      <motion.div
        className="text-center text-white mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-center mb-6">
          <TrophyIcon size={64} />
        </div>
        <h1 className="text-5xl font-extrabold mb-4">Kom igång med GoalSquad</h1>
        <p className="text-white/70 text-xl max-w-2xl mx-auto">
          Välj vad som passar dig bäst. Du kan alltid lägga till fler roller senare.
        </p>
      </motion.div>

      {/* Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Community / Club / Class */}
        <motion.div variants={card} initial="hidden" animate="show" transition={{ delay: 0.15 }}>
          <Link
            href="/join/community"
            className="group block bg-white rounded-3xl p-10 shadow-2xl hover:shadow-3xl transition h-full"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-primary-50 rounded-2xl p-5 group-hover:bg-primary-100 transition">
                <CommunityIcon size={64} />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-3">
              Förening, Klubb eller Klass
            </h2>
            <p className="text-gray-500 text-center mb-6 leading-relaxed">
              Registrera din idrottsförening, skolklass eller annan grupp. Sätt igång att sälja produkter och dela intäkterna rättvist bland era medlemmar.
            </p>
            <ul className="space-y-2 mb-8">
              {[
                'Gratis att komma igång',
                'Automatisk intäktsdelning',
                'Leaderboard & tävlingar',
                'Ingen teknisk kunskap krävs',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-900 flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="w-full bg-primary-900 text-white text-center py-3 rounded-xl font-bold group-hover:bg-primary-600 transition">
              Registrera din förening →
            </div>
          </Link>
        </motion.div>

        {/* Company / Merchant */}
        <motion.div variants={card} initial="hidden" animate="show" transition={{ delay: 0.3 }}>
          <Link
            href="/merchants/onboard"
            className="group block bg-white rounded-3xl p-10 shadow-2xl hover:shadow-3xl transition h-full"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-primary-50 rounded-2xl p-5 group-hover:bg-primary-100 transition">
                <MerchantIcon size={64} />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-3">
              Företag / Merchant
            </h2>
            <p className="text-gray-500 text-center mb-6 leading-relaxed">
              Registrera ditt företag och ladda upp produkter som föreningar kan sälja. Du sätter priser och vi hanterar logistik, betalning och intäktsdelning.
            </p>
            <ul className="space-y-2 mb-8">
              {[
                'Nå tusentals föreningssäljare',
                'Vi hanterar leverans & retur',
                'Realtidsöversikt av försäljning',
                'Org.nummer & momsregistrering',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-900 flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="w-full border-2 border-primary-900 text-primary-900 text-center py-3 rounded-xl font-bold group-hover:bg-primary-900 group-hover:text-white transition">
              Registrera ditt företag →
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Already have account */}
      <motion.p
        className="mt-12 text-white/60 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Har du redan ett konto?{' '}
        <Link href="/auth/login" className="text-white font-semibold hover:underline">
          Logga in här
        </Link>
      </motion.p>
    </main>
  )
}
