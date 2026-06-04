# Teknisk Djupanalys - GoalSquad v2.0

**Datum:** 2026-05-31  
**Syfte:** Komplett teknisk analys för genomgång med Gemini  
**Omfattning:** Arkitektur, säkerhet, finansiella flöden, databas, API

---

## 1. Systemarkitektur

### 1.1 Teknisk Stack

**Frontend:**
- Next.js 14.2 (App Router, SSR/ISR)
- React 18.3
- TypeScript 5.4
- TailwindCSS 3.4
- Framer Motion (animationer)
- Recharts (visualisering)

**Backend:**
- Next.js API Routes (RESTful)
- Supabase (PostgreSQL + Auth + Storage)
- Stripe 15.0 (betalningar, Connect)
- Twilio 5.0 (SMS OTP)
- Nodemailer 6.9 (e-post)

**Databas:**
- PostgreSQL via Supabase
- RLS (Row Level Security) på alla tabeller
- 69+ migrationer
- 100+ tabeller i `public` schema

**Beroenden:**
- `@supabase/supabase-js` 2.43.0
- `@supabase/ssr` 0.5.0
- `stripe` 15.0.0
- `zod` 3.23.0 (validering)
- `uuid` 9.0.1
- `bcryptjs` 2.4.3
- `sharp` 0.33.0 (bildhantering)

### 1.2 Arkitekturmönster

**Database-First Design:**
- PostgreSQL är single source of truth
- Affärslogik i Postgres RPC-funktioner (t.ex. `process_order_split`)
- RLS som primärt säkerhetslager
- Ledger för finansiella transaktioner (immutable)

**API-First:**
- RESTful endpoints i `app/api/**/route.ts`
- Webhook-ready (Stripe, framtida carrier webhooks)
- Centraliserad auth via `lib/api-auth.ts`

**Event-Driven:**
- Stripe webhooks trigger Split Engine
- Audit signatures på kritiska händelser
- Asynkron behandling för tunga operationer

**Zero-Trust Security:**
- RLS på alla tabeller
- OTP-verifiering för känsliga åtgärder
- Kryptografiska signaturer för audit trail
- Anti-cheat system för gamification

### 1.3 Kärnkomponenter

**Split Engine (`lib/split-engine.ts`):**
- Triple-Dip Margin System
- Realtidsfördelning av betalningar
- Delegerar till atomisk Postgres RPC `process_order_split` (migration 063)
- Radlås för att förhindra race conditions
- Exakt DECIMAL-matematik i SQL

**Treasury System (`lib/treasury.ts`):**
- 30-dagars escrow för seller/warehouse
- Atomisk release via `release_treasury_hold` RPC
- Stripe refund implementerad
- Payout ej implementerat (kräver Stripe Connect)

**Gamification Engine (`lib/gamification-engine.ts`):**
- XP-system med exponentiell kurva
- Achievement unlocking
- Streak tracking
- Leaderboard updates
- Anti-cheat integration

**Anti-Cheat System (`lib/anti-cheat.ts`):**
- XP velocity detection
- Rapid-fire event detection
- Impossible order pattern detection
- Flagging för manuell granskning

**Audit Signatures (`lib/audit-signature.ts`):**
- Server-side OTP-lagring (migration 064)
- TTL 5 minuter, max 3 försök
- Burn-after-use
- Kryptografiska signaturer

---

## 2. Säkerhetsanalys

### 2.1 Autentisering & Auktorisering

**Auth Helpers (`lib/api-auth.ts`):**
- `getAuthUser()` - Bearer JWT validering
- `requireRole()` - Rollbaserad auktorisering (RLS-safe client)
- `requireUser()` - Session-validering utan rollkrav
- `requireAdmin()` - gs_admin gatekeeper

**Roller:**
- `gs_admin` - Plattformsadministratör
- `merchant` - Företag/Merchant
- `seller` - Säljare
- `community` - Föreningsadministratör
- `warehouse` - Lagerpartner
- `user` - Kund

**RLS-strategi:**
- Alla tabeller har RLS enabled
- Owner-scoped policies (`*_select_own`)
- Service-role full access
- Public vyer för säker dataexponering (`public_merchants`, `public_communities`)

### 2.2 RLS Policy Status

**Kritiska tabeller med policys:**
- `profiles` - `_select_own`, service-role
- `merchants` - `_select_own`, service-role
- `communities` - `_select_own`, service-role
- `orders` - `_select_own`, service-role
- `wallets` - `_select_own`, service-role
- `treasury_holds` - `_select_own`, service-role

**Frontend-tabeller med policys (migration 067):**
- `return_reasons` - Publik läsning (active only)
- `returns` - Autentiserad läsning per roll (consumer/warehouse/merchant/seller)
- `return_items` - Warehouse uppdatering

**Service-role-only tabeller (32 st):**
- RLS enabled, inga policies = deny-all för direktåtkomst
- Nås bara via `supabaseAdmin` i API-rutter
- Korrekt isolering

### 2.3 SECURITY DEFINER Functions

**Härdade funktioner (migration 068):**
- `use_discount_code` - Validerar caller = customer
- `notify_new_company` - Begränsad till service-role
- `notify_new_product` - Begränsad till service-role

**Lämnade som de är (säkra):**
- `record_ad_click` - RLS på `ad_stats`/`ads`
- `record_ad_view` - RLS på `ad_stats`/`ads`
- `update_goal_progress` - Trigger på RLS-skyddad `entity_goals`

### 2.4 Audit Trail

**OTP System (migration 064):**
- Server-side lagring i `audit_otps`
- Hashed OTP (SHA-256)
- TTL 5 minuter
- Max 3 försök
- Burn-after-use

**Signature Flow:**
- `initiateSignature` - Genererar OTP, lagrar hash
- `completeSignature` - Verifierar OTP, bränner
- IP, timestamp, user agent loggade
- Klient får aldrig hash

### 2.5 Identifierade Sårbarheter (Fixade)

**Kritiska (lösta):**
- ✅ IDOR i `auth/get-profile` - Fixad med `requireUser` + ägarkontroll
- ✅ IDOR i `auth/check-entity-role` - Fixad med `requireUser` + ägarkontroll
- ✅ Anon read läckage via `Public read for build` - Stängd (migration 065)
- ✅ Anon read läckage via `merchants_select_active` - Stängd (migration 066)
- ✅ `use_discount_code` utan caller-validering - Fixad (migration 068)

**Hög prioritet (lösta):**
- ✅ Wallet race condition - Atomär RPC + radlås
- ✅ Escrow dubbel-release - Atomär `release_treasury_hold`
- ✅ Refund stubb - Implementerad med Stripe
- ✅ Orders saknar `seller_id`/`warehouse_id` - Tillagt (migration 069)

**Öppna (ej kritiska):**
- ✅ Checkout-validering - Implementerad med Zod (UUID, quantity >= 1, email, postal code, ISO country)
- ✅ Daily-charge dubbelkörning - Löst via idempotens (migration 070)
- ❌ Payout ej implementerad - Kräver Stripe Connect

### 2.6 Kodkvalitet & Refaktorering

**Profile Lookup Centralisering:**
- ✅ Skapad `lib/profile-helpers.ts` med `getProfile()`, `getProfileWithStripeId()`, `hasRole()`, `isUserActive()`
- ✅ 8 API-rutter refaktorerade att använda helper (treasury, ads, goals, shipping, analytics, coordination)
- ✅ Eliminerat ~20 rader duplicerad kod

**IDOR-säkerhet:**
- ✅ `warehouses/[id]/flow/route.ts` - Lade till auth + access control (warehouse_assignments, community membership, gs_admin)
- ✅ Alla dynamic routes med merchant_id/warehouse_id verifierade

**Kryptografisk säkerhet:**
- ✅ `audit-signature.ts` använder `crypto.randomBytes` (CSPRNG) för OTP-generering

---

### 2.7 Anti-Cheat System

**Detektioner:**
- XP velocity anomaly (3x normal rate)
- Rapid-fire events (10+ inom 5 min)
- Impossible order patterns (20+ orders/timme)
- Duplicate orders
- High cancellation rate

**Flagging:**
- `anti_cheat_flags` tabell
- Manual review workflow
- Account suspension vid bekräftad fusk

---

## 3. Finansiella Flöden

### 3.1 Split Engine

**Triple-Dip Margin:**
1. Sales Margin (Retail vs Merchant base price)
2. Handling Fee (Fixed 25 SEK)
3. Shipping Spread (Carrier arbitrage)

**Fördelning (default):**
- Platform: 12%
- Community: 60%
- Seller: 20%
- Warehouse: 8%
- Handling: 25 SEK (fixed)

**Atomisk Transaktion (migration 063):**
- `process_order_split` RPC
- Radlås på wallets
- Exakt DECIMAL-matematik
- Idempotent (stripe_events dedup)
- Residual platform share
- Real escrow för seller/warehouse

### 3.2 Treasury System

**Escrow Logic:**
- 30 dagars hold för seller/warehouse
- Automatic release efter hold period
- Atomic release via `release_treasury_hold` RPC
- Conditional UPDATE förhindrar dubbel-release

**Refund Flow:**
- Hämtar `stripe_payment_intent_id` från orders
- Triggerar Stripe refund
- Uppdaterar `treasury_holds` status
- Loggar refund metadata

**Payout (ej implementerad):**
- Kräver Stripe Connect
- Communities behöver connected accounts
- Bank account verification flow saknas

### 3.3 Ledger System

**Double-Entry:**
- Varje transaktion skapar balanserade entries
- Credit/Debit par
- Immutable ledger
- Full audit trail

**Wallets:**
- Per entity (platform, merchant, community, seller, warehouse)
- Balance tracking
- Transaction history

### 3.4 Stripe Integration

**Payment Flow:**
- Checkout session creation
- Payment intent
- Webhook: `checkout.session.completed`
- Split Engine trigger

**Refund:**
- `stripe.refunds.create()`
- Metadata med hold_id/order_id
- Status tracking

**Connect (ej implementerat):**
- Merchant onboarding
- Payouts
- Connected accounts

---

## 4. Databas Schema

### 4.1 Kärntabeller

**Entiteter:**
- `profiles` - Användare/entiteter
- `merchants` - Företag
- `communities` - Föreningar
- `seller_profiles` - Säljare
- `warehouse_partners` - Lagerpartners

**Commerce:**
- `products` - Produkter
- `community_products` - Community-specifika produkter
- `orders` - Beställningar
- `order_items` - Orderitems
- `returns` - Returer
- `return_items` - Returitems

**Finansiella:**
- `wallets` - Plånböcker
- `ledger_entries` - Transaktioner
- `treasury_holds` - Escrow
- `split_configurations` - Fördelningsregler

**Gamification:**
- `seller_profiles` - XP, level, streak
- `achievements` - Prestationer
- `user_achievements` - Användarens prestationer
- `leaderboards` - Topplistor
- `xp_events` - XP-historik

**Audit:**
- `audit_otps` - OTP-lagring
- `audit_signatures` - Signaturer
- `anti_cheat_flags` - Fusk-flaggor

### 4.2 Migrationer

**Kritiska migrationer:**
- 062 - Comprehensive RLS fix
- 063 - Atomic split engine + escrow
- 064 - Audit OTP server-side
- 065 - Public safe views
- 066 - Close active anon read
- 067 - RLS policies for frontend tables
- 068 - Harden SECURITY DEFINER functions
- 069 - Add seller_id/warehouse_id to orders

**Totalt:** 69+ migrationer

### 4.3 RLS Status

**Advisor Warning:**
- `spatial_ref_sys` har RLS disabled (PostGIS system table)
- Ej kritisk (system table, ej används av applikationen)

**Alla applikationstabeller:**
- RLS enabled
- Policies definierade eller service-role-only

---

## 5. API-struktur

### 5.1 API-rutter (122 st)

**Admin (22):**
- `/api/admin/users` - User management
- `/api/admin/merchants` - Merchant management
- `/api/admin/communities` - Community management
- `/api/admin/sellers` - Seller management
- `/api/admin/returns` - Return management
- `/api/admin/stats` - Platform statistics

**Auth (2):**
- `/api/auth/get-profile` - Profile lookup (IDOR-fixad)
- `/api/auth/check-entity-role` - Role check (IDOR-fixad)

**Merchants (13):**
- `/api/merchants/onboard` - Onboarding
- `/api/merchants/verify` - OTP verification
- `/api/merchants/[id]/*` - CRUD operations

**Communities (15):**
- `/api/communities/[id]/*` - CRUD operations
- `/api/communities/[id]/sellers` - Seller management
- `/api/communities/[id]/products` - Product management

**Sellers (10):**
- `/api/sellers/xp` - XP management
- `/api/sellers/quests` - Quests
- `/api/sellers/loot-boxes` - Loot boxes
- `/api/sellers/[id]/*` - CRUD operations

**Products (11):**
- `/api/products` - Product listing
- `/api/products/categories` - Categories
- `/api/products/[id]/*` - CRUD operations

**Orders (3):**
- `/api/orders` - Order management
- `/api/checkout` - Checkout flow

**Treasury (1):**
- `/api/treasury/*` - Treasury operations

**Webhooks (1):**
- `/api/stripe/webhook` - Stripe event handler

### 5.2 Autentiseringsmönster

**Standard:**
```typescript
const auth = await requireRole('gs_admin');
if ('error' in auth) return auth.error;
const { user, profile } = auth;
```

**Lättviktig:**
```typescript
const auth = await requireUser();
if ('error' in auth) return auth.error;
const { user, supabase } = auth;
// Manuella ägarkontroller
```

**Bearer:**
```typescript
const user = await getAuthUser(req);
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

---

## 6. Riskbedömning

### 6.1 Kritiska Risker (Lösta)

| Risk | Status | Åtgärd |
|------|--------|--------|
| IDOR i auth endpoints | ✅ Löst | `requireUser` + ägarkontroll |
| Anon data läckage | ✅ Löst | Migrationer 065, 066 |
| Wallet race condition | ✅ Löst | Atomär RPC + radlås |
| Escrow dubbel-release | ✅ Löst | Conditional UPDATE |
| Refund stubb | ✅ Löst | Stripe refund implementerad |
| OTP läckage | ✅ Löst | Server-side lagring |

### 6.2 Medelhöga Risker (Öppna)

| Risk | Status | Rekommendation |
|------|--------|----------------|
| Checkout-validering | ❌ Öppen | Inför zod-scheman |
| Daily-charge dubbelkörning | ❌ Öppen | Idempotensnyckel |
| Payout ej implementerad | ❌ Öppen | Stripe Connect setup |
| Ingen enhetstestning | ❌ Öppen | Lägg till testsvit |

### 6.3 Låga Risker

| Risk | Status | Kommentar |
|------|--------|----------|
| Service-role kringgår RLS | ✅ Granskad | 32 tabeller är korrekt isolerade |
| Daily-charge SCA | ❌ Öppen | Ej kritisk för MVP |
| Loggning | ⚠️ Förbättringsbehov | Strukturerad loggning |

---

## 7. Rekommendationer

### 7.1 Korta Sikt (1-2 veckor)

1. **Checkout-validering**
   - Inför zod-scheman för alla request-bodies
   - Validera `quantity > 0`
   - Validera `shippingAddress`

2. **Daily-charge idempotens**
   - Lägg till idempotensnyckel per `(adId, datum)`
   - Använd Stripe idempotency key

3. **Enhetstestning**
   - Lägg till Playwright-tester
   - Testa kritiska flöden (checkout, split, refund)

### 7.2 Medel Sikt (1-2 månader)

1. **Stripe Connect**
   - Implementera merchant onboarding
   - Implementera community payouts
   - Bank account verification

2. **Loggning**
   - Strukturerad loggning (JSON)
   - Correlation IDs
   - Centraliserad loggaggregator

3. **Monitoring**
   - Metrics för Split Engine
   - Wallet reconciliation
   - Alerting för failed payments

### 7.3 Lång Sikt (3-6 månader)

1. **Multi-currency**
   - Stöd för EUR, USD, SEK
   - Valutakonvertering

2. **Tax calculation**
   - VAT per region
   - Sales tax

3. **AI/ML**
   - Demand forecasting
   - Route optimization
   - Fraud detection

---

## 8. Prestanda & Skalbarhet

### 8.1 Databas

**Optimeringar:**
- Index på alla FK och sökfält
- RLS policies optimerade
- Connection pooling (Supabase)

**Framtida optimeringar:**
- Read replicas för analytics
- Partitioning av orders/ledger per datum
- Materialized views för leaderboards

### 8.2 API

**Optimeringar:**
- `force-dynamic` där behövs
- SSR för dynamiskt innehåll
- ISR för produkt-sidor

**Framtida optimeringar:**
- Redis cache för hot data
- Rate limiting per user/IP
- CDN för statiska assets

### 8.3 Frontend

**Optimeringar:**
- Next.js Image component
- Code splitting
- Lazy loading

**Framtida optimeringar:**
- Edge functions för geolokalisering
- Service Workers för offline

---

## 9. Compliance & Legal

### 9.1 GDPR

**Personuppgifter:**
- `profiles` - Namn, e-post, telefon, adress
- `orders` - Kunddata
- `returns` - Returdata

**Rättigheter:**
- Right to access (implementerad via API)
- Right to delete (ej implementerad)
- Right to rectification (ej implementerad)

### 9.2 PCI DSS

**Stripe Integration:**
- Stripe hanterar kortdata
- Ingen kortdata lagras lokalt
- PCI compliance via Stripe

### 9.3 Finansiell Reglering

**Treasury:**
- Ledger för audit trail
- Immutable transaktioner
- Escrow för riskhantering

---

## 10. Sammanfattning

GoalSquad v2.0 är en välarkitekterad plattform med:

**Styrkor:**
- Database-first design med RLS
- Atomiska finansiella transaktioner
- Robust auth/auktorisation
- Anti-cheat system
- Audit trail

**Säkerhetsstatus:**
- Kritiska sårbarheter lösta
- RLS på alla tabeller
- Audit OTP implementerat
- IDOR-fixar på plats

**Förbättringsområden:**
- Checkout-validering
- Payout implementation
- Enhetstestning
- Loggning/monitoring

**Produktionsklarhet:**
- Kärnfunktionalitet: ✅
- Säkerhet: ✅ (kritiska risker lösta)
- Finansiella flöden: ✅ (escrow, refund)
- Payout: ❌ (ej implementerat)
- Compliance: ⚠️ (GDPR delvis)

---

## Bilaga: Migrationer

| ID | Namn | Syfte |
|----|------|-------|
| 062 | Comprehensive RLS fix | RLS policies för nyckeltabeller |
| 063 | Atomic split engine | Atomisk split + escrow |
| 064 | Audit OTP | Server-side OTP-lagring |
| 065 | Public safe views | Säkra vyer för merchants/communities |
| 066 | Close active anon read | Stäng återstående anon-läckage |
| 067 | RLS policies for frontend | Policys för return-tabeller |
| 068 | Harden SECURITY DEFINER | Härda RPC-funktioner |
| 069 | Add seller/warehouse to orders | Escrow-triggering |

---

**Dokumentversion:** 1.0  
**Senast uppdaterad:** 2026-05-31  
**Nästa granskning:** Efter implementation av kort-sikt rekommendationer
