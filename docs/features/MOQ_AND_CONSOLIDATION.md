# GoalSquad - MOQ & Konsolideringslager

**Datum**: 2026-04-15  
**Status**: ✅ Implementerat

---

## 📦 1. Minimum Order Quantity (MOQ)

### Vad är MOQ?

**MOQ** = Minsta beställning som krävs innan produkten skickas.

**Fördelar**:
- ✅ Lägre fraktkostnader (bulk shipping)
- ✅ Bättre priser för kunder
- ✅ Mindre miljöpåverkan
- ✅ Effektivare logistik

### Företagsinställningar

**Per produkt kan företag sätta**:
- **Minsta antal** (t.ex. 50 stycken)
- **Enhet** (stycken, lådor, pallar, kg, liter)
- **Rabatt vid MOQ** (t.ex. 15% när MOQ uppnås)
- **Tillåt partiella beställningar** (ja/nej)
- **Kräv konsolidering** (måste gå via lager)

### Exempel

**Parmesan Ost 1kg**:
```typescript
{
  moqEnabled: true,
  minimumOrderQuantity: 50,  // 50 st
  moqUnit: 'pieces',
  moqDiscountPercentage: 15, // 15% rabatt
  allowPartialOrders: true,  // Kunder kan beställa mindre
  consolidationRequired: true // Måste via lager
}
```

**Resultat**:
- Kund A beställer 10 st → Väntar på MOQ
- Kund B beställer 20 st → Väntar på MOQ  
- Kund C beställer 25 st → MOQ uppnått! (10+20+25=55)
- Alla får 15% rabatt och leverans inom 2 dagar

---

## 🏭 2. Konsolideringslager (Baserat på Postnummer)

### Hur fungerar det?

**1. Postnummerbaserad tilldelning**:
- Varje lager täcker specifika postnummerområden
- Exempel: Stockholm-lager täcker 100-199
- System hittar närmaste lager automatiskt

**2. Order aggregering**:
- Beställningar till samma område samlas
- När MOQ uppnås → Alla skickas tillsammans
- Split-up till olika lager om olika områden

### Database Schema

```sql
CREATE TABLE consolidation_warehouses (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  code VARCHAR(50) UNIQUE,
  
  -- Location
  postal_code VARCHAR(20),
  city VARCHAR(100),
  country VARCHAR(2),
  
  -- Coverage
  postal_code_ranges TEXT[], -- ['100-199', '200-299']
  coverage_radius_km INTEGER,
  
  -- Capacity
  max_capacity_m3 DECIMAL(10,2),
  max_daily_orders INTEGER,
  processing_days INTEGER DEFAULT 2
);
```

### Exempel Lager

**Stockholm Consolidation Center**:
```typescript
{
  name: 'Stockholm Consolidation Center',
  code: 'STO-01',
  postalCode: '11122',
  city: 'Stockholm',
  postalCodeRanges: ['100-199', '700-799'],
  coverageRadiusKm: 50,
  processingDays: 2
}
```

**Göteborg Consolidation Center**:
```typescript
{
  name: 'Göteborg Consolidation Center',
  code: 'GOT-01',
  postalCode: '41101',
  city: 'Göteborg',
  postalCodeRanges: ['400-499'],
  coverageRadiusKm: 40,
  processingDays: 2
}
```

---

## 🔄 3. Order Flow med MOQ

### Scenario 1: MOQ Aktiverad

**Produkt**: Ekologisk Kaffe 1kg
- MOQ: 30 st
- Rabatt: 10%
- Tillåt partiella: Ja

**Flow**:
```
1. Kund i Stockholm (11122) beställer 5 st
   → System hittar Stockholm-lager
   → Lägg till i aggregation
   → Status: Väntar (5/30)

2. Kund i Stockholm (11234) beställer 10 st
   → Samma lager
   → Lägg till i aggregation
   → Status: Väntar (15/30)

3. Kund i Stockholm (11456) beställer 20 st
   → Samma lager
   → MOQ UPPNÅTT! (35/30) ✅
   → Alla 3 beställningar får 10% rabatt
   → Skickas inom 2 dagar

4. Kund i Göteborg (41101) beställer 8 st
   → Göteborg-lager
   → Ny aggregation startar
   → Status: Väntar (8/30)
```

### Scenario 2: Split-up till Olika Lager

**Produkt**: Premium Choklad
- MOQ: 50 st
- 3 beställningar:
  - 20 st → Stockholm (11122)
  - 15 st → Stockholm (11234)
  - 25 st → Göteborg (41101)

**Resultat**:
```
Stockholm-lager: 20 + 15 = 35 st (Väntar, 35/50)
Göteborg-lager: 25 st (Väntar, 25/50)

Båda väntar på fler beställningar i sina respektive områden
```

---

## 📊 4. Aggregation Logic

### Database Tables

**order_aggregations**:
```sql
CREATE TABLE order_aggregations (
  id UUID PRIMARY KEY,
  product_id UUID,
  warehouse_id UUID,
  target_quantity INTEGER,     -- MOQ
  current_quantity INTEGER,    -- Nuvarande
  status VARCHAR(50),          -- 'collecting', 'ready', 'processing'
  moq_reached_at TIMESTAMP
);
```

**pending_moq_orders**:
```sql
CREATE TABLE pending_moq_orders (
  id UUID PRIMARY KEY,
  order_id UUID,
  product_id UUID,
  quantity INTEGER,
  user_id UUID,
  delivery_postal_code VARCHAR(20),
  assigned_warehouse_id UUID,
  status VARCHAR(50),          -- 'pending', 'ready', 'shipped'
  estimated_ship_date DATE
);
```

### Functions

**find_nearest_warehouse(postal_code)**:
```sql
-- Hittar närmaste lager baserat på postnummer
SELECT * FROM find_nearest_warehouse('11122', 'SE');
-- Returns: warehouse_id
```

**check_moq_status(product_id, warehouse_id)**:
```sql
-- Kollar MOQ-status för produkt på lager
SELECT * FROM check_moq_status('product-uuid', 'warehouse-uuid');
-- Returns: {
--   moq_enabled: true,
--   target_quantity: 50,
--   current_quantity: 35,
--   moq_reached: false,
--   percentage: 70
-- }
```

**process_ready_aggregations()**:
```sql
-- Processar alla aggregationer som nått MOQ
SELECT * FROM process_ready_aggregations();
-- Updates all pending orders to 'ready'
-- Sends notifications to customers
```

---

## 💻 5. Implementation

### Product Page

```tsx
import MOQProgress from '@/app/components/MOQProgress';

<MOQProgress
  productId={product.id}
  postalCode={userPostalCode}
  onStatusChange={(canFulfill) => {
    // Update UI based on MOQ status
  }}
/>
```

**Display**:
- Progress bar (35/50 = 70%)
- Estimated ship date
- Discount information
- Warehouse assignment

### Checkout Flow

```typescript
// Check if product requires MOQ
const moqStatus = await checkMOQStatus(productId, postalCode);

if (moqStatus.moqEnabled && !moqStatus.moqReached) {
  // Show warning: "Leverans när MOQ uppnås"
  // Add to pending orders
  await addToMOQAggregation(orderId, productId, quantity, userId, postalCode);
} else {
  // Normal fulfillment
  await processOrder(orderId);
}
```

### Merchant Dashboard

```
/merchant/products/[id]/moq-settings

Settings:
- Enable MOQ: [x]
- Minimum quantity: [50] [pieces]
- Discount: [15]%
- Allow partial: [x]
- Require consolidation: [x]
```

---

## 🎯 6. Use Cases

### Use Case 1: Färskvaror (Ost)

**Problem**: Parmesan ost måste skickas kylt och separat

**Solution**:
```typescript
{
  moqEnabled: true,
  minimumOrderQuantity: 30,
  consolidationRequired: true,
  shippingRestrictions: ['CHEESE', 'COLD_CHAIN'],
  canConsolidate: false
}
```

**Result**:
- Samlas på kyllager
- Skickas när 30 st beställts till samma område
- Separat från andra produkter

### Use Case 2: Bulk Produkter (Kaffe)

**Problem**: Kaffe är billigare i bulk

**Solution**:
```typescript
{
  moqEnabled: true,
  minimumOrderQuantity: 50,
  moqDiscountPercentage: 20,
  allowPartialOrders: true
}
```

**Result**:
- Kunder kan beställa 5-10 påsar
- När 50 påsar totalt → 20% rabatt till alla
- Lägre pris + mindre miljöpåverkan

### Use Case 3: Lokala Produkter

**Problem**: Lokala producenter vill nå flera kunder

**Solution**:
```typescript
{
  moqEnabled: true,
  minimumOrderQuantity: 20,
  postalCodeRanges: ['100-199'], // Endast Stockholm
  moqDiscountPercentage: 10
}
```

**Result**:
- Endast leverans till Stockholm-området
- Sambeställning mellan grannar
- Stöd lokala producenter

---

## 📈 7. Analytics & Monitoring

### Warehouse Dashboard

```sql
-- Warehouse utilization
SELECT 
  w.name,
  w.city,
  COUNT(p.id) as pending_orders,
  SUM(p.quantity) as total_quantity,
  w.max_capacity_m3,
  w.current_utilization_m3
FROM consolidation_warehouses w
LEFT JOIN pending_moq_orders p ON p.assigned_warehouse_id = w.id
GROUP BY w.id;
```

### MOQ Progress Tracking

```sql
-- Products close to MOQ
SELECT 
  p.name,
  a.current_quantity,
  a.target_quantity,
  ROUND((a.current_quantity::DECIMAL / a.target_quantity) * 100) as percentage,
  w.city
FROM order_aggregations a
JOIN products p ON p.id = a.product_id
JOIN consolidation_warehouses w ON w.id = a.warehouse_id
WHERE a.status = 'collecting'
  AND a.current_quantity >= (a.target_quantity * 0.7) -- 70%+
ORDER BY percentage DESC;
```

---

## ✅ Implementation Status

| Feature | Status | Files |
|---------|--------|-------|
| MOQ per product | ✅ Klar | products.minimum_order_quantity |
| Consolidation warehouses | ✅ Klar | consolidation_warehouses table |
| Postal code assignment | ✅ Klar | find_nearest_warehouse() |
| Order aggregation | ✅ Klar | order_aggregations table |
| Pending orders | ✅ Klar | pending_moq_orders table |
| MOQ check function | ✅ Klar | check_moq_status_v2() |
| Process aggregations | ✅ Klar | process_ready_aggregations() |
| MOQ progress UI | ✅ Klar | MOQProgress.tsx |
| Merchant settings | ✅ Klar | moq-settings/page.tsx |
| API endpoints | ✅ Klar | check-moq, moq routes |
| **Global vs Per-Warehouse** | ✅ Klar | moq_tracking_scope column |
| **Order MOQ blocking** | ✅ Klar | check_order_moq_blocking() |
| **Split shipments** | ✅ Klar | shipments table |
| **Delleverans UI** | ✅ Klar | OrderMOQStatus.tsx |
| **Split shipment API** | ✅ Klar | split-shipment/route.ts |

---

## 🚀 Deployment

### 1. Database Migration

```bash
psql -f database/moq-and-warehouses.sql
```

Creates:
- MOQ columns on products (6 fields)
- consolidation_warehouses table
- order_aggregations table
- pending_moq_orders table
- 4 functions
- 2 views

### 2. Add Warehouses

```sql
-- Stockholm
INSERT INTO consolidation_warehouses (
  name, code, postal_code, city, country,
  postal_code_ranges, coverage_radius_km, processing_days
) VALUES (
  'Stockholm Consolidation Center',
  'STO-01',
  '11122',
  'Stockholm',
  'SE',
  ARRAY['100-199', '700-799'],
  50,
  2
);

-- Göteborg
INSERT INTO consolidation_warehouses (
  name, code, postal_code, city, country,
  postal_code_ranges, coverage_radius_km, processing_days
) VALUES (
  'Göteborg Consolidation Center',
  'GOT-01',
  '41101',
  'Göteborg',
  'SE',
  ARRAY['400-499'],
  40,
  2
);

-- Malmö
INSERT INTO consolidation_warehouses (
  name, code, postal_code, city, country,
  postal_code_ranges, coverage_radius_km, processing_days
) VALUES (
  'Malmö Consolidation Center',
  'MAL-01',
  '21101',
  'Malmö',
  'SE',
  ARRAY['200-299'],
  35,
  2
);
```

### 3. Test MOQ Flow

```
1. Set MOQ on product:
   - Go to /merchant/products/[id]/moq-settings
   - Enable MOQ
   - Set minimum: 30
   - Set discount: 15%
   - Save

2. Customer orders:
   - Add product to cart
   - Enter postal code: 11122
   - See MOQ progress: 0/30
   - Place order
   - Order status: "Pending MOQ"

3. More customers order:
   - When 30 reached → All orders "Ready"
   - Discount applied automatically
   - Estimated ship date shown
```

---

## 🎯 Summary

**Alla funktioner implementerade**:

1. ✅ **MOQ per produkt** - Företag kan sätta minsta beställning
2. ✅ **Konsolideringslager** - Baserat på postnummer
3. ✅ **Automatisk tilldelning** - Hittar närmaste lager
4. ✅ **Order aggregering** - Samlar beställningar till samma lager
5. ✅ **Split-up logic** - Olika lager för olika områden
6. ✅ **Progress tracking** - Visar hur nära MOQ man är
7. ✅ **Rabatt vid MOQ** - Automatisk rabatt när uppnått
8. ✅ **Merchant UI** - Enkla inställningar per produkt

**Key Benefits**:
- 💰 Lägre kostnader (bulk shipping)
- 🌍 Mindre miljöpåverkan
- 📦 Effektivare logistik
- 🤝 Sambeställningar mellan grannar
- 📍 Postnummerbaserad smart routing

**Redo för deployment!** 🚀
