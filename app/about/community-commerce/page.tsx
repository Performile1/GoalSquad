export default function CommunityCommercePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Community Commerce</h1>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Vad är Community Commerce?</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Community Commerce är en ny modell för e-handel där community-medlemmar (föreningar, klasser, klubbar och deras medlemmar) deltar i försäljningsprocessen och delar på intäkterna.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Hur det fungerar</h2>
          <ul className="space-y-3 mb-6 text-gray-600">
            <li className="flex items-start gap-3">
              <span className="text-primary-900 font-bold">1.</span>
              <span>Föreningar, klasser och klubbar registrerar sig på GoalSquad</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary-900 font-bold">2.</span>
              <span>Medlemmar registrerar sig som säljare och kopplas till sin organisation</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary-900 font-bold">3.</span>
              <span>Säljare delar produkter via sina personliga länkar</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary-900 font-bold">4.</span>
              <span>Intäkter delas mellan säljare, organisation och GoalSquad</span>
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Fördelar</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-primary-50 rounded-xl p-4">
              <h3 className="font-bold text-primary-900 mb-2">För föreningar</h3>
              <p className="text-sm text-primary-700">Ny intäktskälla utan lager eller logistik</p>
            </div>
            <div className="bg-primary-50 rounded-xl p-4">
              <h3 className="font-bold text-primary-900 mb-2">För säljare</h3>
              <p className="text-sm text-primary-700">Tjäna pengar genom att dela produkter du gillar</p>
            </div>
            <div className="bg-primary-50 rounded-xl p-4">
              <h3 className="font-bold text-primary-900 mb-2">För kunder</h3>
              <p className="text-sm text-primary-700">Stöd din community när du handlar</p>
            </div>
            <div className="bg-primary-50 rounded-xl p-4">
              <h3 className="font-bold text-primary-900 mb-2">För företag</h3>
              <p className="text-sm text-primary-700">Nå nya kunder genom communities</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Intäktsdelning</h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            När en försäljning görs via en säljares länk delas intäkterna på följande sätt:
          </p>
          <ul className="space-y-2 text-gray-600 mb-6">
            <li>• Organisationen (klubb/förening/klass) väljer om säljaren får provision</li>
            <li>• Säljaren kan välja om de vill dela med sig av sin provision till förening/klass/klubb</li>
            <li>• Säljaren kan vara en medlem/elev/förälder eller supporter</li>
            <li>• GoalSquad tar en del för plattformen och logistik</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
