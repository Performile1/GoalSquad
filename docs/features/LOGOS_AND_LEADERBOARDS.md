# GoalSquad - Klubbloggor, Banner & Leaderboards

**Datum**: 2026-04-15  
**Status**: ✅ Implementerat

---

## 📸 1. Klubbloggor (Community Logos)

### Funktioner

**3 Typer av Loggor**:
- ✅ **Primär Logga** - Kvadratisk (500x500px) - Huvudlogga
- ✅ **Banner Logga** - Bred (1200x300px) - För headers
- ✅ **Ikon Logga** - Liten (128x128px) - För ikoner

**Varumärkesinställningar**:
- ✅ Brand colors (primär & sekundär färg)
- ✅ Visa på startsidan (opt-in)
- ✅ Endast community admins kan ladda upp

### Database Schema

```sql
-- Nya kolumner i communities table
ALTER TABLE communities
ADD COLUMN logo_url TEXT,
ADD COLUMN logo_banner_url TEXT,
ADD COLUMN logo_icon_url TEXT,
ADD COLUMN brand_colors JSONB DEFAULT '{"primary": "#0ea5e9", "secondary": "#06b6d4"}',
ADD COLUMN show_on_homepage BOOLEAN DEFAULT false;
```

### API Endpoints

#### Upload Logo
```
POST /api/communities/[id]/logo
Content-Type: multipart/form-data

Body:
- logo: File (PNG, JPEG, SVG, WebP)
- type: 'primary' | 'banner' | 'icon'

Response:
{
  "success": true,
  "logoUrl": "https://...",
  "type": "primary"
}
```

#### Update Branding
```
PUT /api/communities/[id]/logo
Content-Type: application/json

Body:
{
  "brandColors": {
    "primary": "#0ea5e9",
    "secondary": "#06b6d4"
  },
  "showOnHomepage": true
}
```

### UI Component

**Settings Page**: `/communities/[id]/settings`

Features:
- Drag & drop logo upload
- Color picker för brand colors
- Live preview av färgschema
- Toggle för homepage visibility

### Användning

```typescript
// Upload logo
const formData = new FormData();
formData.append('logo', logoFile);
formData.append('type', 'primary');

await fetch(`/api/communities/${communityId}/logo`, {
  method: 'POST',
  body: formData,
});

// Update branding
await fetch(`/api/communities/${communityId}/logo`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    brandColors: { primary: '#0ea5e9', secondary: '#06b6d4' },
    showOnHomepage: true,
  }),
});
```

---

## 🎪 2. Homepage Banner (Rullande Loggor)

### Funktioner

- ✅ Infinite scroll animation
- ✅ Visar föreningar med loggor
- ✅ Klickbara kort till community pages
- ✅ Stats (medlemmar, total försäljning)
- ✅ Gradient overlays för smooth edges

### Component

**File**: `app/components/CommunityBanner.tsx`

**Features**:
- Framer Motion för smooth animation
- Duplicerade communities för seamless loop
- Hover effects
- Responsive design

### Integration

```tsx
// På homepage
import CommunityBanner from '@/app/components/CommunityBanner';

export default function HomePage() {
  return (
    <div>
      <CommunityBanner />
      {/* Rest of homepage */}
    </div>
  );
}
```

### API

```
GET /api/communities/featured

Response:
{
  "communities": [
    {
      "id": "uuid",
      "name": "Fotbollslaget Vikings",
      "logoUrl": "https://...",
      "city": "Oslo",
      "country": "NO",
      "totalMembers": 25,
      "totalSales": 150000
    }
  ]
}
```

### Customization

```typescript
// Ändra scroll speed
transition={{
  duration: communities.length * 3, // 3 sekunder per logo
  ease: 'linear',
}}

// Ändra antal loggor som visas
.limit(50) // Max 50 communities
```

---

## 🏆 3. Public Leaderboard

### Funktioner

**2 Typer av Leaderboards**:
- ✅ **Säljare** - Top sellers
- ✅ **Föreningar** - Top communities

**Tidsperioder**:
- ✅ Denna vecka
- ✅ Denna månad
- ✅ Totalt (all time)

**Features**:
- ✅ Top 3 podium med medaljer
- ✅ Full lista med rankings
- ✅ Avatars & loggor
- ✅ Stats (försäljning, ordrar, level)

### Page

**URL**: `/leaderboard`

**Features**:
- Tab navigation (Säljare/Föreningar)
- Period filters
- Animated entries
- Medal emojis för top 3
- Responsive design

### API

```
GET /api/leaderboard?type=sellers&period=month&limit=50

Parameters:
- type: 'sellers' | 'communities'
- period: 'week' | 'month' | 'all_time'
- limit: number (default: 50)

Response:
{
  "leaderboard": [
    {
      "rank": 1,
      "id": "uuid",
      "name": "Erik Andersson",
      "avatarUrl": "https://...",
      "communityName": "Fotbollslaget Vikings",
      "totalSales": 45000,
      "totalOrders": 120,
      "level": 8
    }
  ]
}
```

### Användning

```typescript
// Fetch seller leaderboard
const response = await fetch('/api/leaderboard?type=sellers&period=month');
const { leaderboard } = await response.json();

// Fetch community leaderboard
const response = await fetch('/api/leaderboard?type=communities&period=all_time');
const { leaderboard } = await response.json();
```

---

## 🏪 4. Merchant Showcase

### Funktioner

- ✅ Lista alla företag (merchants)
- ✅ Sök & filter funktionalitet
- ✅ Kategori-filter
- ✅ Featured merchants
- ✅ Stats (produkter, sålda, revenue)

### Page

**URL**: `/merchants`

**Features**:
- Search bar
- Category filters
- Featured section
- Merchant cards med stats
- Responsive grid layout

### API

```
GET /api/merchants/showcase

Response:
{
  "merchants": [
    {
      "id": "uuid",
      "name": "Chokladfabriken AB",
      "description": "Premium choklad sedan 1950",
      "logoUrl": "https://...",
      "totalProducts": 45,
      "totalSold": 12500,
      "totalRevenue": 875000,
      "categories": ["Choklad", "Godis"],
      "featured": true
    }
  ]
}
```

### Stats Beräkning

```typescript
// Total produkter
SELECT COUNT(*) FROM products 
WHERE merchant_id = ? AND status = 'active'

// Total sålda
SELECT SUM(quantity) FROM order_items 
WHERE merchant_id = ?

// Total revenue
SELECT SUM(quantity * price) FROM order_items 
WHERE merchant_id = ?
```

---

## 📊 Sammanfattning

### Nya Filer: 11 st

**Database**:
1. `database/community-logos.sql` - Schema för loggor

**Frontend Pages**:
2. `app/components/CommunityBanner.tsx` - Homepage banner
3. `app/leaderboard/page.tsx` - Public leaderboard
4. `app/merchants/page.tsx` - Merchant showcase
5. `app/communities/[id]/settings/page.tsx` - Logo upload UI

**Backend APIs**:
6. `app/api/communities/[id]/logo/route.ts` - Logo upload
7. `app/api/communities/featured/route.ts` - Featured communities
8. `app/api/leaderboard/route.ts` - Leaderboard data
9. `app/api/merchants/showcase/route.ts` - Merchant stats

**Documentation**:
10. `LOGOS_AND_LEADERBOARDS.md` - This file

### Nya Database Kolumner: 5 st

```sql
communities.logo_url
communities.logo_banner_url
communities.logo_icon_url
communities.brand_colors
communities.show_on_homepage
```

---

## 🚀 Deployment

### 1. Kör Database Migration

```bash
psql -f database/community-logos.sql
```

### 2. Setup Supabase Storage

```sql
-- Create storage bucket for logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true);

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'public');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'public' AND auth.role() = 'authenticated');
```

### 3. Upload Test Logos

```bash
# Via UI
1. Gå till /communities/[id]/settings
2. Ladda upp loggor
3. Sätt brand colors
4. Aktivera "Visa på startsidan"
```

### 4. Verifiera

```bash
# Test featured communities
curl https://goalsquad.shop/api/communities/featured

# Test leaderboard
curl https://goalsquad.shop/api/leaderboard?type=sellers&period=month

# Test merchant showcase
curl https://goalsquad.shop/api/merchants/showcase
```

---

## 🎨 Design Guidelines

### Logo Requirements

**Primär Logga**:
- Format: PNG, SVG (recommended)
- Size: 500x500px
- Background: Transparent
- Max file size: 5MB

**Banner Logga**:
- Format: PNG, SVG
- Size: 1200x300px
- Aspect ratio: 4:1
- Max file size: 5MB

**Ikon Logga**:
- Format: PNG, SVG
- Size: 128x128px
- Simple design (works at small size)
- Max file size: 2MB

### Brand Colors

**Best Practices**:
- Use high contrast colors
- Test accessibility (WCAG AA)
- Primary: Main brand color
- Secondary: Complementary color

**Examples**:
```json
{
  "primary": "#0ea5e9",   // Blue
  "secondary": "#06b6d4"  // Cyan
}

{
  "primary": "#dc2626",   // Red
  "secondary": "#f59e0b"  // Orange
}

{
  "primary": "#059669",   // Green
  "secondary": "#10b981"  // Light green
}
```

---

## 📈 Analytics & Metrics

### Track Logo Uploads

```sql
-- Count communities with logos
SELECT COUNT(*) FROM communities WHERE logo_url IS NOT NULL;

-- Featured communities
SELECT COUNT(*) FROM communities WHERE show_on_homepage = true;

-- Most viewed communities (add view tracking)
SELECT name, total_sales, total_members 
FROM communities 
WHERE show_on_homepage = true
ORDER BY total_sales DESC;
```

### Leaderboard Stats

```sql
-- Top seller this month
SELECT sp.*, p.full_name, c.name as community_name
FROM seller_profiles sp
JOIN profiles p ON p.id = sp.user_id
JOIN communities c ON c.id = sp.community_id
ORDER BY sp.total_sales DESC
LIMIT 1;

-- Top community
SELECT * FROM communities
ORDER BY total_sales DESC
LIMIT 1;
```

---

## 🔧 Troubleshooting

### Logo inte synlig på homepage

**Check**:
1. ✅ `show_on_homepage = true`
2. ✅ `logo_url IS NOT NULL`
3. ✅ Logo file accessible (public URL)
4. ✅ Community has sales/members

### Upload fails

**Common issues**:
- File too large (max 5MB)
- Invalid file type (use PNG, JPEG, SVG, WebP)
- No admin permissions
- Supabase storage not configured

### Leaderboard tom

**Check**:
1. ✅ Communities/sellers have sales
2. ✅ Period filter correct
3. ✅ Database has order data
4. ✅ API returns data (check console)

---

## ✅ Funktioner Status

| Funktion | Status | Kommentar |
|----------|--------|-----------|
| Logo Upload (3 typer) | ✅ Klar | PNG, JPEG, SVG, WebP |
| Brand Colors | ✅ Klar | Color picker UI |
| Homepage Banner | ✅ Klar | Infinite scroll animation |
| Seller Leaderboard | ✅ Klar | Week/Month/All time |
| Community Leaderboard | ✅ Klar | Top communities |
| Merchant Showcase | ✅ Klar | Med stats & filter |
| Settings UI | ✅ Klar | Admin only |

---

## 🎯 Nästa Steg

### Immediate
- [ ] Upload test logos för 5-10 communities
- [ ] Testa homepage banner
- [ ] Verifiera leaderboard data
- [ ] Test merchant showcase

### Short-term
- [ ] Add analytics tracking för logo views
- [ ] Email notifications när community featured
- [ ] Leaderboard badges/achievements
- [ ] Merchant featured section

### Long-term
- [ ] Animated logo transitions
- [ ] Video banners
- [ ] 3D logo rendering
- [ ] AR logo preview

---

**Status**: ✅ **ALLA FUNKTIONER KLARA**

- ✅ Klubbloggor (3 typer + brand colors)
- ✅ Homepage banner (rullande loggor)
- ✅ Public leaderboard (säljare & föreningar)
- ✅ Merchant showcase (med stats)

**Redo för deployment!** 🚀
