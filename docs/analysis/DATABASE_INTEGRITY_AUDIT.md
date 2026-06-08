# GoalSquad — Kritisk databasanalys: schema vs kod

> Skapat: 2026-06-08
> Metod: Supabase MCP var nere, så analysen bygger på (a) alla `CREATE TABLE`/`CREATE VIEW` i `supabase/migrations/**` och `database/**`, korsrefererade mot (b) alla `.from('<tabell>')`-anrop i `app/**` och `lib/**`.
> **Viktigt:** kör verifieringsfrågorna i avsnitt 7 mot den faktiska databasen — produktion kan innehålla tabeller skapade utanför versionshanteringen.

---

## 0. Sammanfattning

| # | Problem | Allvar |
|---|---------|--------|
| 1 | **Två parallella schemakällor** — `supabase/migrations/` (89 filer) OCH `database/` (25 filer, varav 8 "complete/master setup") definierar schemat oberoende av varandra | 🔴 Kritisk |
| 2 | **5 "fantomtabeller"** — koden läser/skriver tabeller som inte definieras någonstans (`warehouses`, `sellers`, `warehouse_assignments`, `community_campaigns`, `community_selected_products`) | 🔴 Kritisk |
| 3 | **3 konkurrerande lager-tabeller** för samma koncept (`warehouses`, `warehouse_partners`, `consolidation_warehouses`) + FK-konflikt | 🔴 Hög |
| 4 | **2 konkurrerande säljar-tabeller** (`sellers` vs `seller_profiles`) | 🔴 Hög |
| 5 | **2 plock-system** (`pick_sessions`/`pick_session_items` vs `warehouse_picking_tasks`) | 🟡 Medium |
| 6 | **Luckor i migrationsnumrering** (014, 016–019, 045 m.fl. saknas) | 🟡 Medium |
| 7 | **Dubbla rollsystem** (`profiles.role` vs `user_metadata.role`) — se separat `ROLES_AND_VIEWS_AUDIT.md` | 🔴 Hög |
| 8 | **Ingen kanonisk club/class-modell** — "club" = `community`, "class" = informell `profiles.metadata.class_id` (ingen tabell); överlappar `teams` och `groups` | 🟡 Medium |

---

## 1. Två parallella schemakällor (rotproblem)

Schemat definieras på **två ställen som inte är synkade**:

- `supabase/migrations/` — 89 numrerade migrationer (versionshanterad sanning).
- `database/` — 25 fristående script, varav flera överlappande "hela schemat"-filer:
  - `CLEAN_INSTALL.sql`, `COMPLETE_SETUP.sql`, `COMPLETE_MASTER_SETUP.sql`, `FINAL_COMPLETE_SETUP.sql`, `MASTER_SETUP.sql`, `PRODUCTION_READY.sql`, `VERIFIED_COMPLETE.sql`, `VERIFY_SETUP.sql`

**Konsekvens:** Ingen vet vilken som faktiskt körts mot databasen. Tabeller kan finnas i produktion som inte finns i `migrations/`, och tvärtom. Detta är källan till de flesta övriga problemen.

### Åtgärd
- Utse `supabase/migrations/` som **enda** sanning.
- Arkivera/radera `database/*SETUP*.sql` (flytta till `docs/legacy/` eller ta bort).
- Kör `supabase db diff` mot produktion för att fånga drift och skapa en "reconciliation"-migration.

---

## 2. Fantomtabeller — kod utan schema (🔴 orsakar runtime-fel)

Dessa tabeller anropas i koden men finns **inte** i vare sig `migrations/` eller `database/`:

| Tabell i kod | Anropas i | Åtgärd | Status |
|--------------|-----------|--------|--------|
| `warehouses` | `checkout`, `warehouses/[id]/flow` | flow → `warehouse_partners` (ägarbaserad åtkomst); checkout kvarstår | ⚠️ Delvis (flow ÅTGÄRDAD, checkout kvar) |
| `sellers` | `admin/sellers`, `communities/[id]/sellers`, `admin/sellers/[id]/activate\|deactivate` | → `seller_profiles` + join `profiles` för `full_name` + migration `100` (is_active) | ✅ ÅTGÄRDAD |
| `warehouse_assignments` | `warehouses/[id]/flow` | borttagen (ersatt av ägar-/admin-kontroll) | ✅ ÅTGÄRDAD |
| `community_campaigns` | `admin/campaigns/[campaignId]/rules` | → `campaigns` (kolumner finns via `088`) | ✅ ÅTGÄRDAD |
| `community_selected_products` | `communities/[id]/products` | **finns i DB**, saknar bara migration | 🟡 Behöver migration (reverse-engineer) |

**Notera:** `public_merchants` och `payout_analytics_rollup` är giltiga **vyer** (`065_public_safe_views.sql`, `072_stripe_connect_risk_management.sql`) — inga problem.

**Verifierat mot DB (2026-06-08):** `warehouses`, `sellers`, `warehouse_assignments`, `community_campaigns` saknades; `community_selected_products` fanns.

**Kvar att göra:**
- `checkout/route.ts:115` använder fortfarande `warehouses` — behöver bytas till `warehouse_partners` (kräver kontroll av `community_id`-logiken, som `warehouse_partners` saknar).
- RPC `get_warehouse_flow` finns bara i `database/product-flow-tracking.sql`, inte i migrations — bör läggas till som migration (flow-endpointen faller nu tillbaka på tom data om RPC saknas).
- `community_selected_products` bör fångas i en migration.

### Åtgärd
- Bekräfta i produktion (avsnitt 7) om tabellerna finns. Om de finns → lägg till saknade migrationer. Om inte → rätta koden till rätt tabellnamn.
- Dessa endpoints (`admin/sellers`, `communities/[id]/sellers`, `communities/[id]/products`, `warehouses/[id]/flow`, `checkout` med `warehouseId`) är **trasiga** tills detta löses.

---

## 3. Konkurrerande lager-tabeller (🔴)

Tre tabeller representerar "lager", och olika delar av koden använder olika:

| Tabell | Definierad i | Används av |
|--------|--------------|------------|
| `warehouse_partners` | migrations (031, 033) | `/api/warehouses/[id]` (settings, orders, inventory), mina nya staff/picking-tasks |
| `consolidation_warehouses` | migrations | `warehouse_picking_tasks` FK (092), `warehouse_zones`, `warehouse_network` |
| `warehouses` | **odefinierad** | `checkout`, `warehouses/[id]/flow` |

### FK-konflikt (påverkar nyligen tillagd kod)
`warehouse_picking_tasks.warehouse_id` → **FK till `consolidation_warehouses(id)`** (`092_ecosystem_additions.sql:55`).
Men `/api/warehouses/[id]/picking-tasks` och `/api/warehouses/[id]/staff` (samt `/api/warehouses/[id]`) använder `warehouse_partners.id` som `[id]`.

→ Om `warehouse_partners.id` ≠ `consolidation_warehouses.id` returnerar plockorder-listan tomt och `warehouse_staff`-FK:n (migration 098) pekar på fel "warehouse-rymd".

### Åtgärd
- Bestäm **en** kanonisk lager-tabell (sannolikt `warehouse_partners`).
- Migrera `consolidation_warehouses`-referenser (picking_tasks, zones, network) till den.
- Rätta `checkout`/`flow` från `warehouses` → `warehouse_partners`.
- Verifiera FK för `warehouse_picking_tasks` och min `warehouse_staff` (098) mot vald tabell.

---

## 4. Konkurrerande säljar-tabeller (🔴)

- `seller_profiles` (definierad, kanonisk — används brett, t.ex. `messages/compose`, `campaign_sellers` FK).
- `sellers` (odefinierad) — används av admin-säljarendpoints och `communities/[id]/sellers`.

→ Admin kan inte lista/aktivera/avaktivera säljare (`/api/admin/sellers*` träffar fantomtabell).

### Åtgärd
- Ändra alla `sellers`-anrop till `seller_profiles` (kontrollera kolumnnamn: `is_active`, `user_id`, `community_id`).

---

## 5. Dubbla plock-system (🟡)

- `pick_sessions` + `pick_session_items` (order-nivå plock, migration 037).
- `warehouse_picking_tasks` (kampanj-nivå bulk-plock, migration 092 — kommentaren erkänner överlappet).

Detta är delvis avsiktligt men förvirrande. Plockterminalen (`/warehouses/[id]/picklist/[picklistId]`) använder dessutom **mockdata**, inte någon av tabellerna.

### Åtgärd
- Dokumentera vilken tabell som gäller för vilket flöde, eller slå ihop.
- Koppla plockterminalen till riktig data (idag hårdkodad).

---

## 6. Migrationshygien

- **Numreringsluckor:** 014, 016–019, 045+ saknas i sekvensen → svårt att veta om filer tappats bort.
- **"Validerings/check"-migrationer** som inte ändrar schema ligger blandat (`000_validate`, `003_check_columns`, `024_check_users`, `025_schema_comparison_report`, `038_db_audit`, `039_snapshot_query`). Dessa bör inte vara migrationer.

### Åtgärd
- Flytta rena diagnos-script till `scripts/` eller `docs/`.
- Dokumentera varför luckor finns (eller numrera om i en ren baslinje).

---

## 7. Förslag: hur ni löpande verifierar vad som saknas/inte fungerar

### A. Schema-vs-kod drift (kör direkt mot DB)
Lista tabeller koden använder men som saknas i DB:
```sql
-- Klistra in listan av .from()-tabeller och jämför:
SELECT t.name AS table_in_code
FROM (VALUES ('warehouses'),('sellers'),('warehouse_assignments'),
             ('community_campaigns'),('community_selected_products')) AS t(name)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema='public' AND table_name=t.name
);
```
Hitta tabeller som finns men aldrig används (kandidater för städning) — jämför mot kodlistan.

### B. Automatisera diffen (CI-steg)
Skripten jag körde kan läggas i CI:
```powershell
# Tabeller definierade i migrations
Get-ChildItem -Recurse -Include *.sql supabase/migrations |
  Select-String 'CREATE TABLE(\s+IF NOT EXISTS)?\s+(public\.)?(\w+)' -AllMatches |
  % { $_.Matches } | % { $_.Groups[3].Value } | Sort-Object -Unique

# Tabeller som koden använder
Get-ChildItem -Recurse -Include *.ts,*.tsx app,lib |
  Select-String "\.from\(['""](\w+)['""]\)" -AllMatches |
  % { $_.Matches } | % { $_.Groups[1].Value } | Sort-Object -Unique
```
Diffa listorna och låt bygget faila om kod refererar en tabell utan migration.

### C. Generera TypeScript-typer från DB
Kör `supabase gen types typescript` och använd den typade klienten (`createClient<Database>`). Då blir varje `.from('phantom')` ett **kompileringsfel** istället för ett runtime-fel.

### D. `supabase db diff` / `db lint`
- `supabase db diff` mot produktion → fångar drift mellan migrations och verklig DB.
- `supabase db lint` → fångar saknade index, RLS-luckor m.m.

### E. Advisors (när MCP är uppe)
Kör Supabase Security/Performance advisors regelbundet — särskilt för saknade RLS-policies (de flesta API:er kör `supabaseAdmin` = RLS av, så RLS testas aldrig i praktiken).

### F. Route-/API-täckning
- Lägg till en enkel test som anropar varje `app/api/**/route.ts` med en smoke-request och loggar 500:or.
- E2E (Playwright finns redan i `tests/e2e/`) som klickar igenom varje rolls huvudflöden.

---

## 8. Prioriterad åtgärdsplan

### 🔴 Omedelbart
1. Bekräfta fantomtabeller mot produktion (7A). Rätta kod eller lägg migrationer.
2. Ena lager-tabellen och säljar-tabellen (avsnitt 3–4); rätta `checkout`, `flow`, `admin/sellers`.
3. Verifiera FK för `warehouse_picking_tasks`/`warehouse_staff` mot vald lager-tabell.

### 🟡 Denna vecka
4. Utse `migrations/` som enda sanning; arkivera `database/*SETUP*.sql`.
5. Lägg in schema-vs-kod-diff (7B) i CI.
6. Generera och anta typade Supabase-typer (7C).

### 🟢 Denna månad
7. Slå ihop/dokumentera plock-systemen; koppla plockterminalen till riktig data.
8. Städa diagnos-migrationer; dokumentera numreringsluckor.
9. Inför RLS-policies + advisors i rutin.

---

## 9. Saknad club/class-hierarki (🟡)

Domänen har en förenings-/klasstruktur, men den är **inte modellerad konsekvent**:

| Begrepp | Hur det hanteras idag | Problem |
|---------|------------------------|---------|
| **Club / förening** | `communities` | OK (kanonisk) |
| **Class / klass** | `profiles.metadata.class_id` (fritextfält i JSON) | Ingen tabell, ingen FK, ingen integritet. Används i `@/Users/ricka/Documents/Develop/Standalone/Goalsquad/app/messages/compose/page.tsx:56` |
| **Team / lag** | `teams` (`community_id` FK, migration 033) | Överlappar "class" |
| **Group** | `groups` (`organization_id`, `campaign_id` FK, migration 082) | Parallellt grupperingsbegrepp, frikopplat från `communities` |

**Konsekvens:** "Skicka till klass" i meddelanden filtrerar på en ostrukturerad JSON-nyckel; det finns ingen lista över klasser, ingen koppling säljare→klass med integritet, och tre oladda grupperingsbegrepp (`teams`, `groups`, `metadata.class_id`).

### Rekommenderad kanonisk modell
```
communities (club/förening)
  └── classes (NY tabell, community_id FK)   -- ersätter metadata.class_id
        └── seller_profiles.class_id (NY FK)
```
- Inför `classes` (eller formalisera `teams` → `classes`).
- Lägg `class_id UUID REFERENCES classes(id)` på `seller_profiles`.
- Backfilla från `profiles.metadata->>'class_id'`.
- Besluta om `groups` ska slås ihop med `classes` eller behållas för kampanj-grupper.

---

## 10. Autonom åtgärdsplan (körbar, fas för fas)

> Varje steg har **mål → åtgärd → verifiering**. Kör verifieringen innan nästa steg. Allt skrivs som idempotenta migrationer (`IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`) så att de kan köras om.
> **Förutsättning för alla DDL-beslut:** kör först `\d <tabell>` eller `information_schema`-frågan i 7A mot produktion för att fastställa faktiska kolumner.

### Fas 0 — Baslinje & säkerhet (innan något ändras)
- **Mål:** veta exakt vad produktion innehåller.
- **Åtgärd:**
  1. Dumpa schema: `supabase db dump --schema public > docs/legacy/prod_schema_snapshot.sql`.
  2. Kör `supabase db diff` → spara drift mot `migrations/`.
  3. Kör schema-vs-kod-diffen (avsnitt 7B) och spara listan.
- **Verifiering:** snapshot + difflista incheckade i `docs/legacy/`.

### Fas 1 — Stoppa blödningen (klart / pågår)
- **Mål:** inga endpoints mot fantomtabeller.
- **Status:** `sellers`→`seller_profiles`, `community_campaigns`→`campaigns`, `flow`→`warehouse_partners`, RPC (migr. 101) — **KLART**.
- **Kvar:**
  - `@/Users/ricka/Documents/Develop/Standalone/Goalsquad/app/api/checkout/route.ts:115` (`warehouses`) — kräver community↔warehouse-beslut (se Fas 3).
  - Migration för `community_selected_products` (reverse-engineer från faktisk DB).
- **Verifiering:** `tsc --noEmit` grönt + 7B-difflistan tom för dessa namn.

### Fas 2 — En schemakälla
- **Mål:** `supabase/migrations/` = enda sanning.
- **Åtgärd:**
  1. Skapa `docs/legacy/` och flytta `database/*SETUP*.sql`, `CLEAN_INSTALL.sql`, `PRODUCTION_READY.sql`, `VERIFIED_COMPLETE.sql`, `VERIFY_SETUP.sql` dit.
  2. För kvarvarande `database/*.sql` som faktiskt innehåller schema som saknas i migrations (t.ex. `product-flow-tracking.sql`-vyer): extrahera till numrerade migrationer.
  3. Lägg en `README.md` i `database/` som pekar till `migrations/`.
- **Verifiering:** inga `CREATE TABLE` i `database/` som inte också finns i `migrations/`.

### Fas 3 — Konsolidera lager-modellen
- **Mål:** en kanonisk lager-tabell (`warehouse_partners`).
- **Åtgärd:**
  1. Migration: säkerställ `warehouse_partners` har de fält koden behöver (t.ex. `user_id`, ev. `community_id` om checkout-flödet kräver det).
  2. Migrera FK för `warehouse_picking_tasks`, `warehouse_zones`, `warehouse_network` från `consolidation_warehouses` → `warehouse_partners` (eller tvärtom — välj en).
  3. Rätta `@/Users/ricka/Documents/Develop/Standalone/Goalsquad/app/api/checkout/route.ts` (`warehouses` → vald tabell).
  4. Normalisera `warehouse_inventory` till **ett** kolumn-set (se Fas 6).
- **Verifiering:** alla `.from('warehouses')`-träffar borta; FK:er pekar på en tabell; checkout-smoke-test 200.

### Fas 4 — Konsolidera säljar- & gamification-modellen
- **Mål:** `seller_profiles` enda säljartabell (klart i kod); städa kolumndrift.
- **Åtgärd:** bekräfta `is_active` (migr. 100) i prod; säkerställ `xp_total`/`current_level` vs `seller_xp`/`xp_events` inte dubbellagras.
- **Verifiering:** admin-säljarlistan + aktivering/avaktivering fungerar end-to-end.

### Fas 5 — Club/class-hierarki (avsnitt 9)
- **Mål:** formell klassmodell.
- **Åtgärd:**
  1. Migration `classes` (`id`, `community_id` FK, `name`, `is_active`, timestamps).
  2. `ALTER TABLE seller_profiles ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id)`.
  3. Backfill: `UPDATE seller_profiles SET class_id = ... FROM profiles WHERE ...` baserat på `metadata->>'class_id'` (om värdena mappar).
  4. Ändra `@/Users/ricka/Documents/Develop/Standalone/Goalsquad/app/messages/compose/page.tsx` att filtrera på `seller_profiles.class_id` istället för `metadata`.
  5. Beslut: slå ihop `teams`/`groups` med `classes` eller dokumentera skillnaden.
- **Verifiering:** "skicka till klass" träffar rätt mottagare via FK; klasslista går att hämta.

### Fas 6 — Normalisera `warehouse_inventory`
- **Mål:** ett kolumn-set (idag 3–4 varianter: `quantity` vs `quantity_available/allocated/shipped`, `merchant_id → merchants` vs `→ profiles`).
- **Åtgärd:** migration som `ADD COLUMN IF NOT EXISTS` för det fullständiga setet + en `UPDATE` som fyller `quantity_available` från `quantity` där den saknas; standardisera FK-mål för `merchant_id`.
- **Verifiering:** `get_warehouse_flow` returnerar `by_merchant`-data; inventory-API:t läser samma kolumner.

### Fas 7 — Plock-system
- **Mål:** ett tydligt plockflöde.
- **Åtgärd:** dokumentera `pick_sessions` (order-nivå) vs `warehouse_picking_tasks` (kampanj-nivå); koppla plockterminalen (`@/Users/ricka/Documents/Develop/Standalone/Goalsquad/app/warehouses/[id]/picklist/[picklistId]/page.tsx`) till riktig data istället för mock.
- **Verifiering:** terminalen visar riktiga rader.

### Fas 8 — Förebygg återfall (CI & typer)
- **Mål:** drift fångas automatiskt.
- **Åtgärd:**
  1. CI-steg med 7B-diffen → fail om kod refererar tabell utan migration.
  2. `supabase gen types typescript` → typad klient (`createClient<Database>`).
  3. `supabase db lint` + advisors i CI.
  4. RLS-policies på alla tabeller (många API:er kör `supabaseAdmin` = RLS av).
- **Verifiering:** CI rött vid medveten testdrift; `tsc` fångar fantom-`.from()`.

### Fas 9 — Migrationshygien
- **Mål:** ren historik.
- **Åtgärd:** flytta diagnos-script (`000_validate`, `003_check_columns`, `024_check_users`, `025`, `038`, `039`) till `scripts/`; dokumentera numreringsluckor i `migrations/README.md`.
- **Verifiering:** endast schemaändrande filer kvar i `migrations/`.

### Beroendeordning
```
Fas 0 → Fas 1 → Fas 2 → { Fas 3, Fas 4, Fas 5 } → Fas 6 → Fas 7 → Fas 8 → Fas 9
```
Fas 3–5 kan köras parallellt efter Fas 2. Fas 6 förutsätter Fas 3.

---

*Underlag för team-review. Verifiera alltid mot faktisk DB (avsnitt 7) innan migrationer skrivs.*
