import Link from 'next/link';

export default function SellerCommunityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Säljare Community</h1>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Var med i vårt community</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Som säljare hos GoalSquad är du del av ett större community som hjälper föreningar, klasser och klubbar att finansiera sina aktiviteter.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-primary-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-primary-900 mb-2">Nätverk med andra säljare</h3>
              <p className="text-sm text-primary-700">
                Lär av andra säljares erfarenheter och dela dina bästa tips.
              </p>
            </div>
            <div className="bg-primary-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-primary-900 mb-2">Stöd din organisation</h3>
              <p className="text-sm text-primary-700">
                Hjälp din förening eller klubb att nå sina ekonomiska mål.
              </p>
            </div>
            <div className="bg-primary-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-primary-900 mb-2">Tjäna pengar</h3>
              <p className="text-sm text-primary-700">
                Tjäna provision på varje försäljning du gör.
              </p>
            </div>
            <div className="bg-primary-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-primary-900 mb-2">Var flexibel</h3>
              <p className="text-sm text-primary-700">
                Sälj när det passar dig - helt på dina egna villkor.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Kom igång idag</h3>
            <p className="text-gray-600 mb-6">
              Redo att bli del av vårt community? Registrera dig som säljare och börja sälja.
            </p>
            <div className="flex gap-4">
              <Link
                href="/sellers/join"
                className="inline-block bg-primary-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-600 transition"
              >
                Registrera dig
              </Link>
              <Link
                href="/sellers/get-started"
                className="inline-block border-2 border-primary-900 text-primary-900 px-6 py-3 rounded-xl font-bold hover:bg-primary-50 transition"
              >
                Läs mer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
