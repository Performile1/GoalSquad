'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CommunityIcon, TrophyIcon, UserIcon } from '@/app/components/BrandIcons';

export default function CommunityTeamPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-primary-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-center mb-4">
              <CommunityIcon size={64} />
            </div>
            <h1 className="text-4xl font-bold mb-2">Johan Karlsson</h1>
            <p className="text-xl text-white/80">Föreningsansvarig</p>
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

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-50 rounded-2xl p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-primary-900 mb-4">Om Johan</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Johan ansvarar för alla relationer med föreningar och communities på GoalSquad. Med egen erfarenhet från idrottsrörelsen förstår han de unika utmaningar som föreningar står inför när det gäller finansiering.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Hans fokus ligger på att hjälpa föreningar att maximera sina intäkter genom plattformen och bygga ett starkt community där föreningar kan dela erfarenheter.
          </p>
        </motion.div>

        {/* What he does */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-primary-900 mb-6">Ansvarsområden</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <TrophyIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Onboarding</h3>
              <p className="text-gray-600 text-sm">
                Guidar nya föreningar genom registrering och uppstart av försäljning
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <UserIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Support</h3>
              <p className="text-gray-600 text-sm">
                Hjälpsam support via chat, mail och telefon för alla frågor
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <CommunityIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Community</h3>
              <p className="text-gray-600 text-sm">
                Bygger ett nätverk av föreningar som delar erfarenheter och tips
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <TrophyIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Utbildning</h3>
              <p className="text-gray-600 text-sm">
                Resurser och guider för att maximera försäljningsresultat
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
          <h2 className="text-2xl font-bold mb-4">Kontakta Johan</h2>
          <p className="text-white/80 mb-6">
            Har du frågor om hur GoalSquad kan hjälpa din förening?
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-white text-primary-900 rounded-xl font-bold hover:bg-primary-50 transition"
          >
            Kontakta oss
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
