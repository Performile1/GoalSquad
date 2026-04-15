# GoalSquad Architecture v2.0

## System Overview

GoalSquad is a multi-tenant, distributed commerce platform built on three core pillars:

1. **The Split Engine** - Real-time revenue distribution
2. **Distributed Logistics** - Multi-origin fulfillment
3. **Audit Trail** - Immutable trust layer

---

## Architecture Principles

### 1. Database-First Design
- PostgreSQL (via Supabase) is the source of truth
- All business logic enforced at DB level
- Row-level security for multi-tenancy
- Immutable ledger for financial transactions

### 2. API-First
- RESTful endpoints for all operations
- Webhook-ready for external integrations
- Versioned APIs for backwards compatibility

### 3. Event-Driven
- Stripe webhooks trigger Split Engine
- Carrier webhooks update shipment status
- Audit signatures on critical events

### 4. Zero-Trust Security
- RLS policies on every table
- OTP verification for sensitive actions
- Cryptographic signatures for audit trail

---

## Data Flow

### Order Placement Flow

```
Customer Checkout
    ↓
Stripe Payment Intent Created
    ↓
Order Record Created (status: pending)
    ↓
Order Items Created (with merchant references)
    ↓
Stripe Checkout Completed
    ↓
Webhook: checkout.session.completed
    ↓
Split Engine Triggered
    ↓
Ledger Entries Created:
    - Platform Wallet (margins + fees)
    - Merchant Wallet(s) (base prices)
    - Carrier Wallet (shipping cost)
    ↓
Wallets Updated (atomic transaction)
    ↓
Order Status: confirmed
    ↓
Shipment Created
    ↓
Merchant Notified
```

### Merchant Onboarding Flow

```
Registration Form Submitted
    ↓
Organization Created
    ↓
Merchant Created (status: pending)
    ↓
Wallet Created (balance: 0)
    ↓
OTP Sent (SMS or Email)
    ↓
User Enters OTP
    ↓
Signature Created:
    - Hash OTP
    - Record IP, timestamp, user agent
    - Generate signature hash
    ↓
Merchant Status: verified
    ↓
Stripe Connect Onboarding
    ↓
Merchant Status: active
```

---

## The Split Engine Deep Dive

### Triple-Dip Margin Calculation

```typescript
// 1. Sales Margin
salesMargin = (retailPrice - merchantBasePrice) * quantity

// 2. Handling Fee
handlingFee = FIXED_FEE // e.g., 25 NOK per order

// 3. Shipping Spread
shippingSpread = customerShippingCost - carrierCost

// Total Platform Revenue
platformRevenue = salesMargin + handlingFee + shippingSpread

// Merchant Payout
merchantPayout = merchantBasePrice * quantity
```

### Ledger Double-Entry

Every transaction creates balanced entries:

```sql
-- Customer pays 345 NOK total
-- Merchant base: 200 NOK
-- Sales margin: 100 NOK
-- Handling fee: 25 NOK
-- Shipping spread: 20 NOK

-- Entry 1: Platform receives margins
INSERT INTO ledger_entries (
  wallet_id: platform_wallet,
  entry_type: 'credit',
  amount: 100,
  category: 'sales_margin'
)

-- Entry 2: Platform receives handling fee
INSERT INTO ledger_entries (
  wallet_id: platform_wallet,
  entry_type: 'credit',
  amount: 25,
  category: 'handling_fee'
)

-- Entry 3: Platform receives shipping spread
INSERT INTO ledger_entries (
  wallet_id: platform_wallet,
  entry_type: 'credit',
  amount: 20,
  category: 'shipping_spread'
)

-- Entry 4: Merchant receives payout
INSERT INTO ledger_entries (
  wallet_id: merchant_wallet,
  entry_type: 'credit',
  amount: 200,
  category: 'merchant_payout'
)

-- Total: 345 NOK (balanced)
```

---

## Distributed Logistics

### Hub Types

1. **Merchant Warehouse**: Origin point for products
2. **Linehaul Hub**: Consolidation center for long-distance shipping
3. **Last-Mile Hub**: Local distribution center
4. **Return Center**: Handles returns and refunds

### Routing Algorithm

```
For each order:
  1. Group items by merchant location
  2. Calculate optimal route:
     - Direct if single merchant + short distance
     - Hub consolidation if multiple merchants
     - Multi-hop if international
  3. Create shipment records
  4. Generate shipping labels
  5. Update tracking info
```

### Shipping Matrix

Based on GS1 dimensions:

```typescript
// Calculate volumetric weight
volumetricWeight = (length_mm * width_mm * height_mm) / 5000

// Chargeable weight
chargeableWeight = Math.max(actualWeight, volumetricWeight)

// Shipping cost
shippingCost = getCarrierRate(
  chargeableWeight,
  originPostalCode,
  destinationPostalCode,
  serviceLevel
)

// Add spread
customerCost = shippingCost * (1 + SHIPPING_SPREAD_PERCENT / 100)
```

---

## Security Model

### Row-Level Security (RLS)

```sql
-- Merchants can only see their own data
CREATE POLICY merchants_select_own ON merchants
  FOR SELECT USING (user_id = auth.uid());

-- Customers can only see their own orders
CREATE POLICY orders_select_customer ON orders
  FOR SELECT USING (customer_id = auth.uid());

-- Platform admin can see everything
CREATE POLICY admin_all ON * 
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'platform_admin'
  );
```

### Audit Signatures

Every critical action creates an immutable signature:

```typescript
signature = SHA256({
  entityType,
  entityId,
  action,
  userId,
  email,
  phone,
  otpHash,
  ipAddress,
  userAgent,
  timestamp
})
```

Signatures are:
- **Immutable**: No updates allowed
- **Verifiable**: Can be re-computed and checked
- **Timestamped**: Precise audit trail
- **Geolocation-aware**: IP → country/city

---

## Scalability Considerations

### Database
- **Connection pooling**: Supabase handles this
- **Read replicas**: For analytics queries
- **Partitioning**: Orders/ledger by date range
- **Indexes**: On all foreign keys and search fields

### API
- **Rate limiting**: Per user/IP
- **Caching**: Redis for hot data (product catalog)
- **CDN**: Static assets on Vercel Edge
- **Async processing**: Webhooks → queue → workers

### Frontend
- **SSR**: Next.js App Router
- **ISR**: Product pages regenerated every 60s
- **Edge functions**: Geolocation-based routing
- **Image optimization**: Next.js Image component

---

## Integration Points

### Stripe Connect
- **Account creation**: Merchant onboarding
- **Payment splits**: Automatic via Split Engine
- **Payouts**: Scheduled or on-demand
- **Webhooks**: All payment events

### Carrier APIs (Future)
- **nShift**: Multi-carrier booking
- **Tracking**: Real-time updates
- **Label generation**: PDF/ZPL formats
- **Rate shopping**: Compare carriers

### Email/SMS
- **Twilio**: SMS OTP
- **SendGrid/Nodemailer**: Email OTP, receipts
- **Templates**: Transactional emails

---

## Monitoring & Observability

### Metrics to Track
- **Split Engine**: Total volume, average margins
- **Wallets**: Balance trends, payout velocity
- **Orders**: Conversion rate, AOV, fulfillment time
- **Shipments**: On-time delivery, carrier performance

### Logging
- **Structured logs**: JSON format
- **Log levels**: DEBUG, INFO, WARN, ERROR
- **Correlation IDs**: Track requests across services

### Alerts
- **Failed payments**: Immediate notification
- **Wallet imbalances**: Daily reconciliation
- **Shipment delays**: Customer notifications
- **Security events**: Suspicious login attempts

---

## Deployment

### Infrastructure
- **Frontend**: Vercel (Next.js)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (images, documents)
- **CDN**: Vercel Edge Network

### CI/CD
- **GitHub Actions**: Automated testing
- **Preview deployments**: Per PR
- **Production**: Main branch auto-deploy
- **Rollback**: One-click via Vercel

### Environment Variables
- **Development**: `.env.local`
- **Staging**: Vercel environment
- **Production**: Vercel environment (encrypted)

---

## Future Enhancements

### Phase 2: Advanced Features
- **Multi-currency**: Support EUR, USD, SEK
- **Tax calculation**: VAT, sales tax by region
- **Subscriptions**: Recurring orders
- **Inventory sync**: Real-time stock updates

### Phase 3: AI/ML
- **Demand forecasting**: Predict inventory needs
- **Route optimization**: ML-based routing
- **Fraud detection**: Anomaly detection
- **Personalization**: Product recommendations

### Phase 4: Blockchain (Optional)
- **Immutable ledger**: On-chain audit trail
- **Smart contracts**: Automated splits
- **NFT products**: Digital collectibles
- **Crypto payments**: BTC, ETH support

---

## Conclusion

GoalSquad is built for:
- **Scale**: Millions of orders per day
- **Trust**: Immutable audit trail
- **Fairness**: Transparent revenue splits
- **Speed**: Zero-friction UX

The architecture is modular, extensible, and ready for the future of commerce.
