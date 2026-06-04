# GoalSquad - Färskvaror, Allergier & Företagsvarumärke

**Datum**: 2026-04-15  
**Status**: ✅ Implementerat

---

## 🍎 1. Färskvaror & Bäst Före-datum

### Features

**Redan Implementerat** (från product-attributes.sql):
- ✅ **Bäst före-datum** (`expiry_date DATE`)
- ✅ **Batch nummer** (`batch_number VARCHAR(100)`)
- ✅ **Ingredienser** (`ingredients TEXT`)
- ✅ **Allergener** (`allergens TEXT[]`)
- ✅ **Näringsinnehåll** (`nutritional_info JSONB`)

### Användning

```typescript
// Skapa produkt med bäst före-datum
const product = {
  name: 'Ekologisk Mjölk 1L',
  expiryDate: '2026-05-01',  // Bäst före
  batchNumber: 'BATCH-2026-04-15-001',
  ingredients: 'Ekologisk mjölk',
  allergens: ['milk'],
};
```

### Batch Tracking

**Format**: `BATCH-YYYY-MM-DD-XXX`

**Benefits**:
- Spårbarhet vid recall
- Kvalitetskontroll
- Lagerstyrning (FIFO - First In, First Out)
- Compliance med livsmedelslag

### Expiry Date Management

**Auto-warnings**:
- 🟡 7 dagar kvar - Varning
- 🔴 3 dagar kvar - Röd varning
- ❌ Utgånget - Dölj från försäljning

```sql
-- Find products expiring soon
SELECT * FROM products
WHERE expiry_date <= CURRENT_DATE + INTERVAL '7 days'
  AND expiry_date > CURRENT_DATE
ORDER BY expiry_date;

-- Find expired products
SELECT * FROM products
WHERE expiry_date < CURRENT_DATE;
```

---

## ⚠️ 2. Allergi-varningar (Cards)

### Interactive Allergen Cards

**14 Vanliga Allergener** (EU-standard):
1. 🥛 Mjölk
2. 🥚 Ägg
3. 🐟 Fisk
4. 🦐 Skaldjur
5. 🥜 Nötter (trädnötter)
6. 🥜 Jordnötter
7. 🫘 Soja
8. 🌾 Vete
9. 🌾 Gluten
10. 🥬 Selleri
11. 🌭 Senap
12. 🌰 Sesam
13. 🌱 Lupin
14. ⚗️ Svaveldioxid

### 3 Severity Levels

**Innehåller** (🔴 Röd):
- Produkten innehåller allergenet
- Tydlig varning
- Röd bakgrund

**Kan innehålla spår** (🟡 Gul):
- Korsföroreningsrisk
- Tillverkas i samma anläggning
- Gul bakgrund

**Fri från** (🟢 Grön):
- Produkten innehåller INTE allergenet
- Marknadsföringsfördel
- Grön badge

### UI Component

```tsx
import AllergenCards, { COMMON_ALLERGENS } from '@/app/components/AllergenCards';

// Display mode (product page)
<AllergenCards 
  allergens={[
    { id: 'milk', name: 'Mjölk', emoji: '🥛', severity: 'contains' },
    { id: 'nuts', name: 'Nötter', emoji: '🥜', severity: 'may_contain' }
  ]}
  mode="display"
/>

// Select mode (product creation)
<AllergenCards 
  allergens={selectedAllergens}
  mode="select"
  onToggle={(id, severity) => {
    // Update allergen severity
  }}
/>
```

### Compact Badges

```tsx
import { AllergenBadges, FreeFromBadges } from '@/app/components/AllergenCards';

// Show allergen warnings on product card
<AllergenBadges allergens={product.allergens} />

// Show "free from" marketing badges
<FreeFromBadges allergens={product.allergens} />
```

### Database Storage

```sql
-- Allergens stored as array
UPDATE products
SET allergens = ARRAY['milk', 'eggs', 'wheat']
WHERE id = 'product-uuid';

-- Query products by allergen
SELECT * FROM products
WHERE 'nuts' = ANY(allergens);

-- Find allergen-free products
SELECT * FROM products
WHERE NOT ('gluten' = ANY(allergens));
```

---

## 🏢 3. Företagslogotyper & Varumärke

### 3 Typer av Logotyper

**Huvudlogga** (`logo_url`):
- Kvadratisk eller vertikal
- Används på produktsidor
- Allmän användning

**Kvadratisk Logga** (`logo_square_url`):
- 512x512px rekommenderat
- För ikoner och avatars
- App-ikoner

**Horisontell Logga** (`logo_horizontal_url`):
- 1200x300px rekommenderat
- För headers och banners
- Bred layout

### Brand Colors

```json
{
  "primary": "#0ea5e9",    // Huvudfärg
  "secondary": "#06b6d4"   // Sekundärfärg
}
```

**Användning**:
- Produktsidor
- Företagsprofil
- Email templates
- Invoices

### Company Information

**Grundläggande**:
- Företagsbeskrivning
- Grundat år
- Antal anställda
- Organisationsnummer
- VAT/MOMS-nummer

**Social Media**:
- Webbplats
- LinkedIn
- Facebook
- Instagram

### Database Schema

```sql
ALTER TABLE merchants
ADD COLUMN logo_url TEXT,
ADD COLUMN logo_square_url TEXT,
ADD COLUMN logo_horizontal_url TEXT,
ADD COLUMN brand_colors JSONB,
ADD COLUMN company_description TEXT,
ADD COLUMN founded_year INTEGER,
ADD COLUMN employee_count VARCHAR(50),
ADD COLUMN company_registration VARCHAR(100),
ADD COLUMN vat_number VARCHAR(100),
ADD COLUMN website_url TEXT,
ADD COLUMN linkedin_url TEXT,
ADD COLUMN facebook_url TEXT,
ADD COLUMN instagram_url TEXT;
```

---

## 👤 4. Kontaktpersoner

### Merchant Contacts

**Fields**:
- Namn
- Roll/Titel (VD, Försäljningschef, etc)
- Email
- Telefon
- Mobil
- Foto
- Bio
- LinkedIn

**Responsibilities**:
- ✅ Primär kontakt
- ✅ Faktureringskontakt
- ✅ Teknisk kontakt
- ✅ Försäljningskontakt

### Database Schema

```sql
CREATE TABLE merchant_contacts (
  id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id),
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  is_primary BOOLEAN DEFAULT false,
  is_billing_contact BOOLEAN DEFAULT false,
  is_technical_contact BOOLEAN DEFAULT false,
  is_sales_contact BOOLEAN DEFAULT false,
  photo_url TEXT,
  bio TEXT,
  linkedin_url TEXT
);
```

### API

```
GET /api/merchant/contacts
POST /api/merchant/contacts
PUT /api/merchant/contacts/[id]
DELETE /api/merchant/contacts/[id]
```

---

## 📸 5. Bildbehandling (Crop & Remove Background)

### Features

**Crop (Beskär)**:
- ✂️ Interaktiv beskärning
- Drag & drop selection
- Aspect ratios (1:1, 16:9, 4:3, fri)
- Real-time preview

**Remove Background (Ta bort bakgrund)**:
- 🎨 AI-driven background removal
- Automatic detection
- Before/after preview
- Transparent PNG output

### Image Editor Component

```tsx
import ImageEditor from '@/app/components/ImageEditor';

<ImageEditor
  imageUrl="/path/to/image.jpg"
  onSave={(blob, url) => {
    // Save edited image
  }}
  onCancel={() => {
    // Cancel editing
  }}
/>
```

### Modes

**Crop Mode**:
- Uses `react-image-crop` library
- Drag to select area
- Maintains aspect ratio (optional)
- Generates cropped image

**Remove Background Mode**:
- Calls AI service (remove.bg, Cloudinary, or local)
- Automatic background detection
- Returns transparent PNG
- Checkerboard preview

### Background Removal Options

**Option 1: remove.bg** (Recommended):
```bash
# Add to .env
REMOVE_BG_API_KEY=your_api_key_here
```

**Pricing**:
- Free: 50 images/month
- Paid: $0.20/image

**Option 2: Cloudinary**:
```bash
# Add to .env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Pricing**:
- Free: 25 credits/month
- Paid: $0.0025/credit

**Option 3: Local Processing**:
- Uses Sharp + ML model
- No API costs
- Requires more server resources

### API Endpoints

```
POST /api/images/crop
- Crop image with aspect ratio
- Returns cropped image URL

POST /api/images/remove-background
- Remove background using AI
- Returns transparent PNG URL
```

### Workflow

1. **Upload Image** → Original uploaded
2. **Edit** → User clicks "Edit"
3. **Choose Mode** → Crop or Remove BG
4. **Process** → AI/manual processing
5. **Preview** → Show result
6. **Save** → Upload processed image

---

## 🏅 6. Certifieringar

### Merchant Certifications

**Types**:
- ISO 9001 (Quality Management)
- ISO 14001 (Environmental)
- Fairtrade
- Organic/Ekologisk
- KRAV
- MSC (Marine Stewardship)
- FSC (Forest Stewardship)
- Halal
- Kosher
- B Corp

### Database Schema

```sql
CREATE TABLE merchant_certifications (
  id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id),
  certification_type VARCHAR(100),
  certification_name TEXT,
  issuing_organization VARCHAR(255),
  certificate_number VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,
  certificate_url TEXT,  -- PDF/image
  is_active BOOLEAN DEFAULT true
);
```

### Display

**On Merchant Profile**:
- Badge display
- Certification name
- Expiry date
- Link to certificate

**On Products**:
- Inherited from merchant
- Product-specific certifications
- Trust badges

---

## 📊 7. Complete Product Information

### All Fields for Food Products

**Identifiers**:
- ✅ EAN-13
- ✅ GS1 GTIN
- ✅ SKU
- ✅ Batch number

**Physical**:
- ✅ Weight (grams)
- ✅ Dimensions (mm)
- ✅ Volume (ml)

**Food-Specific**:
- ✅ Ingredients
- ✅ Allergens (14 types)
- ✅ Nutritional info (JSON)
- ✅ Country of origin
- ✅ Expiry date
- ✅ Package type

**Safety & Compliance**:
- ✅ Allergen warnings (cards)
- ✅ Certifications
- ✅ Age restrictions
- ✅ Batch tracking

**Marketing**:
- ✅ Multiple images
- ✅ Brand colors
- ✅ Merchant logos
- ✅ Free-from badges

---

## 🚀 8. Deployment

### 1. Database Migration

```bash
# Run migrations
psql -f database/product-attributes.sql
psql -f database/merchant-branding.sql
```

### 2. Install Dependencies

```bash
npm install sharp react-image-crop cloudinary form-data lodash node-fetch
```

### 3. Environment Variables

```bash
# .env.local

# Remove.bg (optional)
REMOVE_BG_API_KEY=your_key_here

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Supabase (required)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Test Features

**Allergen Cards**:
```
1. Create product
2. Select allergens (click to cycle: free → contains → may contain)
3. Save
4. View product page → See allergen warnings
```

**Image Editing**:
```
1. Upload product image
2. Click "Edit"
3. Choose "Crop" or "Remove Background"
4. Process
5. Preview
6. Save
```

**Merchant Branding**:
```
1. Go to /merchant/settings/branding
2. Upload 3 logos
3. Set brand colors
4. Fill company info
5. Add contact persons
6. Save
```

---

## 📋 9. Best Practices

### Food Products

**Always Include**:
- ✅ Bäst före-datum
- ✅ Batch nummer
- ✅ Ingredienser
- ✅ Allergener
- ✅ Ursprungsland

**Optional but Recommended**:
- ✅ Näringsinnehåll
- ✅ Certifieringar
- ✅ Förpackningsinformation
- ✅ Lagringsanvisningar

### Allergen Warnings

**Legal Requirements** (EU):
- Must declare all 14 major allergens
- Must be clearly visible
- Must use consistent terminology
- Must warn about cross-contamination

**Best Practices**:
- Use visual cards (not just text)
- Color-code severity
- Show on product card
- Highlight on product page
- Include in order confirmation

### Image Quality

**Product Images**:
- Minimum 800x800px
- White or transparent background
- Multiple angles
- Show packaging
- Show product in use

**Logos**:
- Vector format (SVG) preferred
- PNG with transparency
- High resolution (2x for retina)
- Consistent branding

---

## ✅ Implementation Status

| Feature | Status | Files |
|---------|--------|-------|
| Bäst före-datum | ✅ Klar | product-attributes.sql |
| Batch tracking | ✅ Klar | product-attributes.sql |
| Allergen cards (14 types) | ✅ Klar | AllergenCards.tsx |
| Interactive allergen selection | ✅ Klar | AllergenCards.tsx |
| Allergen badges | ✅ Klar | AllergenCards.tsx |
| Merchant logos (3 types) | ✅ Klar | merchant-branding.sql |
| Brand colors | ✅ Klar | merchant-branding.sql |
| Company information | ✅ Klar | merchant-branding.sql |
| Contact persons | ✅ Klar | merchant_contacts table |
| Certifications | ✅ Klar | merchant_certifications table |
| Image crop | ✅ Klar | ImageEditor.tsx, crop API |
| Remove background | ✅ Klar | ImageEditor.tsx, remove-bg API |
| Branding UI | ✅ Klar | branding/page.tsx |

---

## 🎯 Summary

**Alla funktioner du bad om är implementerade**:

1. ✅ **Bäst före-datum & Batch** - För färskvaror
2. ✅ **Allergi-varningar** - 14 typer, interaktiva cards
3. ✅ **Produktinformation** - Ingredienser, näringsinnehåll
4. ✅ **Företagslogotyper** - 3 typer (huvud, kvadrat, horisontell)
5. ✅ **Kontaktpersoner** - Flera per företag
6. ✅ **Företagsinformation** - Beskrivning, org.nr, VAT, etc
7. ✅ **Image Crop** - Interaktiv beskärning
8. ✅ **Remove Background** - AI-driven bakgrundsborttagning

**Bonus Features**:
- ✅ Certifieringar (ISO, Fairtrade, etc)
- ✅ Brand colors
- ✅ Social media links
- ✅ Multiple contact persons
- ✅ Free-from badges (marketing)

**Redo för produktion!** 🚀
