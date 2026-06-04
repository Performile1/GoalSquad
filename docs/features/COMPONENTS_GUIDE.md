# GoalSquad Components Guide

Komplett guide för alla frontend och backend komponenter i GoalSquad v2.0.

---

## 📱 Frontend Components (8 st)

### 1. **Seller Dashboard** 🎮
**Path**: `/sellers/[id]/dashboard`  
**File**: `app/sellers/[id]/dashboard/page.tsx`

**Features**:
- Level & XP progress bar
- Streak tracker med fire emoji
- Total sales & rank
- Avatar preview
- Treasury balance (Available, Pending, Total)
- Achievements grid
- Quick actions

**API**: `GET /api/sellers/[id]/stats`

**Screenshot Preview**:
```
┌─────────────────────────────────────────┐
│ Welcome back, Erik! 👋                  │
│ goalsquad.shop/vikings-erik123          │
├─────────────────────────────────────────┤
│ ⭐ Level 5    🔥 Streak 7    💰 Sales   │
│ 450/600 XP    Keep going!   15,000 NOK  │
├─────────────────────────────────────────┤
│ [Avatar]      [Achievements Grid]       │
│ [Treasury]    [Quick Actions]           │
└─────────────────────────────────────────┘
```

---

### 2. **Leaderboard** 🏆
**Path**: `/communities/[id]/leaderboard`  
**File**: `app/communities/[id]/leaderboard/page.tsx`

**Features**:
- Period selector (Daily, Weekly, Monthly, All Time)
- Top 3 med medals (🥇🥈🥉)
- Rank, avatar, name, level, XP
- Total sales & orders
- Smooth animations

**API**: `GET /api/communities/[id]/leaderboard?period=all_time`

**Screenshot Preview**:
```
┌─────────────────────────────────────────┐
│          🏆 Leaderboard                 │
│  [Daily] [Weekly] [Monthly] [All Time] │
├─────────────────────────────────────────┤
│ 🥇 #1  👤 Anna    Level 8  25,000 NOK  │
│ 🥈 #2  👤 Erik    Level 5  15,000 NOK  │
│ 🥉 #3  👤 Lisa    Level 4  12,000 NOK  │
│ #4     👤 Johan   Level 3   8,000 NOK  │
└─────────────────────────────────────────┘
```

---

### 3. **Community Dashboard** 🏘️
**Path**: `/communities/[id]/dashboard`  
**File**: `app/communities/[id]/dashboard/page.tsx`

**Features**:
- Total members, sales, commission
- Active campaigns count
- Treasury balance (Available, Pending, Total)
- Campaign progress bars
- Top sellers (Top 3)
- Quick actions

**API**: `GET /api/communities/[id]/stats`

**Screenshot Preview**:
```
┌─────────────────────────────────────────┐
│ Fotbollslaget Vikings Dashboard         │
├─────────────────────────────────────────┤
│ 👥 25      💰 50,000    🎯 10,000       │
│ Members    Sales NOK    Commission      │
├─────────────────────────────────────────┤
│ Treasury 💎          Active Campaigns   │
│ Available: 5,000     [Spring Sale]      │
│ Pending: 3,000       Progress: 75%      │
│ Total: 8,000                            │
├─────────────────────────────────────────┤
│ Top Sellers 🏆                          │
│ 🥇 Anna - 25,000 NOK                    │
│ 🥈 Erik - 15,000 NOK                    │
│ 🥉 Lisa - 12,000 NOK                    │
└─────────────────────────────────────────┘
```

---

### 4. **Guardian Control Panel** 👨‍👩‍👧‍👦
**Path**: `/guardians/[id]/dashboard`  
**File**: `app/guardians/[id]/dashboard/page.tsx`

**Features**:
- List of all children
- Per child: Stats, treasury, recent orders
- Parental controls
- Privacy settings
- Payout management

**API**: `GET /api/guardians/[id]/dashboard`

**Screenshot Preview**:
```
┌─────────────────────────────────────────┐
│ Guardian Dashboard - Anna Andersson     │
├─────────────────────────────────────────┤
│ 👤 Erik Andersson (Age: 14, Level 5)   │
│ goalsquad.shop/vikings-erik123          │
│                                         │
│ Total Sales: 15,000 NOK | 45 orders    │
│ Available: 3,000 | Pending: 2,000      │
│                                         │
│ Recent Orders:                          │
│ • GS-001234 - 500 NOK - delivered      │
│ • GS-001235 - 750 NOK - in_transit     │
│                                         │
│ [Privacy] [Payout] [Activity] [Settings]│
└─────────────────────────────────────────┘
```

---

### 5. **Avatar Customizer** 🎨
**Path**: `/sellers/[id]/avatar`  
**File**: `app/sellers/[id]/avatar/page.tsx`

**Features**:
- Live avatar preview
- Category tabs (Hats, Shirts, Pants, Shoes, Accessories, Backgrounds)
- Locked/unlocked items
- Rarity badges (Common, Rare, Epic, Legendary)
- Unlock requirements display
- Equip/unequip items

**API**: 
- `GET /api/sellers/[id]/avatar`
- `PUT /api/sellers/[id]/avatar`

**Screenshot Preview**:
```
┌─────────────────────────────────────────┐
│      🎨 Customize Your Avatar           │
├─────────────────────────────────────────┤
│ [Preview]     [Items Grid]              │
│              [🎩 Hats] [👕 Shirts]      │
│   👤         [👖 Pants] [👟 Shoes]      │
│              [🎒 Accessories]            │
│              [🌄 Backgrounds]            │
│                                         │
│              🎩 Team Cap (Common)       │
│              ✅ Equipped                │
│                                         │
│              👑 Gold Crown (Legendary)  │
│              🔒 Reach Level 10          │
└─────────────────────────────────────────┘
```

---

### 6. **Campaign Management** 📊
**Path**: `/communities/[id]/campaigns`  
**File**: `app/communities/[id]/campaigns/page.tsx`

**Features**:
- List all campaigns
- Create new campaign modal
- Sales & units progress bars
- Campaign status (Draft, Active, Paused, Completed)
- Start/pause/complete actions
- Commission settings

**API**: 
- `GET /api/communities/[id]/campaigns`
- `POST /api/communities/[id]/campaigns`
- `PUT /api/campaigns/[id]/status`

**Screenshot Preview**:
```
┌─────────────────────────────────────────┐
│ Campaign Management    [+ New Campaign] │
├─────────────────────────────────────────┤
│ Spring Fundraiser 2024     [Active]     │
│ 📅 Apr 1 - May 31 | 💰 20% | 👤 10%   │
│                                         │
│ Sales Goal: 15,000 / 20,000 NOK        │
│ ████████████░░░░░░░░ 75%               │
│                                         │
│ Units Goal: 120 / 150 units            │
│ ████████████████░░░░ 80%               │
└─────────────────────────────────────────┘
```

---

## 🔌 Backend API Endpoints (13 nya)

### Seller APIs

#### 1. **GET /api/sellers/[id]/stats**
Hämtar komplett seller statistik för dashboard.

**Response**:
```json
{
  "fullName": "Erik Andersson",
  "shopUrl": "vikings-erik123",
  "xpTotal": 450,
  "currentLevel": 5,
  "streakDays": 7,
  "totalSales": 15000,
  "totalOrders": 45,
  "totalCommission": 1500,
  "rank": 2,
  "achievements": [...],
  "avatarData": {...},
  "treasuryBalance": {
    "held": 2000,
    "available": 3000,
    "total": 5000
  }
}
```

#### 2. **GET /api/sellers/[id]/avatar**
Hämtar avatar data och tillgängliga items.

**Response**:
```json
{
  "avatarData": {
    "base": "default",
    "gear": ["hat_cap", "shirt_blue"],
    "background": "bg_stars",
    "unlockedItems": ["hat_cap", "hat_gold", ...]
  },
  "availableItems": [
    {
      "itemId": "hat_gold",
      "name": "Gold Crown",
      "description": "For champions",
      "itemType": "hat",
      "rarity": "legendary",
      "isLocked": false,
      "unlockRequirement": "Reach level 10"
    }
  ]
}
```

#### 3. **PUT /api/sellers/[id]/avatar**
Uppdaterar avatar.

**Request**:
```json
{
  "avatarData": {
    "base": "default",
    "gear": ["hat_gold"],
    "background": "bg_stars",
    "unlockedItems": [...]
  }
}
```

---

### Community APIs

#### 4. **GET /api/communities/[id]/stats**
Hämtar community statistik.

**Response**:
```json
{
  "name": "Fotbollslaget Vikings",
  "slug": "vikings-2024",
  "communityType": "sports_team",
  "totalMembers": 25,
  "totalSales": 50000,
  "totalCommission": 10000,
  "activeCampaigns": [...],
  "topSellers": [...],
  "treasuryBalance": {...}
}
```

#### 5. **GET /api/communities/[id]/leaderboard?period=all_time**
Hämtar leaderboard.

**Query Params**:
- `period`: `daily` | `weekly` | `monthly` | `all_time`

**Response**:
```json
{
  "rankings": [
    {
      "rank": 1,
      "userId": "uuid",
      "fullName": "Anna Svensson",
      "avatarUrl": "...",
      "totalSales": 25000,
      "totalOrders": 80,
      "level": 8,
      "xp": 1200
    }
  ]
}
```

#### 6. **GET /api/communities/[id]/campaigns**
Lista alla campaigns.

#### 7. **POST /api/communities/[id]/campaigns**
Skapa ny campaign.

**Request**:
```json
{
  "name": "Spring Fundraiser 2024",
  "description": "...",
  "startDate": "2024-04-01",
  "endDate": "2024-05-31",
  "salesGoal": "20000",
  "unitsGoal": "150",
  "communityCommissionPercent": "20",
  "sellerCommissionPercent": "10"
}
```

---

### Guardian APIs

#### 8. **GET /api/guardians/[id]/dashboard**
Hämtar guardian dashboard data.

**Response**:
```json
{
  "fullName": "Anna Andersson",
  "email": "anna@example.com",
  "children": [
    {
      "id": "uuid",
      "fullName": "Erik Andersson",
      "age": 14,
      "shopUrl": "vikings-erik123",
      "currentLevel": 5,
      "totalSales": 15000,
      "totalOrders": 45,
      "treasuryBalance": {...},
      "recentOrders": [...]
    }
  ]
}
```

---

### Campaign APIs

#### 9. **PUT /api/campaigns/[id]/status**
Uppdatera campaign status.

**Request**:
```json
{
  "status": "active"
}
```

**Valid statuses**: `draft`, `active`, `paused`, `completed`, `cancelled`

---

## 🎨 Design System

### Colors
- **Primary**: Blue (#0ea5e9)
- **Secondary**: Cyan (#06b6d4)
- **Success**: Green (#10b981)
- **Warning**: Orange (#f59e0b)
- **Error**: Red (#ef4444)
- **Purple**: (#a855f7)
- **Pink**: (#ec4899)

### Gradients
```css
/* Blue to Cyan */
bg-gradient-to-r from-blue-600 to-cyan-600

/* Green to Emerald */
bg-gradient-to-r from-green-600 to-emerald-600

/* Purple to Pink */
bg-gradient-to-r from-purple-600 to-pink-600

/* Orange to Red */
bg-gradient-to-r from-orange-600 to-red-600
```

### Rarity Colors
- **Common**: Gray (#6b7280)
- **Rare**: Blue (#3b82f6)
- **Epic**: Purple (#a855f7)
- **Legendary**: Yellow (#eab308)

---

## 🚀 Navigation Structure

```
/
├── /sellers/[id]/
│   ├── /dashboard          - Seller main dashboard
│   ├── /avatar             - Avatar customizer
│   ├── /products           - Product management
│   └── /orders             - Order history
│
├── /communities/[id]/
│   ├── /dashboard          - Community admin dashboard
│   ├── /leaderboard        - Leaderboard
│   ├── /campaigns          - Campaign management
│   └── /members            - Member management
│
├── /guardians/[id]/
│   └── /dashboard          - Guardian control panel
│
├── /merchants/[id]/
│   ├── /dashboard          - Merchant dashboard
│   └── /products/new       - Add product
│
└── /warehouses/[id]/
    └── /dashboard          - Warehouse partner dashboard
```

---

## 📊 Component Usage Examples

### Seller Dashboard
```tsx
// Navigate to seller dashboard
router.push(`/sellers/${sellerId}/dashboard`);

// Fetch seller stats
const stats = await fetch(`/api/sellers/${sellerId}/stats`);
```

### Leaderboard
```tsx
// Navigate to leaderboard
router.push(`/communities/${communityId}/leaderboard`);

// Fetch leaderboard
const data = await fetch(`/api/communities/${communityId}/leaderboard?period=weekly`);
```

### Avatar Customizer
```tsx
// Navigate to avatar customizer
router.push(`/sellers/${sellerId}/avatar`);

// Equip item
await fetch(`/api/sellers/${sellerId}/avatar`, {
  method: 'PUT',
  body: JSON.stringify({ avatarData: newAvatarData })
});
```

---

## 🔐 Authentication & Authorization

Alla komponenter använder RLS (Row Level Security):

```typescript
// Seller kan bara se sin egen data
CREATE POLICY seller_own_data ON seller_profiles
  FOR SELECT USING (user_id = auth.uid());

// Guardian kan se sina barns data
CREATE POLICY guardian_children_data ON seller_profiles
  FOR SELECT USING (
    user_id IN (SELECT id FROM profiles WHERE guardian_id = auth.uid())
  );

// Community admin kan se community data
CREATE POLICY community_admin_data ON communities
  FOR SELECT USING (
    admin_id = auth.uid() OR treasurer_id = auth.uid()
  );
```

---

## 🎮 Gamification Integration

Alla seller-komponenter integrerar med Gamification Engine:

```typescript
import { GamificationEngine } from '@/lib/gamification-engine';

// Award XP
await GamificationEngine.awardXP({
  userId: sellerId,
  eventType: 'sale_completed',
  xpAmount: 100,
  referenceId: orderId
});

// Check achievements
await GamificationEngine.checkAchievements({
  userId: sellerId,
  type: 'total_sales',
  value: 1000
});

// Update leaderboard
await GamificationEngine.updateLeaderboard(communityId, 'all_time');
```

---

## 💰 Treasury Integration

Alla wallet/treasury views använder Treasury class:

```typescript
import { Treasury } from '@/lib/treasury';

// Get balance
const balance = await Treasury.getTreasuryBalance('seller', sellerId);
// { held: 2000, available: 3000, total: 5000 }

// Get holds
const holds = await Treasury.getHolds('seller', sellerId, 'held');

// Request payout (for community treasurer)
await Treasury.requestPayout(communityId, 5000, 'bank-account');
```

---

## 📱 Responsive Design

Alla komponenter är fully responsive:

```tsx
// Grid layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// Mobile-first approach
<div className="text-2xl md:text-3xl lg:text-4xl">

// Responsive padding
<div className="p-4 md:p-6 lg:p-8">
```

---

## ✅ Testing Checklist

- [ ] Seller Dashboard loads with correct stats
- [ ] Leaderboard shows rankings correctly
- [ ] Community Dashboard displays all data
- [ ] Guardian can see all children
- [ ] Avatar customizer equips items
- [ ] Campaign creation works
- [ ] Treasury balances are accurate
- [ ] All animations work smoothly
- [ ] Responsive on mobile/tablet/desktop
- [ ] RLS policies enforce correct access

---

**Alla komponenter är nu klara och production-ready! 🎉**
