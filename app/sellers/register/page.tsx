import Link from 'next/link';

export default function SellerRegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Registrera dig som säljare</h1>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Bli en säljare hos GoalSquad</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Som säljare hos GoalSquad kan du tjäna pengar genom att dela produkter från din förening, klass eller klubb. 
            Det är enkelt att komma igång och du väljer själv hur mycket du vill sälja.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-4">Så här fungerar det</h3>
          <ol className="space-y-4 mb-8 text-gray-600">
            <li className="flex items-start gap-3">
              <span className="bg-primary-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
              <span>Registrera dig som säljare med din information</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
              <span>Koppla dig till din förening, klass eller klubb med inbjudningskod</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
              <span>Välj om du vill dela din provision med organisationen</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
              <span>Börja dela produkter via din personliga länk</span>
            </li>
          </ol>

          <div className="bg-primary-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-primary-900 mb-2">Vem kan bli säljare?</h3>
            <ul className="space-y-2 text-primary-700">
              <li>• Medlemmar i föreningar och klubbar</li>
              <li>• Elever i skolklasser</li>
              <li>• Föräldrar som vill stödja sina barns aktiviteter</li>
              <li>• Supporters som vill hjälpa en organisation</li>
            </ul>
          </div>

          <Link
            href="/sellers/join"
            className="inline-block bg-primary-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-600 transition text-center"
          >
            Registrera dig nu
          </Link>
        </div>
      </div>
    </div>
  );
}
