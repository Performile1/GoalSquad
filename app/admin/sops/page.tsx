'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardIcon, DocumentIcon, CheckIcon } from '@/app/components/BrandIcons';

interface SOP {
  id: string;
  entityType: 'company' | 'community' | 'club' | 'class' | 'warehouse';
  title: string;
  version: string;
  lastUpdated: string;
  content: string;
  sla: string;
}

const sops: SOP[] = [
  {
    id: '1',
    entityType: 'company',
    title: 'Företags SOP - Produkthantering',
    version: '1.0',
    lastUpdated: '2026-04-17',
    content: `
# Produkthantering för företag

## Produktregistrering
- Alla produkter måste godkännas av GoalSquad innan publicering
- Produktbilder måste vara av hög kvalitet och visa produkten tydligt
- Produktbeskrivningar måste vara korrekta och inte vilseledande

## Lagerhantering
- Företaget ansvarar för att lagerstatus alltid är uppdaterad
- Vid lagerbrist måste produkten markeras som "Ej i lager" inom 24 timmar
- Returer ska hanteras inom 7 arbetsdagar

## Leverans
- Leveranstid får inte överstiga angiven tid med mer än 2 dagar
- Spårningsnummer ska skickas till kunden vid leverans
- Skadade varor ska ersättas eller återbetalas inom 14 dagar

## Kundtjänst
- Svarstid på kundfrågor: max 24 timmar
- Returhantering: max 7 dagar
    `,
    sla: `
# Service Level Agreement (SLA) för företag

## Tillgänglighet
- Plattformen ska vara tillgänglig 99.5% av tiden
- Underhåll meddelas 48 timmar i förväg

## Prestanda
- Svarstid för produktlistningar: < 2 sekunder
- Orderbekräftelse ska skickas inom 5 minuter

## Support
- Supporttickets svaras inom 24 timmar
- Kritiska fel åtgärdas inom 4 timmar
    `
  },
  {
    id: '2',
    entityType: 'community',
    title: 'Förenings SOP - Medlemshantering',
    version: '1.0',
    lastUpdated: '2026-04-17',
    content: `
# Medlemshantering för föreningar

## Registrering
- Alla nya medlemmar måste verifieras
- Föräldragodkännande krävs för säljare under 18 år
- Medlemmar kan endast tillhöra en förening

## Säljare
- Säljare måste vara godkända av föreningens administratör
- Föräldrar kan begränsa sina barns säljaktivitet
- Säljare måste följa GoalSquads uppförandekod

## Rapportering
- Föreningar kan rapportera inaktiva företag
- Rapporter ska vara välgrundade och ha bevis
- Falska rapporter kan leda till avstängning

## Utbetalningar
- Utbetalningar sker varje måndag
- Minsta utbetalningsbelopp: 100 kr
- Utbetalningstid: 1-3 arbetsdagar
    `,
    sla: `
# Service Level Agreement (SLA) för föreningar

## Medlemsaktivitet
- Medlemmar kan logga in 24/7
- Dashboard uppdateras i realtid

## Utbetalningar
- Utbetalningar behandlas måndagar kl 09:00
- Pengarna når kontot inom 1-3 arbetsdagar

## Support
- Support för föreningar svaras inom 12 timmar
- Kritiska ärenden åtgärdas inom 4 timmar
    `
  },
  {
    id: '3',
    entityType: 'club',
    title: 'Klubb SOP - Aktivitetshantering',
    version: '1.0',
    lastUpdated: '2026-04-17',
    content: `
# Aktivitetshantering för klubbar

## Säljaktivitet
- Säljare måste uppdatera sin aktivitet veckovis
- Inaktivitet i mer än 30 dagar kan leda till avstängning
- Klubben kan sätta aktivitetskrav för sina säljare

## Föräldrar
- Föräldrar kan se sina barns säljstatistik
- Föräldrar kan begränsa säljaktivitet
- Föräldrar kan ta bort sina barn från klubben

## Event
- Klubbar kan organisera säljevent
- Event måste godkännas av GoalSquad
- Event kan inkludera tävlingar och bonusar

## Kommunikation
- Klubben kan skicka meddelanden till alla medlemmar
- Medlemmar kan svara direkt i chatten
- All kommunikation sparas
    `,
    sla: `
# Service Level Agreement (SLA) för klubbar

## Plattform
- Tillgänglighet: 99.5%
- Dashboard uppdateras i realtid

## Kommunikation
- Meddelanden levereras direkt
- Chat-historik sparas i 90 dagar

## Support
- Support svaras inom 12 timmar
- Akuta ärenden prioriteras
    `
  },
  {
    id: '4',
    entityType: 'class',
    title: 'Klass SOP - Lärarhantering',
    version: '1.0',
    lastUpdated: '2026-04-17',
    content: `
# Lärarhantering för klasser

## Lärarroll
- Lärare kan se elevernas säljstatistik
- Lärare kan sätta upp säljmål för klassen
- Lärare kan organisera klassvise tävlingar

## Föräldrar
- Föräldrar kan se sina barns aktivitet
- Föräldrar kan kontakta läraren
- Föräldrar kan begränsa aktivitet

## Elevskydd
- Ingen personlig information delas utanför klassen
- Föräldragodkännande krävs för all aktivitet
- Lärare kan blockera oönskad kontakt

## Utbildning
- GoalSquad erbjuder utbildningsmaterial
- Lärare kan använda detta i undervisningen
- Material uppdateras regelbundet
    `,
    sla: `
# Service Level Agreement (SLA) för klasser

## Tillgänglighet
- Plattformen är tillgänglig 24/7
- Dashboard uppdateras i realtid

## Support
- Lärarsupport svaras inom 8 arbetsdagar
- Akuta ärenden åtgärdas inom 4 timmar

## Integritet
- All data krypteras
- Data raderas på begäran
    `
  },
  {
    id: '5',
    entityType: 'warehouse',
    title: 'Lagerpartner SOP - Orderhantering',
    version: '1.0',
    lastUpdated: '2026-04-17',
    content: `
# Orderhantering för lagerpartner

## Ordermottagning
- Order ska bekräftas inom 2 timmar
- Lagerstatus ska uppdateras i realtid
- Bristande produkter ska rapporteras omedelbart

## Konsolidering
- Paller ska konsolideras effektivt
- Splitting ska dokumenteras
- Spårbarhet ska upprätthållas genom hela kedjan

## Leverans
- Leverans ska ske inom angiven tid
- Spårningsnummer ska delas med mottagare
- Skadade leveranser ska rapporteras

## Kvalitet
- Lager ska hållas rent och organiserat
- Temperatur och luftfuktighet ska övervakas
- Lagersystem ska uppdateras dagligen

## Rapportering
- Aktivitet ska rapporteras veckovis
- Inaktivitet rapporteras till GoalSquad
- Prestandamätningar delas månatligen
    `,
    sla: `
# Service Level Agreement (SLA) för lagerpartner

## Orderhantering
- Orderbekräftelse: < 2 timmar
- Leverans: inom angiven tid
- Returhantering: < 7 dagar

## Tillgänglighet
- Lagerpersonal ska vara tillgängliga 8-17
- Akuta ärenden ska hanteras 24/7

## Kvalitet
- Leveransnoggrannhet: > 99%
- Skadade leveranser: < 0.5%
- Kundnöjdhet: > 4.5/5

## Support
- Support svaras inom 4 timmar
- Kritiska fel åtgärdas inom 2 timmar
    `
  }
];

export default function SOPsPage() {
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const filteredSOPs = filter === 'all' 
    ? sops 
    : sops.filter(sop => sop.entityType === filter);

  const entityTypeLabels: Record<string, string> = {
    company: 'Företag',
    community: 'Förening',
    club: 'Klubb',
    class: 'Klass',
    warehouse: 'Lagerpartner',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SOPs och SLAs</h1>
          <p className="text-gray-600">Standard Operating Procedures och Service Level Agreements för alla entitetstyper</p>
        </motion.div>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                filter === 'all'
                  ? 'bg-primary-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alla
            </button>
            {Object.entries(entityTypeLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-6 py-3 rounded-xl font-semibold transition ${
                  filter === key
                    ? 'bg-primary-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* SOP List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SOP Cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-4"
          >
            {filteredSOPs.map((sop, index) => (
              <motion.div
                key={sop.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedSOP(sop)}
                className={`bg-white rounded-2xl shadow-lg p-6 cursor-pointer border-2 transition ${
                  selectedSOP?.id === sop.id
                    ? 'border-primary-600'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary-100 rounded-lg p-3">
                    <DocumentIcon size={24} className="text-primary-900" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{sop.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {entityTypeLabels[sop.entityType]}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>v{ sop.version}</span>
                      <span>•</span>
                      <span>{sop.lastUpdated}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* SOP Detail */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            {selectedSOP ? (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedSOP.title}</h2>
                    <p className="text-gray-600">{entityTypeLabels[selectedSOP.entityType]}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                      <span>v{selectedSOP.version}</span>
                      <span>•</span>
                      <span>Uppdaterad: {selectedSOP.lastUpdated}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <DocumentIcon size={20} className="text-primary-900" />
                      Standard Operating Procedure (SOP)
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-6 prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                        {selectedSOP.content.trim()}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <DashboardIcon size={20} className="text-primary-900" />
                      Service Level Agreement (SLA)
                    </h3>
                    <div className="bg-primary-50 rounded-xl p-6 prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                        {selectedSOP.sla.trim()}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <DocumentIcon size={64} className="text-gray-300 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-900 mb-2">Välj en SOP</p>
                <p className="text-gray-600">Klicka på en SOP i listan för att visa detaljer</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
