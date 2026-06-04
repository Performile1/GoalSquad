# Gap Analys: Ny Plan (Fas 1-4)

**Datum**: 2026-06-01  
**Status**: Kontroll av befintliga filer och routing

---

## 📊 Översikt

Denna analys identifierar vad som saknas för att implementera den nya 4-fas planen för logistik, analytics, UX och gamification.

---

## ✅ Befintliga Filer (Kan återanvändas)

### Warehouse & Logistik
- ✅ `app/api/warehouse/terminal/discrepancy/route.ts` - Avvikelsehantering API
- ✅ `app/warehouses/[id]/dashboard/page.tsx` - Lagerdashboard
- ✅ `app/warehouses/[id]/management/page.tsx` - Lagerhantering
- ✅ `app/components/logistics/BulkPickList.tsx` - Picklist komponent

### Checkout
- ✅ `app/api/checkout/route.ts` - Checkout API (kan behöva uppdateras för idempotency)
- ✅ `app/checkout/page.tsx` - Checkout sida

### Analytics
- ✅ `app/admin/analytics/page.tsx` - Admin analytics dashboard
- ✅ `app/api/admin/analytics/group/route.ts` - Group analytics API

### Leaderboard
- ✅ `app/leaderboard/page.tsx` - Leaderboard sida
- ✅ `app/api/leaderboard/route.ts` - Leaderboard API
- ✅ `app/communities/[id]/leaderboard/page.tsx` - Community leaderboard
- ✅ `app/api/communities/[id]/leaderboard/route.ts` - Community leaderboard API

### Notifications
- ✅ `app/account/notifications/page.tsx` - Notifications sida
- ✅ `app/api/notifications/route.ts` - Notifications API

---

## ❌ Saknas (Måste skapas)

### Fas 1: Logistik & WMS (Hub 2 & Terminaler)

#### 1.1 Local Hub Breakdown Terminal (Hub 2)
- ❌ `app/api/warehouse/terminal/breakdown/route.ts` - Backend API för breakdown
- ❌ `app/warehouses/[id]/terminal/breakdown/page.tsx` - Frontend terminal
- ❌ `app/warehouses/[id]/terminal/` - Hela terminal-katalogen saknas

#### 1.2 Cross-Dock Queue Management
- ❌ `app/api/warehouse/terminal/queue/route.ts` - Queue management API
- ❌ `app/warehouses/[id]/management/queue/page.tsx` - Queue dashboard

#### 1.3 Warehouse Picking/Packing Interface
- ❌ `app/api/warehouse/terminal/pick/route.ts` - Picking API
- ❌ `app/warehouses/[id]/picklist/[picklistId]/page.tsx` - Picking terminal
- ❌ `app/warehouses/[id]/picklist/` - Hela picklist-katalogen saknas

#### 1.4 Mobiloptimerat Utdelningsark för Lagföräldrar
- ❌ `app/dashboard/distribution/page.tsx` - Distribution ark

---

### Fas 2: Data, Analys & Ekonomi (Dashboards)

#### 2.1 Logistics & Route Analytics
- ❌ `app/api/admin/analytics/logistics/route.ts` - Logistics analytics API
- ❌ `app/admin/analytics/logistics/page.tsx` - Logistics analytics dashboard

#### 2.2 Campaign Analytics & MOQ Dashboard
- ❌ `app/api/admin/analytics/campaigns/route.ts` - Campaign analytics API
- ❌ `app/admin/analytics/campaigns/page.tsx` - Campaign analytics dashboard

#### 2.3 Financial Settlement Ledger
- ❌ `app/api/admin/finance/settlement/route.ts` - Settlement API
- ❌ `app/admin/finance/page.tsx` - Finance dashboard
- ❌ `app/admin/finance/` - Hela finance-katalogen saknas

---

### Fas 3: Kund- & Användarupplevelse (Checkout, UX, Aviseringar)

#### 3.1 Supporter Checkout med Idempotency
- ❌ `app/api/checkout/order/route.ts` - Order API med idempotency (kan uppdatera befintlig)
- ❌ `app/checkout/[campaignId]/page.tsx` - Campaign-specific checkout (kan uppdatera befintlig)

#### 3.2 Aviseringar & SMS-motor
- ❌ `app/api/admin/notifications/dispatch/route.ts` - Dispatch API med idempotency
- ❌ `app/dashboard/distribution/notifications/page.tsx` - Notification center

#### 3.3 Digital Följesedel & QR-kvittens
- ❌ `app/api/hub/delivery/verify/route.ts` - QR verification API
- ❌ `app/hub/scanner/page.tsx` - Hub scanner
- ❌ `app/hub/` - Hela hub-katalogen saknas

---

### Fas 4: Gamification Engine & Leaderboards

#### 4.1 Gamification Engine
- ❌ `app/api/gamification/leaderboard/route.ts` - Gamification API (kan uppdatera befintlig leaderboard API)
- ❌ `app/campaign/[campaignId]/leaderboard/page.tsx` - Campaign leaderboard (kan uppdatera befintlig)
- ❌ `app/campaign/` - Hela campaign-katalogen saknas

---

## 🗄️ Databas-tabeller som saknas

Enligt planen behöver följande tabeller skapas:

1. **customer_payment_methods** - Sparade betalmetoder
2. **system_worker_logs** - CRON-jobb logs
3. **supporter_orders** - Supporter orders med idempotency
4. **campaign_notifications** - Aviseringslogg med idempotency
5. **hub_payouts_receipts** - Utlämningslås
6. **seller_leaderboard_stats** - Cachad säljarstatistik
7. **seller_badges** - Badge-liggare med idempotency

**Index som saknas:**
- `idx_discrepancies_sku_type` på `warehouse_discrepancies`
- `idx_worker_logs_name_date` på `system_worker_logs`

---

## 📋 Sammanfattning

### Statistik
- **Totalt antal nya filer att skapa**: ~20 filer
- **Totalt antal nya kataloger**: 5 kataloger
- **Totalt antal nya databas-tabeller**: 7 tabeller
- **Befintliga filer som kan återanvändas**: ~10 filer

### Prioritering

**High Priority (Fas 1 - Logistik):**
1. Skapa `app/warehouses/[id]/terminal/` katalog
2. Skapa breakdown API och frontend
3. Skapa queue management API och frontend
4. Skapa picking API och frontend
5. Skapa distribution ark

**Medium Priority (Fas 2 - Analytics):**
1. Skapa logistics analytics API och dashboard
2. Skapa campaign analytics API och dashboard
3. Skapa finance katalog och settlement system

**Medium Priority (Fas 3 - UX):**
1. Uppdatera checkout med idempotency
2. Skapa notifications dispatch API
3. Skapa hub katalog och QR scanner

**Medium Priority (Fas 4 - Gamification):**
1. Uppdatera leaderboard API med badges
2. Skapa campaign katalog
3. Skapa gamification features

---

## 🎯 Rekommenderad Exekveringsordning

1. **Databas-migration först** - Skapa alla nya tabeller och index
2. **Fas 1.1** - Local Hub Breakdown Terminal (Backend + Frontend)
3. **Fas 1.2** - Cross-Dock Queue Management (Backend + Frontend)
4. **Fas 1.3** - Warehouse Picking/Packing (Backend + Frontend)
5. **Fas 1.4** - Distribution Ark (Frontend)
6. **Fas 2.1** - Logistics Analytics (Backend + Frontend)
7. **Fas 2.2** - Campaign Analytics (Backend + Frontend)
8. **Fas 2.3** - Financial Settlement (Backend + Frontend)
9. **Fas 3.1** - Checkout Idempotency (Uppdatera befintlig)
10. **Fas 3.2** - Notifications Dispatch (Backend + Frontend)
11. **Fas 3.3** - QR Scanner (Backend + Frontend)
12. **Fas 4** - Gamification (Uppdatera befintlig leaderboard)
