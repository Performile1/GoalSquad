'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrophyIcon, ShopIcon, LogisticsIcon, UserIcon, CommunityIcon, MerchantIcon } from '@/app/components/BrandIcons';

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-900 to-primary-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-center mb-4">
              <CommunityIcon size={64} />
            </div>
            <h1 className="text-5xl font-bold mb-4">Hur GoalSquad fungerar</h1>
            <p className="text-xl text-white/80">
              Ett nytt sätt att finansiera föreningar och klasser
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary-900 hover:text-primary-700 font-semibold mb-8 transition"
        >
          ← Tillbaka till startsidan
        </Link>

        {/* Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-50 rounded-2xl p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-primary-900 mb-4">Det unika upplägget</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Till skillnad från traditionell klubb- och klassförsäljning där du är låst till en specifik produkt, låter GoalSquad både föreningar och slutkonsumenter välja fritt från hundratals produkter från olika leverantörer.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Våra lagerpartners konsoliderar sedan hela ordern och levererar antingen till föreningen, ansvarig person, eller direkt till slutkonsumenten - beroende på vad som passar bäst.
          </p>
        </motion.div>

        {/* How it works for associations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-primary-900 mb-6">För föreningar och klasser</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary-900 text-white flex items-center justify-center font-bold text-lg">
                  1
                </div>
              </div>
              <div>
                <h3 className="font-bold text-primary-900 mb-2">Välj produkter</h3>
                <p className="text-gray-600">
                  Din förening eller klass väljer vilka produkter ni vill sälja från vårt utbud av leverantörspartners. Inga förskottskostnader - ni börjar sälja direkt.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary-900 text-white flex items-center justify-center font-bold text-lg">
                  2
                </div>
              </div>
              <div>
                <h3 className="font-bold text-primary-900 mb-2">Dela säljlänk</h3>
                <p className="text-gray-600">
                  Varje säljare får en unik länk som de delar med lagkamrater, familj och vänner. Allt spåras i realtid i ert dashboard.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary-900 text-white flex items-center justify-center font-bold text-lg">
                  3
                </div>
              </div>
              <div>
                <h3 className="font-bold text-primary-900 mb-2">Intäkt i realtid</h3>
                <p className="text-gray-600">
                  Ni ser varje försäljning i realtid och intäkterna fördelas automatiskt. Pengarna betalas ut månadsvis.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* How it works for end consumers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-primary-900 mb-6">För slutkonsumenter</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary-900 text-white flex items-center justify-center font-bold text-lg">
                  1
                </div>
              </div>
              <div>
                <h3 className="font-bold text-primary-900 mb-2">Välj fritt</h3>
                <p className="text-gray-600">
                  Du kan köpa från flera olika produkter och leverantörer i samma beställning. Ingen låsning till en specifik produkt eller kategori.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary-900 text-white flex items-center justify-center font-bold text-lg">
                  2
                </div>
              </div>
              <div>
                <h3 className="font-bold text-primary-900 mb-2">Stöd din förening</h3>
                <p className="text-gray-600">
                  När du köper via en säljares länk, stöder du automatiskt deras förening eller klass.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary-900 text-white flex items-center justify-center font-bold text-lg">
                  3
                </div>
              </div>
              <div>
                <h3 className="font-bold text-primary-900 mb-2">Smidig leverans</h3>
                <p className="text-gray-600">
                  Våra lagerpartners konsoliderar hela din order och levererar antingen till dig direkt eller till den ansvariga personen för upphämtning.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Warehouse partner consolidation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-primary-900 mb-6">Lagerpartnerkonsolidering</h2>
          <div className="bg-white border-2 border-primary-200 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <LogisticsIcon size={48} />
              <div>
                <h3 className="font-bold text-primary-900 text-lg mb-2">Hur det fungerar</h3>
                <p className="text-gray-600">
                  När en slutkonsument köper från flera olika produkter och leverantörer, konsoliderar våra lagerpartners hela ordern till en samlad leverans.
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-primary-50 rounded-xl p-4">
                <div className="font-bold text-primary-900 mb-1">Till förening</div>
                <p className="text-sm text-gray-600">Leverans till föreningen för distribution</p>
              </div>
              <div className="bg-primary-50 rounded-xl p-4">
                <div className="font-bold text-primary-900 mb-1">Till ansvarig</div>
                <p className="text-sm text-gray-600">Leverans till kontaktperson för upphämtning</p>
              </div>
              <div className="bg-primary-50 rounded-xl p-4">
                <div className="font-bold text-primary-900 mb-1">Direkt till kund</div>
                <p className="text-sm text-gray-600">Leverans direkt till slutkonsumentens adress</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-primary-900 mb-6">Fördelar med GoalSquad</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-primary-200 rounded-xl p-6">
              <ShopIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Flera produkter</h3>
              <p className="text-gray-600 text-sm">
                Föreningar och kunder kan välja från hundratals produkter från olika leverantörer. Ingen låsning.
              </p>
            </div>
            <div className="bg-white border-2 border-primary-200 rounded-xl p-6">
              <TrophyIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">MOQ fördelas</h3>
              <p className="text-gray-600 text-sm">
                Minimum Order Quantity fördelas automatiskt över flera klubbar, föreningar och slutkonsumenter.
              </p>
            </div>
            <div className="bg-white border-2 border-primary-200 rounded-xl p-6">
              <LogisticsIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Konsoliderad leverans</h3>
              <p className="text-gray-600 text-sm">
                Lagerpartners konsoliderar order för optimal leverans och minskad fraktkostnad.
              </p>
            </div>
            <div className="bg-white border-2 border-primary-200 rounded-xl p-6">
              <UserIcon size={32} />
              <h3 className="font-bold text-primary-900 mt-3 mb-2">Automatisk intäktsdelning</h3>
              <p className="text-gray-600 text-sm">
                Transparent redovisning i realtid. Ni ser exakt hur mycket ni tjänar på varje försäljning.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-primary-900 rounded-2xl p-8 text-white text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Redo att börja?</h2>
          <p className="text-white/80 mb-6">
            Registrera din förening, klass eller ditt företag idag. Det är gratis att komma igång.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/join/community"
              className="px-8 py-3 bg-white text-primary-900 rounded-xl font-bold hover:bg-primary-50 transition"
            >
              Registrera förening
            </Link>
            <Link
              href="/merchants/onboard"
              className="px-8 py-3 border-2 border-white text-white rounded-xl font-bold hover:bg-white/10 transition"
            >
              Bli leverantör
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
