'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogisticsIcon, ShopIcon, DashboardIcon } from '@/app/components/BrandIcons';

export default function WarehouseTeamPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-primary-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-center mb-4">
              <LogisticsIcon size={64} />
            </div>
            <h1 className="text-4xl font-bold mb-2">Kenneth Lundgren</h1>
            <p className="text-xl text-white/80">Lagerpartneransvarig</p>
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
          <h2 className="text-2xl font-bold text-primary-900 mb-4">Om Kenneth</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Kenneth ansvarar för alla lagerpartnerskap på GoalSquad. Med lång erfarenhet från logistikbranschen hjälper han företag att bli en del av vårt distribuerade logistiknätverk.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Hans fokus ligger på att bygga relationer med lagerpartners och säkerställa att GoalSquad har rätt kapacitet på rätt platser för optimal leverans.
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
              <ShopIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Partnerskap</h3>
              <p className="text-gray-600 text-sm">
                Bygger och underhåller relationer med lagerpartners i hela Norden
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <LogisticsIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Kapacitetsplanering</h3>
              <p className="text-gray-600 text-sm">
                Säkerställer rätt lagerkapacitet på rätt platser för optimal leverans
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <DashboardIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Integrering</h3>
              <p className="text-gray-600 text-sm">
                Säkerställer smidig integration mellan lagerpartners och GoalSquad-plattformen
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <ShopIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Kvalitetssäkring</h3>
              <p className="text-gray-600 text-sm">
                Ser till att alla lagerpartners uppfyller GoalSquarts kvalitetskrav
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
          <h2 className="text-2xl font-bold mb-4">Bli lagerpartner</h2>
          <p className="text-white/80 mb-6">
            Är ditt företag intresserat av att bli lagerpartner för GoalSquad?
          </p>
          <Link
            href="/warehouses/onboard"
            className="inline-block px-8 py-3 bg-white text-primary-900 rounded-xl font-bold hover:bg-primary-50 transition"
          >
            Ansök som lagerpartner
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
