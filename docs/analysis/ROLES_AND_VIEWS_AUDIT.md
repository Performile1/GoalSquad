# GoalSquad — Kritisk kontroll: Roller, Vyer & Saknade Funktioner

> Skapat: 2026-06-08
> Syfte: verifiera att alla användarroller, vyer, rättigheter och flöden faktiskt finns och hänger ihop.
> Metod: kodgranskning av `app/`, `middleware.ts`, `lib/api-auth.ts`, `lib/auth-context.tsx` och migrations.

---

## 0. Sammanfattning (TL;DR)

| # | Problem | Allvar | Status |
|---|---------|--------|--------|
| 1 | **Två oförenliga rollsystem** (`profiles.role` vs `user_metadata.role`/`detailed_role`) | 🔴 Kritisk | Bekräftad |
| 2 | **Navbar är inte rollmedveten** — inloggad merchant ser "Registrera dig", "Bli Merchant", "Föreslå produkt" och saknar länkar till sin dashboard/produkter/order | 🔴 Hög | Bekräftad |
| 3 | **Warehouse-dashboard länkar till 3 sidor som inte finns** (`/shipments`, `/consolidations`, `/splits`) och länkar INTE till de som finns (orders, picklist, returns, terminal) | 🔴 Hög | Bekräftad |
| 4 | **Middleware skyddar bara session, inte roll** — en seller kan nå `/admin`, `/warehouses/*` | 🔴 Hög | Bekräftad |
| 5 | **CSV/bulk-import saknar UI** — API:t `/api/merchants/bulk/products` finns men exponeras bara i admin unified-dashboard (hårdkodat) | 🟡 Medium | Bekräftad |
| 6 | **Alla nya användare = "Ej verifierad"** — triggern binder `is_verified` till `email_confirmed_at`, och blandar ihop e-postbekräftelse med konto-godkännande | 🟡 Medium | Bekräftad |
| 7 | **Warehouse saknar: personalregister, plockorder-lista, splitorder-vy, returvy i dashboard, skrivar-/plockdator-inställningar** | 🟡 Medium | Bekräftad |
| 8 | **Login-redirect tappade param** — middleware satte `redirectTo` men `/auth/login` läser `redirect`, och gick via en onödig `/login`-hopp | � Medium | ÅTGÄRDAD (middleware pekar nu direkt på `/auth/login?redirect=`) |

---

## 1. Rollsystemet — den största risken

### 1.1 Två parallella sanningar om roller

**System A — `profiles.role`** (används av `lib/auth-context.tsx`, `lib/api-auth.ts::requireRole`, `app/dashboard/page.tsx`):
```
gs_admin | merchant | seller | community | warehouse | user
```

**System B — `user_metadata.role` / `user_metadata.detailed_role`** (används av warehouse- och tracking-API:er):
```
admin | warehouse_staff | warehouse_admin | lagerpersonal | lager
```

Exempel på konflikt — `app/api/warehouses/[id]/inventory/route.ts`:
```ts
const userRole = session?.user?.user_metadata?.role;
const userDetailedRole = session?.user?.user_metadata?.detailed_role;
if (!session || !['admin','warehouse_staff','warehouse_admin','lagerpersonal','lager']
      .includes(userRole || userDetailedRole || '')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```
En användare med `profiles.role = 'warehouse'` (som hela frontend/dashboard antar) blir **nekad** här, eftersom kontrollen läser `user_metadata`, inte `profiles`. → Lagerpersonal kan inte uppdatera lagersaldo.

Samma mönster i `app/api/tracking/[orderId]/route.ts` och `app/api/admin/reports/generate/route.ts`.

### 1.2 `admin` ≠ `gs_admin`
- `requireAdmin()` kräver `profiles.role === 'gs_admin'`.
- Flera API:er kollar `user_metadata.role === 'admin'`.
- `app/api/admin/users/update/route.ts` har `validRoles = ['admin','merchant','warehouse_staff','user']` — saknar `seller`, `community`, `warehouse`, `gs_admin`.

### 1.3 Åtgärd
- **Välj EN källa till sanning** (rekommendation: `profiles.role` + ev. `profiles.detailed_role` för lagerpositioner).
- Ersätt alla `user_metadata.role`-kontroller med `requireRole(...)`.
- Synka rollnamn: bestäm om det heter `warehouse` eller `warehouse_staff`, `gs_admin` eller `admin`.
- Uppdatera `validRoles` i admin-user-update till hela enum:en.

---

## 2. Navbar & rollmedveten navigation

`app/components/Navbar.tsx` använder bara `user` (inloggad/ej), aldrig `profile.role`. Konsekvenser:

- Inloggad **merchant** ser fortfarande:
  - "Registrera dig →" (`/join`)
  - "Bli Merchant →" (mobilmeny, `/merchants/onboard`)
  - "Min sida" → `/dashboard` (ingen direktlänk till `/merchants/[id]/dashboard`, produkter, order)
- Login-länk pekar på **`/auth/login`** (finns ej) → ska vara `/login`.
- "Föreslå produkt"-CTA visas på `/products` och `/marketplace` för alla — även merchants (konsument-flöde).

### Åtgärd
- Gör Navbar rollmedveten: rendera meny utifrån `profile.role`
  (merchant → Produkter/Order/Returer/Inställningar; warehouse → Plock/Order/Retur/Inställningar; seller → Dashboard/Shop/Order; admin → Adminpanel).
- Dölj "Bli Merchant"/"Registrera dig"/"Föreslå produkt" för icke-konsumentroller.
- Rätta login-länk till `/login` (här + `app/dashboard/page.tsx` rad ~36).

---

## 3. Merchant — vyer & gap

| Vy | Fil | Status |
|----|-----|--------|
| Dashboard | `app/merchants/[id]/dashboard/page.tsx` | ✅ |
| Produktlista | `app/merchants/[id]/products/page.tsx` | ✅ (har "+ Ny produkt") |
| Ny produkt | `app/merchants/[id]/products/new/page.tsx` | ✅ |
| Produktredigering | `app/merchants/[id]/products/[productId]/page.tsx` | ✅ |
| Order | `app/merchants/[id]/orders/page.tsx` | ✅ |
| Inställningar | `app/merchants/[id]/settings/page.tsx` | ✅ |
| MOQ-regler / ASN / Streckkoder / Lagertilldelning | `app/merchants/[id]/...` | ✅ |
| **Returer** | `app/merchants/me/returns/page.tsx` | ⚠️ Finns men **inte länkad** från dashboard, och fel prefix (`me` vs `[id]`) |
| **CSV/bulk-import** | — | ❌ Saknar UI (API finns: `/api/merchants/bulk/products`) |

**Prefix-spaghetti:** merchant-sidor finns både under `/merchants/[id]/...` OCH `/merchants/me/...` (`me/products/create`, `me/returns`, `me/settings/branding`). Två parallella struktur → välj en.

### Åtgärd
- Lägg till **Returer**-knapp + **Importera CSV**-knapp i merchant-dashboardens Snabbåtgärder.
- Bygg CSV-import-UI som postar till `/api/merchants/bulk/products` (drag-drop + kolumnmappning + förhandsvisning).
- Normalisera `/merchants/me/*` → `/merchants/[id]/*`.

---

## 4. Warehouse — vyer & gap (störst behov)

**Befintliga sidor:** dashboard, management, management/queue, orders, picklist/[picklistId], settings, terminal/breakdown, onboard, returns.

**Dashboardens Snabbåtgärder länkar till sidor som INTE finns:**
```
/warehouses/[id]/shipments        ❌ 404
/warehouses/[id]/consolidations   ❌ 404
/warehouses/[id]/splits           ❌ 404
/warehouses/[id]/settings         ✅
```
Och länkar INTE till de som finns: `orders`, `picklist`, `returns`, `management`, `terminal`.

**Saknas helt:**
| Funktion | Status |
|----------|--------|
| Plockorder-lista (översikt över alla plockuppdrag) | ❌ (bara detaljvy `picklist/[picklistId]`) |
| Splitorder-vy | ❌ (länkad men saknas) |
| Returhantering länkad i dashboard | ⚠️ `app/warehouses/returns` finns, ej länkad |
| Personalregister (lagerpersonal/roller per lager) | ❌ |
| Skrivar-/etikett-inställningar | ❌ |
| Plockdator-/terminalkonfiguration | ❌ |

`app/warehouses/[id]/settings/page.tsx` har bara: Lagerinfo, Kontakt, Postnummer/Territorium, API/Webhook. Ingen skrivare/terminal/personal.

### Åtgärd
1. **Rätta dashboard-länkarna** så de pekar på existerande sidor (orders, picklist, returns, terminal) — quick win.
2. Bygg **plockorder-översikt** (`/warehouses/[id]/picklist` lista).
3. Bygg **splitorder-vy** eller ta bort knappen tills den finns.
4. Lägg till **Personalregister** (tabell `warehouse_staff` + CRUD-vy + roller).
5. Utöka settings med **skrivare/etiketter** och **plockdator/terminal**-flikar.

---

## 5. Middleware & rättigheter

`middleware.ts` kontrollerar **enbart att session finns**, inte roll:
```ts
const isProtected = pathname.startsWith('/admin') || pathname.startsWith('/warehouses') || ...
if (!session && isProtected) redirect('/login')
```
→ En inloggad **seller** kan navigera till `/admin/dashboard` eller `/warehouses/[id]/dashboard`. Skyddet ligger bara i klientkomponenter (kan kringgås).

### Åtgärd
- Lägg till **rollkontroll** i middleware (hämta `profiles.role` och matcha prefix mot tillåtna roller), ELLER inför server-side guard (`requireRole`) i varje skyddad layout.
- Komplettera med RLS i DB som sista försvarslinje (de flesta API:er kör `supabaseAdmin` = RLS av).

---

## 6. Verifieringsstatus ("Ej verifierad")

`supabase/migrations/022_auth_profile_trigger.sql`:
```sql
is_verified = NEW.email_confirmed_at IS NOT NULL;
```
- Alla nya konton börjar `is_verified = false` tills e-post bekräftas.
- Om e-postbekräftelse är avstängd i Supabase, eller mailen inte når fram, fastnar **alla** som "ej verifierad".
- Fältet blandar två koncept: **e-postbekräftelse** vs **konto-/partner-godkännande** (merchant/warehouse kräver manuell verifiering).

### Åtgärd
- Separera: `email_confirmed` (auth) vs `is_verified` (affärsgodkännande av admin).
- Kontrollera Supabase Auth-inställning "Confirm email" och att SMTP fungerar.
- Lägg admin-flöde för att verifiera merchants/warehouses (knapp i `app/admin/merchants` / `app/admin/warehouses`).
- Backfill: sätt `is_verified = true` för redan bekräftade konton.

---

## 7. Rollmatris — vad varje roll bör se (mål)

| Roll | Landningssida | Ska se | Ska INTE se |
|------|---------------|--------|-------------|
| `user` (konsument) | `/dashboard` | Handla, Order, Communities, Föreslå produkt, Bli Merchant | Admin/Warehouse/Merchant-paneler |
| `seller` | `/sellers/[id]/dashboard` | Min shop, Order, XP/Gamification, Returer | Bli Merchant, Admin |
| `merchant` | `/merchants/[id]/dashboard` | Produkter, CSV-import, Order, Returer, Inställningar, Streckkoder | Registrera dig, Bli Merchant, Föreslå produkt |
| `warehouse` | `/warehouses/[id]/dashboard` | Plockorder, Splitorder, Order, Returer, Personal, Settings (skrivare/terminal) | Merchant/Admin-paneler |
| `community` | `/communities/[id]/dashboard` | Medlemmar, Kampanjer, Leaderboard | Admin |
| `gs_admin` | `/admin/dashboard` | Allt | — |

---

## 8. Prioriterad åtgärdsplan

### 🔴 Omedelbart (1–2 dagar)
1. Ena rollsystemet → `profiles.role`; ersätt `user_metadata.role`-kontroller med `requireRole`.
2. Rätta login-route `/auth/login` → `/login` (Navbar + dashboard).
3. Rätta warehouse-dashboardens döda länkar.
4. Lägg rollkontroll i middleware.

### 🟡 Denna vecka
5. Rollmedveten Navbar (dölj fel CTA:er, lägg rollspecifika länkar).
6. CSV-import-UI för merchant.
7. Länka merchant-returer + warehouse-returer i respektive dashboard.
8. Separera `is_verified` från e-postbekräftelse + admin-godkännandeflöde.

### 🟢 Denna månad
9. Warehouse: plockorder-lista, splitorder-vy, personalregister, skrivar-/terminal-settings.
10. Normalisera prefix `/merchants/me/*` → `/merchants/[id]/*`.
11. RLS-policies som sista försvarslinje.

---

*Underlag för team-review. Verifiera DB-tillstånd (roller, is_verified) direkt mot Supabase innan migrationer körs.*
