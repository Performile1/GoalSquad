# GoalSquad — Environment Variables (Vercel)

Sätt dessa i Vercel → Project Settings → Environment Variables.
Aktivera för **Production**, **Preview** och **Development** om inget annat anges.

---

## ✅ OBLIGATORISKA (platformen fungerar inte utan dessa)

| Variabel | Värde | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | All |
| `SUPABASE_URL` | Samma som ovan (`https://xxxx.supabase.co`) | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (anon key från Supabase) | All |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service_role key — **HEMLIG**) | All |
| `STRIPE_SECRET_KEY` | `sk_live_...` / `sk_test_...` | All |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` / `pk_test_...` | All |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | All |
| `CRON_SECRET` | Valfri lång slumpsträng | All |

> ⚠️ **VIKTIGT**: `SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_URL` måste ha **samma värde**.
> Kodbas använder båda variabelnamnen på olika ställen. Se migration 038 för detaljer.

---

## 🔧 VALFRIA (aktiveras per funktion)

| Variabel | Används för | Scope |
|---|---|---|
| `REMOVE_BG_API_KEY` | Bakgrundsradering av produktbilder (remove.bg) | All |
| `CLOUDINARY_URL` | Bildbehandling via Cloudinary (alt. till remove.bg) | All |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | All |
| `CLOUDINARY_API_KEY` | Cloudinary API key | All |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | All |
| `NEXT_PUBLIC_APP_URL` | App URL för callbacks/redirects (`https://goalsquad.se`) | All |
| `OPENAI_API_KEY` | Om AI-funktioner läggs till | All |

---

## 📋 VAR HITTAR DU VÄRDENA?

### Supabase
1. Öppna [Supabase Dashboard](https://supabase.com/dashboard)
2. Välj ditt projekt → **Settings** → **API**
3. Kopiera:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### Stripe
1. Öppna [Stripe Dashboard](https://dashboard.stripe.com)
2. **Developers** → **API keys**
3. Kopiera Publishable key + Secret key
4. **Webhooks** → Skapa endpoint → `/api/webhooks/stripe` → kopiera signing secret

### Cron Secret
```bash
# Generera en säker sträng:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔍 VERIFIERING

Kör detta i Supabase SQL Editor efter att du kört migration 038:

```sql
-- Kontrollera alla tabeller
SELECT 
  t.expected_table,
  CASE WHEN pt.tablename IS NOT NULL THEN '✅ FINNS' ELSE '❌ SAKNAS' END AS status
FROM (VALUES
  ('organizations'), ('profiles'), ('communities'), ('community_members'),
  ('merchants'), ('products'), ('community_products'), ('blog_posts'),
  ('seller_profiles'), ('consolidation_warehouses'), ('warehouse_inventory'),
  ('orders'), ('order_items'), ('conversations'), ('invitations'),
  ('seller_xp'), ('avatar_items'), ('seller_quests'), ('seller_quest_progress'),
  ('loot_boxes'), ('community_milestones'), ('squad_tiers'), ('community_badges'),
  ('ads'), ('ad_stats'), ('notifications'), ('wallets'), ('ledger_entries'),
  ('treasury_holds'), ('split_configurations'), ('achievements'), ('shipments'),
  ('pick_sessions'), ('campaigns'), ('seo_settings')
) AS t(expected_table)
LEFT JOIN pg_tables pt ON pt.tablename = t.expected_table AND pt.schemaname = 'public'
ORDER BY status DESC, t.expected_table;
```
