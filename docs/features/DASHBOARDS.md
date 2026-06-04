# GoalSquad Dashboard Routes and Roles

## Overview
This document outlines all dashboard routes and role-based routing in the GoalSquad platform.

## Role-Based Routing

After login (email/password or OAuth), users are redirected based on their role in the `profiles` table:

| Role | Dashboard Route | Description |
|------|----------------|-------------|
| `gs_admin` | `/admin/dashboard` | Platform admin dashboard |
| `merchant` | `/merchants/dashboard` | Merchant/Company dashboard |
| `warehouse` | `/warehouses/dashboard` | Warehouse partner dashboard |
| `seller` | `/dashboard` | Seller dashboard (redirects to seller-specific page) |
| `user` | `/dashboard` | Generic user/consumer dashboard |
| Other | `/dashboard` | Default fallback |

## Dashboard Locations

### 1. Admin Dashboard (`/admin/dashboard`)
**Location:** `app/admin/dashboard/page.tsx`

**Features:**
- Overview of all entities (communities, merchants, sellers, orders, returns)
- Quick access to admin management pages
- Platform-wide statistics

**Sub-pages:**
- `/admin/communities` - Community management
- `/admin/merchants` - Merchant management
- `/admin/sellers` - Seller management
- `/admin/orders` - Order management
- `/admin/returns` - Return management
- `/admin/users` - User management
- `/admin/warehouses` - Warehouse management
- `/admin/ads` - Advertisement management
- `/admin/approved-products` - Product approval
- `/admin/blog` - Blog management
- `/admin/campaigns` - Campaign management
- `/admin/seo` - SEO settings
- `/admin/sops` - SOPs management

### 2. Seller Dashboard (`/dashboard`)
**Location:** `app/dashboard/page.tsx` (consumer) or `app/sellers/[id]/dashboard/page.tsx` (seller-specific)

**Consumer Dashboard (`/dashboard`):**
- Order history
- Returns
- Support tickets
- Profile management
- Address book

**Seller Dashboard (`/sellers/[id]/dashboard`):**
- Sales statistics
- XP and level progress
- Streak tracking
- Treasury balance
- Achievements
- Avatar customization

**Seller Sub-pages:**
- `/sellers/[id]/products` - Product management
- `/sellers/[id]/orders` - Order management
- `/sellers/[id]/returns` - Return management (NEW)

### 3. Community Dashboard (`/communities/[id]/dashboard`)
**Location:** `app/communities/[id]/dashboard/page.tsx`

**Features:**
- Member statistics
- Sales overview
- Treasury balance
- Campaign management
- Leaderboard

**Community Sub-pages:**
- `/communities/[id]/sellers` - Seller list (NEW)
- `/communities/[id]/orders` - Order management
- `/communities/[id]/returns` - Return management (NEW)
- `/communities/[id]/messages` - Community messaging
- `/communities/[id]/treasury` - Treasury management
- `/communities/[id]/campaigns` - Campaign management

### 4. Merchant Dashboard (`/merchants/dashboard`)
**Location:** `app/merchants/dashboard/page.tsx`

**Features:**
- Order overview
- Product management
- Sales analytics
- Revenue tracking

**Merchant Sub-pages:**
- `/merchants/[id]/products` - Product management
- `/merchants/[id]/orders` - Order management
- `/merchants/onboard` - Merchant onboarding

### 5. Warehouse Dashboard (`/warehouses/dashboard`)
**Location:** `app/warehouses/dashboard/page.tsx`

**Features:**
- Order processing
- Inventory management
- Shipping tracking

**Warehouse Sub-pages:**
- `/warehouses/[id]/orders` - Order management
- `/warehouses/[id]/inventory` - Inventory management
- `/warehouses/join` - Warehouse onboarding

## Login Flow

### Email/Password Login
**File:** `app/auth/login/page.tsx`

1. User enters email/password
2. Sign in via Supabase Auth
3. Fetch user profile from `profiles` table
4. Redirect based on role (see Role-Based Routing table above)

### OAuth Login (Google/Facebook)
**File:** `app/auth/callback/route.ts`

1. User signs in via OAuth provider
2. Supabase exchanges code for session
3. Fetch user profile from `profiles` table
4. Redirect based on role (see Role-Based Routing table above)

## Database Schema Reference

### Profiles Table
```sql
profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT, -- 'gs_admin', 'merchant', 'warehouse', 'seller', 'user'
  is_active BOOLEAN,
  is_verified BOOLEAN,
  ...
)
```

## Important Notes

1. **Admin Role:** The admin role is `gs_admin` (NOT `admin` or `super_admin`)
2. **Seller Routing:** Sellers are redirected to `/dashboard` which then determines if they have a seller profile and redirects to the appropriate seller-specific dashboard
3. **Custom Redirects:** If a `redirect` query parameter is provided (e.g., `?redirect=/marketplace/new`), it takes precedence over role-based routing
4. **Middleware:** Consider adding middleware for additional role-based access control if needed

## Future Improvements

- Add middleware for role-based route protection
- Create a unified routing configuration file
- Add role-based access control to API endpoints
- Implement role-based UI components
