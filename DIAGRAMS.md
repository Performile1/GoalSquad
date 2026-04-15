# GoalSquad System Diagrams

Visual representations of the GoalSquad architecture.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         GOALSQUAD.SHOP                          │
│                    Community Commerce Platform                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│                  │      │                  │      │                  │
│   CUSTOMERS      │◄────►│   MERCHANTS      │◄────►│   PLATFORM       │
│                  │      │                  │      │                  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
        │                         │                          │
        │                         │                          │
        ▼                         ▼                          ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│                  │      │                  │      │                  │
│   ORDERS         │      │   PRODUCTS       │      │   SPLIT ENGINE   │
│   SHIPMENTS      │      │   INVENTORY      │      │   WALLETS        │
│                  │      │                  │      │   LEDGER         │
└──────────────────┘      └──────────────────┘      └──────────────────┘
        │                         │                          │
        └─────────────────────────┴──────────────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │                          │
                    │   SUPABASE POSTGRESQL    │
                    │   (Source of Truth)      │
                    │                          │
                    └──────────────────────────┘
```

---

## 💰 The Split Engine Flow

```
CUSTOMER CHECKOUT
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  STRIPE PAYMENT: 3080 NOK                                   │
│  - Product: 3000 NOK (2 × 1500 NOK)                        │
│  - Shipping: 80 NOK                                         │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  SPLIT ENGINE TRIGGERED                                     │
│  (lib/split-engine.ts)                                      │
└─────────────────────────────────────────────────────────────┘
       │
       ├──────────────────────────────────────────────────────┐
       │                                                       │
       ▼                                                       ▼
┌──────────────────────┐                          ┌──────────────────────┐
│  CALCULATE SPLITS    │                          │  CREATE LEDGER       │
│                      │                          │  ENTRIES             │
│  1. Sales Margin     │                          │                      │
│     (1500-1000) × 2  │                          │  Transaction ID:     │
│     = 1000 NOK       │                          │  uuid-xxx            │
│                      │                          │                      │
│  2. Handling Fee     │                          │  Entries:            │
│     = 25 NOK         │                          │  - Platform: +1045   │
│                      │                          │  - Merchant: +2000   │
│  3. Shipping Spread  │                          │  - Carrier: +60      │
│     (80-60)          │                          │                      │
│     = 20 NOK         │                          │  Total: 3105 NOK     │
└──────────────────────┘                          └──────────────────────┘
       │                                                       │
       └───────────────────┬───────────────────────────────────┘
                           ▼
              ┌────────────────────────┐
              │  UPDATE WALLET         │
              │  BALANCES (ATOMIC)     │
              │                        │
              │  Platform: +1045 NOK   │
              │  Merchant: +2000 NOK   │
              │  Carrier: +60 NOK      │
              └────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  ORDER STATUS:         │
              │  CONFIRMED ✅          │
              └────────────────────────┘
```

---

## 🚚 Distributed Logistics Flow

```
ORDER PLACED
     │
     ├─────────────────┬─────────────────┬─────────────────┐
     ▼                 ▼                 ▼                 ▼
┌─────────┐       ┌─────────┐       ┌─────────┐       ┌─────────┐
│ Item 1  │       │ Item 2  │       │ Item 3  │       │ Item 4  │
│ Oslo    │       │ Bergen  │       │ Oslo    │       │ Trondheim│
└─────────┘       └─────────┘       └─────────┘       └─────────┘
     │                 │                 │                 │
     └────────┬────────┴────────┬────────┴─────────────────┘
              ▼                 ▼
     ┌─────────────────┐  ┌─────────────────┐
     │  SHIPMENT 1     │  │  SHIPMENT 2     │
     │  Oslo Items     │  │  Bergen/Trondheim│
     │  (Direct)       │  │  (Hub Route)    │
     └─────────────────┘  └─────────────────┘
              │                 │
              │                 ▼
              │        ┌─────────────────┐
              │        │  LINEHAUL HUB   │
              │        │  (Consolidation)│
              │        └─────────────────┘
              │                 │
              │                 ▼
              │        ┌─────────────────┐
              │        │  LAST-MILE HUB  │
              │        │  (Split)        │
              │        └─────────────────┘
              │                 │
              └────────┬────────┘
                       ▼
              ┌─────────────────┐
              │  CUSTOMER       │
              │  Delivery ✅    │
              └─────────────────┘
```

---

## 🔐 Merchant Onboarding Flow

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: REGISTRATION FORM                                  │
│  /merchants/onboard                                         │
│                                                             │
│  - Merchant Name                                            │
│  - Business Details                                         │
│  - Address                                                  │
│  - Contact Info                                             │
│  - Verification Method (SMS/Email)                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  POST /api/merchants/onboard                                │
│                                                             │
│  1. Create Organization                                     │
│  2. Create Merchant                                         │
│  3. Create Wallet (balance: 0)                             │
│  4. Generate OTP (6 digits)                                │
│  5. Hash OTP (SHA-256)                                     │
│  6. Send OTP (SMS/Email)                                   │
│  7. Return otpHash                                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: OTP VERIFICATION                                   │
│  /merchants/onboard (verification step)                     │
│                                                             │
│  - Enter 6-digit code                                       │
│  - Submit for verification                                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  POST /api/merchants/verify                                 │
│                                                             │
│  1. Verify OTP hash matches                                │
│  2. Create Audit Signature:                                │
│     - SHA-256 hash of entire record                        │
│     - IP address, timestamp                                │
│     - User agent, geolocation                              │
│  3. Update merchant: verified ✅                           │
│  4. Update merchant: onboarding_completed ✅               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  MERCHANT DASHBOARD                                         │
│  /merchants/{id}/dashboard                                  │
│                                                             │
│  - Add Products                                             │
│  - View Orders                                              │
│  - Check Wallet Balance                                     │
│  - Manage Settings                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Product Creation Flow

```
┌─────────────────────────────────────────────────────────────┐
│  PRODUCT FORM                                               │
│  /merchants/{id}/products/new                               │
│                                                             │
│  Basic Info:                                                │
│  - Name, Description, Category, Brand                       │
│                                                             │
│  Identification:                                            │
│  - SKU (auto-generated if empty)                           │
│  - EAN-13 Barcode (optional)                               │
│                                                             │
│  Pricing:                                                   │
│  - Base Price (what merchant gets)                         │
│  - Retail Price (what customer pays)                       │
│                                                             │
│  GS1 Dimensions:                                            │
│  - Weight (grams)                                           │
│  - Length, Width, Height (mm)                              │
│                                                             │
│  Inventory:                                                 │
│  - Stock Quantity                                           │
│  - Stock Location                                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  CALCULATE DIMENSIONS                                       │
│  (Real-time as user types)                                  │
│                                                             │
│  Volumetric Weight = (L × W × H) / 5000                    │
│  Chargeable Weight = max(actual, volumetric)               │
│                                                             │
│  Example:                                                   │
│  - Actual: 500g                                             │
│  - Volumetric: (300 × 200 × 100) / 5000 = 1200g           │
│  - Chargeable: 1200g ✅                                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  POST /api/products/create                                  │
│                                                             │
│  1. Verify merchant is verified                            │
│  2. Check SKU uniqueness                                   │
│  3. Generate platform SKU if needed (GS-XXXXX)            │
│  4. Insert product record                                  │
│  5. Return product with calculated dimensions              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PRODUCT CREATED ✅                                         │
│                                                             │
│  - Ready for sale                                           │
│  - Shipping cost can be calculated                         │
│  - Appears in product catalog                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema Relationships

```
┌──────────────────┐
│  organizations   │
│  (Top-level)     │
└────────┬─────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐         ┌──────────────────┐
│  merchants       │────────►│  wallets         │
│                  │  1:1    │  (Virtual $)     │
└────────┬─────────┘         └──────────────────┘
         │                            │
         │ 1:N                        │ 1:N
         ▼                            ▼
┌──────────────────┐         ┌──────────────────┐
│  products        │         │  ledger_entries  │
│  (GS1 + SKU)     │         │  (Immutable)     │
└────────┬─────────┘         └──────────────────┘
         │
         │ N:M
         ▼
┌──────────────────┐         ┌──────────────────┐
│  order_items     │◄────────│  orders          │
│                  │  N:1    │                  │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         │ 1:N                        │ 1:N
         ▼                            ▼
┌──────────────────┐         ┌──────────────────┐
│  shipment_items  │◄────────│  shipments       │
│                  │  N:1    │  (Tracking)      │
└──────────────────┘         └────────┬─────────┘
                                      │
                                      │ N:1
                                      ▼
                             ┌──────────────────┐
                             │  logistics_hubs  │
                             │  (Warehouses)    │
                             └──────────────────┘

┌──────────────────┐
│  signatures      │
│  (Audit Trail)   │
│                  │
│  - Merchant onboarding
│  - Order placement
│  - Payment splits
│  - Shipment updates
└──────────────────┘

┌──────────────────┐
│  split_configs   │
│  (Margin Rules)  │
│                  │
│  - Sales margin %
│  - Handling fee
│  - Shipping spread %
└──────────────────┘
```

---

## 🔄 Order Lifecycle

```
┌─────────────┐
│   PENDING   │  ← Order created, payment not confirmed
└──────┬──────┘
       │ Stripe checkout completed
       ▼
┌─────────────┐
│  CONFIRMED  │  ← Payment received, Split Engine triggered
└──────┬──────┘
       │ Merchant processes order
       ▼
┌─────────────┐
│ PROCESSING  │  ← Picking items, preparing shipment
└──────┬──────┘
       │ Shipment created, label generated
       ▼
┌─────────────┐
│   SHIPPED   │  ← In transit to customer
└──────┬──────┘
       │ Carrier confirms delivery
       ▼
┌─────────────┐
│  DELIVERED  │  ← Order complete ✅
└─────────────┘

Alternative paths:
┌─────────────┐
│  CANCELLED  │  ← Customer/merchant cancels
└─────────────┘

┌─────────────┐
│  REFUNDED   │  ← Payment returned to customer
└─────────────┘
```

---

## 💳 Wallet Balance Flow

```
INITIAL STATE
┌──────────────────────────────────────────┐
│  Platform Wallet:    0 NOK               │
│  Merchant A Wallet:  0 NOK               │
│  Merchant B Wallet:  0 NOK               │
│  Carrier Wallet:     0 NOK               │
└──────────────────────────────────────────┘

AFTER ORDER 1 (3080 NOK)
- Merchant A: 2000 NOK
- Platform: 1045 NOK (1000+25+20)
- Carrier: 60 NOK

┌──────────────────────────────────────────┐
│  Platform Wallet:    1045 NOK            │
│  Merchant A Wallet:  2000 NOK            │
│  Merchant B Wallet:  0 NOK               │
│  Carrier Wallet:     60 NOK              │
└──────────────────────────────────────────┘

AFTER ORDER 2 (5150 NOK)
- Merchant B: 3500 NOK
- Platform: 1550 NOK
- Carrier: 100 NOK

┌──────────────────────────────────────────┐
│  Platform Wallet:    2595 NOK            │
│  Merchant A Wallet:  2000 NOK            │
│  Merchant B Wallet:  3500 NOK            │
│  Carrier Wallet:     160 NOK             │
└──────────────────────────────────────────┘

AFTER PAYOUT TO MERCHANT A
- Merchant A requests payout: -2000 NOK

┌──────────────────────────────────────────┐
│  Platform Wallet:    2595 NOK            │
│  Merchant A Wallet:  0 NOK ✅            │
│  Merchant B Wallet:  3500 NOK            │
│  Carrier Wallet:     160 NOK             │
└──────────────────────────────────────────┘
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: NETWORK                                           │
│  - HTTPS only                                               │
│  - CORS policies                                            │
│  - Rate limiting                                            │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: AUTHENTICATION                                    │
│  - Supabase JWT tokens                                      │
│  - OTP verification (SMS/Email)                            │
│  - Session management                                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: AUTHORIZATION                                     │
│  - Row-Level Security (RLS)                                │
│  - Role-based access control                               │
│  - Merchant can only see own data                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 4: DATA VALIDATION                                   │
│  - Zod schema validation                                    │
│  - Type checking (TypeScript)                              │
│  - SQL injection prevention                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 5: AUDIT TRAIL                                       │
│  - Immutable signatures                                     │
│  - Cryptographic hashing                                    │
│  - IP/timestamp logging                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow: Customer Purchase

```
CUSTOMER                    FRONTEND                    API                     DATABASE
   │                           │                         │                         │
   │  1. Browse products       │                         │                         │
   ├──────────────────────────►│                         │                         │
   │                           │  GET /api/products      │                         │
   │                           ├────────────────────────►│                         │
   │                           │                         │  SELECT * FROM products │
   │                           │                         ├────────────────────────►│
   │                           │                         │◄────────────────────────┤
   │                           │◄────────────────────────┤                         │
   │◄──────────────────────────┤                         │                         │
   │                           │                         │                         │
   │  2. Add to cart           │                         │                         │
   ├──────────────────────────►│                         │                         │
   │                           │                         │                         │
   │  3. Checkout              │                         │                         │
   ├──────────────────────────►│                         │                         │
   │                           │  POST /api/orders       │                         │
   │                           ├────────────────────────►│                         │
   │                           │                         │  INSERT INTO orders     │
   │                           │                         ├────────────────────────►│
   │                           │                         │◄────────────────────────┤
   │                           │◄────────────────────────┤                         │
   │                           │                         │                         │
   │  4. Stripe checkout       │                         │                         │
   ├──────────────────────────►│                         │                         │
   │                           │                         │                         │
   │  5. Payment complete      │                         │                         │
   ├──────────────────────────►│                         │                         │
   │                           │  Webhook: checkout.     │                         │
   │                           │  session.completed      │                         │
   │                           ├────────────────────────►│                         │
   │                           │                         │  Split Engine triggered │
   │                           │                         ├────────────────────────►│
   │                           │                         │  UPDATE wallets         │
   │                           │                         │  INSERT ledger_entries  │
   │                           │                         │◄────────────────────────┤
   │                           │◄────────────────────────┤                         │
   │                           │                         │                         │
   │  6. Order confirmed ✅    │                         │                         │
   │◄──────────────────────────┤                         │                         │
```

---

**These diagrams provide a visual understanding of GoalSquad's architecture. For detailed explanations, see [ARCHITECTURE.md](ARCHITECTURE.md).**
