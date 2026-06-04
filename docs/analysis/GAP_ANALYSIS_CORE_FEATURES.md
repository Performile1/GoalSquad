# Gap Analys: Core Features (Order, Merchants, Warehouse, Return, Admin, Consumer)

**Datum**: 2026-06-01  
**Status**: Uppdaterad med MOQ & Advanced Logistics implementation

---

## 📊 Översikt

Kodbasen har omfattande implementation för core features. Denna analys identifierar vad som saknas eller behöver förbättras.

---

## 0. Consumer (Kunder)

### ✅ Implementerat

**Frontend Pages:**
- ✅ `/cart` - Shopping cart
- ✅ `/checkout` - Checkout page
- ✅ `/products` - Products listing
- ✅ `/products/[id]` - Product details
- ✅ `/marketplace` - Marketplace
- ✅ `/marketplace/new` - New marketplace
- ✅ `/account` - Account page
- ✅ `/account/gamification` - Account gamification
- ✅ `/account/discount-codes` - Discount codes
- ✅ `/orders` - Orders list
- ✅ `/orders/[id]/flow` - Order flow
- ✅ `/returns` - Returns list
- ✅ `/communities` - Communities list
- ✅ `/communities/[id]` - Community details
- ✅ `/join/community` - Join community
- ✅ `/search` - Search page
- ✅ `/leaderboard` - Leaderboard
- ✅ `/dashboard` - Customer dashboard
- ✅ `/messages` - Messages
- ✅ `/messages/compose` - Compose message

**API Endpoints:**
- ✅ `POST /api/checkout` - Create order/checkout
- ✅ `GET /api/products` - List products
- ✅ `GET /api/products/[id]` - Get product details
- ✅ `GET /api/orders` - List orders
- ✅ `GET /api/orders/[id]` - Get order details
- ✅ `GET /api/customer/discount-codes` - Get discount codes
- ✅ `GET /api/customer/support-stats` - Get support stats
- ✅ `GET /api/search` - Search products
- ✅ `GET /api/search/advanced` - Advanced search
- ✅ `GET /api/messages/conversations` - Get conversations
- ✅ `GET /api/messages/[conversationId]` - Get messages
- ✅ `POST /api/messages/[conversationId]/send` - Send message

**Components:**
- ✅ `Navbar` - Navigation med cart icon
- ✅ `BrandIcons` - Cart icon
- ✅ `ProductFlowVisualization` - Product flow
- ✅ `Goals` - Customer goals
- ✅ `MOQProgress` - MOQ progress
- ✅ `ChatWidget` - Chat widget

### ❌ Saknas / Behöver Förbättras

**Frontend:**
- [ ] Customer profile page (separate från account)
- ✅ Customer order history page (detailed) - `/orders/[id]`
- ✅ Customer wishlist/favorites - API implementerad
- ✅ Customer address book - `/account/addresses`
- [ ] Customer payment methods management
- ✅ Customer order tracking page (real-time) - `/tracking/[id]`
- [ ] Customer review/rating system
- [ ] Customer referral program
- [ ] Customer loyalty program UI
- [ ] Customer support chat UI
- ✅ Customer notification center - `/account/notifications`
- [ ] Customer analytics dashboard (spending, savings)

**Backend:**
- [ ] Customer profile API
- ✅ Wishlist API (`/api/wishlist`)
- ✅ Address book API (`/api/account/addresses`)
- [ ] Payment methods API
- ✅ Order tracking API (`/api/tracking/[orderId]`)
- [ ] Review/rating API
- [ ] Referral API
- [ ] Loyalty API
- [ ] Support chat API
- [ ] Customer analytics API

**Database:**
- [ ] Wishlist table (använder `consumer_product_preferences` med `is_favorite`)
- ✅ Address book table - `address_book` table
- [ ] Payment methods table
- ✅ Reviews table - `product_reviews` table
- ✅ Referrals table - `referrals` table
- ✅ Loyalty points table - `loyalty_points` + `loyalty_transactions` tables
- [ ] Customer preferences table

---

## 1. Orders (Beställningar)

### ✅ Implementerat

**Frontend Pages:**
- ✅ `/orders` - Orders list page
- ✅ `/orders/[id]/flow` - Order flow visualization
- ✅ `/sellers/[id]/orders` - Seller orders
- ✅ `/merchants/[id]/orders` - Merchant orders
- ✅ `/communities/[id]/orders` - Community orders
- ✅ `/warehouses/[id]/orders` - Warehouse orders
- ✅ `/admin/orders` - Admin orders

**API Endpoints:**
- ✅ `GET /api/orders` - List orders
- ✅ `GET /api/orders/[id]` - Get order details
- ✅ `POST /api/orders/[id]/split-shipment` - Split shipment
- ✅ `GET /api/orders/[id]/moq-status` - MOQ status
- ✅ `POST /api/checkout` - Create order
- ✅ `GET /api/sellers/[id]/orders` - Seller orders API
- ✅ `GET /api/merchants/[id]/orders` - Merchant orders API

**Components:**
- ✅ `OrderMOQStatus` - MOQ progress indicator
- ✅ `MOQProgress` - MOQ progress bar
- ✅ `ProductFlowVisualization` - Order flow visualization

### ❌ Saknas / Behöver Förbättras

**Frontend:**
- ✅ Order details page (`/orders/[id]`) - Implementerad
- [ ] Order history page för customers
- ✅ Order tracking page med real-time updates (`/tracking/[id]`)
- ✅ Order cancellation UI för customers - integrerat i order details
- [ ] Order modification UI (add/remove items)
- [ ] Order export functionality (PDF, CSV)
- [ ] Order search och advanced filtering
- [ ] Order analytics dashboard

**Backend:**
- ✅ Order cancellation API (`/api/orders/[id]/cancel`)
- [ ] Order modification API
- [ ] Order export API
- [ ] Order search API
- [ ] Order analytics API
- [ ] Order notification triggers (push notifications)
- [ ] Order status webhook callbacks
- [ ] Order refund integration

**Database:**
- ✅ Order audit log (för spårning av ändringar) - `audit_logs` table
- [ ] Order notes/comments system
- [ ] Order tags/categories
- [ ] Order templates

---

## 2. Merchants (Handlare)

### ✅ Implementerat

**Frontend Pages:**
- ✅ `/merchants` - Merchants list
- ✅ `/merchants/[id]` - Merchant profile
- ✅ `/merchants/[id]/dashboard` - Merchant dashboard
- ✅ `/merchants/[id]/products` - Merchant products
- ✅ `/merchants/[id]/products/new` - Create product
- ✅ `/merchants/[id]/products/[productId]` - Product details
- ✅ `/merchants/[id]/orders` - Merchant orders
- ✅ `/merchants/[id]/settings` - Merchant settings
- ✅ `/merchants/[id]/barcodes` - Barcode management
- ✅ `/merchants/[id]/asn` - ASN management
- ✅ `/merchants/[id]/moq-rules` - MOQ rules
- ✅ `/merchants/[id]/warehouse-assignments` - Warehouse assignments
- ✅ `/merchants/[id]/messages` - Merchant messages
- ✅ `/merchants/onboard` - Merchant onboarding
- ✅ `/merchant/products/create` - Product creation wizard
- ✅ `/merchant/returns` - Merchant returns
- ✅ `/merchant/settings/branding` - Branding settings
- ✅ `/merchant/products/[id]/moq-settings` - MOQ settings

**API Endpoints:**
- ✅ `GET /api/merchants` - List merchants
- ✅ `GET /api/merchants/[id]` - Get merchant details
- ✅ `GET /api/merchants/[id]/stats` - Merchant stats
- ✅ `GET /api/merchants/[id]/products` - Merchant products
- ✅ `GET /api/merchants/[id]/orders` - Merchant orders
- ✅ `POST /api/merchants/[id]/products` - Create product
- ✅ `POST /api/merchants/[id]/warehouse-assignments` - Assign warehouse
- ✅ `POST /api/merchants/[id]/moq-rules` - Set MOQ rules
- ✅ `POST /api/merchants/[id]/barcodes` - Create barcode
- ✅ `POST /api/merchants/[id]/asn` - Create ASN
- ✅ `POST /api/merchants/onboard` - Onboard merchant
- ✅ `POST /api/merchants/verify` - Verify merchant
- ✅ `POST /api/merchants/[id]/message-community` - Message community
- ✅ `GET /api/merchants/showcase` - Merchant showcase

**Components:**
- ✅ `MerchantShippingPreferences` - Shipping preferences
- ✅ `ProductFlowVisualization` - Product flow

### ❌ Saknas / Behöver Förbättras

**Frontend:**
- [ ] Merchant verification UI (status tracking)
- [ ] Merchant analytics dashboard (sales, performance)
- [ ] Merchant comparison tool
- [ ] Merchant review/rating system
- [ ] Merchant certification display
- [ ] Merchant notification center
- [ ] Merchant bulk operations (bulk product upload, bulk orders)
- [ ] Merchant integration settings (ERP, accounting)

**Backend:**
- [ ] Merchant verification API
- [ ] Merchant analytics API
- [ ] Merchant review API
- [ ] Merchant certification API
- [ ] Merchant bulk operations API
- [ ] Merchant integration API
- [ ] Merchant notification triggers

**Database:**
- [ ] Merchant certifications table
- [ ] Merchant reviews table
- [ ] Merchant analytics cache
- [ ] Merchant integration configs

---

## 3. Warehouse (Lager)

### ✅ Implementerat

**Frontend Pages:**
- ✅ `/warehouses` - Warehouses list
- ✅ `/warehouses/[id]` - Warehouse details
- ✅ `/warehouses/[id]/dashboard` - Warehouse dashboard
- ✅ `/warehouses/[id]/orders` - Warehouse orders
- ✅ `/warehouses/[id]/settings` - Warehouse settings
- ✅ `/warehouses/[id]/management` - Warehouse management
- ✅ `/warehouses/returns` - Warehouse returns
- ✅ `/warehouses/onboard` - Warehouse onboarding
- ✅ `/admin/warehouses` - Admin warehouses

**API Endpoints:**
- ✅ `GET /api/warehouses` - List warehouses
- ✅ `GET /api/warehouses/[id]` - Get warehouse details
- ✅ `GET /api/warehouses/[id]/stats` - Warehouse stats
- ✅ `GET /api/warehouses/[id]/orders` - Warehouse orders
- ✅ `GET /api/warehouses/[id]/flow` - Warehouse flow
- ✅ `GET /api/warehouses/find` - Find warehouse
- ✅ `POST /api/webhooks/warehouse` - Warehouse webhook

**Components:**
- ✅ `WarehouseMap` - Warehouse map visualization

### ❌ Saknas / Behöver Förbättras

**Frontend:**
- ✅ Warehouse inventory management UI (tab i `/warehouses/[id]/management`)
- [ ] Warehouse picking/packing interface
- [ ] Warehouse receiving UI
- [ ] Warehouse layout editor
- [ ] Warehouse analytics dashboard
- [ ] Warehouse staff management
- [ ] Warehouse equipment tracking
- [ ] Warehouse zone management

**Backend:**
- ✅ Inventory management API (`/api/warehouses/[id]/inventory`)
- [ ] Picking/packing API
- [ ] Receiving API
- [ ] Warehouse layout API
- [ ] Warehouse analytics API
- [ ] Staff management API
- [ ] Equipment tracking API
- [ ] Zone management API

**Database:**
- ✅ Inventory table (stock levels, locations) - `warehouse_inventory` table
- [ ] Picking/packing table
- [ ] Receiving table
- [ ] Warehouse layout table
- [ ] Staff table
- [ ] Equipment table
- [ ] Zones table

---

## 4. Returns (Returer)

### ✅ Implementerat

**Frontend Pages:**
- ✅ `/returns` - Returns list
- ✅ `/sellers/[id]/returns` - Seller returns
- ✅ `/warehouses/returns` - Warehouse returns
- ✅ `/communities/[id]/returns` - Community returns
- ✅ `/merchant/returns` - Merchant returns
- ✅ `/admin/returns` - Admin returns

**API Endpoints:**
- ✅ `GET /api/sellers/[id]/returns` - Seller returns
- ✅ `GET /api/communities/[id]/returns` - Community returns
- ✅ `POST /api/admin/returns/[id]/approve` - Approve return
- ✅ `GET /api/admin/returns` - Admin returns

### ❌ Saknas / Behöver Förbättras

**Frontend:**
- ✅ Return request creation UI (for customers) - `/returns/create`
- [ ] Return tracking page
- [ ] Return reason categorization
- [ ] Return refund status display
- [ ] Return analytics dashboard
- [ ] Return policy display
- [ ] Return label generation

**Backend:**
- ✅ Return request creation API (`/api/returns/create`)
- [ ] Return tracking API
- [ ] Return refund API
- [ ] Return analytics API
- [ ] Return label generation API
- [ ] Return policy API

**Database:**
- ✅ Return requests table - `returns` table
- ✅ Return reasons table - `return_reasons` table
- ✅ Return labels table - `return_labels` table
- ✅ Return refunds table - `return_refunds` table

---

## 5. Admin (Administration)

### ✅ Implementerat

**Frontend Pages:**
- ✅ `/admin/dashboard` - Admin dashboard
- ✅ `/admin/users` - User management
- ✅ `/admin/users/create` - Create user
- ✅ `/admin/orders` - Admin orders
- ✅ `/admin/merchants` - Admin merchants
- ✅ `/admin/communities` - Admin communities
- ✅ `/admin/warehouses` - Admin warehouses
- ✅ `/admin/returns` - Admin returns
- ✅ `/admin/ads` - Admin ads
- ✅ `/admin/campaigns` - Admin campaigns
- ✅ `/admin/blog` - Admin blog
- ✅ `/admin/approved-products` - Approved products
- ✅ `/admin/sops` - Standard operating procedures
- ✅ `/admin/seo` - SEO management
- ✅ `/admin/sellers` - Admin sellers

**API Endpoints:**
- ✅ `GET /api/admin/stats` - Admin stats
- ✅ `GET /api/admin/users` - List users
- ✅ `POST /api/admin/users/create` - Create user
- ✅ `POST /api/admin/users/[id]/deactivate` - Deactivate user
- ✅ `GET /api/admin/orders` - Admin orders
- ✅ `GET /api/admin/merchants` - Admin merchants
- ✅ `POST /api/admin/merchants/[id]/activate` - Activate merchant
- ✅ `POST /api/admin/merchants/[id]/deactivate` - Deactivate merchant
- ✅ `GET /api/admin/communities` - Admin communities
- ✅ `POST /api/admin/communities/[id]/activate` - Activate community
- ✅ `POST /api/admin/communities/[id]/deactivate` - Deactivate community
- ✅ `GET /api/admin/sellers` - Admin sellers
- ✅ `POST /api/admin/sellers/[id]/activate` - Activate seller
- ✅ `POST /api/admin/sellers/[id]/deactivate` - Deactivate seller
- ✅ `GET /api/admin/ads` - Admin ads
- ✅ `POST /api/admin/ads/[id]/approve` - Approve ad
- ✅ `POST /api/admin/ads/[id]/reject` - Reject ad
- ✅ `GET /api/admin/returns` - Admin returns
- ✅ `POST /api/admin/returns/[id]/approve` - Approve return
- ✅ `GET /api/admin/entities` - Admin entities
- ✅ `POST /api/admin/broadcast` - Broadcast message
- ✅ `POST /api/admin/stripe/freeze-account` - Freeze Stripe account
- ✅ `GET /api/admin/activities` - Admin activities

### ❌ Saknas / Behöver Förbättras

**Frontend:**
- ✅ Admin audit log viewer (`/admin/security`)
- ✅ Admin settings page - `/admin/settings`
- [ ] Admin notification center
- [ ] Admin analytics dashboard
- [ ] Admin report generator
- [ ] Admin system health monitor
- [ ] Admin backup/restore UI
- [ ] Admin API key management
- ✅ Admin role management (RBAC) (`/admin/security`)
- [ ] Admin permission management

**Backend:**
- ✅ Audit log API (via `audit_logs` table)
- ✅ Settings API (`/api/admin/settings`)
- [ ] Analytics API
- [ ] Report generation API
- [ ] System health API
- [ ] Backup/restore API
- [ ] API key management API
- ✅ Role management API (`/api/admin/users/update`)
- [ ] Permission management API

**Database:**
- ✅ Audit log table - `audit_logs` table
- [ ] Settings table (använder `platform_settings` table)
- [ ] Analytics cache table
- [ ] Reports table
- [ ] System health table
- [ ] Backup logs table
- ✅ API keys table - `api_keys` table
- [ ] Roles table
- [ ] Permissions table

---

## 6. MOQ Campaign Management (Kampanjhantering)

### ✅ Implementerat

**Database:**
- ✅ Campaign status fields: `moq_succeeded`, `moq_failed`
- ✅ Business rule fields: `grace_period_hours`, `auto_extend_enabled`, `auto_extend_days`, `auto_extend_threshold_pct`, `manual_dispense_granted`
- ✅ Index for campaign evaluation: `idx_campaigns_eval_status`, `idx_campaigns_processed_at`

**Backend:**
- ✅ Campaign rules engine (`lib/campaignRulesEngine.ts`)
- ✅ Campaign evaluation worker (`app/api/workers/campaign-evaluation/route.ts`)
- ✅ Stripe capture logic (`lib/stripeSettlement.ts`)
- ✅ Stripe void authorization (`lib/stripeSettlement.ts`)
- ✅ Campaign notifications (`lib/campaignNotifications.ts`)

**Frontend:**
- ✅ Campaign rules form for admin (`CampaignRulesForm.tsx`)

**Operations:**
- ✅ Cron job plan documented (`docs/operations/CRON_JOBS_SETUP.md`)

### ❌ Saknas / Behöver Förbättras

**Frontend:**
- [ ] Campaign analytics dashboard
- [ ] Campaign comparison tool
- [ ] Campaign performance reports
- [ ] Campaign template management

**Backend:**
- [ ] Campaign analytics API
- [ ] Campaign template API
- [ ] Campaign A/B testing features

---

## 7. Advanced Logistics (Multi-Echelon Cross-Docking)

### ✅ Implementerat

**Database:**
- ✅ `warehouse_network` - Hub-to-hub relations
- ✅ `shipment_segments` - Transport legs
- ✅ `warehouse_cross_dock_queue` - Cross-docking instructions
- ✅ `warehouse_discrepancies` - Discrepancy handling
- ✅ `consolidation_warehouses` updates: `is_central_hub`, `zip_code`

**RPC Functions:**
- ✅ `find_optimal_local_warehouse` - Find local hub by zip code
- ✅ `generate_multi_echelon_routing` - Generate consolidation routes
- ✅ `get_aggregated_campaign_picklist` - Picklist generation

**Backend APIs:**
- ✅ Logistics consolidation API (`app/api/admin/logistics/consolidate/route.ts`)
- ✅ Discrepancy reporting API (`app/api/warehouse/terminal/discrepancy/route.ts`)
- ✅ Delivery status tracking API (`app/api/delivery/status/[campaignId]/route.ts`)

**Frontend Components:**
- ✅ `WarehouseCrossDockDashboard.tsx` - Hub 1 terminal
- ✅ `DiscrepancyReportModal.tsx` - Discrepancy reporting UI
- ✅ `DeliveryStatusTracker.tsx` - Mobile delivery tracking
- ✅ `BulkPickList.tsx` - WMS picklist
- ✅ `ConsumerDeliverySheet.tsx` - Delivery sheet
- ✅ `WarehousePalletLabel.tsx` - Pallet labeling

### ❌ Saknas / Behöver Förbättras

**Frontend:**
- [ ] Local hub breakdown terminal (Hub 2)
- [ ] Warehouse terminal overview
- [ ] Cross-dock queue management UI
- [ ] Logistics analytics dashboard
- [ ] Route optimization visualization

**Backend:**
- [ ] Local hub inbound breakdown API
- [ ] Cross-dock queue list/action API
- [ ] Warehouse terminal overview API
- [ ] Logistics analytics API
- [ ] Route optimization API

**Database:**
- [ ] Warehouse events table (exists but may need expansion)
- [ ] Shipping provider integration configs
- [ ] Route history table

---

## 📋 Sammanfattning

### Implementation Status

| Feature | Status | Completion |
|---------|--------|------------|
| Consumer | ✅ Mostly Complete | 85% |
| Orders | ✅ Mostly Complete | 90% |
| Merchants | ✅ Mostly Complete | 80% |
| Warehouse | ✅ Mostly Complete | 75% |
| Returns | ✅ Mostly Complete | 75% |
| Admin | ✅ Mostly Complete | 90% |
| MOQ Campaign Management | ✅ Mostly Complete | 85% |
| Advanced Logistics | ✅ Mostly Complete | 70% |

### Kritiska Saknade Funktioner

**High Priority:**
1. ~~Warehouse Inventory Management~~ - ✅ Implementerad
2. ~~Return Request Creation~~ - ✅ Implementerad
3. ~~Order Cancellation~~ - ✅ Implementerad
4. ~~Admin Audit Log~~ - ✅ Implementerad
5. ~~Admin Role Management~~ - ✅ Implementerad
6. ~~Customer Order Tracking~~ - ✅ Implementerad
7. ~~Customer Wishlist~~ - ✅ Implementerad
8. ~~MOQ Campaign Rules Engine~~ - ✅ Implementerad
9. ~~Multi-Echelon Logistics Routing~~ - ✅ Implementerad
10. ~~Cross-Docking Operations~~ - ✅ Implementerad

**Medium Priority:**
1. Order Analytics Dashboard
2. Merchant Verification UI
3. Warehouse Picking/Packing Interface
4. Return Tracking
5. Admin Settings Page
6. Customer Review/Rating System
7. Customer Loyalty Program
8. Local Hub Breakdown Terminal (Hub 2)
9. Logistics Analytics Dashboard
10. Campaign Analytics Dashboard

**Low Priority:**
1. Order Export
2. Merchant Reviews
3. Warehouse Layout Editor
4. Return Analytics
5. Admin Report Generator
6. Customer Referral Program
7. Route Optimization Visualization

---

## 🎯 Rekommenderade Nästa Steg

### Fase 1: Logistik UI Komplettering (1 vecka)

1. **Local Hub Breakdown Terminal (Hub 2)**
   - Skapa UI för lokal hubb breakdown
   - Implementera API för inbound breakdown
   - Skapa segment creation UI

2. **Warehouse Terminal Overview**
   - Skapa dashboard för lagerterminal
   - Implementera overview API
   - Lägg till real-time status updates

3. **Cross-Dock Queue Management**
   - Skapa UI för köhantering
   - Implementera list/action API
   - Lägg till queue status visualization

### Fase 2: Analytics & Reporting (1-2 veckor)

1. **Logistics Analytics Dashboard**
   - Implementera logistics analytics API
   - Skapa logistics analytics UI
   - Lägg till route performance metrics

2. **Campaign Analytics Dashboard**
   - Implementera campaign analytics API
   - Skapa campaign analytics UI
   - Lägg till MOQ success rate tracking

3. **Order Analytics**
   - Implementera analytics API
   - Skapa analytics dashboard UI

### Fase 3: Enhanced Features (1-2 veckor)

1. **Warehouse Picking/Packing Interface**
   - Skapa picking/packing UI
   - Implementera picking/packing API
   - Lägg till barcode scanning integration

2. **Merchant Verification UI**
   - Skapa verification status tracking
   - Implementera verification API
   - Lägg till verification workflow

3. **Return Tracking**
   - Implementera return tracking API
   - Skapa return tracking UI
   - Lägg till return status notifications

---

## 📝 Notes

- Kodbasen har en solid grund för alla core features
- MOQ Campaign Management är nu 85% komplett med regelmotor, Stripe integration och cron-jobb
- Advanced Logistics (Multi-Echelon Cross-Docking) är 70% komplett med routing engine och cross-docking operations
- Många av de saknade funktionerna är "nice-to-have" snarare än kritiska
- Fokus bör ligga på logistik UI komplettering (Hub 2 terminal, warehouse overview) och analytics dashboards
- Admin features kan byggas ut gradvis efter behov
- Messaging features är nu 100% implementerade (se separat analys)
