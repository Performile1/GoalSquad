# GoalSquad - Deployment Guide
## Vercel + Supabase Integration

**Datum**: 2026-04-15

---

## 🎯 Översikt

Vi ska koppla samman:
1. **Vercel** - Frontend & API hosting
2. **Supabase** - Database, Auth, Storage

---

## 📋 Förberedelser

### Vad du behöver:
- ✅ GitHub repository: https://github.com/Performile1/GoalSquad
- ✅ Vercel account (gratis)
- ✅ Supabase account (gratis)

---

## 1️⃣ SUPABASE SETUP

### Steg 1: Skapa Supabase Projekt

1. Gå till: https://supabase.com
2. Klicka "Start your project"
3. Logga in med GitHub
4. Klicka "New Project"

**Projekt Settings**:
```
Name: GoalSquad
Database Password: [Välj ett starkt lösenord - SPARA DET!]
Region: North Europe (Stockholm) - närmast Sverige
Pricing Plan: Free
```

5. Klicka "Create new project"
6. Vänta 2-3 minuter medan projektet skapas

---

### Steg 2: Hämta Supabase Credentials

När projektet är klart:

1. Gå till **Settings** → **API**
2. Kopiera dessa värden:

```
Project URL: https://[your-project-id].supabase.co
anon/public key: eyJhbGc...
service_role key: eyJhbGc... (HEMLIG - visa först)
```

**SPARA DESSA!** Vi behöver dem för Vercel.

---

### Steg 3: Kör Database Migrations

1. Gå till **SQL Editor** i Supabase
2. Klicka "New Query"
3. Kör dessa filer i ordning:

**Ordning (VIKTIGT)**:
```sql
-- 1. Grundläggande schema
database/schema.sql

-- 2. Utökad schema
database/schema-extended.sql

-- 3. Produktattribut
database/product-attributes.sql

-- 4. Produktkategorier
database/product-categories.sql

-- 5. Shipping restrictions
database/shipping-restrictions.sql

-- 6. Auth & Members
database/auth-and-members.sql

-- 7. MOQ & Warehouses
database/moq-and-warehouses.sql

-- 8. MOQ Enhancements
database/moq-enhancements.sql

-- 9. Product Flow Tracking
database/product-flow-tracking.sql

-- 10. Merchant Branding
database/merchant-branding.sql

-- 11. Community Logos
database/community-logos.sql

-- 12. Messaging System
database/messaging-system.sql

-- 13. Webhook Queue
database/webhook-queue.sql

-- 14. Security Hardening
database/security-hardening.sql

-- 15. Sample Data (SIST)
database/warehouse-sample-data.sql
database/sample-calculator-data.sql
```

**Hur du kör**:
1. Öppna filen i VS Code
2. Kopiera HELA innehållet
3. Klistra in i Supabase SQL Editor
4. Klicka "Run"
5. Vänta tills "Success" visas
6. Upprepa för nästa fil

---

### Steg 4: Verifiera Database

Kör denna query för att verifiera:

```sql
-- Kontrollera att alla tabeller finns
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Förväntat resultat: ~30+ tabeller
```

**Viktiga tabeller**:
- ✅ products
- ✅ merchants
- ✅ communities
- ✅ orders
- ✅ consolidation_warehouses
- ✅ warehouse_inventory
- ✅ pending_moq_orders
- ✅ profiles
- ✅ community_members

---

### Steg 5: Setup Storage Buckets

1. Gå till **Storage** i Supabase
2. Skapa dessa buckets:

**Bucket 1: product-images**
```
Name: product-images
Public: Yes
File size limit: 5 MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

**Bucket 2: merchant-logos**
```
Name: merchant-logos
Public: Yes
File size limit: 2 MB
Allowed MIME types: image/svg+xml, image/png
```

**Bucket 3: community-logos**
```
Name: community-logos
Public: Yes
File size limit: 2 MB
Allowed MIME types: image/svg+xml, image/png
```

**Bucket 4: avatars**
```
Name: avatars
Public: Yes
File size limit: 1 MB
Allowed MIME types: image/jpeg, image/png
```

---

### Steg 6: Setup Authentication

1. Gå till **Authentication** → **Providers**
2. Aktivera:

**Email (Enabled by default)**
```
✅ Enable email provider
✅ Confirm email: Yes
```

**Google (Optional)**
```
Client ID: [från Google Cloud Console]
Client Secret: [från Google Cloud Console]
```

**GitHub (Optional)**
```
Client ID: [från GitHub OAuth Apps]
Client Secret: [från GitHub OAuth Apps]
```

3. Gå till **Authentication** → **URL Configuration**

**Site URL**:
```
https://goalsquad.vercel.app (uppdatera efter Vercel deploy)
```

**Redirect URLs**:
```
http://localhost:3000/**
https://goalsquad.vercel.app/**
```

---

## 2️⃣ VERCEL SETUP

### Steg 1: Skapa Vercel Projekt

1. Gå till: https://vercel.com
2. Klicka "Add New..." → "Project"
3. Klicka "Import Git Repository"
4. Välj: **Performile1/GoalSquad**
5. Klicka "Import"

---

### Steg 2: Configure Project

**Framework Preset**: Next.js (auto-detected)

**Root Directory**: `./` (default)

**Build Command**:
```bash
npm run build
```

**Output Directory**: `.next` (default)

**Install Command**:
```bash
npm install
```

---

### Steg 3: Environment Variables

Klicka "Environment Variables" och lägg till:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (service_role key)

# App
NEXT_PUBLIC_APP_URL=https://goalsquad.vercel.app
NODE_ENV=production

# Optional: Remove.bg (för background removal)
REMOVE_BG_API_KEY=your_api_key_here

# Optional: Cloudinary (för image processing)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**VIKTIGT**: 
- Använd **service_role** key för `SUPABASE_SERVICE_ROLE_KEY`
- Använd **anon** key för `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### Steg 4: Deploy

1. Klicka "Deploy"
2. Vänta 2-5 minuter
3. När klar, får du en URL: `https://goalsquad.vercel.app`

---

## 3️⃣ POST-DEPLOYMENT

### Steg 1: Uppdatera Supabase URLs

Gå tillbaka till Supabase:

1. **Authentication** → **URL Configuration**
2. Uppdatera **Site URL**:
```
https://goalsquad.vercel.app
```

3. Lägg till i **Redirect URLs**:
```
https://goalsquad.vercel.app/**
https://goalsquad-*.vercel.app/** (för preview deployments)
```

---

### Steg 2: Test Deployment

Besök din site: `https://goalsquad.vercel.app`

**Test dessa sidor**:
```
✅ / (homepage)
✅ /products (produktlista)
✅ /calculator (försäljningskalkylator)
✅ /merchants (företag)
✅ /auth/login (login)
✅ /auth/register (registrering)
```

---

### Steg 3: Test Database Connection

Öppna browser console på din site och kör:

```javascript
// Test Supabase connection
const { data, error } = await fetch('/api/products').then(r => r.json());
console.log('Products:', data);
```

**Förväntat**: Lista med produkter (eller tom array om ingen data)

---

## 4️⃣ SETUP SAMPLE DATA

### Option 1: Via Supabase SQL Editor

Kör dessa queries för att lägga till testdata:

```sql
-- 1. Warehouse sample data
-- (Redan kördes i migration)

-- 2. Calculator sample data
-- (Redan kördes i migration)

-- 3. Verifiera data
SELECT 
  m.name as merchant,
  COUNT(p.id) as products
FROM merchants m
LEFT JOIN products p ON p.merchant_id = m.id
GROUP BY m.name;
```

---

### Option 2: Via API (Recommended)

Använd Postman eller curl för att skapa data via API:

**Skapa Merchant**:
```bash
curl -X POST https://goalsquad.vercel.app/api/merchants/onboard \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Företag",
    "email": "test@example.com",
    "phone": "+46701234567"
  }'
```

**Skapa Product**:
```bash
curl -X POST https://goalsquad.vercel.app/api/products/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Produkt",
    "price": 99.00,
    "cost_price": 60.00,
    "merchant_id": "uuid-from-merchant"
  }'
```

---

## 5️⃣ DOMAIN SETUP (Optional)

### Lägg till Custom Domain

1. I Vercel, gå till **Settings** → **Domains**
2. Klicka "Add"
3. Ange din domain: `goalsquad.se`
4. Följ instruktioner för DNS setup

**DNS Records** (hos din domain provider):
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

5. Vänta på DNS propagation (5-60 min)
6. Uppdatera Supabase URLs till din custom domain

---

## 6️⃣ MONITORING & LOGS

### Vercel Logs

1. Gå till din deployment i Vercel
2. Klicka "Functions"
3. Se real-time logs för API routes

### Supabase Logs

1. Gå till **Logs** i Supabase
2. Välj **Postgres Logs** för database queries
3. Välj **API Logs** för auth/storage

---

## 🔒 SECURITY CHECKLIST

### Supabase

- ✅ RLS (Row Level Security) enabled på alla tabeller
- ✅ Service role key är HEMLIG (endast i Vercel env vars)
- ✅ Anon key är publik (OK att exponera)
- ✅ Auth redirect URLs konfigurerade

### Vercel

- ✅ Environment variables är encrypted
- ✅ HTTPS enabled (automatic)
- ✅ Preview deployments har separata env vars

---

## 🚀 CONTINUOUS DEPLOYMENT

### Automatic Deployments

Vercel deployer automatiskt när du pushar till GitHub:

```bash
# Gör ändringar
git add .
git commit -m "feat: new feature"
git push origin master

# Vercel deployer automatiskt!
```

**Deployment Flow**:
1. Push till GitHub
2. Vercel detekterar push
3. Bygger projektet
4. Kör tests (om konfigurerade)
5. Deployer till production
6. URL: https://goalsquad.vercel.app

**Preview Deployments**:
- Varje branch får en preview URL
- Test innan merge till master

---

## 📊 PERFORMANCE OPTIMIZATION

### Vercel

**Edge Functions** (för snabbare API):
```typescript
// app/api/products/route.ts
export const runtime = 'edge'; // Kör på Vercel Edge Network
```

**ISR (Incremental Static Regeneration)**:
```typescript
// app/products/page.tsx
export const revalidate = 60; // Revalidate var 60:e sekund
```

### Supabase

**Indexes** (redan konfigurerade i migrations):
```sql
CREATE INDEX idx_products_merchant ON products(merchant_id);
CREATE INDEX idx_orders_user ON orders(user_id);
```

**Connection Pooling**:
- Supabase hanterar automatiskt
- Max 60 connections på Free tier

---

## 🐛 TROUBLESHOOTING

### Problem: "Failed to fetch"

**Lösning**:
1. Kontrollera Supabase URL i env vars
2. Verifiera anon key är korrekt
3. Kolla CORS settings i Supabase

### Problem: "Unauthorized"

**Lösning**:
1. Kontrollera RLS policies
2. Verifiera auth token
3. Kolla service_role key för admin operations

### Problem: "Build failed"

**Lösning**:
1. Kolla Vercel build logs
2. Verifiera package.json dependencies
3. Test `npm run build` lokalt först

### Problem: "Database connection failed"

**Lösning**:
1. Verifiera Supabase project är aktiv
2. Kontrollera connection string
3. Kolla IP whitelist (Supabase Free tier = alla IPs OK)

---

## ✅ DEPLOYMENT CHECKLIST

### Pre-Deployment
- ✅ GitHub repository pushat
- ✅ All kod testad lokalt
- ✅ Environment variables förberedda
- ✅ Database migrations klara

### Supabase
- ✅ Projekt skapat
- ✅ Database migrations körda
- ✅ Storage buckets skapade
- ✅ Auth providers konfigurerade
- ✅ RLS policies aktiverade

### Vercel
- ✅ Projekt importerat från GitHub
- ✅ Environment variables satta
- ✅ Build settings konfigurerade
- ✅ Första deployment lyckad

### Post-Deployment
- ✅ URLs uppdaterade i Supabase
- ✅ Test pages fungerar
- ✅ Database connection testad
- ✅ Sample data tillagd
- ✅ Custom domain (optional)

---

## 📞 SUPPORT

### Vercel
- Docs: https://vercel.com/docs
- Discord: https://vercel.com/discord

### Supabase
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

---

**LYCKA TILL MED DEPLOYMENT!** 🚀
