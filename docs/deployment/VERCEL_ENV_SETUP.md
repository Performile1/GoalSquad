# Vercel Environment Variables Setup

**VIKTIGT**: Du måste sätta environment variables i Vercel Dashboard!

---

## 🔑 Steg-för-Steg

### 1. Gå till Vercel Dashboard

1. Öppna: **https://vercel.com/dashboard**
2. Klicka på ditt projekt: **GoalSquad**
3. Klicka på **"Settings"** tab
4. Klicka på **"Environment Variables"** i vänster menyn

---

### 2. Lägg till Environment Variables

Klicka **"Add New"** för varje variabel nedan:

#### **NEXT_PUBLIC_SUPABASE_URL**
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://[your-project-id].supabase.co
Environment: Production, Preview, Development (välj alla)
```

#### **NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (din anon key från Supabase)
Environment: Production, Preview, Development (välj alla)
```

#### **SUPABASE_SERVICE_ROLE_KEY**
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (din service_role key från Supabase)
Environment: Production, Preview, Development (välj alla)
```

#### **NEXT_PUBLIC_APP_URL**
```
Key: NEXT_PUBLIC_APP_URL
Value: https://goalsquad.vercel.app (eller din custom domain)
Environment: Production, Preview, Development (välj alla)
```

#### **NODE_ENV**
```
Key: NODE_ENV
Value: production
Environment: Production only
```

---

### 3. Hämta Supabase Credentials

Om du inte har dem:

1. Gå till: **https://supabase.com/dashboard**
2. Välj ditt projekt: **GoalSquad**
3. Gå till **Settings** → **API**
4. Kopiera:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public**: `eyJhbG...` (under "Project API keys")
   - **service_role**: `eyJhbG...` (klicka "Reveal" först)

---

### 4. Optional: Image Processing APIs

Om du vill använda background removal:

#### **REMOVE_BG_API_KEY** (Optional)
```
Key: REMOVE_BG_API_KEY
Value: [din API key från remove.bg]
Environment: Production, Preview, Development
```

Få API key:
1. Gå till: https://www.remove.bg/api
2. Sign up (gratis tier: 50 images/månad)
3. Kopiera API key

#### **CLOUDINARY** (Optional)
```
Key: CLOUDINARY_CLOUD_NAME
Value: [ditt cloud name]

Key: CLOUDINARY_API_KEY
Value: [din API key]

Key: CLOUDINARY_API_SECRET
Value: [din API secret]

Environment: Production, Preview, Development
```

Få credentials:
1. Gå till: https://cloudinary.com
2. Sign up (gratis tier)
3. Dashboard → Account Details

---

## 5. Redeploy

Efter att du lagt till environment variables:

### Option A: Automatic Redeploy
Vercel kommer automatiskt redeploya när du pushar nästa commit.

### Option B: Manual Redeploy
1. Gå till **Deployments** tab
2. Klicka **"Redeploy"**
3. Välj **"Use existing Build Cache"** = NO
4. Klicka **"Redeploy"**

---

## ✅ Verifiering

När deployment är klar:

1. Gå till din site: `https://goalsquad-xxx.vercel.app`
2. Öppna browser console (F12)
3. Kör:
   ```javascript
   // Test Supabase connection
   fetch('/api/products')
     .then(r => r.json())
     .then(data => console.log('Products:', data))
     .catch(err => console.error('Error:', err));
   ```

**Förväntat**:
- ✅ Inga errors
- ✅ Data returneras (eller tom array om ingen data)

**Om error**:
- ❌ Kolla att alla env vars är satta
- ❌ Kolla att Supabase URL/keys är korrekta
- ❌ Redeploya igen

---

## 📋 Checklist

Innan du deployer, verifiera:

- [ ] **NEXT_PUBLIC_SUPABASE_URL** är satt
- [ ] **NEXT_PUBLIC_SUPABASE_ANON_KEY** är satt
- [ ] **SUPABASE_SERVICE_ROLE_KEY** är satt
- [ ] **NEXT_PUBLIC_APP_URL** är satt
- [ ] **NODE_ENV** = production (för production environment)
- [ ] Alla environment variables har rätt "Environment" vald
- [ ] Supabase credentials är korrekta (från Supabase dashboard)

---

## 🔒 Security

**VIKTIGT**:
- ✅ **anon key** är OK att exponera (används i frontend)
- ❌ **service_role key** är HEMLIG (används bara i API routes)
- ✅ Vercel krypterar alla environment variables
- ✅ service_role key exponeras ALDRIG till frontend

**Vercel hanterar detta automatiskt**:
- `NEXT_PUBLIC_*` → Exponeras till frontend
- Andra vars → Endast tillgängliga i serverless functions

---

## 🐛 Troubleshooting

### Problem: "Environment variable not found"

**Lösning**:
1. Kolla att variabeln är satt i Vercel dashboard
2. Kolla att rätt "Environment" är vald (Production/Preview/Development)
3. Redeploya projektet

### Problem: "Supabase connection failed"

**Lösning**:
1. Verifiera Supabase URL är korrekt
2. Verifiera anon key är korrekt
3. Kolla att Supabase projekt är aktivt
4. Test connection i Supabase dashboard

### Problem: "Unauthorized"

**Lösning**:
1. Kolla att service_role key är korrekt
2. Verifiera RLS policies i Supabase
3. Kolla API route använder rätt key

---

## 📸 Screenshots Guide

### Steg 1: Settings → Environment Variables
```
[Vercel Dashboard]
  └─ GoalSquad (projekt)
      └─ Settings
          └─ Environment Variables
              └─ [Add New] knapp
```

### Steg 2: Lägg till variabel
```
┌─────────────────────────────────────┐
│ Add Environment Variable            │
├─────────────────────────────────────┤
│ Key:   NEXT_PUBLIC_SUPABASE_URL    │
│ Value: https://xxx.supabase.co     │
│                                     │
│ Environment:                        │
│ ☑ Production                        │
│ ☑ Preview                           │
│ ☑ Development                       │
│                                     │
│ [Save]                              │
└─────────────────────────────────────┘
```

---

## ✅ Klart!

När alla environment variables är satta:
1. ✅ Vercel kan bygga projektet
2. ✅ API routes kan ansluta till Supabase
3. ✅ Frontend kan hämta data
4. ✅ Auth fungerar

**Nu kan du deploya!** 🚀
