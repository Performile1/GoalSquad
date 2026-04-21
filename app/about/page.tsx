'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrophyIcon, HandshakeIcon, RocketIcon, LeafIcon, CommunityIcon, LaptopIcon, MerchantIcon, TargetIcon, ShopIcon, LogisticsIcon } from '@/app/components/BrandIcons';

const values = [
  {
    icon: TrophyIcon,
    title: 'Föreningar i centrum',
    desc: 'Vi bygger plattformen för att föreningar, klubbar och klasser ska kunna finansiera sin verksamhet utan krångel.',
  },
  {
    icon: HandshakeIcon,
    title: 'Rättvis fördelning',
    desc: 'Varje krona som tjänas in delas transparent. Säljaren vet exakt vad de får och föreningen ser allt i realtid.',
  },
  {
    icon: RocketIcon,
    title: 'Enkelt att sälja',
    desc: 'Inga lager, ingen frakt, ingen hantering. Vi sköter allt logistik så att du kan fokusera på det viktiga.',
  },
  {
    icon: LeafIcon,
    title: 'Hållbart',
    desc: 'Vi väljer partners med omsorg. Kvalitetsprodukter från ansvarsfulla företag som delar våra värderingar.',
  },
];

const team = [
  { name: 'Rickard Andersson', role: 'VD & Grundare', icon: TrophyIcon, link: '/about/team/vd', image: 'bild 1' },
  { name: 'Erik Lindberg', role: 'Försäljningsansvarig', icon: ShopIcon, link: '/about/team/sales', image: 'bild 1' },
  { name: 'Lisa Svensson', role: 'Support', icon: TargetIcon, link: '/about/team/support', image: 'bild 2' },
  { name: 'Johan Karlsson', role: 'Föreningsansvarig', icon: CommunityIcon, link: '/about/team/community', image: 'bild 1' },
  { name: 'Maria Nilsson', role: 'Företagsförsäljning', icon: MerchantIcon, link: '/about/team/merchant', image: 'bild 2' },
  { name: 'Kenneth Lundgren', role: 'Lagerpartneransvarig', icon: LogisticsIcon, link: '/about/team/warehouse', image: 'bild 1' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-primary-900 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl font-bold mb-6">Om GoalSquad</h1>
            <p className="text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
              Vi är en Community Commerce-plattform som hjälper idrottsföreningar, 
              skolklasser och klubbar att finansiera sin verksamhet genom smart, 
              digital försäljning.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Mission */}
      <div className="max-w-4xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-primary-900 mb-6">Vårt uppdrag</h2>
          <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
            GoalSquad grundades med en enkel tanke: det ska vara enkelt för en fotbollsklubb, 
            en skolklass eller en idrottsförening att tjäna pengar till gemensamma aktiviteter — 
            utan lotterilappar, utan hantering och utan krångel.
          </p>
          <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto mt-4">
            Vi kopplar ihop engagerade säljare med kvalitetsprodukter från svenska och nordiska 
            leverantörer. Allt levereras direkt till kunden. Föreningen får sin andel. Enkelt.
          </p>
        </motion.div>

        {/* Values */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-primary-50 rounded-2xl p-8 border border-primary-100"
            >
              <v.icon size={40} />
              <h3 className="text-xl font-bold text-primary-900 mb-2">{v.title}</h3>
              <p className="text-gray-600">{v.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* What differentiates us */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-primary-50 to-green-50 rounded-2xl p-12 mb-20 border-2 border-primary-200"
        >
          <h2 className="text-3xl font-bold text-primary-900 mb-8 text-center">Det som skiljer oss från andra</h2>
          <p className="text-gray-600 mb-8 text-center max-w-3xl mx-auto">
            Till skillnad från traditionell klubb- och klassförsäljning där du är låst till en produkt, låter GoalSquad både säljare och slutkonsumenter välja fritt från flera olika produkter och leverantörer.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary-900 rounded-lg flex items-center justify-center mb-4">
                <ShopIcon size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Flera produkter, inga begränsningar</h3>
              <p className="text-gray-600">
                Säljare och kunder kan välja från hundratals produkter från olika leverantörer. Ingen låsning till en specifik produkt eller kategori.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary-900 rounded-lg flex items-center justify-center mb-4">
                <CommunityIcon size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">MOQ fördelas automatiskt</h3>
              <p className="text-gray-600">
                Minimum Order Quantity fördelas över flera klubbar, föreningar, klasser och slutkonsumenter. Ni behöver inte nå MOQ själva.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-primary-900 rounded-lg flex items-center justify-center mb-4">
                <TargetIcon size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Flexibel produktvy</h3>
              <p className="text-gray-600">
                Vårt dynamiska kortgränssnitt anpassar sig automatiskt – när det blir för många produkter på rad skapas en smidig slider för bättre överblick.
              </p>
            </div>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-primary-900 rounded-2xl p-12 text-white text-center mb-20"
        >
          <h2 className="text-3xl font-bold mb-4">Hur det fungerar</h2>
          <div className="grid md:grid-cols-3 gap-8 mt-8">
            {[
              { step: '1', title: 'Registrera föreningen', desc: 'Skapa ett gratis konto för din förening på några minuter.' },
              { step: '2', title: 'Välj produkter', desc: 'Välj bland hundratals produkter från våra leverantörspartners.' },
              { step: '3', title: 'Sälj & tjäna', desc: 'Dela länken med ditt nätverk och se intäkterna växa i realtid.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-white/70 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-primary-900 mb-10">Teamet bakom GoalSquad</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {team.map((member) => (
              <Link key={member.name} href={member.link} className="bg-white border-2 border-primary-100 rounded-2xl p-6 hover:border-primary-600 transition block">
                <div className="flex justify-center mb-3">
                  <div className="relative">
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #004040 0%, #006666 100%)' }}
                    >
                      <div className="absolute inset-0 bg-black/30 rounded-full" />
                      <member.icon size={32} />
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-primary-900 text-sm text-center">{member.name}</h3>
                <p className="text-gray-500 text-xs mt-1 text-center">{member.role}</p>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-primary-900 mb-4">Redo att börja?</h2>
          <p className="text-gray-600 mb-8">Registrera din förening idag — det är helt gratis att komma igång.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/join"
              className="px-8 py-4 bg-primary-900 text-white rounded-xl font-bold text-lg hover:bg-primary-700 transition"
            >
              Kom igång gratis
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 border-2 border-primary-900 text-primary-900 rounded-xl font-bold text-lg hover:bg-primary-50 transition"
            >
              Kontakta oss
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
