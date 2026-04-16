'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MerchantIcon, ShopIcon, LogisticsIcon } from '@/app/components/BrandIcons';

export default function MerchantTeamPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-primary-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-center mb-4">
              <MerchantIcon size={64} />
            </div>
            <h1 className="text-4xl font-bold mb-4">Merchant Relations</h1>
            <p className="text-xl text-white/80">
              Vi bygger partnerskap med leverantörer för kvalitetsprodukter
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
            Vi arbetar med svenska och nordiska leverantörer för att erbjuda föreningar högkvalitativa produkter till bra priser. Genom att bygga långsiktiga partnerskap säkerställer vi att våra leverantörer delar våra värderingar kring kvalitet, hållbarhet och rättvis handel.
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
              <ShopIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Partnerskap</h3>
              <p className="text-gray-600 text-sm">
                Bygger och underhåller relationer med leverantörspartners
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <MerchantIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Produkturval</h3>
              <p className="text-gray-600 text-sm">
                Kuraterar produkter som passar föreningars försäljningsbehov
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <LogisticsIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Logistik</h3>
              <p className="text-gray-600 text-sm">
                Säkerställer smidig leverans och lagerhantering för alla produkter
              </p>
            </div>
            <div className="border-2 border-primary-200 rounded-xl p-6">
              <ShopIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Prissättning</h3>
              <p className="text-gray-600 text-sm">
                Förhandlar fram bra priser och villkor för föreningar
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
          <h2 className="text-2xl font-bold mb-4">Bli leverantör</h2>
          <p className="text-white/80 mb-6">
            Är du intresserad av att sälja dina produkter via GoalSquad?
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
