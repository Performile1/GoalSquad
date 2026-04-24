# GoalSquad - Kod & Databas Gap-analys
_Senast uppdaterad: 2026-04-24_

---

## 🔴 SAKNADE API-ROUTES (sida anropar endpoint som inte finns)

| Endpoint som anropas | Fil som anropar | Status |
|---|---|---|
| `/api/merchants/[id]/stats` | `merchants/[id]/dashboard/page.tsx` | ❌ Saknas |
| `/api/merchants/[id]/conversations` | `merchants/[id]/messages/page.tsx` | ❌ Saknas |
| `/api/merchants/[id]/orders` | `merchants/[id]/orders/page.tsx` | ❌ Saknas |
| `/api/merchants/[id]` GET | `merchants/[id]/page.tsx` | ❌ Saknas |
| `/api/merchants/[id]/products/[productId]` | `merchants/[id]/products/[productId]/page.tsx` | ❌ Saknas |
| `/api/warehouses/[id]/stats` | `warehouses/[id]/dashboard/page.tsx` | ❌ Saknas |
| `/api/warehouses/[id]/orders` | `warehouses/[id]/orders/page.tsx` | ❌ Saknas |
| `/api/warehouses/[id]/incoming-pallets` | `warehouses/[id]/management/page.tsx` | ❌ Saknas |
| `/api/warehouses/[id]/consolidation-groups` | `warehouses/[id]/management/page.tsx` | ❌ Saknas |
| `/api/warehouses/[id]/shipments` | `warehouses/[id]/management/page.tsx` | ❌ Saknas |
| `/api/warehouses/[id]/pallets/[id]/receive` | `warehouses/[id]/management/page.tsx` | ❌ Saknas |
| `/api/warehouses/[id]/consolidations` | `warehouses/[id]/management/page.tsx` | ❌ Saknas |
| `/api/sellers/[id]/orders` | `sellers/[id]/orders/page.tsx` | ❌ Saknas |
| `/api/sellers/[id]/avatar/save` | `sellers/[id]/avatar/create/page.tsx` | ❌ Saknas |
| `/api/guardians/[id]/dashboard` | `guardians/[id]/dashboard/page.tsx` | ❌ Saknas |
| `/api/conversations/[id]/messages` | `merchants/[id]/messages/page.tsx` | ❌ Saknas |
| `/api/products/validate-ean` | `merchant/products/create/page.tsx` | ❌ Saknas |
| `/api/products/[id]/moq` PUT | `merchant/products/[id]/moq-settings/page.tsx` | ❌ Saknas |

---

## 🟡 SAKNADE UI-SIDOR (databas-tabeller utan frontend)

| Tabell/Feature | Sida som saknas |
|---|---|
| `regional_moq_rules` | `/merchants/[id]/moq-rules` (lista/hantera regionala MOQ-regler) |
| `product_warehouse_assignments` | `/merchants/[id]/warehouses` (tilldela produkter till lager) |
| `community_selected_products` | Delvis täckt i `/communities/[id]/products` |
| `consumer_product_preferences` | `/account/product-preferences` ✅ finns |
| `warehouse_partners` profil/settings | `/warehouses/[id]/settings` ❌ Saknas |
| `merchants` profil/settings | `/merchants/[id]/settings` ❌ Saknas |
| `seller_profiles` profil/settings | `/sellers/[id]/settings` ❌ Saknas |
| `communities` settings | `/communities/[id]/settings` ✅ finns |
| `campaigns` | `/admin/campaigns` ✅, men `/communities/[id]/campaigns` ✅ |
| `product_barcodes` | Ingen sida för att hantera streckkoder |
| `asn_notices` (Advanced Shipment Notice) | Ingen merchant-sida för ASN |
| `pick_sessions` / `pick_session_items` | `/warehouses/[id]/management` - delvis täckt |
| `leaderboards` / `user_achievements` | `/leaderboard` ✅, `/account/gamification` ✅ |
| `blog_posts` | `/blog` ✅ läs, `/admin/blog` ✅ skriv |

---

## 🔵 KONTO-SIDOR SOM SAKNAS

| Roll | Saknad sida |
|---|---|
| **Merchant** | `/merchants/[id]/settings` - redigera företagsinfo, bank, org.nr |
| **Warehouse** | `/warehouses/[id]/settings` - redigera lagerpartner-info |
| **Seller** | `/sellers/[id]/settings` - redigera profil, bank, adress |
| **Consumer** | `/account` ✅ finns, men saknar adressfält och personnummer |
| **Community** | `/communities/[id]/settings` ✅ finns - kolla om org.nr, kontakt, adress finns |

---

## 🟢 API-ROUTES SOM FINNS

### Merchants
- ✅ `/api/merchants/onboard` 
- ✅ `/api/merchants/verify`
- ✅ `/api/merchants/showcase`
- ✅ `/api/merchants/[id]/products` GET
- ✅ `/api/merchants/[id]/message-community`

### Sellers
- ✅ `/api/sellers/[id]/stats`
- ✅ `/api/sellers/[id]/avatar`
- ✅ `/api/sellers/[id]/returns`
- ✅ `/api/sellers/register`
- ✅ `/api/sellers/xp`
- ✅ `/api/sellers/quests`
- ✅ `/api/sellers/loot-boxes`

### Warehouses
- ✅ `/api/warehouses` (list)
- ✅ `/api/warehouses/find`
- ✅ `/api/warehouses/[id]/flow`

### Communities
- ✅ `/api/communities/[id]/merchants`
- ✅ `/api/communities/[id]/product-goals`
- ✅ `/api/communities/[id]/products`

---

## 📊 DATABAS KONTRA KOD - SAMMANFATTNING

| Tabell | API | UI | Status |
|---|---|---|---|
| `profiles` | Via auth | `/account` | ⚠️ Saknar adress/personnummer-formulär |
| `communities` | ✅ | ✅ | ⚠️ Settings sida - kolla fält |
| `merchants` | ⚠️ Saknar stats, orders, GET /[id] | ⚠️ Saknar settings | 🔴 Behöver arbete |
| `seller_profiles` | ⚠️ Saknar orders | ⚠️ Saknar settings | 🟡 |
| `warehouse_partners` | ⚠️ Saknar stats, orders, management | ⚠️ Saknar settings | 🔴 Behöver arbete |
| `products` | ✅ | ✅ | ✅ |
| `orders` | ✅ | ✅ | ✅ |
| `returns` | ✅ | ✅ | ✅ |
| `regional_moq_rules` | ❌ Saknas helt | ❌ Saknas | 🔴 Ny |
| `product_warehouse_assignments` | ❌ Saknas | ❌ Saknas | 🔴 Ny |
| `product_barcodes` | ❌ Saknas | ❌ Saknas | 🔴 Ny |
| `asn_notices` | ❌ Saknas | ❌ Saknas | 🔴 Ny |
| `pick_sessions` | ⚠️ Delvis | ⚠️ Delvis | 🟡 |
| `campaigns` | ✅ | ✅ | ✅ |
| `leaderboards` | ✅ | ✅ | ✅ |
| `community_merchants` | ✅ | ✅ | ✅ |
| `community_selected_products` | ✅ | ✅ | ✅ |
| `consumer_product_preferences` | ✅ | ✅ | ✅ |

---

## 🚨 PRIORITETSORDNING

### P1 - Kritiska API-routes som blockerar befintliga sidor
1. `/api/merchants/[id]` - GET merchant details
2. `/api/merchants/[id]/stats` - Dashboard stats
3. `/api/merchants/[id]/orders` - Order list
4. `/api/warehouses/[id]/stats` - Warehouse dashboard
5. `/api/sellers/[id]/orders` - Seller orders

### P2 - Settings/profil-sidor
1. `/merchants/[id]/settings`
2. `/warehouses/[id]/settings`  
3. `/sellers/[id]/settings`
4. `/account` - lägg till adress/personnummer-fält

### P3 - Nya features utan frontend
1. Regional MOQ-regler UI
2. Product-warehouse assignments UI
3. Product barcodes UI
4. ASN Notices UI
