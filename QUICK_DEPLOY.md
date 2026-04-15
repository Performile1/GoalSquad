# GoalSquad - Snabb Deploy Guide

**5 minuter till live!** ⚡

---

## 🚀 Steg-för-Steg

### 1. SUPABASE (2 min)

1. Gå till https://supabase.com
2. "New Project"
   - Name: `GoalSquad`
   - Password: [Välj starkt lösenord]
   - Region: `North Europe (Stockholm)`
3. Vänta 2 min...
4. Gå till **Settings** → **API**
5. Kopiera:
   ```
   URL: https://xxx.supabase.co
   anon key: eyJhbG...
   service_role key: eyJhbG... (klicka "Reveal")
   ```

---

### 2. VERCEL (2 min)

1. Gå till https://vercel.com
2. "Add New..." → "Project"
3. Import: `Performile1/GoalSquad`
4. **Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL = [din Supabase URL]
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [din anon key]
   SUPABASE_SERVICE_ROLE_KEY = [din service_role key]
   NEXT_PUBLIC_APP_URL = https://goalsquad.vercel.app
   NODE_ENV = production
   ```
5. "Deploy"
6. Vänta 2-3 min...
7. ✅ LIVE på: `https://goalsquad-xxx.vercel.app`

---

### 3. DATABASE (1 min)

1. Tillbaka till Supabase
2. **SQL Editor** → "New Query"
3. Kopiera & kör VARJE fil i ordning:

**Minimal Setup** (för att komma igång snabbt):
```sql
-- 1. Grundschema (MÅSTE)
database/schema.sql

-- 2. Produkter (MÅSTE)
database/product-attributes.sql

-- 3. MOQ & Warehouses (MÅSTE)
database/moq-and-warehouses.sql

-- 4. Sample Data (REKOMMENDERAT)
database/warehouse-sample-data.sql
database/sample-calculator-data.sql
```

**Full Setup** (kör alla 15 filer från DEPLOYMENT_GUIDE.md)

---

### 4. STORAGE (30 sek)

1. Supabase → **Storage**
2. "New Bucket":
   - `product-images` (Public)
   - `merchant-logos` (Public)
   - `avatars` (Public)

---

### 5. AUTH (30 sek)

1. Supabase → **Authentication** → **URL Configuration**
2. **Site URL**: `https://goalsquad-xxx.vercel.app` (din Vercel URL)
3. **Redirect URLs**: `https://goalsquad-xxx.vercel.app/**`

---

## ✅ TEST

Besök: `https://goalsquad-xxx.vercel.app`

**Test Pages**:
- ✅ `/` - Homepage
- ✅ `/calculator` - Försäljningskalkylator
- ✅ `/products` - Produkter
- ✅ `/auth/login` - Login

---

## 🎯 Nästa Steg

### Lägg till Custom Domain (Optional)

1. Vercel → **Settings** → **Domains**
2. Add: `goalsquad.se`
3. Uppdatera DNS hos din domain provider
4. Uppdatera Supabase URLs

### Lägg till mer data

1. Använd `/api/merchants/onboard` för att skapa företag
2. Använd `/api/products/create` för att skapa produkter
3. Eller kör fler SQL migrations

---

## 🐛 Problem?

**Build Failed?**
- Kolla Vercel logs
- Verifiera env vars är satta

**Database Error?**
- Kolla att migrations kördes
- Verifiera Supabase URL/keys

**Auth Error?**
- Uppdatera Redirect URLs i Supabase
- Matcha Site URL med Vercel URL

---

**KLART!** 🎉

Din app är nu live på Vercel med Supabase backend!
