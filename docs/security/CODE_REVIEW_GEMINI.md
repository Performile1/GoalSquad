# Teknisk djupanalys – GoalSquad (brief för Gemini)

> Syfte: Djupgående teknisk genomlysning för granskning i Gemini. Innehåller arkitekturöversikt,
> rangordnade fynd med filhänvisningar, samt riktade frågor för vidare analys.
> Senast uppdaterad: 2026-05-31. Fynden bygger på statisk kodläsning (appen har ej körts).
>
> **Status:** Admin-auth-hålen i sektion 2 är **åtgärdade** (se 2.x). Nya, ännu **icke åtgärdade**
> fynd finns i sektion 2b (oautentiserade profil-endpoints) och sektion 3 (finansiell motor).

---

## 1. Översikt

| Område | Detalj |
| --- | --- |
| Typ | Next.js 14 (App Router) + Supabase (Postgres/Auth/RLS) |
| Domän | "Global 4PL och Fintech-plattform" – community commerce, MOQ, gamification, ads, treasury |
| API | ~124 `route.ts`-filer under `app/api/` |
| Auth | Blandad: Bearer-JWT (`getAuthUser`) för användarroutes; cookie-baserad `requireRole` (RLS-säker) för admin |
| Betalning | Stripe (checkout, webhook, ads off-session daily-charge) |
| Stack | `@supabase/ssr` 0.5, `stripe` 15, `zod` 3.23 (oanvänd), `twilio` 5, `nodemailer`, `cloudinary`, `sharp`, `recharts` |
| Tester | Endast `tests/e2e/auth.spec.ts` (Playwright, saknar typer); inga enhetstester för `lib/`-motorerna |

Affärslogik i `lib/`: `split-engine.ts` (fördelning), `treasury.ts` (escrow), `moq-handler.ts`,
`gamification-engine.ts`, `anti-cheat.ts`, `audit-signature.ts`.

---

## 2. Säkerhet – admin-auth (ÅTGÄRDAT)

Följande hål i admin-lagret har rättats i denna omgång och dokumenteras för spårbarhet:

- **2.1 `admin/fix-role`** – oautentiserad privilegieskalering (satte `gs_admin` på fast e-post). **Borttagen.**
- **2.2 `admin/users` GET** – listade alla profilers PII utan auth. **Skyddad med `requireAdmin()`.**
- **2.3 `admin/users/create`** – skapade konton med godtycklig roll utan auth. **Skyddad + rollvitlista.**
- **2.4 Trasig rollkontroll (systemiskt)** – 12 routes jämförde `authUser.role !== 'gs_admin'`, men
  `getAuthUser` returnerar Supabase auth-user vars `.role` är Postgres-rollen (`"authenticated"`),
  aldrig app-rollen. **Alla migrerade** till central gatekeeper.
- Dessutom skyddades `admin/stats`, `admin/entities`, `admin/activities`, `admin/ads`,
  `admin/users/[id]/deactivate` (saknade auth) och `admin/broadcast` + `admin/ads/[id]/approve|reject`
  (egna ad hoc-kontroller) konsoliderades.

**Ny arkitektur:** central `requireRole(allowedRoles)` i
`lib/api-auth.ts` använder en RLS-säker cookie-klient (`lib/supabase/server.ts`), slår upp
`role/is_active` i `profiles`, och returnerar antingen `{ error: NextResponse }` (401/403) eller
`{ user, profile }`. Mönster i routes: `const auth = await requireRole('gs_admin'); if ('error' in auth) return auth.error;`.

**Kvarstående beroende:** den cookie-baserade kontrollen kräver att RLS tillåter self-read av
`profiles` (policy `profiles_select_own` i migration `062`). Verifiera att migrationen faktiskt är
körd i produktion, annars returnerar gatekeepern `403 Profile not found`.

---

## 2b. Säkerhet – KRITISKA, ÄNNU EJ ÅTGÄRDADE

### 2b.1 Oautentiserat PII-läckage – `auth/get-profile`
`app/api/auth/get-profile/route.ts:9-29`

GET tar `?userId=<uuid>` och returnerar **hela profilen** (`select('*')` – e-post, telefon,
personnummer, adress) för **vilken användare som helst**, via service-role. Ingen kontroll att
anroparen äger `userId`. Klassisk IDOR + möjlig enumerering av hela användarbasen.

```
const userId = url.searchParams.get('userId');
const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
return NextResponse.json(data);
```

**Åtgärd:** Verifiera session och att `userId === session.user.id` (eller gör endpointen helt
intern). Returnera bara nödvändiga fält, aldrig `personal_id_number`.

### 2b.2 Oautentiserad entitetsenumerering – `auth/check-entity-role`
`app/api/auth/check-entity-role/route.ts:9-33`

Samma mönster: `?userId=` → returnerar merchant/seller/warehouse/community-kopplingar för valfri
användare, utan auth. Lägre allvar (endast id:n) men samma IDOR-klass.

**Åtgärd:** Samma som 2b.1.

### 2b.3 Genomgående service-role → RLS kringgås (riskmultiplikator)
`lib/supabase.ts` + 80+ routes. Service-role-klienten **kringgår RLS helt**, så all behörighet
vilar på app-koden. Det var grundorsaken till 2.1–2.4 och 2b.1–2b.2. Användarroutes autentiserar
fortfarande via Bearer (`getAuthUser`) men gör sedan arbetet med service role utan RLS-skydd.

**Åtgärd:** Migrera användar-routes till den RLS-säkra klienten (`lib/supabase/server.ts`).
Reservera service role för genuint privilegierade operationer bakom `requireRole`.

---

## 3. KRITISKT – Finansiell motor (split-engine + treasury + webhook)

Detta är den allvarligaste klustret för en fintech-plattform. Inga av punkterna nedan är åtgärdade.

### 3.1 Ingen idempotens i Stripe-webhook → dubbel fondfördelning
`app/api/stripe/webhook/route.ts:71-133`

`checkout.session.completed` → `SplitEngine.processOrderSplit(orderId)` körs **utan idempotensskydd**.
Stripe levererar webhooks *at-least-once* och gör retries vid timeout/5xx. Ingen kontroll av
befintlig `payment_status`, ingen `stripe_events`-dedup-tabell, och `processOrderSplit` saknar
egen "redan fördelad"-kontroll. Resultat: **wallets dubbelkrediteras** och dubbla `ledger_entries`
skapas vid varje retry.

**Åtgärd:** Persistera `event.id` i en unik tabell och no-op:a dubbletter; och/eller guard:a på
`order.payment_status === 'paid'` innan split. Gör splitten idempotent på `(order_id)`.

### 3.2 Race condition i wallet-saldon (lost update)
`lib/split-engine.ts:206-211, 251-256, 296-301, 314-321` och `lib/treasury.ts:148-152`

Saldon uppdateras med läs-modifiera-skriv:
```
balance: parseFloat(communityWallet.balance) + communityAmount
```
Två samtidiga ordrar mot samma community/seller/warehouse-wallet ger **lost update** – den ena
krediteringen försvinner. Ingen rad-lås, ingen atomär `balance = balance + x`, ingen transaktion.

**Åtgärd:** Använd atomär DB-inkrement (Postgres `update ... set balance = balance + $1` via RPC)
eller härled saldo enbart ur `ledger_entries` (single source of truth). Wallet-saldot bör inte
lagras redundant utan transaktionsgaranti.

### 3.3 Ingen DB-transaktion → ledger och saldon kan divergera
`lib/split-engine.ts:193-308`

För community/seller/warehouse uppdateras wallet-saldot **före** att `ledger_entries` insertas
(rad 306). Om ledger-inserten kastar (rad 310-312) har saldon redan ändrats → inkonsistens mellan
liggare och saldo. Allt sker utanför en transaktion.

**Åtgärd:** Kör hela fördelningen i en Postgres-funktion/transaktion (allt-eller-inget).

### 3.4 Flyttalsaritmetik på pengar
`lib/split-engine.ts:138-141`, `lib/treasury.ts:148,264`, `app/api/checkout/route.ts:84-87`

Alla belopp hanteras som `parseFloat` och `* percent / 100`. Flyttal ger avrundningsfel
(t.ex. `0.1 + 0.2`). I en liggare som ska balansera är detta en tidsinställd bomb.

**Åtgärd:** Räkna i heltal (ören) eller använd `decimal`-typ konsekvent; avrunda explicit och
verifiera att summan av delar == totalen.

### 3.5 Liten-order-bugg: distribuerar mer än insamlat
`lib/split-engine.ts:138, 148, 161, 315`

`platformAmount = total*12% - 25` (handling fee). För små ordrar blir detta negativt och floor:as
med `Math.max(0, platformAmount)` – men handling fee (25) krediteras **ändå** separat. Då blir
totalt utbetalt = community 60% + seller 20% + warehouse 8% + 0 + 25 > insamlat belopp.
Plattformen betalar mellanskillnaden. `shippingSpreadPercent` läses men används aldrig.

**Åtgärd:** Beräkna plattformsandel som residual (total − övriga andelar) och dra handling fee
därifrån; säkerställ att Σ delar ≡ total.

### 3.6 Escrow-release saknar atomär statusövergång
`lib/treasury.ts:99-189`

`releaseHold` läser `status === 'held'` (rad 113) och uppdaterar senare till `released` (rad 174)
utan villkorlig update. Två samtidiga `releaseExpiredHolds`-körningar (t.ex. överlappande cron)
kan **dubbel-släppa** samma hold → dubbel kreditering. Vem som triggar cron är heller inte
uppenbart i koden.

**Åtgärd:** Gör övergången atomär: `update ... set status='released' where id=$ and status='held'`
och agera endast om en rad faktiskt påverkades.

### 3.7 Refund och payout är stubbar (pengar rör sig inte)
`lib/treasury.ts:220-242` (`// TODO: Trigger Stripe refund`), `:324-356` (`// TODO: Stripe Connect`)

`refundHold` sätter bara status = `refunded` men gör **ingen** Stripe-refund. `requestPayout`
loggar bara och returnerar ett fejk-`payoutId`. Webhooken `charge.refunded` markerar ordern men
förlitar sig på dessa stubbar för faktiska pengaflöden.

**Åtgärd:** Implementera faktisk Stripe-refund/Connect-payout, eller markera tydligt som ej i drift.

---

## 3b. Höga fynd (arkitektur & säkerhet)

### 3b.0 RLS-policyer ofullständiga
`supabase/migrations/062_comprehensive_rls_fix.sql:24-42`

Migrationen lägger bara `SELECT`-policyer för "egna" rader och saknar INSERT/UPDATE/DELETE.
I kombination med service-role-användningen (2b.3) är RLS i praktiken verkningslöst som skyddslager
idag. 61+ migrationer plus lösa `fix_*.sql`/`set_admin_role.sql` antyder upprepade ad hoc-RLS-fixar.

**Åtgärd:** Behandla RLS som primärt skydd. Definiera kompletta policyer per tabell/operation och
testa dem med anon/JWT-klient.

### 3b.1 Validering av indata (`checkout`)
`app/api/checkout/route.ts:26-126`

Verifierar inte `quantity > 0` (negativ/0 kvantitet valideras ej), saknar lager-/MOQ-kontroll, och
validerar inte `shippingAddress`-fält. Litar på klientens `shippingAddress.email` som Stripe
`customer_email`. `community_products` saknar `community_id`-FK och slås upp **via namn** (rad 93-97,
kommenterat som "simplified approach") – ömtåligt. Priser hämtas dock korrekt server-side (bra).
`zod` finns som beroende men används inte för request-validering.

**Åtgärd:** Inför `zod`-scheman för alla muterande request-bodies; lägg FK på `community_products`.

### 3b.2 Audit-signaturer är icke-funktionella och osäkra
`lib/audit-signature.ts:68-132`

- `sendOTPSMS`/`sendOTPEmail` är **stubbar** som `console.log`:ar OTP:n i klartext (rad 71, 90) –
  Twilio/Nodemailer-koden är bortkommenterad.
- `initiateSignature` **returnerar OTP-hashen till anroparen** (rad 127) och `completeSignature`
  jämför sedan mot en `storedOTPHash` som **skickas in av anroparen** (rad 140-145). Den som kan
  anropa verifieringen kan alltså skicka en egen matchande hash → **signaturintegriteten är bruten**.
- Ingen utgångstid, ingen försöksbegränsning, osaltad SHA-256.

**Åtgärd:** Lagra pending OTP server-side (egen tabell) med TTL och försöksgräns; skicka aldrig
hash till klienten; implementera faktisk SMS/e-post.

### 3b.3 Daily-charge: dubbelkörningsrisk
`app/api/ads/stripe/daily-charge/route.ts:52-124`

Auth är korrekt (gs_admin/system via `profiles`). Men `should_charge_daily`-kontrollen och
`paymentIntents.create` + efterföljande `update last_daily_charge_date` är **inte atomära** – två
samtidiga anrop för samma annons kan dubbeldebitera. Ingen hantering av `requires_action` (SCA).

**Åtgärd:** Lås/idempotensnyckel per `(adId, datum)`; använd Stripe idempotency key.

---

## 4. Medel / kodhälsa

- **Dokumentationssvall:** ~40 markdown-filer i roten (överlappande statusrapporter). Konsolidera till `docs/`.
- **Duplicerad Supabase-klientinit:** många routes gör egen `createClient(...)` i stället för
  `@/lib/supabase`. Inkonsekvent och felbenäget.
- **`force-dynamic` selektivt satt** – verifiera att svarscachning inte läcker data mellan användare.
- **Loggning:** generiska `console.error` utan korrelations-id/strukturerad logg – svagt för fintech.
- **Inga enhetstester** för de finansiella motorerna; enda testfilen (`tests/e2e/auth.spec.ts`)
  saknar `@playwright/test`-typer (35 TS-fel vid `tsc`).
- **61+ migrationer** med flera lösa `fix_*.sql`/`set_admin_role.sql` – tecken på ad hoc-RLS-fixar.

---

## 5. Positivt

- Ny **central gatekeeper** (`requireRole`) med RLS-säker klient – ren och enhetlig auth för admin.
- `user/profile` PUT vitlistar fält korrekt – förhindrar mass-assignment av `role`/`is_active`.
- `checkout` och webhook hämtar priser/total server-side; webhook **verifierar Stripe-signaturen** korrekt.
- Tydlig separation av affärslogik i `lib/`.
- Hemligheter via env; `.env*.local` och `*.pem` gitignorerade.
- `anti-cheat.ts` har genomtänkt XP-velocity-/rapid-fire-detektion (men verifiera att den faktiskt
  anropas server-side i alla XP-tilldelningsvägar).

---

## 6. Riktade frågor till Gemini

1. **Finansiell integritet:** Granska `processOrderSplit` + `Treasury.releaseHold` för idempotens,
   atomicitet och flyttalsfel. Föreslå en Postgres-transaktionell omskrivning där liggaren är
   single source of truth och saldon härleds.
2. **Webhook-idempotens:** Bästa mönster för Stripe-event-dedup i Next.js App Router (event-tabell
   vs. order-status-guard)? Hur hanteras out-of-order events?
3. **IDOR-svep:** Inventera samtliga `app/api/**/route.ts` och flagga varje route som tar ett
   `userId`/`id` från klienten och läser/muterar utan ägarkontroll (börja med `auth/get-profile`,
   `auth/check-entity-role`).
4. **RLS-strategi:** Minsta refaktorering för att göra RLS till verkligt skyddslager givet utbredd
   service-role-användning? Vilka tabeller behöver kompletta INSERT/UPDATE/DELETE-policyer?
5. **Audit-signatur:** Är OTP-flödet i `audit-signature.ts` exploaterbart som beskrivet (klient-
   tillhandahållen hash)? Föreslå säker server-side design.
6. **Liten-order-matematiken:** Verifiera 3.5 – distribuerar plattformen mer än insamlat när
   `total*12% < handlingFee`?

---

## 7. Föreslagen åtgärdsordning

1. **(akut)** Skydda `auth/get-profile` + `auth/check-entity-role` (IDOR/PII).
2. **(akut)** Idempotens i Stripe-webhook + idempotent `processOrderSplit`.
3. **(akut)** Atomära wallet-/escrow-uppdateringar i DB-transaktion; liggare som sanning.
4. **(hög)** Heltalsbaserad (ören) pengaaritmetik; rätta liten-order-buggen (3.5).
5. **(hög)** Implementera eller avaktivera refund/payout-stubbarna och audit-OTP.
6. **(hög)** `zod`-validering i muterande routes.
7. **(medel)** Migrera användar-routes från service role till RLS-säker klient.
8. **(låg)** Konsolidera dokumentation; lägg enhetstester för `lib/`-motorerna.

---

## 8. Statusöversikt (fynd → åtgärd)

| # | Fynd | Allvar | Status |
| --- | --- | --- | --- |
| 2.1 | `admin/fix-role` privilegieskalering | Kritisk | ✅ Borttagen |
| 2.2 | `admin/users` GET PII utan auth | Kritisk | ✅ Skyddad |
| 2.3 | `admin/users/create` godtycklig roll | Kritisk | ✅ Skyddad + vitlista |
| 2.4 | Trasig `authUser.role`-kontroll (12 st) | Kritisk | ✅ Migrerad |
| 2b.1 | `auth/get-profile` IDOR/PII | Kritisk | ✅ `requireUser` + ägar-/admin-kontroll |
| 2b.2 | `auth/check-entity-role` IDOR | Hög | ✅ `requireUser` + ägar-/admin-kontroll |
| 2b.3 | Service-role kringgår RLS | Hög | ✅ Granskad: 32 tabeller är service-role-only (korrekt deny-all), 3 frontend-tabeller fick policys (migration 067) |
| 2b.4 | `Public read for build` (anon `USING(true)`) läcker merchants bank/IBAN/PII + communities-kontakt till anon-nyckeln | Kritisk | ✅ Migration 065 körd & verifierad (anon-policy borttagen, säkra vyer `public_merchants`/`public_communities` med grants) |
| 2b.5 | `merchants_select_active`/`communities_select_active` (PUBLIC, `is_active=true`) läcker fortfarande hela aktiva rader till anon | Kritisk | ✅ Migration 066 körd & verifierad (endast `*_select_own` + service_role kvar; anon = 0 rader) |
| 3.1 | Webhook saknar idempotens | Kritisk | ✅ `stripe_events`-dedup; migration 063 körd |
| 3.2 | Wallet race condition | Kritisk | ✅ Atomär RPC + radlås; körd & röktestad |
| 3.3 | Ingen DB-transaktion | Kritisk | ✅ `process_order_split` (en transaktion); körd & röktestad |
| 3.4 | Flyttalsaritmetik på pengar | Hög | ✅ Math i SQL (exakt DECIMAL); JS-lagret kvar i UI |
| 3.5 | Liten-order distribuerar för mycket | Hög | ✅ Residual-modell + min-order-guard; röktest balans=100 |
| 3.6 | Escrow dubbel-release | Hög | ✅ Atomär `release_treasury_hold`; körd |
| 3.7 | Refund/payout är stubbar | Hög | ✅ Refund implementerad med Stripe (treasury.ts), payout markerad som ej i drift (kräver Stripe Connect) |
| 3.x | Seller/warehouse dubbel-betalning (wallet + hold) | Kritisk | ✅ Rättad: escrow-only i RPC; körd |
| 3.y | `orders` saknar `seller_id`/`warehouse_id` → escrow triggas aldrig | Hög | ✅ Migration 069 tillagd (seller_id/warehouse_id med FK) |
| 3b.1 | Checkout-validering | Medel | ✅ Zod-validering implementerad (UUID, quantity >= 1, email, postal code, ISO country code) |
| 3b.2 | Audit-OTP bruten/osäker | Hög | ✅ Server-side `audit_otps` (TTL 5min, 3 försök, burn); klient får aldrig hash. Migration 064 |
| 3b.3 | Daily-charge dubbelkörning | Medel | ✅ Idempotens via `ad_daily_charges` (unique constraint) + Stripe idempotency key. Migration 070 |
| 3b.4 | IDOR-sårbarhet i warehouses/[id]/flow | Hög | ✅ Lade till auth + access control (warehouse_assignments, community membership, gs_admin) |
| --- | SECURITY DEFINER RPC-härda | Hög | ✅ Migration 068: `use_discount_code` validerar caller=customer, `notify_*` begränsade till service_role |
| --- | messages/compose data-läcka | Låg | ✅ Uppdaterad att använda `public_merchants`-vy (säker) |
| --- | Profile lookup duplicering | Medel | ✅ Skapad `lib/profile-helpers.ts`, 8 API-rutter refaktorerade |
