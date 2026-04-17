import Link from 'next/link';

export default function SellerGetStartedPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Kom igång som säljare</h1>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dina första steg</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Här är en steg-för-steg guide för att komma igång som säljare hos GoalSquad.
          </p>

          <div className="space-y-8">
            <div className="border-l-4 border-primary-900 pl-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">1. Registrera dig</h3>
              <p className="text-gray-600 mb-4">
                Skapa ett konto och fyll i din information. Du behöver namn, e-post och telefonnummer.
              </p>
              <Link href="/sellers/join" className="text-primary-900 font-semibold hover:text-primary-600">
                Registrera dig →
              </Link>
            </div>

            <div className="border-l-4 border-primary-900 pl-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">2. Koppla dig till en organisation</h3>
              <p className="text-gray-600 mb-4">
                Använd inbjudningskoden från din förening, klass eller klubb för att koppla dig till organisationen.
                Om du inte har en kod kan du kontakta din organisation för att få en.
              </p>
            </div>

            <div className="border-l-4 border-primary-900 pl-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">3. Välj provision-delning</h3>
              <p className="text-gray-600 mb-4">
                Välj om du vill dela en del av din provision med organisationen. Detta hjälper din förening eller klubb att finansiera sina aktiviteter.
              </p>
            </div>

            <div className="border-l-4 border-primary-900 pl-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">4. Få din personliga länk</h3>
              <p className="text-gray-600 mb-4">
                Efter registrering får du en personlig länk som du kan dela med vänner, familj och på sociala medier.
              </p>
            </div>

            <div className="border-l-4 border-primary-900 pl-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">5. Börja sälja</h3>
              <p className="text-gray-600 mb-4">
                Dela produkter från din organisation via din länk. När någon köper via din länk tjänar du provision.
              </p>
            </div>

            <div className="border-l-4 border-primary-900 pl-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">6. Följ dina intäkter</h3>
              <p className="text-gray-600 mb-4">
                Logga in på ditt dashboard för att se dina försäljningar, intäkter och statistik.
              </p>
              <Link href="/sellers/dashboard" className="text-primary-900 font-semibold hover:text-primary-600">
                Gå till dashboard →
              </Link>
            </div>
          </div>

          <div className="mt-12 bg-primary-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-primary-900 mb-2">Behöver du hjälp?</h3>
            <p className="text-primary-700 mb-4">
              Kontakta din organisation om du har frågor om inbjudningskoder eller specifika regler för din förening eller klubb.
            </p>
            <Link href="/contact" className="text-primary-900 font-semibold hover:text-primary-600">
              Kontakta GoalSquad →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
