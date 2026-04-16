'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TargetIcon, MessageIcon, UserIcon } from '@/app/components/BrandIcons';

export default function SupportTeamPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-primary-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-center mb-4">
              <TargetIcon size={64} />
            </div>
            <h1 className="text-4xl font-bold mb-4">Support & Onboarding</h1>
            <p className="text-xl text-white/80">
              Vi hjälper föreningar att komma igång och lyckas
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
          <h2 className="text-2xl font-bold text-primary-900 mb-4">Vårt uppdrag</h2>
          <p className="text-gray-700 leading-relaxed">
            Vi är här för att hjälpa varje förening att lyckas med sin försäljning. Från första registrering till löpande support - vi finns med hela vägen. Vårt mål är att göra det så enkelt som möjligt att komma igång och maximera intäkterna.
          </p>
        </motion.div>

        {/* What we do */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-primary-900 mb-6">Vad vi gör</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <UserIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Onboarding</h3>
              <p className="text-gray-600 text-sm">
                Guidar nya föreningar genom hela registreringsprocessen
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <MessageIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Support</h3>
              <p className="text-gray-600 text-sm">
                Snabb och hjälpsam support via chat, mail och telefon
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <TargetIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Utbildning</h3>
              <p className="text-gray-600 text-sm">
                Resurser och guider för att maximera försäljningsresultat
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <UserIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Framgångscoachning</h3>
              <p className="text-gray-600 text-sm">
                Tips och råd för att optimera försäljningsstrategier
              </p>
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
          <h2 className="text-2xl font-bold mb-4">Behöver du hjälp?</h2>
          <p className="text-white/80 mb-6">
            Vi finns här för att hjälpa dig med alla frågor om GoalSquad
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block px-8 py-3 bg-white text-primary-900 rounded-xl font-bold hover:bg-primary-50 transition"
            >
              Kontakta Support
            </Link>
            <Link
              href="/join/community"
              className="inline-block px-8 py-3 border-2 border-white text-white rounded-xl font-bold hover:bg-white hover:text-primary-900 transition"
            >
              Registrera förening
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
