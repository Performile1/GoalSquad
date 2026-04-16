'use client';

import { motion } from 'framer-motion';

const sections = [
  {
    title: '1. Tjänstebeskrivning',
    content: `GoalSquad är en Community Commerce-plattform där föreningar, 
    klubbar och klasser kan bedriva digital försäljning av produkter från 
    anslutna leverantörer. Plattformen förmedlar kontakten mellan säljare 
    (förening/individ), leverantör och kund.`,
  },
  {
    title: '2. Konto och registrering',
    content: `För att använda plattformens funktioner krävs ett registrerat konto. 
    Du ansvarar för att de uppgifter du lämnar är korrekta och för att hålla 
    ditt lösenord hemligt. GoalSquad förbehåller sig rätten att stänga konton 
    som bryter mot dessa villkor.`,
  },
  {
    title: '3. Försäljning och intäkter',
    content: `Säljare (föreningar och individer) erhåller en förutbestämd andel 
    av försäljningspriset per såld produkt. Exakt marginal visas alltid tydligt 
    innan du väljer att sälja en produkt. Utbetalning sker månadsvis till 
    registrerat bankkonto eller organisation.`,
  },
  {
    title: '4. Produkter och kvalitet',
    content: `Alla produkter på plattformen har genomgått en granskning av 
    GoalSquad och leverantören ansvarar för produktens kvalitet, korrekt 
    beskrivning och lagerhållning. GoalSquad agerar förmedlare och ansvarar 
    inte för produktfel men hjälper till att lösa eventuella reklamationer.`,
  },
  {
    title: '5. Leverans och retur',
    content: `Leverans sker direkt från leverantör till slutkund via våra 
    logistikpartners (DHL, Instabox m.fl.). Leveranstiden framgår på 
    produktsidan. Kunden har 14 dagars ångerrätt enligt Distansavtalslagen. 
    Returer hanteras via GoalSquads kundtjänst.`,
  },
  {
    title: '6. Betalning',
    content: `Betalning sker via Stripe, Klarna eller Swish. Alla 
    betaltransaktioner är krypterade. GoalSquad lagrar inga kortuppgifter. 
    Priserna på plattformen anges inklusive moms.`,
  },
  {
    title: '7. Förbjuden användning',
    content: `Det är förbjudet att: använda plattformen för olaglig verksamhet, 
    manipulera försäljningsstatistik, skapa falska konton, sprida skadlig 
    programvara, eller på annat sätt skada plattformen eller andra användare. 
    Överträdelser leder till omedelbar avstängning.`,
  },
  {
    title: '8. Ansvarsbegränsning',
    content: `GoalSquad ansvarar inte för indirekta skador eller förluster 
    till följd av användning av plattformen. Vår ansvarsbegränsning gäller 
    i den utsträckning lagen tillåter. Vi arbetar kontinuerligt för att 
    plattformen ska vara tillgänglig dygnet runt men garanterar ej 100% drifttid.`,
  },
  {
    title: '9. Ändringar i villkoren',
    content: `GoalSquad kan uppdatera dessa villkor. Vid väsentliga ändringar 
    meddelas registrerade användare via e-post minst 30 dagar i förväg. 
    Fortsatt användning av plattformen efter ikraftträdandedatum innebär 
    att du accepterar de nya villkoren.`,
  },
  {
    title: '10. Tillämplig lag',
    content: `Dessa villkor regleras av svensk rätt. Tvister ska i första 
    hand lösas genom dialog med GoalSquads kundtjänst. I andra hand gäller 
    Allmänna reklamationsnämnden (ARN) eller svensk domstol.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-900 to-primary-600 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl font-bold mb-4">Användarvillkor</h1>
            <p className="text-white/70 text-sm">Senast uppdaterad: januari 2025</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-primary-50 border-2 border-primary-200 rounded-2xl p-8 mb-12"
        >
          <p className="text-primary-900 leading-relaxed">
            Välkommen till GoalSquad. Genom att använda vår plattform godkänner du dessa 
            användarvillkor. Läs igenom dem noggrant. Om du inte accepterar villkoren 
            får du inte använda plattformen.
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              className="border-b border-gray-100 pb-8 last:border-0"
            >
              <h2 className="text-xl font-bold text-primary-900 mb-3">{section.title}</h2>
              <p className="text-gray-700 leading-relaxed">{section.content}</p>
            </motion.div>
          ))}
        </div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 bg-primary-900 text-white rounded-2xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold mb-3">Frågor om villkoren?</h2>
          <p className="text-white/70 mb-4">
            Kontakta oss om du har frågor om dessa användarvillkor.
          </p>
          <a
            href="mailto:legal@goalsquad.se"
            className="inline-block px-6 py-3 bg-white text-primary-900 rounded-xl font-bold hover:bg-primary-50 transition"
          >
            legal@goalsquad.se
          </a>
        </motion.div>
      </div>
    </div>
  );
}
