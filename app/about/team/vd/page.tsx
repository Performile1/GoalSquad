'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrophyIcon, UserIcon } from '@/app/components/BrandIcons';

export default function VDTeamPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-primary-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-center mb-4">
              <TrophyIcon size={64} />
            </div>
            <h1 className="text-4xl font-bold mb-2">Rickard Andersson</h1>
            <p className="text-xl text-white/80">VD & Grundare</p>
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
          <h2 className="text-2xl font-bold text-primary-900 mb-4">Om Rickard</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Rickard grundade GoalSquad med visionen att göra det enkelt för föreningar och klubbar att finansiera sin verksamhet. Med bakgrund inom både idrottsrörelsen och tech-industrin såg han behovet av en modern digital plattform som förenklar försäljning för alla.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Genom att kombinera passion för idrott med teknisk innovation har Rickard byggt en plattform som redan hjälpt hundratals föreningar att öka sina intäkter och minska administration.
          </p>
        </motion.div>

        {/* Vision */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-primary-900 mb-6">Vision</h2>
          <div className="border-2 border-primary-200 rounded-xl p-6">
            <UserIcon size={32} />
            <p className="text-gray-700 mt-4 leading-relaxed">
              Att varje förening, oavsett storlek, ska ha tillgång till enkla och effektiva verktyg för att finansiera sin verksamhet. Ingen ska behöva vända sig till dyr finansiering eller krångliga lotterilappar för att nå sina mål.
            </p>
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-primary-900 rounded-2xl p-8 text-white text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Kontakta Rickard</h2>
          <p className="text-white/80 mb-6">
            Har du frågor om GoalSquads vision eller vill du diskutera samarbete?
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
