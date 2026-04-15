# GoalSquad Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be ready (~2 minutes)
3. Go to **SQL Editor** in the Supabase dashboard
4. Copy the entire contents of `database/schema.sql`
5. Paste into the SQL Editor and click **Run**
6. Verify tables were created: Go to **Table Editor** and you should see:
   - organizations
   - merchants
   - products
   - orders
   - order_items
   - shipments
   - wallets
   - ledger_entries
   - signatures
   - logistics_hubs
   - split_configurations

### 3. Get Supabase Credentials

1. Go to **Settings** → **API** in Supabase
2. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`, keep this secret!)

### 4. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key

# Stripe (Optional for now)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio (Optional - for SMS OTP)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Email (Optional - for Email OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@goalsquad.shop
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Testing the Platform

### Test Merchant Onboarding

1. Go to [http://localhost:3000/merchants/onboard](http://localhost:3000/merchants/onboard)
2. Fill out the form:
   - Merchant Name: "Test Store"
   - Slug: "test-store"
   - Email: your@email.com
   - Address: Any valid address
   - Verification: Email OTP
3. Click "Continue to Verification"
4. **Check your terminal** - the OTP code will be printed there (since Twilio/email isn't configured yet)
5. Enter the 6-digit code
6. You should be redirected to the merchant dashboard

### Test Product Upload

1. After onboarding, go to: `/merchants/{merchant-id}/products/new`
2. Fill out product details:
   - Name: "Nike Air Max 90"
   - Base Price: 1000 NOK
   - Retail Price: 1500 NOK
   - Weight: 500g
   - Dimensions: 300mm × 200mm × 100mm
3. Click "Create Product"
4. The system will:
   - Generate a platform SKU (GS-XXXXX)
   - Calculate volumetric weight
   - Calculate chargeable weight
   - Store product with GS1 dimensions

### Verify Database

Go to Supabase **Table Editor**:

1. **organizations** - Should have 1 row (platform) + your merchant org
2. **merchants** - Should have your test merchant
3. **wallets** - Should have platform wallet + your merchant wallet
4. **products** - Should have your test product
5. **signatures** - Should have onboarding signature with OTP hash

---

## Understanding the Split Engine

### Example Transaction

Let's say a customer orders 2 units of your product:

```
Product:
- Base Price: 1000 NOK (what you get)
- Retail Price: 1500 NOK (what customer pays)
- Quantity: 2

Shipping:
- Customer pays: 80 NOK
- Carrier charges: 60 NOK

Split Calculation:
1. Sales Margin = (1500 - 1000) × 2 = 1000 NOK → Platform
2. Handling Fee = 25 NOK (fixed) → Platform
3. Shipping Spread = 80 - 60 = 20 NOK → Platform
4. Merchant Payout = 1000 × 2 = 2000 NOK → You

Total:
- Customer pays: 3080 NOK (3000 + 80 shipping)
- You receive: 2000 NOK
- Platform receives: 1045 NOK (1000 + 25 + 20)
- Carrier receives: 60 NOK
```

### Check Wallet Balances

```sql
-- In Supabase SQL Editor
SELECT 
  owner_type,
  owner_id,
  balance,
  currency
FROM wallets;
```

### Check Ledger Entries

```sql
-- In Supabase SQL Editor
SELECT 
  entry_type,
  amount,
  category,
  description,
  created_at
FROM ledger_entries
ORDER BY created_at DESC
LIMIT 20;
```

---

## Troubleshooting

### "Cannot find module" errors

These are expected before running `npm install`. The TypeScript errors will disappear once dependencies are installed.

### OTP not received

If you haven't configured Twilio/Email:
1. Check your terminal/console
2. The OTP will be printed there like: `[OTP Email] Sending to user@example.com: 123456`
3. Use that code for verification

### Database connection failed

1. Check your `.env.local` has correct Supabase URL and keys
2. Verify the Supabase project is running (not paused)
3. Check you ran the `schema.sql` script

### RLS Policy errors

If you get "permission denied" errors:
1. Make sure you're using the **service_role key** for admin operations
2. Check RLS policies in Supabase: **Authentication** → **Policies**
3. Verify the policies were created by the schema script

---

## Next Steps

### 1. Set Up Stripe Connect

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Enable **Stripe Connect** in your dashboard
3. Get your API keys: **Developers** → **API keys**
4. Add to `.env.local`
5. Implement Stripe Connect onboarding flow

### 2. Configure Email/SMS

**For Email (Nodemailer with Gmail):**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password  # Not your regular password!
```

To get Gmail App Password:
1. Go to Google Account settings
2. Security → 2-Step Verification
3. App passwords → Generate

**For SMS (Twilio):**
1. Sign up at [twilio.com](https://twilio.com)
2. Get a phone number
3. Copy Account SID and Auth Token
4. Add to `.env.local`

### 3. Deploy to Production

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables
```

### 4. Set Up Webhooks

**Stripe Webhooks:**
1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `account.updated`
4. Copy webhook secret to `.env.local`

---

## Production Checklist

Before going live:

- [ ] All environment variables set in Vercel
- [ ] Stripe Connect fully configured
- [ ] Email/SMS providers configured
- [ ] Database backups enabled in Supabase
- [ ] RLS policies tested
- [ ] Webhook endpoints secured
- [ ] Rate limiting implemented
- [ ] Error monitoring set up (Sentry)
- [ ] Analytics configured (PostHog/Mixpanel)
- [ ] Legal pages (Terms, Privacy Policy)
- [ ] GDPR compliance (if EU customers)

---

## Support

For questions or issues:
1. Check the [README.md](README.md)
2. Review [ARCHITECTURE.md](ARCHITECTURE.md)
3. Contact the development team

---

**Let's build the future of community commerce! 🚀**
