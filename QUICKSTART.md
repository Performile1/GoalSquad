# GoalSquad - 5-Minute Quickstart 🚀

## Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier is fine)

---

## Step 1: Install Dependencies (1 min)

```bash
npm install
```

---

## Step 2: Set Up Supabase (2 min)

### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and name: "goalsquad"
4. Set a strong database password
5. Choose region closest to you
6. Click "Create new project"
7. Wait ~2 minutes for setup

### Run Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Open `database/schema.sql` from this project
4. Copy ALL contents (Ctrl+A, Ctrl+C)
5. Paste into Supabase SQL Editor
6. Click **Run** (or F5)
7. You should see "Success. No rows returned"

### Verify Tables Created
1. Go to **Table Editor** in Supabase
2. You should see these tables:
   - organizations ✅
   - merchants ✅
   - products ✅
   - orders ✅
   - wallets ✅
   - ledger_entries ✅
   - signatures ✅
   - (and 5 more...)

---

## Step 3: Configure Environment (1 min)

### Get Supabase Credentials
1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (long string)
   - **service_role key**: `eyJhbG...` (different long string)

### Create .env.local
```bash
cp .env.example .env.local
```

### Edit .env.local
Open `.env.local` and paste your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your_service_role_key
```

**Note**: The other variables (Stripe, Twilio, Email) are optional for now.

---

## Step 4: Run Development Server (30 sec)

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in 2.3s
```

---

## Step 5: Test the Platform (30 sec)

### Open Browser
Go to [http://localhost:3000](http://localhost:3000)

You should see the **GoalSquad landing page** with:
- Hero section with animated background
- "Become a Merchant" button
- "Start Shopping" button
- Three feature cards (Split Engine, Distributed Logistics, Audit Trail)

### Test Merchant Onboarding
1. Click **"Become a Merchant"**
2. Fill out the form:
   - Merchant Name: "Test Store"
   - Slug: "test-store"
   - Email: your@email.com
   - Phone: +47 123 45 678
   - Address: Any valid address
   - Verification: **Email OTP**
3. Click **"Continue to Verification"**

### Get OTP Code
**Check your terminal** where `npm run dev` is running. You'll see:
```
[OTP Email] Sending to your@email.com: 123456
```

Copy the 6-digit code.

### Complete Verification
1. Enter the OTP code
2. Click **"Verify & Complete"**
3. You should be redirected to merchant dashboard

---

## ✅ Success!

You now have:
- ✅ GoalSquad running locally
- ✅ Database with all tables
- ✅ A verified merchant account
- ✅ A merchant wallet (balance: 0 NOK)

---

## Next Steps

### Add a Product
1. Go to: `http://localhost:3000/merchants/{merchant-id}/products/new`
   - (Replace `{merchant-id}` with your merchant ID from the URL)
2. Fill out product details:
   - Name: "Nike Air Max 90"
   - Base Price: 1000 NOK
   - Retail Price: 1500 NOK
   - Weight: 500g
   - Dimensions: 300mm × 200mm × 100mm
3. Click **"Create Product"**

### Check Database
Go to Supabase **Table Editor**:
- **merchants**: Your test merchant ✅
- **wallets**: Your merchant wallet ✅
- **products**: Your test product ✅
- **signatures**: Onboarding signature ✅

---

## Troubleshooting

### "Cannot connect to database"
- Check `.env.local` has correct Supabase URL
- Verify Supabase project is not paused
- Try restarting dev server

### "OTP not received"
- OTP is printed in terminal, not sent by email (unless you configure email provider)
- Look for `[OTP Email]` or `[OTP SMS]` in terminal output

### "Module not found" errors
- Run `npm install` again
- Delete `node_modules` and `.next` folders
- Run `npm install` and `npm run dev`

### TypeScript errors
- These are expected before `npm install`
- They will disappear after dependencies are installed

---

## What's Next?

### Phase 2: Payments
- Set up Stripe Connect
- Implement checkout flow
- Test the Split Engine with real payments

### Phase 3: Deploy
- Deploy to Vercel
- Configure production environment variables
- Set up custom domain

### Phase 4: Scale
- Add more merchants
- Integrate carrier APIs
- Build analytics dashboard

---

## Need Help?

- 📖 Read [README.md](README.md) for full documentation
- 🏗️ Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- 🔧 See [SETUP.md](SETUP.md) for detailed setup
- 📡 Review [API.md](API.md) for API reference

---

**You're ready to build the future of community commerce! 🎉**
