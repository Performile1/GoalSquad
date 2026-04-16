'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShopIcon, TrophyIcon } from '@/app/components/BrandIcons';

export default function SalesTeamPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-primary-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-center mb-4">
              <ShopIcon size={64} />
            </div>
            <h1 className="text-4xl font-bold mb-2">Erik Lindberg</h1>
            <p className="text-xl text-white/80">Försäljningsansvarig</p>
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
          <h2 className="text-2xl font-bold text-primary-900 mb-4">Om Erik</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Erik ansvarar för alla försäljningsaktiviteter på GoalSquad. Med lång erfarenhet från B2B-försäljning och partnerskapsbyggande hjälper han både nya och befintliga partners att maximera sin potential på plattformen.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Hans fokus ligger på att bygga långsiktiga relationer med leverantörer och säkerställa att GoalSquad alltid har ett attraktivt produktutbud för föreningar.
          </p>
        </motion.div>

        {/* Responsibilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-primary-900 mb-6">Ansvarsområden</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <ShopIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Leverantörsrekrytering</h3>
              <p className="text-gray-600 text-sm">
                Identifierar och rekryterar nya kvalitetsleverantörer till plattformen
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <TrophyIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Partnerskapsutveckling</h3>
              <p className="text-gray-600 text-sm">
                Utvecklar och underhåller relationer med befintliga partners
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <ShopIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Företagsförsäljning</h3>
              <p className="text-gray-600 text-sm">
                Hjälper företag att nå nya marknader genom föreningar
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <TrophyIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Intäktsstrategi</h3>
              <p className="text-gray-600 text-sm">
                Utvecklar strategier för att maximera intäkter för alla parter
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
          <h2 className="text-2xl font-bold mb-4">Bli partner</h2>
          <p className="text-white/80 mb-6">
            Är ditt företag intresserat av att sälja via GoalSquad?
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
