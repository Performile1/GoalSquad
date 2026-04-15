# GoalSquad.shop 🚀

**Global 4PL and Fintech Platform for Community Commerce**

GoalSquad is a high-performance, scalable platform that combines logistics, payments, and community commerce. Built with a "Shopify-meets-Sport-Management" vibe, it features extreme scalability and zero-friction user experience.

---

## 🎯 Core Features

### The Split Engine 💰
Triple-dip margin system that splits revenue in real-time:
- **Sales Margin**: Difference between retail and merchant base price
- **Handling Fee**: Fixed platform fee per order
- **Shipping Spread**: Carrier cost arbitrage

Money NEVER lands in a single account - it's split virtually at checkout using our immutable ledger system.

### Distributed Logistics 🚚
Multi-origin shipping with intelligent hub routing:
- Orders can have multiple shipments from different merchants
- Consolidation at linehaul hubs
- Last-mile optimization
- Full tracking and audit trail

### Audit-Log Signatures 🔒
Immutable trust records for every critical action:
- OTP verification via SMS/Email (no BankID)
- SHA-256 hashed signatures
- IP, timestamp, and geolocation tracking
- Tamper-proof audit trail

### GS1 Hybrid PIM 📦
Product management supporting both:
- EAN-13 barcodes (GS1 standard)
- Platform SKUs (GS-XXXXX format)
- Full GS1 dimensions (weight, L×W×H) for shipping matrix

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (styling)
- **Framer Motion** (animations)

### Backend
- **Supabase** (Auth, PostgreSQL, Storage)
- **Node.js** (API endpoints)
- **Stripe Connect** (payments & splits)

### Logistics
- API-first architecture
- Ready for nShift/3PL webhooks
- Multi-carrier support

---

## 📁 Project Structure

```
goalsquad/
├── app/                          # Next.js App Router
│   ├── api/                      # API endpoints
│   │   ├── merchants/
│   │   │   ├── onboard/         # Merchant onboarding
│   │   │   └── verify/          # OTP verification
│   │   └── products/
│   │       └── create/          # Product creation with GS1
│   ├── merchants/
│   │   └── onboard/             # Merchant onboarding UI
│   ├── layout.tsx
│   ├── page.tsx                 # Landing page
│   └── globals.css
├── lib/
│   ├── split-engine.ts          # Triple-dip margin calculator
│   ├── audit-signature.ts       # OTP & signature system
│   └── supabase.ts              # Supabase clients
├── database/
│   └── schema.sql               # Complete database schema
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── .env.example
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Stripe account (for payments)
- Twilio account (for SMS OTP, optional)

### 1. Clone and Install

```bash
git clone <your-repo>
cd goalsquad
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project
2. Run the database schema:
   ```bash
   # Copy the contents of database/schema.sql
   # Paste into Supabase SQL Editor
   # Execute
   ```

3. Enable Row Level Security (RLS) policies are already included in schema

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio (optional, for SMS OTP)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Email (for Email OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@goalsquad.shop
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📊 Database Schema

### Core Tables

#### Organizations
Top-level entity for multi-tenancy (platform, merchants, hubs, carriers)

#### Merchants
Sellers on the platform with Stripe Connect integration

#### Products
GS1 hybrid PIM with EAN/GTIN support and physical dimensions

#### Orders & Order Items
Customer purchases with line-item details

#### Shipments
Physical movement tracking with multi-origin support

#### Wallets
Virtual accounts for all participants (platform, merchants, carriers)

#### Ledger Entries
Immutable double-entry bookkeeping for all transactions

#### Signatures
Audit trail with OTP verification and cryptographic hashing

---

## 🔐 The Split Engine

### How It Works

When a customer completes checkout:

1. **Order Created**: Total amount captured via Stripe
2. **Split Calculation**:
   - Sales Margin = (Retail Price - Merchant Base) × Quantity
   - Handling Fee = Fixed fee (default: 25 NOK)
   - Shipping Spread = Customer Shipping - Carrier Cost
3. **Ledger Entries**: Double-entry bookkeeping creates:
   - Credit to Platform Wallet (margins + fees)
   - Credit to Merchant Wallet (base price × quantity)
   - Credit to Carrier Wallet (carrier cost)
4. **Immutable Record**: All entries timestamped and locked

### Example Split

```
Product: 100 NOK (merchant base) → 150 NOK (retail)
Quantity: 2
Shipping: 80 NOK (customer pays) / 60 NOK (carrier cost)

Splits:
- Merchant Payout: 200 NOK (100 × 2)
- Sales Margin: 100 NOK ((150-100) × 2)
- Handling Fee: 25 NOK
- Shipping Spread: 20 NOK (80-60)
- Platform Revenue: 145 NOK (100+25+20)

Total: 345 NOK (200 + 145)
```

---

## 🎨 Merchant Onboarding Flow

### Step 1: Registration
- Merchant fills out business details
- Address, contact info, legal entity
- Choose verification method (SMS or Email OTP)

### Step 2: OTP Verification
- 6-digit code sent via chosen method
- Code hashed with SHA-256
- Immutable signature created with:
  - IP address
  - User agent
  - Timestamp
  - Geolocation (optional)

### Step 3: Stripe Connect
- Merchant connects Stripe account
- Platform can split payments automatically
- Merchant receives payouts directly

### Step 4: Product Upload
- Add products with GS1 dimensions
- Weight (grams), Length/Width/Height (mm)
- Volumetric weight calculated for shipping matrix

---

## 🚚 Distributed Logistics

### Routing Types

1. **Direct**: Merchant → Customer
2. **Hub Consolidation**: Multiple merchants → Linehaul Hub → Customer
3. **Multi-Origin**: Complex routing with multiple hubs

### Shipping Matrix

Uses GS1 dimensions to calculate:
- Volumetric weight: (L × W × H) / 5000
- Chargeable weight: max(actual weight, volumetric weight)
- Shipping cost based on weight + distance

---

## 🔒 Security & Compliance

- **RLS Policies**: Row-level security on all tables
- **Audit Signatures**: Immutable records for compliance
- **Encrypted Secrets**: All API keys in environment variables
- **HTTPS Only**: Force SSL in production
- **Rate Limiting**: API endpoints protected (TODO)

---

## 📈 Roadmap

### Phase 1: MVP ✅
- [x] Database schema
- [x] Split Engine
- [x] Merchant onboarding
- [x] Product management
- [x] Audit signatures

### Phase 2: Payments
- [ ] Stripe Connect integration
- [ ] Checkout flow
- [ ] Webhook handlers
- [ ] Payout automation

### Phase 3: Logistics
- [ ] Carrier API integration (nShift)
- [ ] Shipping label generation
- [ ] Tracking webhooks
- [ ] Hub management dashboard

### Phase 4: Community
- [ ] Customer accounts
- [ ] Order history
- [ ] Reviews & ratings
- [ ] Community funding features

---

## 🤝 Contributing

This is a private project. For questions, contact the development team.

---

## 📄 License

Proprietary - All rights reserved

---

## 🎯 The Vibe

**"Shopify meets Sport Management"**

- High-performance
- Clean, modern UI
- Extreme scalability
- Zero-friction UX
- Community-first

Built for the future of commerce. 🚀
