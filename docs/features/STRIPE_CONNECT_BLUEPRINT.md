# Stripe Connect Blueprint - Express Onboarding

## Översikt
Detta dokument beskriver arkitekturen för Stripe Connect Express-integration för GoalSquad. Express är rekommenderat eftersom det minskar utvecklingstiden med 80% genom att Stripe sköter onboarding-gränssnittet, bankverifiering och identitetskontroller.

## Arkitektur

### 1. Connected Accounts
Varje community och säljare får ett Stripe Connected Account (Express-typ).

**Databas-schema:**
```sql
-- Lägg till i profiles-tabellen
ALTER TABLE profiles ADD COLUMN stripe_account_id TEXT;
ALTER TABLE profiles ADD COLUMN stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN stripe_payouts_enabled BOOLEAN DEFAULT FALSE;

-- Ny tabell för Stripe-konto-status
CREATE TABLE stripe_account_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL,
  onboarding_status TEXT, -- 'pending', 'completed', 'failed'
  payouts_enabled BOOLEAN DEFAULT FALSE,
  charges_enabled BOOLEAN DEFAULT FALSE,
  requirements JSONB, -- Stripe requirements object
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(stripe_account_id)
);
```

### 2. Onboarding Flow

**Steg 1: Initiera Connected Account (HÄRDAD)**
```typescript
// POST /api/stripe/connect/create-account
export async function createConnectedAccount(userId: string, businessType: 'individual' | 'company' = 'individual') {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'SE',
    capabilities: {
      transfers: { requested: true },
      card_payments: { requested: true },
    },
    business_type: businessType, // Dynamisk: stödjer både privatpersoner och företag
    business_profile: {
      url: 'https://goalsquad.se',
      mcc: '5734', // Computer software stores
    },
    settings: {
      payouts: {
        schedule: {
          interval: 'weekly',
          weekly_anchor: 5, // Fredag
        },
      },
    },
    metadata: {
      goalsquad_profile_id: userId, // Kritiskt för bakåtspårbarhet i Stripe Dashboard
      goalsquad_role: profile.role,
      goalsquad_entity_type: profile.entity_type || profile.role,
    },
  });

  // Spara stripe_account_id till profile
  await supabaseAdmin
    .from('profiles')
    .update({ 
      stripe_account_id: account.id,
      stripe_business_type: businessType,
    })
    .eq('id', userId);

  // Skapa post i stripe_account_status för spårbarhet
  await supabaseAdmin
    .from('stripe_account_status')
    .insert({
      profile_id: userId,
      stripe_account_id: account.id,
      onboarding_status: 'pending',
      payouts_enabled: false,
      charges_enabled: false,
      requirements: {},
    });

  return account;
}
```

**Steg 2: Generera Onboarding Link**
```typescript
// POST /api/stripe/connect/onboarding-link
export async function createOnboardingLink(accountId: string, returnUrl: string) {
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${returnUrl}/onboarding/refresh`,
    return_url: `${returnUrl}/onboarding/complete`,
    type: 'account_onboarding',
  });

  return link.url;
}
```

**Steg 3: Verifiera Onboarding Status (HÄRDAD)**
```typescript
// GET /api/stripe/connect/status/:accountId
export async function getAccountStatus(accountId: string, userId: string) {
  const account = await stripe.accounts.retrieve(accountId);

  const isComplete = 
    account.charges_enabled && 
    account.payouts_enabled &&
    !account.requirements?.currently_due?.length;

  // Uppdatera databas med korrekt profile_id (fix: userId parameter)
  await supabaseAdmin
    .from('stripe_account_status')
    .upsert({
      profile_id: userId, // Fix: Använd parameter istället för undefined
      stripe_account_id: accountId,
      onboarding_status: isComplete ? 'completed' : 'pending',
      payouts_enabled: account.payouts_enabled,
      charges_enabled: account.charges_enabled,
      requirements: account.requirements,
      last_synced_at: new Date().toISOString(),
    });

  // Uppdatera profile-tabellen också
  await supabaseAdmin
    .from('profiles')
    .update({
      stripe_onboarding_complete: isComplete,
      stripe_payouts_enabled: account.payouts_enabled,
    })
    .eq('id', userId);

  return {
    onboarding_complete: isComplete,
    payouts_enabled: account.payouts_enabled,
    charges_enabled: account.charges_enabled,
    requirements: account.requirements?.currently_due || [],
  };
}
```

### 3. Payout Flow (HÄRDAD - Idempotent)

**Automatiska Payouts med Idempotens-skydd**
```typescript
// Cron job: /api/cron/stripe-payouts
import { getWeek, getYear } from 'date-fns';

export async function processPayouts() {
  const currentYear = getYear(new Date());
  const currentWeek = getWeek(new Date());

  // 1. Hämta godkända konton
  const { data: accounts } = await supabaseAdmin
    .from('stripe_account_status')
    .select('profile_id, stripe_account_id')
    .eq('payouts_enabled', true);

  for (const account of accounts) {
    // 2. Använd DB-transaktion/RPC för att kontrollera saldo och låsa raden
    // Detta förhindrar race conditions om två instanser körs samtidigt
    const { data: wallet } = await supabaseAdmin
      .rpc('get_and_lock_wallet_for_payout', { p_profile_id: account.profile_id });

    if (!wallet || wallet.balance < 100) continue;

    // 3. Generera unik, deterministisk idempotensnyckel för denna vecka
    const idempotencyKey = `transfer_run_${currentYear}_w${currentWeek}_wallet_${wallet.id}`;

    try {
      // 4. Skapa överföringen med idempotensnyckel
      const transfer = await stripe.transfers.create({
        amount: Math.round(wallet.balance * 100), // Ören
        currency: 'sek',
        destination: account.stripe_account_id,
        metadata: {
          profile_id: account.profile_id,
          wallet_id: wallet.id,
          payout_run: `${currentYear}-W${currentWeek}`,
        },
      }, { idempotencyKey }); // Räddar vid nätverksfel

      // 5. Registrera i ledger och dra av saldot atomiskt
      await supabaseAdmin.rpc('execute_payout_deduction', {
        p_wallet_id: wallet.id,
        p_amount: wallet.balance,
        p_stripe_transfer_id: transfer.id,
      });

      // 6. Skapa payout-post för spårbarhet
      await supabaseAdmin.rpc('create_payout_record', {
        p_wallet_id: wallet.id,
        p_profile_id: account.profile_id,
        p_stripe_account_id: account.stripe_account_id,
        p_stripe_transfer_id: transfer.id,
        p_amount: wallet.balance,
        p_payout_run: `${currentYear}-W${currentWeek}`,
      });

    } catch (error) {
      // Logga strukturerat via JSON-logger
      logger.paymentError('stripe_payout_cron', transfer.id || 'unknown', error as Error, {
        profileId: account.profile_id,
        walletId: wallet.id,
        payoutRun: `${currentYear}-W${currentWeek}`,
      });
    }
  }
}
```

### 4. Webhook Hantering

**Stripe Connect Events**
```typescript
// POST /api/stripe/connect/webhook
export async function handleConnectWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'account.updated':
      const account = event.data.object as Stripe.Account;
      await syncAccountStatus(account);
      break;
    
    case 'account.external_account.created':
      // Bankkonto kopplat
      break;
    
    case 'payout.created':
    case 'payout.paid':
    case 'payout.failed':
      await handlePayoutEvent(event);
      break;
  }
}
```

## Säkerhetsöverväganden

### KYC/AML
- Stripe sköter KYC/AML verifiering automatiskt
- Onboarding-gränssnittet samlar in nödvändig dokumentation
- Stripe verifierar identitet och bankinformation

### IDOR Skydd
- Endast kontoinnehavaren kan se sin onboarding-status
- Payouts görs endast till verifierade konton
- Alla Stripe-anrop använder service_role key

### Payout Begränsningar
- Minimigräns för payout: 100 SEK
- Maximalt dagligt payout: 50,000 SEK
- Automatisk payout-schema: varje fredag

## Implementation Prioritering

### Fas 1: Grundläggande Integration (1-2 dagar)
1. Databas-migration för stripe_account_id
2. API endpoints för att skapa connected accounts
3. Onboarding link generation
4. Status verifiering

### Fas 2: Payout Automatisering (2-3 dagar)
1. Cron job för automatiska payouts
2. Ledger integration för payout-spårning
3. Webhook hantering för payout-events
4. Dashboard för payout-historik

### Fas 3: Avancerade Features (1-2 dagar)
1. Manuella payout requests
2. Payout paus/frys
3. Multi-currency support (om behövs)
4. Rapportering och analytics

## API Endpoints

```
POST   /api/stripe/connect/create-account
POST   /api/stripe/connect/onboarding-link
GET    /api/stripe/connect/status/:accountId
POST   /api/stripe/connect/refresh-link
GET    /api/stripe/connect/payouts/:profileId
POST   /api/stripe/connect/request-payout
POST   /api/stripe/connect/webhook
```

## Frontend Integration

### Onboarding Komponent
```typescript
// components/StripeOnboarding.tsx
export function StripeOnboarding() {
  const [status, setStatus] = useState<'pending' | 'completed' | 'failed'>('pending');

  const startOnboarding = async () => {
    const { data } = await fetch('/api/stripe/connect/onboarding-link', {
      method: 'POST',
    });
    window.location.href = data.url;
  };

  const checkStatus = async () => {
    const { data } = await fetch('/api/stripe/connect/status');
    setStatus(data.onboarding_complete ? 'completed' : 'pending');
  };

  return (
    <div>
      {status === 'pending' && (
        <button onClick={startOnboarding}>
          Start Onboarding
        </button>
      )}
      {status === 'completed' && (
        <div>Payouts enabled! You can now receive payments.</div>
      )}
    </div>
  );
}
```

## Testning

### Test Scenarios
1. Onboarding flow med test-data
2. Payout automatisk och manuell
3. Webhook event hantering
4. Felhantering (KYC failure, bank verification failed)

### Stripe Test Mode
- Använd Stripe test mode för utveckling
- Test med test-konton och test-bankkonton
- Simulera olika KYC-scenarios

## Monitoring

### Viktiga Metrics
- Onboarding completion rate
- Payout success rate
- Time to first payout
- Failed payout reasons

### Alerts
- KYC verification failures
- Payout failures
- High-value payouts (>10,000 SEK)
