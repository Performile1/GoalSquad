# GoalSquad - Komplett Produkthantering

**Datum**: 2026-04-15  
**Status**: ✅ Implementerat

---

## 📦 1. Produktattribut (Alla Fält)

### Grundläggande Information
- ✅ **Produktnamn** - Tydligt beskrivande namn
- ✅ **Beskrivning** - Detaljerad produktbeskrivning
- ✅ **Pris** - Försäljningspris i SEK/NOK
- ✅ **Lagersaldo** - Antal i lager
- ✅ **Kategori** - Produktkategori (med AI-förslag)

### Identifiering & Spårning
- ✅ **EAN-13** - Europeisk artikelnummer (valideras automatiskt)
- ✅ **GS1 GTIN-14** - Global Trade Item Number
- ✅ **SKU** - Merchant's Stock Keeping Unit
- ✅ **Varumärke** - Brand name
- ✅ **Tillverkare** - Manufacturer

### Fysiska Attribut
- ✅ **Vikt** - I gram (konverteras till kg)
- ✅ **Längd** - I millimeter (konverteras till cm)
- ✅ **Bredd** - I millimeter
- ✅ **Höjd** - I millimeter
- ✅ **Volym** - I milliliter (för vätskor)

### Produktdetaljer
- ✅ **Ingredienser** - Ingrediensförteckning
- ✅ **Allergener** - Lista över allergener (14 vanliga)
- ✅ **Näringsinnehåll** - JSON med nutrition facts
- ✅ **Ursprungsland** - ISO country code
- ✅ **Bäst före datum** - Expiry date
- ✅ **Batch nummer** - Lot/batch tracking

### Förpackning
- ✅ **Förpackningstyp** - Låda, påse, flaska, burk, etc
- ✅ **Enheter per förpackning** - Antal items
- ✅ **Återvinningsbar** - Boolean flag
- ✅ **Miljövänlig** - Eco-friendly flag

### Certifieringar & Restriktioner
- ✅ **Certifieringar** - Ekologisk, Fairtrade, KRAV, etc
- ✅ **Åldersgräns** - 15+, 18+, 21+

### Bilder
- ✅ **Flera bilder** - Unlimited product images
- ✅ **Bildtyper** - Product, lifestyle, detail, packaging
- ✅ **Sortering** - Display order
- ✅ **Huvudbild** - Primary image flag

---

## 🔖 2. EAN & GS1 Hantering

### EAN-13 Validation

**Automatisk validering**:
```sql
SELECT validate_ean13('5901234123457');
-- Returns: true/false
```

**Checksum Algorithm**:
1. Multiply odd positions by 1
2. Multiply even positions by 3
3. Sum all results
4. Subtract from next multiple of 10
5. Compare with check digit

**UI Feedback**:
- ✅ Real-time validation
- ✅ Green checkmark for valid
- ✅ Red X for invalid
- ✅ Auto-format (remove non-digits)

### GS1 GTIN-14

**Format**: 14 digits
**Usage**: Wholesale/logistics
**Optional**: Not required for retail

---

## 🎯 3. Smart Duplicate Prevention

### Similarity Detection

**Triggers**:
- Product name entered (> 3 chars)
- EAN entered
- Brand + name combination

**Algorithm**:
```sql
SELECT * FROM find_similar_products(
  'Premium Choklad',  -- name
  '5901234123457',    -- EAN
  'Marabou',          -- brand
  0.6                 -- similarity threshold
);
```

**Similarity Scoring**:
- **Exact EAN match** - 100% (highest priority)
- **Name similarity** - PostgreSQL pg_trgm
- **Brand + name** - Combined score
- **Threshold** - 60% default

### UI Workflow

**When duplicates found**:
1. ⚠️ Yellow warning banner
2. Show similar products with scores
3. Options:
   - **Use existing** - Link to existing product
   - **Create new** - Proceed anyway

**Benefits**:
- Prevents duplicate products
- Saves merchant time
- Maintains clean catalog
- Improves search quality

---

## 🤖 4. AI Category Suggestions

### Auto-Suggest Categories

**Triggers**:
- Product name entered
- Description added

**Algorithm**:
```sql
SELECT * FROM suggest_product_category(
  'Premium Chokladaskar 500g',
  'Läcker choklad med nötter'
);
```

**Returns**:
- Top 5 matching categories
- Confidence scores (0-1)
- Sorted by relevance

### UI Integration

**Display**:
- 💡 Blue suggestion box
- Clickable category pills
- Confidence percentage shown
- Easy one-click selection

**Fallback**:
- Manual dropdown always available
- Shows all categories
- Product counts per category

---

## 📸 5. Multi-Image Upload

### Features

- ✅ **Multiple images** - Unlimited uploads
- ✅ **Drag & drop** - Easy upload
- ✅ **Preview** - Instant preview
- ✅ **Reorder** - Change display order
- ✅ **Primary image** - First = main
- ✅ **Image types** - Product, lifestyle, detail, packaging
- ✅ **Remove** - Delete unwanted images

### Database Schema

```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  image_type VARCHAR(50),
  alt_text TEXT
);
```

### Storage

**Supabase Storage**:
- Bucket: `product-images`
- Public access
- Max 5MB per image
- Formats: PNG, JPG, WebP

---

## 📞 6. Contact Information (All Entities)

### Supported Entities

- ✅ **Merchants** - Company contact info
- ✅ **Communities** - Club/school contact
- ✅ **Sellers** - Individual seller contact
- ✅ **Users** - Personal contact

### Fields

**Contact Details**:
- Email
- Phone
- Mobile
- Website

**Address**:
- Address line 1 & 2
- Postal code
- City
- Region
- Country
- Coordinates (lat/lng)

**Social Media**:
- Facebook
- Instagram
- Twitter/X
- LinkedIn

**Additional**:
- Contact person name
- Contact person role
- Business hours (JSON)
- Public visibility toggle

### Database Schema

```sql
CREATE TABLE contact_information (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(50), -- 'merchant', 'community', 'seller', 'user'
  entity_id UUID,
  email VARCHAR(255),
  phone VARCHAR(50),
  -- ... all fields
  is_public BOOLEAN,
  is_primary BOOLEAN
);
```

### API

```
GET /api/contact/merchant/[id]
PUT /api/contact/merchant/[id]

GET /api/contact/community/[id]
PUT /api/contact/community/[id]

GET /api/contact/seller/[id]
PUT /api/contact/seller/[id]

GET /api/contact/user/[id]
PUT /api/contact/user/[id]
```

### UI Component

```tsx
import ContactForm from '@/app/components/ContactForm';

<ContactForm 
  entityType="merchant" 
  entityId="merchant-uuid"
  onSave={() => console.log('Saved!')}
/>
```

---

## 🎨 7. Product Creation Wizard (5 Steps)

### Step 1: Grundinfo 📝
- Product name
- Description
- Category (with AI suggestions)
- Price
- Stock

### Step 2: Identifiering 🔖
- EAN-13 (validated)
- GS1 GTIN-14
- SKU
- Brand
- Manufacturer

### Step 3: Mått & Vikt 📏
- Weight (grams → kg)
- Dimensions (mm → cm)
- Volume (ml → liters)
- Auto-calculations

### Step 4: Detaljer 📋
- Ingredients
- Allergens (14 common)
- Country of origin
- Package type
- Sustainability flags
- Certifications (10 common)
- Age restriction

### Step 5: Bilder 📸
- Multi-image upload
- Drag & drop
- Preview
- Remove
- Primary image auto-selected

### Progress Tracking

- ✅ Visual step indicator
- ✅ Completed steps marked green
- ✅ Current step highlighted
- ✅ Click to jump between steps
- ✅ Validation before proceeding

---

## 📊 8. Database Schema Summary

### New Tables: 2

```sql
-- Product images
product_images (
  id, product_id, image_url, display_order,
  is_primary, image_type, alt_text, metadata
)

-- Contact information
contact_information (
  id, entity_type, entity_id,
  email, phone, mobile, website,
  address_line1, address_line2, postal_code, city, region, country,
  latitude, longitude,
  facebook_url, instagram_url, twitter_url, linkedin_url,
  business_hours, contact_person, contact_role,
  is_public, is_primary, metadata
)
```

### New Columns on Products: 25

```sql
-- Identifiers
ean, gs1_gtin, sku, brand, manufacturer

-- Physical
weight_grams, length_mm, width_mm, height_mm, volume_ml

-- Details
ingredients, allergens, nutritional_info, country_of_origin,
expiry_date, batch_number

-- Packaging
package_type, units_per_package, recyclable, eco_friendly

-- Certifications
certifications, age_restriction

-- Flexible
attributes (JSONB)
```

### New Functions: 4

```sql
-- Find similar products (deduplication)
find_similar_products(name, ean, brand, threshold)

-- Suggest categories (AI-assisted)
suggest_product_category(name, description)

-- Validate EAN-13 checksum
validate_ean13(ean_code)

-- Get category tree with counts
get_category_tree()
```

---

## 🚀 9. Deployment

### 1. Run Database Migration

```bash
psql -f database/product-attributes.sql
```

Creates:
- New tables (product_images, contact_information)
- New columns on products (25 fields)
- Functions (similarity, validation, suggestions)
- Indexes for performance
- RLS policies

### 2. Setup Supabase Storage

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Public read policy
CREATE POLICY "Public read product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Authenticated upload policy
CREATE POLICY "Authenticated upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

### 3. Test Product Creation

```bash
# Navigate to merchant portal
https://goalsquad.shop/merchant/products/create

# Fill in product details
# Upload images
# Check for duplicates
# Get category suggestions
# Validate EAN
# Submit
```

### 4. Test Contact Management

```bash
# Navigate to settings
https://goalsquad.shop/merchant/settings/contact

# Fill in contact information
# Add social media links
# Toggle public visibility
# Save
```

---

## 📋 10. Recommended Product Fields (Checklist)

### ✅ Obligatoriska Fält
- [x] Produktnamn
- [x] Beskrivning
- [x] Pris
- [x] Lagersaldo
- [x] Kategori
- [x] Minst 1 bild

### ⭐ Starkt Rekommenderade
- [x] EAN-13 (för spårning)
- [x] Varumärke
- [x] Vikt (för frakt)
- [x] Mått (för frakt)
- [x] Ursprungsland

### 💡 Bra att Ha
- [x] SKU (internt)
- [x] Ingredienser (mat)
- [x] Allergener (mat)
- [x] Förpackningstyp
- [x] Certifieringar
- [x] Flera bilder

### 🌟 Extra (Valfritt)
- [x] GS1 GTIN-14
- [x] Tillverkare
- [x] Batch nummer
- [x] Bäst före datum
- [x] Näringsinnehåll
- [x] Åldersgräns

---

## 🎯 11. Best Practices

### Product Names
✅ **Good**: "Marabou Premium Chokladaskar 500g"
❌ **Bad**: "Choklad"

**Tips**:
- Include brand
- Include size/weight
- Be specific
- Use keywords

### Descriptions
✅ **Good**: "Läcker premium choklad med hela hasselnötter. Perfekt som gåva eller för egen njutning. Innehåller 20 pralines i olika smaker."
❌ **Bad**: "Choklad"

**Tips**:
- 2-3 sentences minimum
- Highlight key features
- Mention use cases
- Include details

### Categories
✅ **Good**: Use AI suggestions first
❌ **Bad**: Guess randomly

**Tips**:
- Let AI suggest
- Check similar products
- Be consistent
- Don't create duplicates

### Images
✅ **Good**: Multiple high-quality images
❌ **Bad**: One blurry phone photo

**Tips**:
- Minimum 3 images
- White background for main
- Show product in use
- Show packaging
- High resolution

### EAN Codes
✅ **Good**: Use official EAN from supplier
❌ **Bad**: Make up random numbers

**Tips**:
- Get from supplier
- Validate before saving
- Use for inventory tracking
- Helps prevent duplicates

---

## 📈 12. Analytics & Insights

### Track Product Quality

```sql
-- Products with complete info
SELECT 
  COUNT(*) FILTER (WHERE ean IS NOT NULL) as with_ean,
  COUNT(*) FILTER (WHERE brand IS NOT NULL) as with_brand,
  COUNT(*) FILTER (WHERE weight_grams IS NOT NULL) as with_weight,
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM product_images WHERE product_id = products.id
  )) as with_images,
  COUNT(*) as total
FROM products;
```

### Find Incomplete Products

```sql
-- Products missing key info
SELECT id, name, merchant_id
FROM products
WHERE ean IS NULL 
   OR brand IS NULL 
   OR weight_grams IS NULL
   OR NOT EXISTS (
     SELECT 1 FROM product_images WHERE product_id = products.id
   );
```

### Duplicate Detection Report

```sql
-- Potential duplicates by EAN
SELECT ean, COUNT(*) as count, array_agg(name) as products
FROM products
WHERE ean IS NOT NULL
GROUP BY ean
HAVING COUNT(*) > 1;
```

---

## ✅ Implementation Status

| Feature | Status | Files |
|---------|--------|-------|
| Product attributes (25 fields) | ✅ Klar | product-attributes.sql |
| EAN-13 validation | ✅ Klar | validate-ean/route.ts |
| GS1 GTIN support | ✅ Klar | Schema |
| Multi-image upload | ✅ Klar | product_images table |
| Duplicate detection | ✅ Klar | check-similar/route.ts |
| AI category suggestions | ✅ Klar | suggest-category/route.ts |
| 5-step wizard UI | ✅ Klar | create/page.tsx, steps.tsx |
| Contact information | ✅ Klar | contact_information table |
| Contact form UI | ✅ Klar | ContactForm.tsx |

---

## 🎉 Summary

**Alla funktioner implementerade**:

1. ✅ **25+ produktattribut** - EAN, GS1, mått, vikt, ingredienser, etc
2. ✅ **EAN-13 validering** - Automatisk checksum validation
3. ✅ **Multi-image upload** - Unlimited bilder per produkt
4. ✅ **Smart duplicate prevention** - AI-driven similarity detection
5. ✅ **AI category suggestions** - Auto-suggest rätt kategori
6. ✅ **5-step wizard** - Guided product creation
7. ✅ **Contact information** - För alla entities (merchant, community, seller, user)
8. ✅ **Comprehensive UI** - Beautiful, user-friendly forms

**Redo för produktion!** 🚀
