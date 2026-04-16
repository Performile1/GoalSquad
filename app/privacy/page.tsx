'use client';

import { motion } from 'framer-motion';

const sections = [
  {
    title: '1. Vilka uppgifter vi samlar in',
    content: [
      'Namn och e-postadress vid registrering',
      'Leveransadress vid köp',
      'Betalningsinformation (hanteras av Stripe/Klarna — vi lagrar inga kortuppgifter)',
      'Försäljningsstatistik kopplad till ditt konto',
      'Teknisk information som IP-adress och webbläsartyp',
    ],
  },
  {
    title: '2. Hur vi använder uppgifterna',
    content: [
      'Hantera ditt konto och dina ordrar',
      'Skicka orderbekräftelser och leveransnotiser',
      'Beräkna och betala ut din försäljningsersättning',
      'Förbättra plattformens funktion och upplevelse',
      'Uppfylla lagstadgade krav (t.ex. bokföringslagen)',
    ],
  },
  {
    title: '3. Delning med tredje part',
    content: [
      'Betalningsleverantörer (Stripe, Klarna, Swish) — för betaltransaktioner',
      'Logistikpartners (DHL, Instabox m.fl.) — för leverans av ordrar',
      'Vi säljer aldrig dina uppgifter till tredje part för marknadsföring',
    ],
  },
  {
    title: '4. Dina rättigheter (GDPR)',
    content: [
      'Rätt att begära ut en kopia av dina uppgifter',
      'Rätt att korrigera felaktiga uppgifter',
      'Rätt att begära radering av ditt konto och uppgifter',
      'Rätt att invända mot viss behandling',
      'Kontakta oss på privacy@goalsquad.se för att utöva dina rättigheter',
    ],
  },
  {
    title: '5. Lagring och säkerhet',
    content: [
      'Dina uppgifter lagras på säkra servrar inom EU (Supabase/AWS)',
      'All kommunikation sker via HTTPS med 256-bit SSL-kryptering',
      'Vi genomför regelbundna säkerhetsgranskningar',
      'Uppgifter raderas automatiskt 36 månader efter senaste aktivitet',
    ],
  },
  {
    title: '6. Cookies',
    content: [
      'Nödvändiga cookies: krävs för att plattformen ska fungera',
      'Autentiseringscookies: håller dig inloggad',
      'Vi använder inga tredjepartscookies för spårning eller annonsering',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-900 to-primary-600 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl font-bold mb-4">Integritetspolicy</h1>
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
            GoalSquad AB (&quot;vi&quot;, &quot;oss&quot;) värnar om din integritet. Denna policy beskriver hur 
            vi samlar in, använder och skyddar dina personuppgifter när du använder vår 
            plattform på goalsquad.se. Vi följer Dataskyddsförordningen (GDPR).
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <h2 className="text-xl font-bold text-primary-900 mb-4 pb-2 border-b-2 border-primary-100">
                {section.title}
              </h2>
              <ul className="space-y-2">
                {section.content.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-900 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
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
          <h2 className="text-2xl font-bold mb-3">Frågor om integritet?</h2>
          <p className="text-white/70 mb-4">
            Kontakta vårt dataskyddsombud om du har frågor om hur vi hanterar dina uppgifter.
          </p>
          <a
            href="mailto:privacy@goalsquad.se"
            className="inline-block px-6 py-3 bg-white text-primary-900 rounded-xl font-bold hover:bg-primary-50 transition"
          >
            privacy@goalsquad.se
          </a>
        </motion.div>
      </div>
    </div>
  );
}
