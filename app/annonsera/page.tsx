'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { MoneyIcon, CalendarIcon, EyeIcon, ClickIcon, CheckIcon, XIcon, ShieldIcon } from '@/app/components/BrandIcons';

export default function AdvertisingPage() {
  const prohibitedCategories = [
    { name: 'Porr och vuxenmaterial', description: 'Allt innehåll av sexuell natur' },
    { name: 'Casino, betting och spelverksamhet', description: 'Inklusive affiliatesidor och bonuserbjudanden' },
    { name: 'Oetisk verksamhet', description: 'Snabblån, vapen, droger eller innehåll som strider mot svensk lag' },
  ];

  const pricingModels = [
    {
      type: 'CPM (Cost Per Mille)',
      description: 'Pris per 1 000 visningar. Idealiskt för varumärkesbyggande och synlighet.',
      icon: EyeIcon,
    },
    {
      type: 'CPC (Cost Per Click)',
      description: 'Pris per faktiskt klick. Idealiskt för att driva trafik direkt till er sida.',
      icon: ClickIcon,
    },
  ];

  const benefits = [
    'Engagerad målgrupp inom skola, sport och föreningsliv',
    'Rabatter för backlink-samarbeten',
    'Transparent prismodell',
    'Manuell granskningsprocess',
    'Trygg och etisk annonsmiljö',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-primary-900 to-primary-600 text-white py-20"
      >
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-5xl font-bold mb-4">Annonsera på Goalsquad.shop</h1>
          <p className="text-xl text-primary-100 max-w-3xl">
            Vill du nå en engagerad målgrupp inom skola, sport och föreningsliv? Goalsquad erbjuder attraktiva annonsplatser för företag och organisationer som delar våra värderingar om en aktiv, ekonomisk och meningsfull skolgång.
          </p>
          <div className="mt-8">
            <Link
              href="/ads/purchase"
              className="inline-block px-8 py-4 bg-white text-primary-900 rounded-lg font-semibold hover:bg-primary-50 transition"
            >
              Börja annonsera
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-6 py-16 space-y-20">
        {/* Pricing Models */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Prismodeller</h2>
          <p className="text-gray-600 mb-8">
            Vi erbjuder två huvudsakliga modeller för att passa era behov:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {pricingModels.map((model, index) => (
              <motion.div
                key={model.type}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-primary-300 transition"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <model.icon size={32} className="text-primary-900" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{model.type}</h3>
                </div>
                <p className="text-gray-600">{model.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Backlink Bonus */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-primary-50 rounded-xl p-8 border-2 border-primary-200"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Rabatter & SEO-samarbeten</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-primary-900 mb-2">Backlink-bonus</h3>
              <p className="text-gray-700 mb-4">
                Vi värdesätter långsiktiga digitala samarbeten.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckIcon size={20} className="text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Länka tillbaka:</strong> Vi erbjuder en rabatt på annonskostnaden om ni placerar en godkänd backlink till goalsquad.shop på er egen webbplats.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon size={20} className="text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Synergi:</strong> Vi ger även rabatt till samarbetspartners vars innehåll direkt främjar Goalsquads community och syfte.</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Prohibited Content */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-red-100 rounded-lg">
              <ShieldIcon size={32} className="text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Strikt Policy & Etiska Riktlinjer</h2>
          </div>
          <p className="text-gray-600 mb-8">
            För att bibehålla en trygg miljö tillämpar vi en nollvision mot oseriös annonsering. Vi accepterar INGEN annonsering inom följande kategorier:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {prohibitedCategories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-red-50 rounded-xl p-6 border-2 border-red-200"
              >
                <div className="flex items-start gap-3">
                  <XIcon size={24} className="text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-red-900 mb-2">{category.name}</h3>
                    <p className="text-sm text-red-700">{category.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Registration Requirements */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-xl p-8 border-2 border-gray-200"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Registreringskrav</h2>
          <p className="text-gray-700">
            Vid registrering som annonsör är det obligatoriskt att lämna en kort beskrivning av företaget. Detta hjälper oss att säkerställa att våra partners matchar vår profil.
          </p>
        </motion.section>

        {/* Rejection Policy */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-yellow-50 rounded-xl p-8 border-2 border-yellow-200"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Direkt avslag och Administrativ Avgift</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              Vi granskar både innehåll (Content) och mål-URL noggrant.
            </p>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 border-2 border-yellow-300">
                <h3 className="font-bold text-gray-900 mb-2">Automatiskt avslag</h3>
                <p className="text-sm">
                  Innehåll eller länkar som innehåller svartlistade termer kopplade till casino, porr eller spelverksamhet nekas omedelbart.
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border-2 border-yellow-300">
                <h3 className="font-bold text-gray-900 mb-2">Ekonomisk reglering</h3>
                <p className="text-sm">
                  Vid förskottsbetalning tas en administrativ avgift ut på 250 kr även om annonseringen nekas. Detta gäller specifikt när avslaget beror på att annonsen eller länken bryter mot våra tydliga regler (t.ex. försök att annonsera för spel eller vuxenmaterial). Resterande belopp av förskottsbetalningen återbetalas till annonsören.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Review Process */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Granskningsprocess</h2>
          <p className="text-gray-600 mb-6">
            Varje annons genomgår en manuell kontroll där vi validerar:
          </p>
          <ul className="space-y-3">
            {[
              'Att företagsbeskrivningen är sanningsenlig.',
              'Att mål-URL:en är säker och relevant.',
              'Att annonsens budskap följer Goalsquads etiska kompass.',
            ].map((item, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 text-gray-700"
              >
                <CheckIcon size={20} className="text-green-600 flex-shrink-0" />
                <span>{item}</span>
              </motion.li>
            ))}
          </ul>
        </motion.section>

        {/* Admin Note */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-blue-50 rounded-xl p-8 border-2 border-blue-200"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Till dig som administratör:</h2>
          <p className="text-gray-700">
            När du sätter upp backend-systemet för goalsquad.shop, se till att filtret för "Direkt avslag" även scannar landningssidan (URL:en) så att annonsörer inte försöker dölja oetiskt innehåll bakom en till synes neutral länk.
          </p>
        </motion.section>

        {/* Benefits */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Varför välja Goalsquad?</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 bg-white rounded-lg p-4 border-2 border-gray-200"
              >
                <CheckIcon size={20} className="text-green-600 flex-shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Redo att nå ut?</h2>
          <p className="text-gray-600 mb-8">
            Skapa din annons idag och börja nå din målgrupp.
          </p>
          <Link
            href="/ads/purchase"
            className="inline-block px-8 py-4 bg-primary-900 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
          >
            Börja annonsera nu
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
