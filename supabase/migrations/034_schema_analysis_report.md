# Schema Analysis Report — GoalSquad
*Skapad: 034_comprehensive_fix.sql*

## Alla tabeller som kodbas förväntar sig

| Tabell | Migrering | Status | Åtgärd |
|--------|-----------|--------|--------|
| `profiles` | 001 | ✅ Finns | Kolumner tillagda: `stripe_customer_id`, `organization_id/type/name`, `share_commission` |
| `organizations` | 001 | ✅ Finns | Kolumner tillagda: `invite_code`, `type` |
| `communities` | 001 | ✅ Finns | Kolumner tillagda: `is_active`, `city`, `country`, `total_members` |
| `community_members` | 001 | ✅ Finns | OK |
| `products` | 002/005 | ✅ Finns | OK |
| `product_categories` | 002 | ✅ Finns | OK |
| `merchants` | 002 | ✅ Finns | OK |
| `orders` | 002 | ✅ Finns | OK |
| `order_items` | 002 | ✅ Finns | OK |
| `seller_profiles` | 009 | ✅ Finns | Kolumner tillagda: `shop_url`, `total_sales`, `current_level`, `stripe_customer_id` |
| `seller_quests` | 009 | ✅ Finns | OK |
| `seller_quest_progress` | 009 | ✅ Finns | OK |
| `seller_xp` | 009 | ✅ Finns | OK |
| `seller_loot_boxes` | 009 | ✅ Finns | OK |
| `seller_avatar_equipment` | 009 | ✅ Finns | OK |
| `discount_codes` | 010 | ✅ Finns | OK |
| `returns` | 008 | ✅ Finns | OK |
| `return_items` | 008 | ✅ Finns | OK |
| `return_reasons` | 008 | ✅ Finns | OK |
| `shipments` | 006 | ✅ Finns | OK |
| `ad_placements` | 026 | ✅ Finns | OK |
| `ads` | 026+028+029+030 | ✅ Finns | Alla kolumner ensured, CHECK constraints fixade |
| `ad_stats` | 026 | ✅ Finns | OK |
| `ad_payments` | 026 | ✅ Finns | OK |
| `ad_payment_transactions` | 029 | ✅ Finns | RLS fixad (merchant_id → advertiser_id) |
| `admin_fee_config` | 029 | ✅ Finns | OK |
| `campaigns` | 032 | ✅ Finns | OK |
| `blog_posts` | blog_posts.sql | ✅ Finns | OK |
| `contact_information` | 023 | ✅ Finns | OK |
| `conversations` | 027 | ✅ Finns | OK |
| `conversation_participants` | 027 | ✅ Finns | OK |
| `messages` | 027 | ✅ Finns | OK |
| `community_products` | 005 | ✅ Finns | OK |
| `avatar_items` | 009 | ✅ Finns | OK |
| `warehouse_partners` | 031/033 | ✅ Finns | OK |
| **`notifications`** | 027 | ⚠️ Ensured | Tabell ensured i 034 |
| **`merchant_shipping_preferences`** | 006 | ⚠️ Ensured | Tabell ensured i 034 |
| **`consolidation_warehouses`** | ❌ Saknas | 🆕 SKAPAD | Ny tabell i 034 |
| **`warehouse_inventory`** | ❌ Saknas | 🆕 SKAPAD | Ny tabell i 034 |
| **`asn_notices`** | ❌ Saknas | 🆕 SKAPAD | Ny tabell i 034 |
| **`warehouse_events`** | ❌ Saknas | 🆕 SKAPAD | Ny tabell i 034 |
| **`product_flow_summary`** | ❌ Saknas | 🆕 SKAPAD | Ny tabell i 034 |
| **`entity_goals`** | ❌ Saknas | 🆕 SKAPAD | Ny tabell i 034 |
| **`wallets`** | ❌ Saknas | 🆕 SKAPAD | Ny tabell i 034 |
| **`leaderboards`** | ❌ Saknas | 🆕 SKAPAD | Ny tabell i 034 |
| **`user_achievements`** | ❌ Saknas | 🆕 SKAPAD | Ny tabell i 034 |
| **`squad_tiers`** | ❌ Saknas | 🆕 SKAPAD | Ny tabell i 034 |
| **`community_milestones`** | ❌ Saknas | 🆕 SKAPAD | Ny tabell i 034 |
| **`community_badges`** | ❌ Saknas | 🆕 SKAPAD | Ny tabell i 034 |
| **`coordination_messages`** | ❌ Saknas | 🆕 SKAPAD | Ny tabell i 034 |
| **`merchant_community_messages`** | ❌ Saknas | 🆕 SKAPAD | Ny tabell i 034 |
| **`broadcast_messages`** | ❌ Saknas | 🆕 SKAPAD | Ny tabell i 034 |
| **`broadcast_recipients`** | ❌ Saknas | 🆕 SKAPAD | Ny tabell i 034 |
| **`customer_support_stats`** | ❌ Saknas | 🆕 SKAPAD | Ny tabell i 034 |

## Kritiska buggfixar i funktioner

### `get_active_ads_for_placement()` (Migration 028 — TRASIG)
```sql
-- FEL (028):
JOIN ad_placements ap ON a.id = ap.ad_id  -- ap.ad_id finns inte!
-- Refererar merchant_id som inte finns på ads-tabellen

-- RÄTT (034):
WHERE a.placement_id = p_placement_id  -- korrekt FK-relation
```

### `check_total_ad_limits()` (Migration 028 — TRASIG)
```sql
-- FEL: Refererar total_views, total_days som inte finns på ads
-- RÄTT: Använder max_views, max_clicks, end_date som faktiskt finns
```

### `ad_payment_transactions` RLS (Migration 029 — FEL KOLUMN)
```sql
-- FEL: ads.merchant_id = auth.uid()   ← merchant_id finns inte!
-- RÄTT: ads.advertiser_id = auth.uid()
```

### `ads` UPDATE policy (Migration 028 — FEL KOLUMN)
```sql
-- FEL: merchant_id = auth.uid()
-- RÄTT: advertiser_id = auth.uid()
```

## Körning
Kör `034_comprehensive_fix.sql` i Supabase SQL Editor.
Är idempotent — kan köras flera gånger utan problem.
