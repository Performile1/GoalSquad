# GoalSquad Frontend Setup Guide

Komplett guide för att installera och testa alla nya frontend komponenter.

---

## ✅ Prerequisites

Alla dependencies finns redan i `package.json`:
- ✅ `framer-motion` - För animationer
- ✅ `tailwindcss` - För styling
- ✅ `next` - För routing
- ✅ `@supabase/supabase-js` - För data

---

## 🚀 Installation

### 1. Installera Dependencies (om inte redan gjort)

```bash
npm install
```

### 2. Kör Extended Schema

I Supabase SQL Editor:

```sql
-- Kopiera hela innehållet från database/schema-extended.sql
-- Klistra in och kör
```

### 3. Starta Dev Server

```bash
npm run dev
```

---

## 🎨 Testa Komponenter

### 1. Seller Dashboard

**URL**: `http://localhost:3000/sellers/[seller-id]/dashboard`

**Test Steps**:
1. Skapa en seller först via `/api/sellers/register`
2. Navigera till dashboard med seller ID
3. Verifiera att du ser:
   - Level & XP progress
   - Streak counter
   - Sales stats
   - Avatar preview
   - Treasury balance
   - Achievements

**Expected Result**:
```
✅ Dashboard loads
✅ Stats display correctly
✅ Animations work smoothly
✅ Treasury shows held/available/total
```

---

### 2. Leaderboard

**URL**: `http://localhost:3000/communities/[community-id]/leaderboard`

**Test Steps**:
1. Skapa en community först via `/api/communities/create`
2. Registrera flera sellers i samma community
3. Gör några försäljningar
4. Navigera till leaderboard
5. Testa period filters (Daily, Weekly, Monthly, All Time)

**Expected Result**:
```
✅ Leaderboard loads
✅ Rankings display correctly
✅ Top 3 have medals (🥇🥈🥉)
✅ Period filtering works
✅ Smooth animations on load
```

---

### 3. Community Dashboard

**URL**: `http://localhost:3000/communities/[community-id]/dashboard`

**Test Steps**:
1. Logga in som community admin/treasurer
2. Navigera till dashboard
3. Verifiera stats:
   - Total members
   - Total sales
   - Total commission
   - Active campaigns
   - Treasury balance
   - Top sellers

**Expected Result**:
```
✅ Dashboard loads
✅ All stats display
✅ Campaigns show progress bars
✅ Top sellers list appears
✅ Treasury balance correct
```

---

### 4. Guardian Control Panel

**URL**: `http://localhost:3000/guardians/[guardian-id]/dashboard`

**Test Steps**:
1. Registrera en seller med guardian via `/api/sellers/register`
2. Logga in som guardian
3. Navigera till dashboard
4. Verifiera:
   - List of children
   - Each child's stats
   - Treasury balances
   - Recent orders
   - Parental controls

**Expected Result**:
```
✅ Dashboard loads
✅ All children listed
✅ Stats per child correct
✅ Treasury balances shown
✅ Recent orders display
✅ Parental controls accessible
```

---

### 5. Avatar Customizer

**URL**: `http://localhost:3000/sellers/[seller-id]/avatar`

**Test Steps**:
1. Navigera till avatar customizer
2. Testa category tabs (Hats, Shirts, etc.)
3. Klicka på unlocked items för att equip
4. Verifiera locked items visar unlock requirements
5. Spara avatar

**Expected Result**:
```
✅ Customizer loads
✅ Category tabs work
✅ Items can be equipped
✅ Locked items show requirements
✅ Avatar preview updates
✅ Save works
```

---

### 6. Campaign Management

**URL**: `http://localhost:3000/communities/[community-id]/campaigns`

**Test Steps**:
1. Logga in som community admin
2. Klicka "New Campaign"
3. Fyll i campaign form:
   - Name: "Spring Fundraiser 2024"
   - Start/End dates
   - Sales goal: 20000
   - Units goal: 150
   - Commission percentages
4. Skapa campaign
5. Testa status changes (Draft → Active → Paused)

**Expected Result**:
```
✅ Campaign list loads
✅ Create modal works
✅ Form validation works
✅ Campaign created successfully
✅ Progress bars display
✅ Status changes work
```

---

## 🎮 Test Data Setup

### Create Test Community

```bash
curl -X POST http://localhost:3000/api/communities/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Vikings",
    "slug": "test-vikings",
    "communityType": "sports_team",
    "treasurerId": "uuid-of-treasurer",
    "adminId": "uuid-of-admin",
    "country": "NO",
    "city": "Oslo"
  }'
```

### Register Test Seller

```bash
curl -X POST http://localhost:3000/api/sellers/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Seller",
    "email": "test@example.com",
    "dateOfBirth": "2010-05-15",
    "guardianName": "Test Guardian",
    "guardianEmail": "guardian@example.com",
    "guardianPhone": "+4712345678",
    "communityId": "community-uuid",
    "verificationMethod": "otp_email"
  }'
```

### Create Test Campaign

```bash
curl -X POST http://localhost:3000/api/communities/[id]/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Spring Sale",
    "description": "Annual spring fundraiser",
    "startDate": "2024-04-01",
    "endDate": "2024-05-31",
    "salesGoal": "20000",
    "unitsGoal": "150",
    "communityCommissionPercent": "20",
    "sellerCommissionPercent": "10"
  }'
```

---

## 🎨 Styling Customization

Alla komponenter använder Tailwind CSS. För att anpassa:

### Colors

Ändra i `tailwind.config.ts`:

```typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9',    // Blue
        secondary: '#06b6d4',  // Cyan
        success: '#10b981',    // Green
        warning: '#f59e0b',    // Orange
        error: '#ef4444',      // Red
      }
    }
  }
}
```

### Animations

Framer Motion animations finns i varje component. För att anpassa:

```tsx
// Ändra delay
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.5 }}  // <-- Ändra här
>
```

---

## 🔧 Troubleshooting

### Problem: "Module not found: framer-motion"

**Solution**:
```bash
npm install framer-motion
```

### Problem: "Cannot read property 'full_name' of undefined"

**Solution**: Kontrollera att:
1. Extended schema är körd
2. Seller profile finns i databasen
3. RLS policies tillåter access

### Problem: "Leaderboard is empty"

**Solution**:
1. Kontrollera att sellers har gjort försäljningar
2. Kör leaderboard update manuellt:
```typescript
await GamificationEngine.updateLeaderboard(communityId, 'all_time');
```

### Problem: "Avatar items not loading"

**Solution**:
1. Kontrollera att `avatar_items` table har data
2. Kör initial data insert från `schema-extended.sql`

### Problem: "Treasury balance shows 0"

**Solution**:
1. Kontrollera att orders har skapats
2. Verifiera att treasury holds skapades vid order completion
3. Kör:
```sql
SELECT * FROM treasury_holds WHERE holder_id = 'seller-id';
```

---

## 📱 Mobile Testing

Alla komponenter är responsive. Testa på olika skärmstorlekar:

### Desktop (1920x1080)
```bash
# Chrome DevTools
# Viewport: Desktop
```

### Tablet (768x1024)
```bash
# Chrome DevTools
# Viewport: iPad
```

### Mobile (375x667)
```bash
# Chrome DevTools
# Viewport: iPhone SE
```

---

## ✅ Component Checklist

- [ ] **Seller Dashboard**
  - [ ] Loads without errors
  - [ ] Stats display correctly
  - [ ] Animations smooth
  - [ ] Treasury balance accurate
  - [ ] Achievements render

- [ ] **Leaderboard**
  - [ ] Rankings display
  - [ ] Period filters work
  - [ ] Top 3 have medals
  - [ ] Animations smooth

- [ ] **Community Dashboard**
  - [ ] Stats accurate
  - [ ] Campaigns show
  - [ ] Treasury correct
  - [ ] Top sellers list

- [ ] **Guardian Dashboard**
  - [ ] Children listed
  - [ ] Stats per child
  - [ ] Orders display
  - [ ] Controls work

- [ ] **Avatar Customizer**
  - [ ] Items load
  - [ ] Equip works
  - [ ] Locked items show
  - [ ] Save works

- [ ] **Campaign Management**
  - [ ] List loads
  - [ ] Create works
  - [ ] Progress bars
  - [ ] Status changes

---

## 🚀 Production Deployment

### Pre-deployment Checklist

1. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

2. **Database**
   - [ ] schema.sql executed
   - [ ] schema-extended.sql executed
   - [ ] RLS policies active
   - [ ] Initial data inserted

3. **Build Test**
   ```bash
   npm run build
   npm start
   ```

4. **Performance**
   - [ ] Images optimized
   - [ ] Animations smooth (60fps)
   - [ ] API responses < 500ms
   - [ ] Lighthouse score > 90

---

## 📚 Additional Resources

- **Components Guide**: `COMPONENTS_GUIDE.md`
- **API Documentation**: `MASTER_IMPLEMENTATION_STATUS.md`
- **Database Schema**: `database/schema-extended.sql`
- **Setup Guide**: `SETUP_EXTENDED.md`

---

**Alla komponenter är nu redo att användas! 🎉**

För frågor eller problem, kontakta utvecklingsteamet.
