# GoalSquad — Kritisk Kodbasanalys

> Dokument skapat: 2026-06-08  
> Syfte: strukturerad genomgång av kodbasen för teamreview och prioritering av teknisk skuld.

---

## 1. Projektöversikt

| | |
|---|---|
| **Ramverk** | Next.js 14 (App Router), React, TypeScript |
| **Styling** | Tailwind CSS |
| **Backend** | Next.js API Routes + Supabase (Postgres + Auth + Realtime) |
| **Betalningar** | Stripe (Connect + Webhooks) |
| **Deployment** | Vercel |
| **Tillstånd** | ~192 legacy TS-fel dolda via `ignoreBuildErrors: true` |

---

## 2. Routing & Sidstruktur

### 2.1 Sidantal
Kodbasen innehåller **~90+ frontend-sidor** under `app/`. Exempel:

- `/` — Landing
- `/marketplace`, `/products`, `/search` — Köparflöde
- `/sellers/*` — Säljardashboard, registrering, orders, produkter, avatars
- `/merchants/*` — Handlardashboard, produkter, inställningar
- `/warehouses/*` — Lagerhantering, terminal, plocklistor
- `/admin/*` — Adminpanel, unified-dashboard, analytics
- `/campaign/[campaignId]` — Kampanjdetaljvy (ny)
- `/pickup/[orderId]` — QR-hämtning
- `/cart`, `/checkout`, `/orders` — Kundvagn & betalning
- `/messages`, `/leaderboard`, `/tracking` — Community-funktioner

### 2.2 Routingproblematik

| Problem | Konsekvens | Åtgärd |
|---------|-----------|--------|
| **Middleware (`middleware.ts`) redirectar `/dashboard` till `/auth/login`**, men `/auth/login` existerar inte — den existerande login-sidan är `/login`. | Oändliga redirect-loopar eller 404 för alla skyddade rutter. | Korrigera redirect till `/login` och lägg till fler skyddade prefixes. |
| **Dubbla säljardashboards**: `/sellers/dashboard` och `/sellers/[id]/dashboard` | Två oberoende implementationer — risk för divergens. | Slå ihop eller tydliggör skillnaden (egen vs. publik). |
| **Dubbla merchant-dashboards**: `/merchants/[id]/dashboard` och `/merchant/settings/branding` | Inkonsistent prefix (`merchants` vs `merchant`). | Normalisera till ett prefix. |
| **Campaign-routing mismatch**: Frontend länkar till `/campaign/[id]`, men API ligger under `/api/campaigns/[id]`. | Inkonsekvent singular/plural. | Normalisera till `/campaigns/[id]` både för frontend och API. |
| **Ingen 404-hantering för saknade dynamiska rutter** | Next.js fallback kan exponera oväntade fel. | Lägg till `not-found.tsx` i varje betydande dynamisk segment. |

---

## 3. API-struktur

### 3.1 Route-antal
**~85+ API-rutter** under `app/api/`. Spridda över:

- `auth/*` — Rollkontroll, profil
- `sellers/*` — Stats, orders, XP, avatar, quests, loot-boxes
- `merchants/*` — Bulk-produkter, ASN, streckkoder, MOQ-regler
- `warehouses/*` — Plockning, terminal, kö, avvikelser
- `admin/*` — Stats, sellers, orders, analytics
- `stripe/*` — Betalning, utbetalning, webhooks
- `checkout/*`, `cart/*`, `orders/*` — Köpflöde
- `campaigns/*`, `communities/*` — Kampanjer & communities
- `search/*`, `analytics/*`, `tracking/*` — Stödfunktioner

### 3.2 API-kritiska problem

| Problem | Allvarlighet | Beskrivning |
|---------|-------------|-------------|
| **Inkonsistent autentisering** | 🔴 Hög | Vissa routes använder `getAuthUser(req)`, andra `requireUser()`, andra saknar auth helt. Ena kräver header-baserad JWT, andra cookie-baserad session. |
| **`supabaseAdmin` används i ~90% av routes** | 🟡 Medium | Service-role key = RLS disabled. Bara enstaka routes använder `createClient(cookieStore)` för RLS-säkerhet. Fel i auth = dataexponering. |
| **`dynamic = 'force-dynamic'` på nästan alla routes** | 🟡 Medium | Korrekt för auth-routes, men onödigt för publika routes (produktlistor, kampanjer). Förstör ISR/CDN-cachning. |
| **Saknad input-validering** | 🔴 Hög | Få routes validerar `params.id` som giltig UUID. Många gör `.eq('id', params.id)` direkt — risk för SQL-injektion via PostgREST är låg, men `params.id` kan vara `undefined` och orsaka 500. |
| **Inkonsekvent felhantering** | 🟡 Medium | Vissa routes returnerar `{ error }`, andra `{ message }`, andra kastar 500 utan strukturerad payload. |
| **Saknad rate-limiting** | 🟡 Medium | Inga API-rutter har rate-limiting. Stripe-webhook saknar signature-verifiering i vissa fall. |

---

## 4. Databasschema & Modellanalys

### 4.1 Identifierade tabeller (från migrations)

| Domän | Tabeller |
|-------|----------|
| **Användare** | `profiles`, `users` (auth), `seller_profiles`, `merchant_profiles` |
| **Produkter** | `products`, `community_products`, `merchant_products`, `product_images` |
| **Orders** | `orders`, `order_items`, `returns` |
| **Kampanjer** | `campaigns`, `campaign_forms`, `campaign_form_submissions`, `campaign_notifications` |
| **Försäljning** | `ledger_entries`, `payout_requests` |
| **Gamification** | `seller_xp`, `achievements` (saknas?), `xp_events` (referens i kod men ej bekräftad) |
| **Community** | `communities`, `messages`, `conversations` |
| **Lager** | `warehouses`, `picking_tasks`, `warehouse_inventory` |
| **Logistik** | `shipping_methods`, `tracking_events` |
| **System** | `system_settings`, `api_keys`, `audit_logs` |

### 4.2 Schema-problem

| Problem | Beskrivning |
|---------|-------------|
| **`campaign_products` saknas** | Kampanj-detajlvy förväntar sig `campaign_products`-koppling. Nuvarande shim hämtar godtyckliga godkända produkter. |
| **`campaign_sellers` / `seller_campaigns` saknas** | "Gå med i kampanj" har ingen persistent koppling — knappen ger bara en success-toast. |
| **`xp_events` tabell osäker** | Realtime-notification lyssnar på `xp_events` — verifiera att den tabellen finns. |
| **`orders.seller_id` vs `seller_profiles.id`** | API `/api/sellers/[id]/orders` filtrerar på `orders.seller_id`, men det kan vara `seller_profiles.id` eller `profiles.id` — tydliggör konvention. |
| **`orders.total` vs `orders.total_amount`** | Blandade kolumnnamn — kod använder `total` ibland, `total_amount` ibland. |
| **`community_products.stock` saknar triggers** | Lagerändringar uppdaterar inte alltid `community_products.stock`. |

---

## 5. Frontend-komponenter & Kvalitet

### 5.1 Komponentarkitektur

- **BrandIcons.tsx** — ~40+ SVG-ikoner i en enda fil (792 rader). Välstrukturerade men svåröverskådliga.
- **useCart hook** — Finns, men `CartIcon` importeras från BrandIcons i marketplace — bekräftad OK.
- **useAuth** — Central auth-kontext. Används konsekvent.
- **ToastNotifications.tsx** — Ny, framer-motion-baserad.

### 5.2 Frontend-problem

| Problem | Plats | Beskrivning |
|---------|-------|-------------|
| **Importerar `supabaseAdmin` i client-komponent** | `app/sellers/dashboard/page.tsx` | `supabaseAdmin` är service-role och ska aldrig finnas i `'use client'`-filer. Använd `supabase` (anon-klient) eller API-rutter. |
| **Blandad auth-hantering i sellers/dashboard** | `app/sellers/dashboard/page.tsx` | Använder både `useAuth` (klient) och `supabaseAdmin` (server) i samma fil. |
| **Non-existent icon imports** | Flera filer | Tidigare: `QrIcon`, `PackageIcon`, `ClockIcon` — några fixade, men risk för återkomst. |
| **`any`-typer i ~30+ filer** | Spritt | Många `useState<any>`, `Promise<any>` — försvårar refaktorering. |
| **Hårdkodade URL:er** | `sellers/dashboard/page.tsx` | `https://goal-squad.vercel.app/seller/${user.id}` — bryts i staging/local. Använd `window.location.origin`. |
| **Ingen loading-skeleton på marketplace** | `marketplace/page.tsx` | Bara text "Laddar..." — bör ha strukturerade skeletons. |

---

## 6. Säkerhetsanalys

| Risk | Allvarlighet | Beskrivning |
|------|-------------|-------------|
| **Service-role key i klientkod** | 🔴 **Kritisk** | `supabaseAdmin` importeras i `app/sellers/dashboard/page.tsx` som är `'use client'`. Om det bunclas till browser-bundle har angripare full DB-access. |
| **Stripe webhook secret exposure** | 🟡 Medium | Verifiera att `STRIPE_WEBHOOK_SECRET` används i alla webhook-routes. |
| **Saknad CSRF-skydd** | 🟡 Medium | API-rutter som accepterar POST/PATCH har inga CSRF-tokens. |
| **Saknad input-sanering** | 🟡 Medium | Få routes sanerar `searchParams` eller JSON-body innan DB-frågor. |
| **`ignoreBuildErrors: true`** | 🟡 Medium | Döljer TypeScript-fel som kan vara runtime-fel. |
| **RLS på `spatial_ref_sys` avstängd** | 🟢 Låg | PostGIS-systemtabell — påverkar inte applikationsdata men flaggas av Supabase Advisor. |

---

## 7. Prestanda & Skalbarhet

| Problem | Påverkan | Förslag |
|---------|----------|---------|
| **Inga databas-index dokumenterade** | Långsamma listningar vid skalning | Lägg till index på `orders.seller_id`, `orders.status`, `community_products.status`, `campaigns.community_id`. |
| **API-rutter hämtar allt på en gång** | Långsam TTFB | Paginering finns på vissa routes men inte konsekvent. |
| **`force-dynamic` på publika routes** | CDN-cachning disabled | Publika routes (`/api/community-products`, `/api/campaigns/*`) bör kunna vara statiska eller ISR. |
| **BrandIcons.tsx — 792 rader** | Större bundle | Dela upp ikoner per domän eller använd `lucide-react`. |
| **Service Worker cache-strategi** | Risk för stale data | API-cachning med `network-first` är OK, men se till att `cache.put` hanterar `no-store`-responser. |

---

## 8. Bygg & Deployment

| Problem | Beskrivning |
|---------|-------------|
| **TypeScript-fel ignorerade** | `next.config.js`: `typescript.ignoreBuildErrors: true`. Bygget går igenom men kan ha runtime-fel. |
| **ESLint ignorerat** | `eslint.ignoreDuringBuilds: true`. Kodkvalitet försämras över tid. |
| **Mobile-katalog exkluderad** | `webpack.watchOptions.ignored: ['**/mobile/**']`. React Native-appen byggs separat? |
| **Miljövariabler** | `.env.example` finns men många routes förväntar sig keys utan fallback. |

---

## 9. Prioriterad Åtgärdsplan

### Omedelbart (Blockerar/Brister)
1. **🔴 Ta bort `supabaseAdmin` från alla `'use client'`-filer** — `sellers/dashboard/page.tsx` är den värsta.
2. **🔴 Fixa middleware redirect** — `/auth/login` ska vara `/login`.
3. **🔴 Lägg till input-validering (Zod) på alla API-rutter** som tar emot `id`, `body`, eller `searchParams`.

### Denna vecka
4. **🟡 Normalisera routing** — välj `campaign` eller `campaigns`, `merchant` eller `merchants`, dokumentera.
5. **🟡 Skapa `campaign_products` och `campaign_sellers` tabeller** — gör kampanj-logiken persistent.
6. **🟡 Konsekvent autentisering** — skapa en `requireAuth()`-utility som alltid används. Döp om `getAuthUser` / `requireUser`.

### Denna månad
7. **🟡 Aktivera TypeScript strict mode** och åtgärda fel stegvis (börja med nya filer).
8. **🟡 Lägg till databas-index** för `orders`, `community_products`, `campaigns`.
9. **🟡 Implementera rate-limiting** på publika API-rutter.
10. **🟡 Refaktorera BrandIcons** — migrera till `lucide-react` eller dela upp filen.

---

## 10. Mätetal

| Mätetal | Nuvarande | Mål |
|---------|-----------|-----|
| TypeScript-fel | ~192 (dolda) | 0 |
| API-rutter utan auth | ~15% | 0% |
| `'use client'` med `supabaseAdmin` | 1 | 0 |
| Middleware redirect-buggar | 1 | 0 |
| Saknade DB-tabeller (shims) | 3 | 0 |
| Inkonsekventa route-prefix | 2+ | 0 |

---

## Appendix A: Filreferenser för Gemini-review

För Gemini-genomgång, fokusera på följande filer i prioritetsordning:

1. `middleware.ts` — redirect-bugg
2. `app/sellers/dashboard/page.tsx` — supabaseAdmin i klientkod
3. `lib/supabase.ts` — proxy-pattern för klient/admin
4. `next.config.js` — ignoreBuildErrors
5. `app/api/campaigns/[id]/route.ts` — nytt, men bör ses över
6. `app/api/admin/orders/route.ts` — konsekvent admin-auth
7. `app/campaign/[campaignId]/page.tsx` — ny frontend, koppling till DB
8. `public/sw.js` — PWA-logik

---

*Dokumentet är avsett för team-review och bör uppdateras efter varje sprint.*
