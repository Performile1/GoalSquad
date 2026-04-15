# GoalSquad - Real Data Flow (Ingen Mockup)

**Datum**: 2026-04-15  
**Princip**: **ENDAST VERKLIG DATA** - Ingen mockup, allt baserat på faktiska transaktioner

---

## 🎯 Grundprincip

**INGEN MOCKUP DATA**

Alla siffror och flöden baseras på:
- ✅ Faktiska beställningar från riktiga kunder
- ✅ Faktiska produkter från riktiga företag
- ✅ Faktiska lager med riktiga adresser
- ✅ Faktiska transaktioner och shipments

**Om det inte finns data → Visa 0 eller "Ingen aktivitet"**

---

## 📊 Produktflöde (4 Steg)

### Steg 1: Väntande Beställningar

**Data från**: `pending_moq_orders` tabellen

```sql
SELECT 
  product_id,
  SUM(quantity) as total_quantity,
  COUNT(DISTINCT order_id) as order_count,
  assigned_warehouse_id
FROM pending_moq_orders
WHERE product_id = 'chips-product-id'
  AND status = 'pending'
GROUP BY product_id, assigned_warehouse_id;
```

**Visar**:
- Antal beställda produkter som väntar på MOQ
- Antal beställningar
- Fördelning per lagerpartner

**Exempel (Real Data)**:
```
Chips (Skånska Chips):
- Stockholm CC: 40 påsar (4 beställningar)
- Göteborg CC: 10 påsar (1 beställning)
Totalt: 50 påsar
```

---

### Steg 2: På väg från Företag → Lager

**Data från**: `merchant_shipments` + `merchant_shipment_items`

```sql
SELECT 
  ms.id as shipment_id,
  ms.warehouse_id,
  w.name as warehouse_name,
  msi.quantity,
  ms.status,
  ms.estimated_arrival
FROM merchant_shipments ms
JOIN merchant_shipment_items msi ON msi.shipment_id = ms.id
JOIN consolidation_warehouses w ON w.id = ms.warehouse_id
WHERE msi.product_id = 'chips-product-id'
  AND ms.status IN ('shipped', 'in_transit');
```

**Visar**:
- Produkter på väg från företag till lager
- Status (shipped, in_transit)
- Beräknad ankomst
- Destination (vilket lager)

**Exempel (Real Data)**:
```
Shipment #SH-2026-001:
- Från: Skånska Chips
- Till: Stockholm CC
- Antal: 50 påsar
- Status: in_transit
- Ankomst: 2026-04-17
```

---

### Steg 3: På Konsolideringslager

**Data från**: `warehouse_inventory`

```sql
SELECT 
  wi.warehouse_id,
  w.name as warehouse_name,
  w.city,
  wi.quantity_available,
  wi.quantity_allocated,
  wi.quantity_shipped,
  wi.status
FROM warehouse_inventory wi
JOIN consolidation_warehouses w ON w.id = wi.warehouse_id
WHERE wi.product_id = 'chips-product-id'
  AND (wi.quantity_available > 0 OR wi.quantity_allocated > 0);
```

**Visar**:
- Tillgängligt (kan allokeras)
- Allokerat (reserverat för order)
- Skickat (redan på väg till kund)
- Status per lager

**Exempel (Real Data)**:
```
Stockholm CC:
- Tillgängligt: 10 påsar
- Allokerat: 40 påsar
- Skickat: 0 påsar

Göteborg CC:
- Tillgängligt: 0 påsar
- Allokerat: 10 påsar
- Skickat: 0 påsar
```

---

### Steg 4: Allokerat till Kunder

**Data från**: `warehouse_allocations` + `warehouse_inventory`

```sql
SELECT 
  wi.warehouse_id,
  w.name as warehouse_name,
  SUM(wa.quantity_allocated) as total_quantity,
  wa.status
FROM warehouse_allocations wa
JOIN warehouse_inventory wi ON wi.id = wa.warehouse_inventory_id
JOIN consolidation_warehouses w ON w.id = wi.warehouse_id
WHERE wi.product_id = 'chips-product-id'
  AND wa.status IN ('allocated', 'picked', 'packed')
GROUP BY wi.warehouse_id, w.name, wa.status;
```

**Visar**:
- Produkter allokerade till specifika kunder
- Status (allocated, picked, packed, shipped)
- Fördelning per lager

**Exempel (Real Data)**:
```
Stockholm CC:
- Allocated: 30 påsar (3 kunder)
- Picked: 10 påsar (1 kund)
- Packed: 0 påsar

Göteborg CC:
- Allocated: 10 påsar (1 kund)
```

---

## 🏭 Lagerflöde

### Inkommande från Företag

**Query**:
```sql
SELECT 
  COUNT(*) as shipment_count,
  SUM((SELECT SUM(quantity) FROM merchant_shipment_items WHERE shipment_id = ms.id)) as total_items
FROM merchant_shipments ms
WHERE warehouse_id = 'stockholm-cc-id'
  AND status IN ('shipped', 'in_transit');
```

**Visar**:
- Antal shipments på väg
- Totalt antal produkter
- Status per shipment

---

### Nuvarande Lager

**Query**:
```sql
SELECT 
  COUNT(DISTINCT product_id) as product_count,
  SUM(quantity_available) as total_available,
  SUM(quantity_allocated) as total_allocated
FROM warehouse_inventory
WHERE warehouse_id = 'stockholm-cc-id';
```

**Visar**:
- Antal olika produkter
- Tillgängligt totalt
- Allokerat totalt
- Fördelning per företag

---

### Väntande Kundorder

**Query**:
```sql
SELECT 
  COUNT(DISTINCT order_id) as order_count,
  SUM(quantity) as total_quantity
FROM pending_moq_orders
WHERE assigned_warehouse_id = 'stockholm-cc-id';
```

**Visar**:
- Antal order som väntar
- Totalt antal produkter
- Status breakdown

---

## 🚫 Vad VI INTE Gör

### ❌ Ingen Mockup Data

```typescript
// ❌ ALDRIG DETTA
const mockData = {
  pending: 50,
  inTransit: 100,
  atWarehouse: 75
};

// ✅ ALLTID DETTA
const { data } = await supabase.rpc('get_product_flow', {
  p_product_id: productId
});
// Om ingen data → visa 0 eller "Ingen aktivitet"
```

### ❌ Inga Hårdkodade Siffror

```typescript
// ❌ ALDRIG
<div>247 väntande order</div>

// ✅ ALLTID
<div>{realData.pending_order_count || 0} väntande order</div>
```

### ❌ Inga Placeholder-värden

```typescript
// ❌ ALDRIG
const warehouseCount = 8; // Hårdkodat

// ✅ ALLTID
const { data: warehouses } = await supabase
  .from('consolidation_warehouses')
  .select('*')
  .eq('is_active', true);
const warehouseCount = warehouses?.length || 0;
```

---

## ✅ Vad VI GÖR

### ✅ Real-time Queries

```typescript
// Hämta verklig data
const fetchRealData = async () => {
  const { data } = await supabase.rpc('get_product_flow', {
    p_product_id: productId
  });
  
  // Om ingen data finns
  if (!data || data.pending_orders.total_quantity === 0) {
    return {
      message: 'Ingen produktaktivitet än',
      showEmptyState: true
    };
  }
  
  return data;
};
```

### ✅ Null-safe Rendering

```typescript
// Visa bara om data finns
{flowData?.pending_orders?.total_quantity > 0 && (
  <div>
    {flowData.pending_orders.total_quantity} st väntande
  </div>
)}

// Eller visa empty state
{!hasAnyData && (
  <div>
    <p>Ingen aktivitet än</p>
    <p>När beställningar kommer in visas de här</p>
  </div>
)}
```

### ✅ Auto-refresh för Real-time

```typescript
useEffect(() => {
  fetchRealData();
  
  // Uppdatera var 30:e sekund
  const interval = setInterval(fetchRealData, 30000);
  
  return () => clearInterval(interval);
}, [productId]);
```

---

## 📋 Dataflöde - Komplett Exempel

### Scenario: Första Beställningen

**Dag 1 - Kund beställer**:
```sql
-- Skapar order
INSERT INTO orders (...) VALUES (...);
INSERT INTO order_items (...) VALUES (...);

-- Om MOQ inte uppnått → pending
INSERT INTO pending_moq_orders (
  product_id, quantity, assigned_warehouse_id, status
) VALUES (
  'chips-id', 10, 'stockholm-cc-id', 'pending'
);
```

**Produktflöde visar**:
```
Steg 1: Väntande Beställningar
- Stockholm CC: 10 påsar (1 beställning)
- Status: 10/50 (20%)

Steg 2-4: Ingen data (visas inte)
```

---

### Dag 5 - MOQ Uppnått

```sql
-- Totalt 50 påsar beställda
SELECT SUM(quantity) FROM pending_moq_orders
WHERE product_id = 'chips-id';
-- Result: 50

-- Företaget skapar shipment
INSERT INTO merchant_shipments (
  merchant_id, warehouse_id, status
) VALUES (
  'skanska-chips-id', 'stockholm-cc-id', 'shipped'
);

INSERT INTO merchant_shipment_items (
  shipment_id, product_id, quantity
) VALUES (
  'shipment-id', 'chips-id', 50
);
```

**Produktflöde visar**:
```
Steg 1: Väntande Beställningar
- Stockholm CC: 50 påsar (5 beställningar)
- Status: 50/50 (100%) ✅

Steg 2: På väg från Företag
- Shipment #SH-001
- Till: Stockholm CC
- Antal: 50 påsar
- Status: shipped
- Ankomst: 2026-04-17
```

---

### Dag 7 - Anländer till Lager

```sql
-- Uppdatera shipment
UPDATE merchant_shipments
SET status = 'arrived', arrived_at = NOW()
WHERE id = 'shipment-id';

-- Lägg till i inventory
INSERT INTO warehouse_inventory (
  warehouse_id, product_id, merchant_id,
  quantity_received, quantity_available
) VALUES (
  'stockholm-cc-id', 'chips-id', 'skanska-chips-id',
  50, 50
);
```

**Produktflöde visar**:
```
Steg 3: På Konsolideringslager
- Stockholm CC:
  * Tillgängligt: 50 påsar
  * Allokerat: 0 påsar
  * Skickat: 0 påsar
```

---

### Dag 8 - Allokeras till Kunder

```sql
-- Allokera till order items
INSERT INTO warehouse_allocations (
  warehouse_inventory_id, order_item_id, quantity_allocated
)
SELECT 
  'inventory-id', oi.id, oi.quantity
FROM order_items oi
JOIN pending_moq_orders pmo ON pmo.order_item_id = oi.id
WHERE pmo.product_id = 'chips-id'
  AND pmo.assigned_warehouse_id = 'stockholm-cc-id';

-- Uppdatera inventory
UPDATE warehouse_inventory
SET quantity_allocated = 50,
    quantity_available = 0
WHERE id = 'inventory-id';
```

**Produktflöde visar**:
```
Steg 3: På Konsolideringslager
- Stockholm CC:
  * Tillgängligt: 0 påsar
  * Allokerat: 50 påsar
  * Skickat: 0 påsar

Steg 4: Allokerat till Kunder
- Totalt: 50 påsar (5 kunder)
- Stockholm CC:
  * Allocated: 50 påsar
```

---

## 🎯 Summary

**Principer**:
1. ✅ **Endast verklig data** - Från faktiska transaktioner
2. ✅ **Null-safe** - Hantera när data saknas
3. ✅ **Real-time** - Auto-refresh var 30:e sekund
4. ✅ **Transparent** - Visa exakt vad som finns i databasen
5. ✅ **No mock** - Aldrig hårdkodade värden

**Resultat**:
- Kunder ser EXAKT var deras produkter är
- Företag ser EXAKT hur många som beställts
- Lager ser EXAKT vad som är på väg/finns/ska skickas
- Allt baserat på faktiska databas-records

**När systemet är tomt**:
- Visa "Ingen aktivitet än"
- Förklara vad som kommer hända när data finns
- Ge exempel på hur det kommer se ut

**Redo för produktion med VERKLIG data!** 🚀
