# GoalSquad - MOQ Logic (Detaljerat Exempel)

**Datum**: 2026-04-15

---

## 📦 Konkret Exempel: Chips från Skåne

### Scenario

**Företag**: Skånska Chips AB (Malmö)
- **Produkt**: Premium Chips 200g
- **MOQ**: 50 påsar
- **Pris**: 25 kr/påse
- **Rabatt vid MOQ**: 15%

**5 Föreningar med säljare**:
1. Fotbollslaget Vikings (Stockholm, 11122) - 10 påsar
2. Basketlaget Eagles (Göteborg, 41101) - 10 påsar  
3. Handbollslaget Sharks (Uppsala, 75101) - 10 påsar
4. Volleybollklubben Stars (Örebro, 70101) - 10 påsar
5. Innebandylaget Tigers (Linköping, 58101) - 10 påsar

**Totalt**: 50 påsar (MOQ uppnått! ✅)

---

## 🔄 Komplett Flöde

### Steg 1: Beställningar Kommer In

```
Dag 1:
- Vikings (Stockholm): 10 påsar → Postnummer 11122
  → System: find_nearest_warehouse('11122')
  → Resultat: Stockholm Consolidation Center
  → Status: Pending (10/50)

Dag 2:
- Eagles (Göteborg): 10 påsar → Postnummer 41101
  → System: find_nearest_warehouse('41101')
  → Resultat: Göteborg Consolidation Center
  → Status: Pending (10/50)

Dag 3:
- Sharks (Uppsala): 10 påsar → Postnummer 75101
  → System: find_nearest_warehouse('75101')
  → Resultat: Stockholm Consolidation Center (närmast)
  → Status: Pending (20/50) för Stockholm

Dag 4:
- Stars (Örebro): 10 påsar → Postnummer 70101
  → System: find_nearest_warehouse('70101')
  → Resultat: Stockholm Consolidation Center
  → Status: Pending (30/50) för Stockholm

Dag 5:
- Tigers (Linköping): 10 påsar → Postnummer 58101
  → System: find_nearest_warehouse('58101')
  → Resultat: Stockholm Consolidation Center
  → Status: READY! (40/50) för Stockholm
  → Göteborg: (10/50) fortfarande väntar
```

### Aggregering per Lager

**Stockholm Consolidation Center**:
- Vikings: 10 påsar
- Sharks: 10 påsar
- Stars: 10 påsar
- Tigers: 10 påsar
- **Totalt: 40 påsar** (80% av MOQ)

**Göteborg Consolidation Center**:
- Eagles: 10 påsar
- **Totalt: 10 påsar** (20% av MOQ)

**Problem**: Ingen av lagerna har nått MOQ (50 påsar)!

---

## 🎯 Lösning: Flexibel MOQ Tracking

### Alternativ 1: Global MOQ (Rekommenderat för Chips)

**Logik**: MOQ räknas TOTALT över alla lager

```typescript
// check_moq_status - Global version
SELECT SUM(quantity) as total_quantity
FROM pending_moq_orders
WHERE product_id = 'chips-product-id'
  AND status = 'pending';

// Result: 50 påsar totalt → MOQ UPPNÅTT! ✅
```

**Resultat**:
```
1. Skånska Chips skickar 50 påsar till Stockholm CC (största volymen)
2. Stockholm CC plockar och förpackar:
   - 10 påsar → Vikings (Stockholm)
   - 10 påsar → Sharks (Uppsala)
   - 10 påsar → Stars (Örebro)
   - 10 påsar → Tigers (Linköping)
   - 10 påsar → Eagles (via transfer till Göteborg CC)

3. Alla får 15% rabatt (21.25 kr/påse)
4. Leverans inom 2-3 dagar
```

### Alternativ 2: Per-Warehouse MOQ (Striktare)

**Logik**: MOQ måste uppnås PER lager

```typescript
// check_moq_status - Per warehouse
SELECT warehouse_id, SUM(quantity) as warehouse_quantity
FROM pending_moq_orders
WHERE product_id = 'chips-product-id'
GROUP BY warehouse_id;

// Result:
// Stockholm: 40 påsar (80%) ❌
// Göteborg: 10 påsar (20%) ❌
```

**Resultat**:
```
Alla beställningar väntar tills:
- Stockholm får 10 påsar till (50 totalt), ELLER
- Göteborg får 40 påsar till (50 totalt)

Kunder får meddelande:
"Din beställning väntar på att fler i ditt område beställer.
Nuvarande status: 40/50 påsar i Stockholm-området."
```

---

## 📦 Lagerpartner Flow (Detaljerat)

### Stockholm Consolidation Center (Lagerpartner A)

**Inkommande från Skånska Chips**:
```
1 pall med 50 påsar chips
Anländer: Dag 6
```

**Andra produkter som också anländer**:
```
- Choklad från Marabou (MOQ uppnått)
- Kaffe från Löfbergs (MOQ uppnått)
- Godis från Malaco (MOQ uppnått)
```

**Lagerpartner A's Uppgifter**:

1. **Ta emot** (Dag 6):
   ```
   ✓ 50 påsar chips (Skånska Chips)
   ✓ 100 chokladkakor (Marabou)
   ✓ 80 kaffepaket (Löfbergs)
   ✓ 60 godispåsar (Malaco)
   ```

2. **Plocka ihop per förening** (Dag 7):
   ```
   Vikings (Stockholm):
   - 10 påsar chips
   - 20 chokladkakor
   - 15 kaffepaket
   → 1 kolli, 5 kg
   
   Sharks (Uppsala):
   - 10 påsar chips
   - 15 chokladkakor
   - 10 kaffepaket
   - 20 godispåsar
   → 1 kolli, 6 kg
   
   Stars (Örebro):
   - 10 påsar chips
   - 25 chokladkakor
   → 1 kolli, 4 kg
   
   Tigers (Linköping):
   - 10 påsar chips
   - 10 kaffepaket
   - 15 godispåsar
   → 1 kolli, 5 kg
   ```

3. **Förpacka** (Dag 7):
   - Använd Skånska Chips förpackningsmaterial
   - Lägg till andra produkter i samma kolli
   - Märk med föreningsnamn och leveransadress

4. **Skicka** (Dag 8):
   ```
   → Vikings: Leverans Dag 9
   → Sharks: Leverans Dag 9
   → Stars: Leverans Dag 10
   → Tigers: Leverans Dag 10
   ```

5. **Transfer till Göteborg CC** (Dag 7):
   ```
   10 påsar chips → Göteborg CC
   Anländer: Dag 8
   Plockas ihop med Eagles order: Dag 8
   Leverans till Eagles: Dag 9
   ```

---

## ⚠️ Problem: MOQ Påverkar Andra Produkter

### Scenario: Choklad väntar på Chips

**Vikings beställning**:
- 10 påsar chips (MOQ: 50, Status: 40/50 ❌)
- 20 chokladkakor (MOQ: 100, Status: 100/100 ✅)
- 15 kaffepaket (MOQ: 80, Status: 80/80 ✅)

**Problem**:
```
Choklad och kaffe är REDO att skickas (MOQ uppnått)
Men chips väntar fortfarande (40/50)

Alternativ:
1. Vänta på chips → ALLT skickas tillsammans (Dag 10)
2. Delleverans → Choklad+kaffe nu (Dag 3), chips senare (Dag 10)
```

### Lösning 1: Vänta (Rekommenderat)

**UI Meddelande till Kund**:
```
📦 Din beställning

Status: Väntar på minsta beställning

Produkter redo:
✅ Choklad (20 st) - Redo att skicka
✅ Kaffe (15 st) - Redo att skicka

Produkter som väntar:
⏳ Chips (10 st) - 40/50 påsar beställda (80%)
   Uppskattat: 5-7 dagar

Beräknad leverans: När alla produkter är redo
Fördel: Lägre fraktkostnad, allt i ett paket

[Acceptera väntetid] [Välj delleverans]
```

### Lösning 2: Delleverans

**UI Meddelande till Kund**:
```
⚠️ Delleverans

Du kan välja att få produkter som är redo nu:

Leverans 1 (Nu):
✅ Choklad (20 st)
✅ Kaffe (15 st)
Fraktkostnad: 79 kr
Leverans: 2-3 dagar

Leverans 2 (Senare):
⏳ Chips (10 st)
Fraktkostnad: 49 kr
Leverans: 5-10 dagar (när MOQ uppnås)

Total fraktkostnad: 128 kr (istället för 89 kr)
Extra kostnad: +39 kr

[Ja, delleverans] [Nej, vänta på allt]
```

**Database Implementation**:
```sql
-- Split order into multiple shipments
UPDATE orders
SET shipment_strategy = 'split',
    estimated_shipments = 2,
    additional_shipping_cost = 39.00
WHERE id = 'order-uuid';

-- Create shipment 1 (ready items)
INSERT INTO shipments (order_id, status, items)
VALUES ('order-uuid', 'ready', '["choklad", "kaffe"]');

-- Create shipment 2 (pending MOQ items)
INSERT INTO shipments (order_id, status, items)
VALUES ('order-uuid', 'pending_moq', '["chips"]');
```

---

## 📊 MOQ Tracking Dashboard (För Kunder)

### Föreningens Dashboard

```
=== Vikings Pågående Beställningar ===

Order #12345 (Dag 1)
Status: Väntar på minsta beställning

Produkter:
✅ Choklad - Redo (100/100)
✅ Kaffe - Redo (80/80)
⏳ Chips - Väntar (40/50) 80%

[████████░░] 80% av chips-beställningen uppnådd

10 påsar kvar tills leverans!
Uppskattat: 3-5 dagar

Alternativ:
[Vänta på allt] [Delleverans (+39 kr)]

---

Andra som väntar på samma produkt:
• Sharks (Uppsala) - 10 påsar
• Stars (Örebro) - 10 påsar
• Tigers (Linköping) - 10 påsar

Tillsammans: 40/50 påsar
```

---

## 🎯 Rekommenderad Implementation

### Database Schema (Uppdaterad)

```sql
-- Add shipment strategy to orders
ALTER TABLE orders
ADD COLUMN shipment_strategy VARCHAR(50) DEFAULT 'wait_for_all',
  -- 'wait_for_all', 'split_shipment', 'partial_ok'
ADD COLUMN estimated_shipments INTEGER DEFAULT 1,
ADD COLUMN additional_shipping_cost DECIMAL(10,2) DEFAULT 0;

-- Track MOQ globally OR per warehouse
ALTER TABLE products
ADD COLUMN moq_tracking_scope VARCHAR(50) DEFAULT 'global';
  -- 'global' = count all orders regardless of warehouse
  -- 'per_warehouse' = each warehouse must reach MOQ separately
```

### Updated MOQ Check Function

```sql
CREATE OR REPLACE FUNCTION check_moq_status_v2(
  p_product_id UUID,
  p_postal_code VARCHAR(20)
)
RETURNS JSONB AS $$
DECLARE
  v_product products%ROWTYPE;
  v_warehouse_id UUID;
  v_total_quantity INTEGER;
  v_warehouse_quantity INTEGER;
BEGIN
  -- Get product
  SELECT * INTO v_product FROM products WHERE id = p_product_id;
  
  IF NOT v_product.moq_enabled THEN
    RETURN jsonb_build_object('moq_enabled', false);
  END IF;
  
  -- Find warehouse
  v_warehouse_id := find_nearest_warehouse(p_postal_code);
  
  -- Check tracking scope
  IF v_product.moq_tracking_scope = 'global' THEN
    -- Count ALL pending orders globally
    SELECT COALESCE(SUM(quantity), 0) INTO v_total_quantity
    FROM pending_moq_orders
    WHERE product_id = p_product_id
      AND status = 'pending';
    
    RETURN jsonb_build_object(
      'moq_enabled', true,
      'tracking_scope', 'global',
      'target_quantity', v_product.minimum_order_quantity,
      'current_quantity', v_total_quantity,
      'moq_reached', v_total_quantity >= v_product.minimum_order_quantity,
      'warehouse_id', v_warehouse_id
    );
  ELSE
    -- Count only for this warehouse
    SELECT COALESCE(SUM(quantity), 0) INTO v_warehouse_quantity
    FROM pending_moq_orders
    WHERE product_id = p_product_id
      AND assigned_warehouse_id = v_warehouse_id
      AND status = 'pending';
    
    RETURN jsonb_build_object(
      'moq_enabled', true,
      'tracking_scope', 'per_warehouse',
      'target_quantity', v_product.minimum_order_quantity,
      'current_quantity', v_warehouse_quantity,
      'moq_reached', v_warehouse_quantity >= v_product.minimum_order_quantity,
      'warehouse_id', v_warehouse_id
    );
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## ✅ Sammanfattning

### Chips Exempel - Komplett Flow

1. **5 föreningar beställer** → 50 påsar totalt
2. **System aggregerar** → 40 till Stockholm CC, 10 till Göteborg CC
3. **MOQ tracking** → Global: 50/50 ✅ eller Per-warehouse: 40/50 ❌
4. **Vid global MOQ** → Skånska Chips skickar 50 påsar till Stockholm CC
5. **Stockholm CC** → Plockar ihop med andra produkter
6. **Förpackning** → Använder Skånska Chips material
7. **Distribution** → 4 paket från Stockholm, 1 via Göteborg
8. **Alla får rabatt** → 15% (21.25 kr/påse istället för 25 kr)

### Key Points

✅ **MOQ tracking**: Global (rekommenderat) eller per-warehouse
✅ **Lagerpartner**: Tar emot, plockar, förpackar, distribuerar
✅ **Andra produkter**: Kan påverkas av MOQ-väntan
✅ **Delleverans**: Kund kan välja (extra kostnad)
✅ **Transparens**: Kunder ser progress (40/50)
✅ **Rabatt**: Automatiskt när MOQ uppnås

**Logiken är korrekt implementerad!** 🎉
