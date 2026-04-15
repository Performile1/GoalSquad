# GoalSquad.shop - Complete Documentation Index

Welcome to GoalSquad! This index will guide you through all documentation.

---

## 🚀 Getting Started

**New to GoalSquad? Start here:**

1. **[QUICKSTART.md](QUICKSTART.md)** ⚡ (5 minutes)
   - Install dependencies
   - Set up Supabase
   - Run the platform
   - Test merchant onboarding

2. **[SETUP.md](SETUP.md)** 🔧 (15 minutes)
   - Detailed setup instructions
   - Environment configuration
   - Testing guide
   - Troubleshooting

3. **[README.md](README.md)** 📖 (10 minutes)
   - Project overview
   - Features and tech stack
   - Project structure
   - Roadmap

---

## 🏗️ Architecture & Design

**Understanding the system:**

4. **[ARCHITECTURE.md](ARCHITECTURE.md)** 🏛️
   - System overview
   - Data flow diagrams
   - The Split Engine deep dive
   - Distributed logistics
   - Security model
   - Scalability considerations

5. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** 📊
   - What we built
   - Project structure
   - Database schema
   - Tech stack
   - Key metrics
   - Design system

---

## 💻 Development

**For developers:**

6. **[API.md](API.md)** 📡
   - Complete API reference
   - Endpoint documentation
   - Request/response examples
   - Error codes
   - Testing with cURL

7. **Database Schema** 🗄️
   - See: `database/schema.sql`
   - 12 core tables
   - RLS policies
   - Triggers and functions
   - Initial data

---

## 📁 File Structure Reference

```
goalsquad/
│
├── 📖 Documentation
│   ├── INDEX.md              ← You are here
│   ├── QUICKSTART.md         ← Start here (5 min)
│   ├── SETUP.md              ← Detailed setup
│   ├── README.md             ← Main docs
│   ├── ARCHITECTURE.md       ← System design
│   ├── PROJECT_SUMMARY.md    ← Project overview
│   └── API.md                ← API reference
│
├── 🗄️ Database
│   └── schema.sql            ← Complete PostgreSQL schema
│
├── 🎨 Frontend (Next.js 14)
│   ├── app/
│   │   ├── page.tsx                    ← Landing page
│   │   ├── layout.tsx                  ← Root layout
│   │   ├── globals.css                 ← Global styles
│   │   ├── merchants/
│   │   │   ├── onboard/page.tsx        ← Merchant registration
│   │   │   └── [id]/products/new/page.tsx  ← Product upload
│   │   └── api/
│   │       ├── merchants/
│   │       │   ├── onboard/route.ts    ← POST /api/merchants/onboard
│   │       │   └── verify/route.ts     ← POST /api/merchants/verify
│   │       └── products/
│   │           └── create/route.ts     ← POST /api/products/create
│
├── 🧠 Business Logic
│   ├── lib/
│   │   ├── split-engine.ts             ← Triple-dip margin calculator
│   │   ├── audit-signature.ts          ← OTP & signature system
│   │   └── supabase.ts                 ← Supabase clients
│
├── ⚙️ Configuration
│   ├── package.json                    ← Dependencies
│   ├── tsconfig.json                   ← TypeScript config
│   ├── tailwind.config.ts              ← Tailwind config
│   ├── next.config.js                  ← Next.js config
│   ├── postcss.config.js               ← PostCSS config
│   ├── .env.example                    ← Environment template
│   └── .gitignore                      ← Git ignore rules
```

---

## 🎯 Quick Navigation

### By Role

**👨‍💼 Business/Product:**
- [README.md](README.md) - Overview and features
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - What we built
- [ARCHITECTURE.md](ARCHITECTURE.md) - How it works

**👨‍💻 Developer:**
- [QUICKSTART.md](QUICKSTART.md) - Get started fast
- [SETUP.md](SETUP.md) - Detailed setup
- [API.md](API.md) - API reference
- `database/schema.sql` - Database structure

**🎨 Designer:**
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Design system
- `app/page.tsx` - Landing page
- `app/globals.css` - Global styles
- `tailwind.config.ts` - Design tokens

**🚀 DevOps:**
- [SETUP.md](SETUP.md) - Deployment guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - Infrastructure
- `.env.example` - Environment variables

---

## 🔑 Key Concepts

### The Split Engine
**What**: Real-time revenue distribution system
**Where**: `lib/split-engine.ts`
**Docs**: [ARCHITECTURE.md](ARCHITECTURE.md#the-split-engine-deep-dive)

Triple-dip margins:
1. **Sales Margin**: (Retail - Merchant Base) × Quantity
2. **Handling Fee**: Fixed platform fee (25 NOK)
3. **Shipping Spread**: Customer Cost - Carrier Cost

### Audit Signatures
**What**: Immutable trust records with OTP verification
**Where**: `lib/audit-signature.ts`
**Docs**: [ARCHITECTURE.md](ARCHITECTURE.md#audit-signatures)

Every critical action creates:
- SHA-256 hash of entire record
- IP address, timestamp, user agent
- OTP verification (SMS or Email)

### Distributed Logistics
**What**: Multi-origin shipping with hub routing
**Where**: `database/schema.sql` (shipments, logistics_hubs)
**Docs**: [ARCHITECTURE.md](ARCHITECTURE.md#distributed-logistics)

Routing types:
- Direct: Merchant → Customer
- Hub Consolidation: Multiple merchants → Hub → Customer
- Multi-Origin: Complex routing

### GS1 Hybrid PIM
**What**: Product management with GS1 dimensions
**Where**: `database/schema.sql` (products table)
**Docs**: [README.md](README.md#gs1-hybrid-pim)

Supports:
- EAN-13 barcodes
- Platform SKUs (GS-XXXXX)
- Physical dimensions (weight, L×W×H)
- Volumetric weight calculation

---

## 📚 Learning Path

### Beginner (Day 1)
1. Read [QUICKSTART.md](QUICKSTART.md)
2. Set up local environment
3. Test merchant onboarding
4. Explore landing page code

### Intermediate (Week 1)
1. Read [ARCHITECTURE.md](ARCHITECTURE.md)
2. Study Split Engine code
3. Create test products
4. Understand database schema

### Advanced (Month 1)
1. Read [API.md](API.md)
2. Implement Stripe Connect
3. Build checkout flow
4. Deploy to production

---

## 🎓 Code Examples

### Create a Merchant (API)
```typescript
const response = await fetch('/api/merchants/onboard', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    merchantName: 'My Store',
    slug: 'my-store',
    email: 'merchant@example.com',
    // ... more fields
  })
})
```

### Process Order Split (Split Engine)
```typescript
import { SplitEngine } from '@/lib/split-engine'

const result = await SplitEngine.processOrderSplit(orderId)
console.log(result.splits)
// {
//   merchantPayout: 2000,
//   salesMargin: 1000,
//   handlingFee: 25,
//   shippingSpread: 20,
//   platformRevenue: 1045
// }
```

### Create Audit Signature
```typescript
import { AuditSignature } from '@/lib/audit-signature'

const result = await AuditSignature.initiateSignature({
  entityType: 'merchant',
  entityId: merchantId,
  action: 'onboarding',
  verificationMethod: 'otp_email',
  email: 'merchant@example.com'
})
```

---

## 🔍 Search Guide

**Looking for something specific?**

### Database
- Schema: `database/schema.sql`
- Tables: Search for `CREATE TABLE`
- Policies: Search for `CREATE POLICY`
- Functions: Search for `CREATE FUNCTION`

### API Endpoints
- All routes: `app/api/**/*.ts`
- Merchant onboarding: `app/api/merchants/onboard/route.ts`
- Product creation: `app/api/products/create/route.ts`

### Business Logic
- Split Engine: `lib/split-engine.ts`
- Signatures: `lib/audit-signature.ts`
- Supabase: `lib/supabase.ts`

### UI Components
- Landing page: `app/page.tsx`
- Onboarding form: `app/merchants/onboard/page.tsx`
- Product form: `app/merchants/[id]/products/new/page.tsx`

---

## 🐛 Troubleshooting

**Common issues and solutions:**

### Setup Issues
See: [SETUP.md](SETUP.md#troubleshooting)
- Database connection failed
- OTP not received
- Module not found errors

### API Errors
See: [API.md](API.md#error-codes)
- 400 Bad Request
- 401 Unauthorized
- 500 Internal Server Error

### Database Issues
See: [ARCHITECTURE.md](ARCHITECTURE.md#security-model)
- RLS policy errors
- Permission denied
- Foreign key violations

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

See: [SETUP.md](SETUP.md#deploy-to-production)

### Environment Variables
Required in production:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:
- Stripe keys
- Twilio credentials
- Email credentials

---

## 📊 Metrics & Analytics

### Business Metrics
- GMV (Gross Merchandise Value)
- Platform Revenue
- Merchant Payouts
- Average Order Value

See: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md#key-metrics-to-track)

### Technical Metrics
- API response time
- Database query performance
- Error rates
- Uptime

---

## 🤝 Contributing

### Code Style
- TypeScript for type safety
- ESLint for linting
- Prettier for formatting
- Conventional commits

### Pull Request Process
1. Create feature branch
2. Write tests
3. Update documentation
4. Submit PR
5. Code review
6. Merge to main

---

## 📞 Support

### Documentation
- Start with [QUICKSTART.md](QUICKSTART.md)
- Check [SETUP.md](SETUP.md) for setup issues
- Review [API.md](API.md) for API questions

### External Resources
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Tailwind Docs](https://tailwindcss.com/docs)

---

## 🎯 Roadmap

### Phase 1: MVP ✅ (Completed)
- Database schema
- Split Engine
- Merchant onboarding
- Product management

### Phase 2: Payments (Next)
- Stripe Connect integration
- Checkout flow
- Webhook handlers

### Phase 3: Logistics
- Carrier API integration
- Shipping labels
- Tracking

See: [README.md](README.md#roadmap)

---

## 📝 Changelog

### v1.0.0 (2024-04-15)
- Initial release
- Complete database schema
- Split Engine implementation
- Merchant onboarding flow
- Product management
- Audit signatures
- Frontend scaffold

---

**Ready to build? Start with [QUICKSTART.md](QUICKSTART.md)! 🚀**
