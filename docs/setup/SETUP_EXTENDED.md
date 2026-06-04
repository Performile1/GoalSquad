# GoalSquad Extended Setup Guide

## Installera Extended Schema

Efter att du har kört `schema.sql`, kör även det utökade schemat:

### 1. Kör Extended Schema

I Supabase SQL Editor:

```sql
-- Kopiera hela innehållet från database/schema-extended.sql
-- Klistra in och kör
```

Detta lägger till:
- 14 nya tabeller (communities, seller_profiles, achievements, etc.)
- RBAC system med 11 roller
- Gamification engine
- Treasury (30-day escrow)
- Warehouse integration

### 2. Verifiera Installation

Kör detta i SQL Editor för att kontrollera:

```sql
-- Kontrollera att alla tabeller finns
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Du ska se 26 tabeller totalt
```

### 3. Kontrollera Permissions

```sql
-- Visa alla roller och deras behörigheter
SELECT * FROM permissions ORDER BY role;

-- Du ska se 11 roller
```

---

## Testa Nya Funktioner

### 1. Skapa en Community

```bash
curl -X POST http://localhost:3000/api/communities/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fotbollslaget Vikings",
    "slug": "vikings-2024",
    "communityType": "sports_team",
    "treasurerId": "uuid-of-treasurer",
    "adminId": "uuid-of-admin",
    "country": "NO",
    "city": "Oslo"
  }'
```

### 2. Registrera en Säljare (med Guardian)

```bash
curl -X POST http://localhost:3000/api/sellers/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Erik Andersson",
    "email": "erik@example.com",
    "dateOfBirth": "2010-05-15",
    "guardianName": "Anna Andersson",
    "guardianEmail": "anna@example.com",
    "guardianPhone": "+46701234567",
    "communityId": "uuid-of-community",
    "verificationMethod": "otp_email"
  }'
```

### 3. Testa Gamification

```typescript
import { GamificationEngine } from '@/lib/gamification-engine';

// Award XP för en försäljning
await GamificationEngine.processSaleCompletion(
  'seller-user-id',
  'order-id',
  1500, // 1500 NOK order
  false // not international
);

// Kontrollera achievements
const achievements = await GamificationEngine.checkAchievements({
  userId: 'seller-user-id',
  type: 'total_sales',
  value: 1500
});

// Uppdatera leaderboard
await GamificationEngine.updateLeaderboard(
  'community-id',
  'all_time'
);
```

### 4. Testa Treasury

```typescript
import { Treasury } from '@/lib/treasury';

// Skapa en hold
await Treasury.createHold({
  orderId: 'order-id',
  transactionId: 'transaction-id',
  holderType: 'merchant',
  holderId: 'merchant-id',
  amount: 2000,
  currency: 'NOK',
  holdDays: 30
});

// Kontrollera balance
const balance = await Treasury.getTreasuryBalance('merchant', 'merchant-id');
console.log(balance);
// { held: 2000, available: 0, total: 2000 }

// Efter 30 dagar, release holds
const released = await Treasury.releaseExpiredHolds();
console.log(`Released ${released} holds`);
```

### 5. Testa Warehouse Webhooks

```bash
# Simulera warehouse event
curl -X POST http://localhost:3000/api/webhooks/warehouse \
  -H "Content-Type: application/json" \
  -H "x-warehouse-signature: sha256-hash" \
  -H "x-partner-id: warehouse-partner-id" \
  -d '{
    "event_type": "inbound_received",
    "shipment_id": "shipment-id",
    "data": {
      "asn_number": "ASN-001",
      "received_at": "2024-04-15T10:00:00Z",
      "items": [...]
    }
  }'
```

---

## Cron Jobs (Viktigt!)

För att Treasury ska fungera korrekt behöver du sätta upp en cron job som kör treasury release dagligen.

### Vercel Cron (Rekommenderat)

Skapa `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/treasury-release",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Skapa `app/api/cron/treasury-release/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Treasury } from '@/lib/treasury';

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const released = await Treasury.releaseExpiredHolds();
  
  return NextResponse.json({
    success: true,
    releasedCount: released,
    timestamp: new Date().toISOString()
  });
}
```

---

## Databas Queries för Monitoring

### Visa Community Stats

```sql
SELECT 
  c.name,
  c.total_members,
  c.total_sales,
  c.total_commission,
  COUNT(sp.id) as active_sellers
FROM communities c
LEFT JOIN seller_profiles sp ON sp.community_id = c.id
GROUP BY c.id, c.name, c.total_members, c.total_sales, c.total_commission;
```

### Visa Top Sellers

```sql
SELECT 
  p.full_name,
  sp.total_sales,
  sp.total_orders,
  sp.current_level,
  sp.xp_total,
  c.name as community_name
FROM seller_profiles sp
JOIN profiles p ON p.id = sp.user_id
JOIN communities c ON c.id = sp.community_id
ORDER BY sp.total_sales DESC
LIMIT 10;
```

### Visa Treasury Status

```sql
SELECT 
  holder_type,
  COUNT(*) as holds_count,
  SUM(amount) as total_held,
  AVG(amount) as avg_amount
FROM treasury_holds
WHERE status = 'held'
GROUP BY holder_type;
```

### Visa Warehouse Performance

```sql
SELECT 
  wp.partner_name,
  wp.partner_tier,
  COUNT(we.id) as total_events,
  wp.accuracy_rate,
  wp.total_processed
FROM warehouse_partners wp
LEFT JOIN warehouse_events we ON we.warehouse_partner_id = wp.id
WHERE wp.status = 'active'
GROUP BY wp.id, wp.partner_name, wp.partner_tier, wp.accuracy_rate, wp.total_processed;
```

### Visa Achievement Progress

```sql
SELECT 
  p.full_name,
  COUNT(ua.id) as achievements_unlocked,
  sp.current_level,
  sp.xp_total
FROM profiles p
JOIN seller_profiles sp ON sp.user_id = p.id
LEFT JOIN user_achievements ua ON ua.user_id = p.id
WHERE p.role = 'seller'
GROUP BY p.id, p.full_name, sp.current_level, sp.xp_total
ORDER BY achievements_unlocked DESC;
```

---

## Environment Variables (Uppdaterade)

Lägg till dessa i `.env.local`:

```env
# Existing...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Cron Jobs
CRON_SECRET=your-random-secret-key

# Warehouse Integration
WAREHOUSE_WEBHOOK_SECRET=your-warehouse-secret

# Gamification
ENABLE_LEADERBOARDS=true
LEADERBOARD_UPDATE_INTERVAL=3600000
```

---

## Testing Checklist

- [ ] RBAC: Testa att olika roller har rätt behörigheter
- [ ] Communities: Skapa community och lägg till members
- [ ] Sellers: Registrera seller med guardian consent
- [ ] Gamification: Award XP, unlock achievements
- [ ] Treasury: Create holds, verify 30-day lock
- [ ] Warehouse: Send webhook events, verify processing
- [ ] Leaderboards: Update and verify rankings
- [ ] Avatar: Unlock items, customize avatar

---

## Production Deployment

### Pre-deployment Checklist

1. **Database**
   - [ ] Run schema.sql
   - [ ] Run schema-extended.sql
   - [ ] Verify all 26 tables exist
   - [ ] Verify RLS policies active

2. **Environment Variables**
   - [ ] All secrets configured in Vercel
   - [ ] CRON_SECRET set
   - [ ] Warehouse webhook secrets set

3. **Cron Jobs**
   - [ ] Treasury release cron configured
   - [ ] Leaderboard update cron configured

4. **Monitoring**
   - [ ] Error tracking (Sentry)
   - [ ] Performance monitoring
   - [ ] Database query monitoring

5. **Security**
   - [ ] All RLS policies tested
   - [ ] Webhook signatures verified
   - [ ] Rate limiting configured

---

**Du är nu redo att köra GoalSquad v2.0 i produktion! 🚀**
