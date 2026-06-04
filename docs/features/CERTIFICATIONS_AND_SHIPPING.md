# GoalSquad - Certifieringsmärken & Fraktrestriktioner

**Datum**: 2026-04-15  
**Status**: ✅ Implementerat

---

## 🏅 1. Certifieringsmärken (Badges)

### 25+ Certifieringar

**Mat & Kost** (🍽️):
- 🌿 Ekologisk (EU-organic)
- 🇸🇪 KRAV
- 🌾 Glutenfri
- 🌱 Vegansk
- 🥗 Vegetarisk
- 🥛 Laktosfri
- 🍬 Sockerfri
- ☪️ Halal
- ✡️ Kosher

**Etik** (🤝):
- 🤝 Fairtrade
- 🐸 Rainforest Alliance
- ☕ UTZ

**Miljö** (🌍):
- 🐟 MSC (Hållbart fiske)
- 🦐 ASC (Hållbar vattenbruk)
- 🌲 FSC (Hållbart skogsbruk)
- 🦢 Svanen (Nordisk miljömärkning)
- 🇪🇺 EU Ecolabel

**Kvalitet** (⭐):
- 🇸🇪 Svenskt
- 🇳🇴 Norskt
- 🔑 Nyckelhålet

**Material** (🧵):
- 🌸 100% Bomull
- 🌿 Ekologisk Bomull
- ♻️ Återvunnet
- 🧵 OEKO-TEX

### UI Component

```tsx
import CertificationBadges from '@/app/components/CertificationBadges';

// Product page - large badges
<CertificationBadges
  certifications={['organic', 'vegan', 'fairtrade']}
  size="large"
  layout="grid"
  showTooltip={true}
/>

// Product card - compact
<CertificationBadgesCompact
  certifications={['organic', 'vegan']}
  maxShow={3}
/>

// Product creation - selector
<CertificationSelector
  selected={selectedCerts}
  onChange={(certs) => setSelectedCerts(certs)}
/>
```

### Placering

**Product Page**:
- ✅ Under produktbilder (stora badges)
- ✅ Under kort produktspecifikation
- ✅ Detaljerad lista längre ner

**Listing Page**:
- ✅ Under produktbild (kompakta badges)
- ✅ Max 3 synliga + "+X fler"

### Database Storage

```sql
-- Store as array of certification IDs
UPDATE products
SET certifications = ARRAY['organic', 'vegan', 'fairtrade']
WHERE id = 'product-uuid';

-- Query products by certification
SELECT * FROM products
WHERE 'vegan' = ANY(certifications);
```

---

## 📦 2. Fraktrestriktioner

### Kan Inte Konsolideras

**Checkbox**: `can_consolidate BOOLEAN`

**Exempel på produkter som måste skickas separat**:
- 🧀 Parmesan ost (stark lukt, kräver kylning)
- ❄️ Fryst mat
- ⚠️ Kemikalier
- 💧 Vätskor (läckagerisk)
- 📦 Ömtåliga produkter med tunga produkter

### Shipping Restriction Categories

**9 Kategorier**:

1. **CHEESE** (🧀 Ost & Mejeri)
   - Kräver kylning
   - Stark lukt
   - Kan inte skickas med: FROZEN, CHEMICALS
   - Extra kostnad: +15%

2. **FROZEN** (❄️ Fryst)
   - Måste hållas fryst
   - Kan inte skickas med: CHEESE, AMBIENT, FRAGILE
   - Extra kostnad: +25%

3. **COLD_CHAIN** (🧊 Kylvara)
   - Kräver kylkedja
   - Kan inte skickas med: FROZEN, AMBIENT
   - Extra kostnad: +20%

4. **FRAGILE** (📦 Ömtålig)
   - Kräver extra skydd
   - Kan inte skickas med: HEAVY
   - Extra kostnad: +10%

5. **HEAVY** (⚖️ Tung, >10kg)
   - Kan inte skickas med: FRAGILE
   - Extra kostnad: +5%

6. **CHEMICALS** (⚠️ Kemikalier)
   - Farligt gods
   - Kan inte skickas med: FOOD, CHEESE
   - Extra kostnad: +30%

7. **LIQUIDS** (💧 Vätskor)
   - Risk för läckage
   - Kan inte skickas med: ELECTRONICS
   - Extra kostnad: +10%

8. **PERISHABLE** (🍎 Färskvara)
   - Kort hållbarhet
   - Kan inte skickas med: FROZEN
   - Extra kostnad: +15%

9. **AMBIENT** (📦 Rumstemperatur)
   - Normal frakt
   - Kan inte skickas med: FROZEN, COLD_CHAIN
   - Extra kostnad: 0%

### Database Schema

```sql
ALTER TABLE products
ADD COLUMN can_consolidate BOOLEAN DEFAULT true,
ADD COLUMN shipping_restrictions TEXT[],
ADD COLUMN requires_cold_chain BOOLEAN DEFAULT false,
ADD COLUMN requires_frozen BOOLEAN DEFAULT false,
ADD COLUMN is_fragile BOOLEAN DEFAULT false,
ADD COLUMN is_hazardous BOOLEAN DEFAULT false,
ADD COLUMN shipping_notes TEXT,
ADD COLUMN separate_packaging_required BOOLEAN DEFAULT false;
```

### Functions

**Check if products can ship together**:
```sql
SELECT * FROM can_ship_together(ARRAY['product-1-uuid', 'product-2-uuid']);

Returns:
{
  "can_ship": false,
  "reason": "Cannot ship CHEESE with FROZEN",
  "suggested_shipments": {
    "shipment1": ["product-1-uuid"],
    "shipment2": ["product-2-uuid"]
  }
}
```

**Calculate shipping cost multiplier**:
```sql
SELECT calculate_shipping_multiplier(ARRAY['product-1-uuid', 'product-2-uuid']);

Returns: 1.25 (25% extra for frozen shipping)
```

### UI Warnings

**Product Page**:
```tsx
{!product.canConsolidate && (
  <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4">
    <p className="font-bold text-yellow-900">
      ⚠️ Kan inte kombineras med andra produkter
    </p>
    <p className="text-sm text-yellow-800">
      Denna produkt måste skickas separat
    </p>
  </div>
)}
```

**Checkout**:
```tsx
// Check if cart items can ship together
const { canShip, reason, suggestedShipments } = await checkShipping(cartItems);

if (!canShip) {
  alert(`${reason}. Produkterna kommer skickas i ${suggestedShipments.length} separata paket.`);
}
```

---

## 🖼️ 3. Local Background Removal (Sharp + ML)

### Implementation

**File**: `lib/image-processing.ts`

**Methods**:
1. **Threshold-based** - Simple white background removal
2. **Edge detection** - Advanced contour detection
3. **Smart crop** - Auto-crop to content
4. **Enhancement** - Brightness, contrast, sharpness

### Usage

```typescript
import { removeBackgroundLocal, smartCrop, enhanceProductImage } from '@/lib/image-processing';

// Remove background
const buffer = await removeBackgroundLocal(imageBuffer);

// Smart crop to content
const cropped = await smartCrop(buffer);

// Enhance quality
const enhanced = await enhanceProductImage(cropped);
```

### API

```
POST /api/images/remove-background

Priority:
1. Local Sharp processing (default)
2. remove.bg API (if REMOVE_BG_API_KEY set)
3. Cloudinary AI (if CLOUDINARY_URL set)
```

### Limitations

**Local Processing**:
- ✅ No API costs
- ✅ Fast processing
- ✅ Privacy (no external upload)
- ❌ Works best with solid backgrounds
- ❌ Not as accurate as AI services

**For Best Results**:
- Use white or solid color backgrounds
- Good lighting
- Clear subject separation
- High contrast

**Production Recommendation**:
- Use remove.bg API for critical product images
- Use local processing for quick edits
- Provide manual crop as fallback

### Additional Features

**Smart Crop**:
```typescript
const cropped = await smartCrop(imageBuffer);
// Auto-crops to content bounds
```

**Enhance Image**:
```typescript
const enhanced = await enhanceProductImage(imageBuffer);
// Normalize brightness, sharpen edges
```

**Optimize for Web**:
```typescript
const optimized = await optimizeForWeb(imageBuffer, 1920, 85);
// Resize + compress
```

**Convert to WebP**:
```typescript
const webp = await convertToWebP(imageBuffer, 85);
// Better compression than JPEG
```

**Add Watermark**:
```typescript
const watermarked = await addWatermark(
  imageBuffer,
  logoBuffer,
  'bottom-right',
  0.5
);
```

---

## 📊 4. Complete Product Information

### All Fields

**Identifiers**:
- EAN-13, GS1 GTIN, SKU, Batch

**Physical**:
- Weight, dimensions, volume

**Food**:
- Ingredients, allergens, nutrition, expiry date

**Certifications**:
- 25+ certification badges

**Shipping**:
- Can consolidate (checkbox)
- Shipping restrictions (array)
- Cold chain / frozen flags
- Fragile / hazardous flags
- Shipping notes

### Product Creation Flow

1. **Basic Info** - Name, description, price
2. **Identifiers** - EAN, SKU, brand
3. **Physical** - Weight, dimensions
4. **Details** - Ingredients, allergens
5. **Certifications** - Select badges ✨ NEW
6. **Shipping** - Restrictions ✨ NEW
7. **Images** - Upload + edit

---

## 🚀 5. Deployment

### 1. Database Migration

```bash
psql -f database/shipping-restrictions.sql
```

Creates:
- New columns on products (8 fields)
- `shipping_restriction_categories` table
- Functions: `can_ship_together()`, `calculate_shipping_multiplier()`

### 2. Install Dependencies

Already added in package.json:
- `sharp` - Image processing
- `react-image-crop` - Crop UI
- `cloudinary` - Optional cloud processing

### 3. Test Features

**Certification Badges**:
```
1. Create product
2. Select certifications (click badges)
3. Save
4. View product page → See badges under images
5. View listing → See compact badges
```

**Shipping Restrictions**:
```
1. Create product (e.g., Parmesan cheese)
2. Uncheck "Kan konsolideras"
3. Select restrictions: CHEESE, COLD_CHAIN
4. Save
5. View product → See shipping warning
6. Add to cart with frozen item → See split shipment warning
```

**Background Removal**:
```
1. Upload product image
2. Click "Edit" → "Ta bort bakgrund"
3. Process (uses local Sharp)
4. Preview result
5. Save
```

---

## 📋 6. Best Practices

### Certifications

**Always Include**:
- Relevant dietary certifications (vegan, gluten-free)
- Environmental certifications (organic, MSC)
- Ethical certifications (Fairtrade)

**Don't Overdo It**:
- Max 5-6 certifications per product
- Only include verified certifications
- Provide proof if requested

### Shipping Restrictions

**Be Honest**:
- If product needs cold chain, mark it
- If fragile, mark it
- Better to over-communicate than under

**Examples**:

**Parmesan Cheese**:
```typescript
{
  canConsolidate: false,
  shippingRestrictions: ['CHEESE', 'COLD_CHAIN'],
  requiresColdChain: true,
  shippingNotes: 'Stark lukt, måste förpackas separat'
}
```

**Frozen Pizza**:
```typescript
{
  canConsolidate: false,
  shippingRestrictions: ['FROZEN'],
  requiresFrozen: true,
  shippingNotes: 'Måste hållas fryst under hela transporten'
}
```

**Glass Jar**:
```typescript
{
  canConsolidate: true,
  shippingRestrictions: ['FRAGILE'],
  isFragile: true,
  shippingNotes: 'Kräver extra skyddsmaterial'
}
```

---

## ✅ Implementation Status

| Feature | Status | Files |
|---------|--------|-------|
| Certification badges (25+) | ✅ Klar | CertificationBadges.tsx |
| Badge selector UI | ✅ Klar | CertificationSelector |
| Compact badges | ✅ Klar | CertificationBadgesCompact |
| Shipping restrictions | ✅ Klar | shipping-restrictions.sql |
| Can consolidate checkbox | ✅ Klar | products.can_consolidate |
| Restriction categories | ✅ Klar | 9 categories |
| Compatibility check | ✅ Klar | can_ship_together() |
| Cost calculation | ✅ Klar | calculate_shipping_multiplier() |
| Local background removal | ✅ Klar | image-processing.ts |
| Smart crop | ✅ Klar | smartCrop() |
| Image enhancement | ✅ Klar | enhanceProductImage() |
| Product page UI | ✅ Klar | products/[id]/page.tsx |

---

## 🎯 Summary

**Alla funktioner implementerade**:

1. ✅ **25+ Certifieringsmärken** - Ekologisk, glutenfri, vegansk, fairtrade, 100% bomull, etc
2. ✅ **Visuella Badges** - Färgkodade ikoner med tooltips
3. ✅ **Placering** - Under bilder på product page, under bilder på listing
4. ✅ **Fraktrestriktioner** - Checkbox "kan konsolideras"
5. ✅ **9 Restriction Categories** - Ost, fryst, kylvara, ömtålig, etc
6. ✅ **Kompatibilitetskontroll** - Automatisk kontroll om produkter kan skickas tillsammans
7. ✅ **Local Background Removal** - Sharp + ML, ingen API-kostnad
8. ✅ **Smart Crop & Enhance** - Automatisk beskärning och förbättring

**Key Benefits**:
- **Certifieringar** - Visuella märken ökar förtroende och försäljning
- **Fraktrestriktioner** - Förhindrar problem med inkompatibla produkter
- **Automatisk kontroll** - Systemet varnar vid checkout om produkter inte kan skickas tillsammans
- **Kostnadskalkylering** - Automatisk beräkning av extra fraktkostnader
- **Local Processing** - Ingen API-kostnad för bildbehandling

**Redo för deployment!** 🚀
