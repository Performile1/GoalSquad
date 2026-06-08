# GoalSquad — Teknisk analys: Inloggning, roller & användarflöden

> Dokument för dialog med Gemini / AI-assistenter. Beskriver hela autentiserings- och auktoriseringsarkitekturen, samt hur varje användartyp navigerar i applikationen.
> Skapat: 2026-06-08
> Baseras på: `middleware.ts`, `lib/auth-context.tsx`, `lib/api-auth.ts`, `app/dashboard/page.tsx`, `app/auth/callback/route.ts`, samt rollspecifika sidor.

---

## 1. Arkitekturöversikt (high-level)

```
┌─────────────────────────────────────────────────────────────────┐
│                      ANVÄNDARE (Browser)                         │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Next.js 14 (App Router)                                       │
│  ├─ Middleware (`middleware.ts`) — session + role check        │
│  ├─ Client Context (`lib/auth-context.tsx`) — React context    │
│  ├─ API Helpers (`lib/api-auth.ts`) — route protection         │
│  └─ Pages (`app/**`) — role-specific UIs                       │
└──────────────┬──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Supabase                                                        │
│  ├─ Auth (JWT sessions, cookies)                                 │
│  ├─ Database (Postgres) — profiles, entities, RLS              │
│  └─ Storage (avatars, product images)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Inloggningsflöde (steg för steg)

### 2.1 Konsument / ny användare

```
1. Besökarsida (/, /marketplace, /products)
   │
   ▼
2. Klickar "Logga in" → /auth/login?redirect=/checkout
   │  • Visar email/password + Google/Facebook OAuth
   │  • `redirect` query-param sparas för återvänd
   │
   ▼
3. Inloggning (tre vägar):
   │
   ├── A. Email + Password
   │      └─→ `supabase.auth.signInWithPassword()`
   │
   ├── B. Google OAuth
   │      └─→ `supabase.auth.signInWithOAuth({provider:'google'})`
   │          → redirect till Google → /auth/callback?code=...
   │
   └── C. Facebook OAuth
          └─→ samma mönster som Google
   │
   ▼
4. Auth callback (`/auth/callback/route.ts`)
   │  • `exchangeCodeForSession(code)` — byter auth-kod mot JWT-session
   │  • Hämtar `profiles.role`
   │  • Role-based redirect:
   │      gs_admin    → /admin/dashboard
   │      merchant    → /merchants/{id}/dashboard (eller /onboard)
   │      warehouse   → /warehouses/{id}/dashboard (eller /onboard)
   │      seller      → /sellers/{id}/dashboard (eller /join)
   │      community   → /communities/{id}/dashboard (eller /communities)
   │      user        → /dashboard
   │
   ▼
5. `/dashboard/page.tsx` (fallback om ingen role-match)
   │  • Anropar `/api/auth/check-entity-role`
   │  • Priority-routing: warehouse > merchant > seller > community > consumer
   │  • `router.replace(...)` till rätt dashboard
   │
   ▼
6. Mål-dashboard renderas med data från rollspecifika API:er
```

### 2.2 Registrering

```
/auth/login → "Skapa konto" → /auth/register (eller inbäddat i /sellers/join)

Email-registrering:
  1. `signUp(email, password, fullName)` → Supabase Auth skapar user i `auth.users`
  2. Database trigger (migration 002) skapar rad i `profiles` med:
     • id = auth.uid
     • role = 'user'  (default consumer)
     • is_active = true
     • is_verified = false
  3. Säljare/Merchant/Community/Warehouse skapar sedan sin entitetsprofil
     via separat onboarding-flöde (t.ex. POST /api/sellers/register)
```

---

## 3. Rollsystemet — Single Source of Truth

### 3.1 Var roller lagras

| System | Fält | Status |
|--------|------|--------|
| `profiles.role` | `gs_admin`, `merchant`, `seller`, `community`, `warehouse`, `user` | **KANONISK** ✅ |
| `auth.users.user_metadata.role` | Legacy, kan vara osynkad | **DEPRECATED** ❌ |
| Entity-tabeller | `merchants.user_id`, `seller_profiles.user_id`, `warehouse_partners.user_id`, `communities.owner_id` | **VERIFIERANDE** 🔍 |

**Regel:** `profiles.role` är sanning. `auth-context.tsx` verifierar mot entity-tabeller och korrigerar rollen vid behov.

### 3.2 Rollhierarki & routing-prioritet

```
┌────────────────────────────────────────────────────────────────┐
│  Priority (högst → lägst):                                    │
│  1. warehouse     → /warehouses/{id}/dashboard               │
│  2. merchant      → /merchants/{id}/dashboard                │
│  3. seller        → /sellers/{id}/dashboard                  │
│  4. community     → /communities/{id}/dashboard              │
│  5. gs_admin      → /admin/dashboard                         │
│  6. user          → /dashboard (consumer-view)                │
└────────────────────────────────────────────────────────────────┘
```

*En användare kan ha flera roller (t.ex. både seller och community-owner), men dashboard dirigerar till den högsta prioriteten.*

### 3.3 Rollbestämning i realtid

**Client-side** (`lib/auth-context.tsx`):
```typescript
// 1. Hämta profiles.* från /api/auth/get-profile
// 2. Hämta entity-associeringar från /api/auth/check-entity-role
//    → { merchant: uuid|null, seller: uuid|null, warehouse: uuid|null, community: uuid|null }
// 3. Override correctRole baserat på entity-data:
//    warehouse ? 'warehouse' :
//    merchant  ? 'merchant'  :
//    seller    ? 'seller'    :
//    community ? 'community' :
//    gs_admin  ? 'gs_admin'  :
//    'user'
```

**Server-side** (`middleware.ts`):
```typescript
// Endast grov filtrering på path-prefix:
//   /admin      → kräver profiles.role = 'gs_admin'
//   /warehouses → kräver profiles.role = 'warehouse' ELLER 'gs_admin'
// Övriga routes: endast session krävs (via isProtected-listan)
```

---

## 4. Säkerhetslager (försvar på djupet)

```
Lager 1: Middleware (cookie-baserad session)
  └─ Oautentiserade → /auth/login?redirect=...
  └─ Fel roll för /admin eller /warehouses → /dashboard

Lager 2: API Route Guards (`lib/api-auth.ts`)
  ├─ `requireUser()`    → validerar session, returnerar {user, supabase}
  ├─ `requireRole(roles)` → requireUser + profiles.role check + is_active check
  └─ `requireAdmin()`   → convenience wrapper för 'gs_admin'

Lager 3: Service-role queries (`supabaseAdmin`)
  └─ Server-side API routes använder `supabaseAdmin` (bypassar RLS)
  └─ Client-side använder `supabase` (RLS-aware, begränsad)

Lager 4: Database RLS
  └─ ALLA tabeller har ENABLE ROW LEVEL SECURITY
  └─ Standardpolicy: `service_role` = full access
  └─ Viss tabeller har authenticated-owner policies
```

---

## 5. Användarflöden per roll

### 5.1 🔵 Konsument (user)

**Beskrivning:** Vanlig köpare, kan vara medlem i communities, handlar via kampanjer.

```
Flöde:
  / (landing) → /marketplace → /products/{id} → /cart → /checkout
  │
  ├─ Kan gå med i community via invite-länk
  ├─ Kan se säljares shop-sidor (/shop/{sellerId})
  └─ Dashboard: generisk consumer-view (/dashboard)

Skyddade sidor för consumer:
  /cart, /checkout, /orders, /messages, /account

API-anrop:
  • POST /api/checkout
  • GET  /api/orders
  • GET  /api/communities/{id}/products
```

### 5.2 🟢 Säljare (seller)

**Beskrivning:** Individ som säljer produkter inom en community/förening.

```
Onboarding:
  /sellers/join?community={id}&code={invite}
  │  1. Registrerar konto (om ny) eller loggar in
  │  2. Fyller i: org-typ, org-namn, telefon, invite-kod
  │  3. POST /api/sellers/register → skapar seller_profiles + sätter profiles.role='seller'
  │  4. Redirect → /sellers/{id}/dashboard

Dashboard (/sellers/{id}/dashboard):
  │  • Statistik: totalSales, totalOrders, currentLevel, xpTotal, streakDays
  │  • Avatar/utrustning (gamification)
  │  • Länkar till: Gamification, Orders, Campaigns, Settings
  │
  └─ Datakällor:
      • GET /api/sellers/{id}/stats
      • seller_profiles (egna fält: total_sales, current_level, xp_total)
      • seller_xp (kanonisk XP — synkas till seller_profiles via trigger)
      • orders (via order_items → products)

Gamification:
  /sellers/gamification
  │  • XP-progress, Level, Achievements, Loot boxes, Fire mode
  │  • Data: seller_xp, seller_quests, seller_quest_progress
```

### 5.3 🟡 Handlare / Merchants (merchant)

**Beskrivning:** Företag som säljer produkter direkt (ej via community-kampanjer).

```
Onboarding:
  /merchants/onboard
  │  1. Företagsinfo, org-nr, kontouppgifter för Stripe
  │  2. Skapar merchants-rad + seller_profiles-rad (implicit)
  │  3. profiles.role = 'merchant'

Dashboard (/merchants/{id}/dashboard):
  │  • Ordershantering, produktkatalog, intäktsrapport
  │  • Stripe Connect-integration för utbetalningar
  │
  └─ Datakällor:
      • merchants (egna fält)
      • products (merchant_id FK)
      • orders + order_items
      • stripe_settlements
```

### 5.4 🔴 Lager / Warehouse (warehouse)

**Beskrivning:** Partner som hanterar fysiska lager, plock, pack och utleverans.

```
Onboarding:
  /warehouses/onboard (om ej existerande)
  │  1. Företagsinfo, adress, kontakt
  │  2. Skapar warehouse_partners-rad
  │  3. profiles.role = 'warehouse'

Dashboard (/warehouses/{id}/dashboard):
  │  • Inkorg (breakdown), Plock, Ordrar, Personal
  │
  └─ Datakällor:
      • warehouse_partners
      • warehouse_inventory (via warehouse_id FK)
      • warehouse_picking_tasks
      • orders (assigned_warehouse_id)

Terminal-flöden:
  /warehouses/{id}/terminal/breakdown   ──► Pallet → bin assignment
  /warehouses/{id}/picklist/{picklistId} ──► Kampanjplock
  │  • API: /api/warehouse/terminal/pick
  • API: /api/warehouse/terminal/breakdown
```

### 5.5 🟣 Förening / Community (community)

**Beskrivning:** Idrottsförening som driver kampanjer via säljare.

```
Flöde:
  /communities → välj eller skapa community
  │
  ├─ Community Owner (profiles.role='community'):
  │   /communities/{id}/dashboard
  │   • Kampanjhantering, säljare, statistik
  │   • Medlemslista, invitations
  │
  └─ Community-medlem (profiles.role='user'):
      • Handlar i pågående kampanjer
      • Kan bli säljare via /sellers/join?community={id}

Datakällor:
  • communities (owner_id FK till profiles)
  • campaigns (community_id FK)
  • community_members
  • community_selected_products (products per community)
```

### 5.6 ⚫ Systemadmin (gs_admin)

**Beskrivning:** GoalSquad-intern admin med full access.

```
Dashboard (/admin/dashboard):
  │  • Översikt: communities, sellers, merchants, warehouses, sales
  │  • Entity-hantering: aktivera/avaktivera
  │  • Rapporter & Anti-cheat flags
  │  • Meddelanden (broadcast)
  │
  └─ Datakällor:
      • ALLA tabeller via supabaseAdmin
      • GET /api/admin/* (requireAdmin-guarded)

Admin-API:er:
  • GET    /api/admin/orders
  • GET    /api/admin/sellers
  • POST   /api/admin/sellers/{id}/activate
  • POST   /api/admin/sellers/{id}/deactivate
  • GET    /api/admin/analytics/*
```

---

## 6. Multi-roll-hantering (en användare, flera hattar)

**Problem:** En användare kan vara både `seller` och `community`-ägare.

**Lösning:** `check-entity-role` returnerar ALLA associeringar. Dashboard prioriterar enligt:

```typescript
// app/dashboard/page.tsx
if (entityData.warehouse)      → /warehouses/{id}/dashboard
else if (entityData.merchant)  → /merchants/{id}/dashboard
else if (entityData.seller)    → /sellers/{id}/dashboard
else if (entityData.community) → /communities/{id}/dashboard
```

**Roll-switcher:** Ingen explicit UI-switcher existerar idag. Användaren når andra roller genom att navigera direkt till URL (t.ex. `/sellers/{id}/dashboard` när de är inloggade som merchant). Middleware blockerar bara `/admin` och `/warehouses` på roll.

**Förslag till förbättring:** Lägg till roll-switcher i Navbar för användare med multipla roller.

---

## 7. Session & Timeout-hantering

```
AuthContext (`lib/auth-context.tsx`):
  • Default timeout: 30 minuter inaktivitet
  • Configurerbart via profile.metadata.session_timeout
  • Warning 1 minut före utloggning
  • Aktivitetsspårning: mousemove, keydown, scroll, click
  • `extendSession()` — manuell förlängning (t.ex. klick på "Jag är kvar")
```

---

## 8. Kända svagheter & förbättringsområden

| # | Problem | Konsekvens | Föreslagen åtgärd |
|---|---------|------------|-----------------|
| 1 | `profiles.role` kan bli osynkad med entity-tabeller | Användare ser fel dashboard | Trigger: `ON INSERT/UPDATE` på entity-tabeller → synka `profiles.role` |
| 2 | `user_metadata.role` (legacy) kan divergera | Förvirring vid debugging | Migrering: rensa `user_metadata.role`, använd endast `profiles.role` |
| 3 | Ingen explicit roll-switcher i UI | Svårt navigera multipla roller | Lägg till dropdown i Navbar baserat på `check-entity-role` |
| 4 | Middleware gör DB-query per request för /admin och /warehouses | Latens (~20-50ms) | Cacha roll i JWT-claims eller encrypted cookie |
| 5 | `auth-context.tsx` anropar två API-endpoints vid mount | Vattenfalls-latens | Slå ihop till en endpoint: `/api/auth/me` som returnerar profil + entities |
| 6 | `is_active` på profiles kan deaktivera utan logout | Inaktiv användare fortsätter surfa tills session expiry | Middleware bör kolla `is_active` på varje request |
| 7 | Gamification XP dubbellagras (`seller_xp` + `seller_profiles`) | Risk för drift | ✅ ÅTGÄRDAD — trigger (migration 107) synkar automatisk |
| 8 | `check-entity-role` äger `userId`-parameter som gs_admin kan använda | OK men dokumentera | Behåll, används för admin-impersonation |

---

## 9. API-auktoriseringsmönster (kopierbart)

### Skydda en API-route med roll

```typescript
// app/api/admin/orders/route.ts
import { requireAdmin } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;  // 401 eller 403

  const { user, profile } = auth;
  // ... hämta data med supabaseAdmin
}
```

### Skydda en API-route med generisk roll

```typescript
import { requireRole } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await requireRole(['merchant', 'gs_admin']);
  if ('error' in auth) return auth.error;
  // ...
}
```

### Client-side rollkoll

```typescript
const { profile } = useAuth();
const isSeller = profile?.role === 'seller';
const isAdmin  = profile?.role === 'gs_admin';
```

---

## 10. Ordlista för Gemini-dialog

| Term | Betydelse |
|------|-----------|
| `profiles` | Central användartabell (1:1 med `auth.users`) |
| `profiles.role` | Kanonisk roll: `gs_admin`, `merchant`, `seller`, `community`, `warehouse`, `user` |
| `entity` | Affärsentitet: merchant, seller, warehouse, community |
| `check-entity-role` | API-endpoint som avslöjar vilka entiteter en användare äger |
| `supabaseAdmin` | Service-role klient (bypassar RLS) — ENDAST server-side |
| `supabase` (browser) | Anon-key klient — RLS-respekterande, client-side |
| `requireRole` | API-helper som returnerar `{user, profile}` eller `{error}` |
| `is_active` | Profil-flagga — `false` = kontot deaktiverat |
| `seller_xp` | Kanonisk XP-tabell (synkas till `seller_profiles` via trigger) |
| `gs_admin` | GoalSquad systemadministratör |

---

*Dokumentet är avsett att klistras in som system prompt / kontext vid dialog med Gemini om autentisering, auktorisation eller rollspecifika flöden i GoalSquad.*
