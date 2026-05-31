# Gemini Gap Analys - GoalSquad v2.0

**Datum:** 2026-05-31  
**Syfte:** Identifiera gap, duplicerad kod och förbättringsområden för prioritering  
**Omfattning:** Hela kodbasen (API, lib, frontend, migrations)

---

## 1. Duplicerad Kod

### 1.1 Profile Lookup (Hög prioritet)

**Problem:** Profile-lookup upprepas i 30+ API-rutter

**Exempel:**
```typescript
// Upprepat i 30+ filer
const { data: profile } = await supabaseAdmin
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();
```

**Filer:**
- `app/api/treasury/release/route.ts`
- `app/api/shipping/preferences/route.ts` (2 gånger)
- `app/api/goals/route.ts`
- `app/api/coordination/route.ts`
- `app/api/analytics/sales/route.ts`
- `app/api/ads/stripe/save-payment-method/route.ts` (2 gånger)
- `app/api/ads/[id]/refund/route.ts`
- `app/api/ads/stripe/daily-charge/route.ts`
- `app/api/ads/stripe/create-payment-intent/route.ts`
- ... och 20+ fler

**Lösning:**
```typescript
// lib/profile-helpers.ts
export async function getProfile(userId: string, fields = 'role') {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select(fields)
    .eq('id', userId)
    .single();
  return profile;
}
```

**Estimerad besparing:** 200+ rader kod

---

### 1.2 Stripe Customer & Payment Method (Medel prioritet)

**Problem:** Stripe customer retrieve + payment method extraction upprepas

**Exempel:**
```typescript
// Upprepat i 2 filer
const customer = await stripe.customers.retrieve(userProfile.stripe_customer_id);
const paymentMethodId = (customer as Stripe.Customer).invoice_settings?.default_payment_method as string;
```

**Filer:**
- `app/api/ads/stripe/daily-charge/route.ts`
- `app/api/ads/stripe/create-payment-intent/route.ts`

**Lösning:**
```typescript
// lib/stripe-helpers.ts
export async function getDefaultPaymentMethod(customerId: string): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId);
  return (customer as Stripe.Customer).invoice_settings?.default_payment_method as string || null;
}
```

---

### 1.3 Auth Header Validation (Låg prioritet)

**Problem:** Bearer token validering upprepas manuellt

**Exempel:**
```typescript
// Upprepat i 30+ filer
const authHeader = request.headers.get('authorization');
if (!authHeader) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
```

**Lösning:** Använd `getAuthUser()` från `lib/api-auth.ts` (redan existerar men ej utnyttjad fullt ut)

---

### 1.4 Console.error (Låg prioritet)

**Problem:** console.error överallt, ingen strukturerad loggning

**Filer med console.error:** 100+ filer

**Lösning:**
```typescript
// lib/logger.ts
export function logError(context: string, error: any, metadata?: any) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    context,
    error: error.message,
    stack: error.stack,
    metadata,
  }));
}
```

---

## 2. Saknade Funktioner

### 2.1 Checkout-validering (Kritisk)

**Status:** ✅ Implementerad  
**Risk:** Löst

**Implementerat:**
- Zod-scheman för request bodies
- UUID-validering för productId, communityProductId, warehouseId
- Integer-validering med min(1) för quantity
- Email-validering för shippingAddress.email
- String length-validering för postalCode (3-10 chars)
- ISO country code-validering (2 chars)

**Rekommendation:**
```typescript
// lib/validation/checkout.ts
import { z } from 'zod';

export const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
  })),
  shippingAddress: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().regex(/^\d{5}$/),
    country: z.string().default('SE'),
  }),
  paymentMethodId: z.string().uuid(),
});
```

---

### 2.2 Payout Implementation (Hög prioritet)

**Status:** Stub (ej implementerad)  
**Risk:** Communities kan inte ta ut pengar

**Saknas:**
- Stripe Connect onboarding
- Connected account creation
- Bank account verification
- Payout API integration

**Rekommendation:**
- Implementera Stripe Connect flow
- Lägg till `stripe_account_id` till `communities`
- Implementera `requestPayout` i `lib/treasury.ts`

---

### 2.3 GDPR Compliance (Medel prioritet)

**Status:** Delvis implementerad  
**Risk:** Legal compliance

**Saknas:**
- Right to delete (user data export + delete)
- Right to rectification (data update)
- Data export API

**Rekommendation:**
```typescript
// app/api/user/gdpr-export/route.ts
export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  
  // Export all user data
  const data = await exportUserData(auth.user.id);
  return NextResponse.json(data);
}
```

---

### 2.4 Enhetstestning (Hög prioritet)

**Status:** Ej implementerat  
**Risk:** Regression bugs

**Saknas:**
- Unit tests för lib-funktioner
- Integration tests för API-rutter
- E2E tests för kritiska flöden

**Rekommendation:**
- Lägg till Jest/Vitest
- Testa Split Engine
- Testa Treasury
- Testa Auth helpers

---

### 2.5 Loggning & Monitoring (Medel prioritet)

**Status:** Ad-hoc console.error  
**Risk:** Svårt att debugga i produktion

**Saknas:**
- Strukturerad loggning
- Correlation IDs
- Log aggregator (Datadog, Sentry)
- Metrics för kritiska flöden

**Rekommendation:**
- Implementera logger helper
- Lägg till correlation ID middleware
- Integrera med log aggregator

---

### 2.6 Rate Limiting (Medel prioritet)

**Status:** Ej implementerat  
**Risk:** DDoS, API abuse

**Saknas:**
- Rate limiting per user/IP
- Rate limiting per endpoint
- DDoS protection

**Rekommendation:**
- Implementera Redis-based rate limiting
- Lägg till rate limiting middleware

---

### 2.7 Multi-currency Support (Låg prioritet)

**Status:** SEK only  
**Risk:** Ej kritiskt för MVP

**Saknas:**
- Valutakonvertering
- Multi-currency checkout
- Stripe multi-currency

---

### 2.8 Tax Calculation (Låg prioritet)

**Status:** Ej implementerat  
**Risk:** Legal compliance vid expansion

**Saknas:**
- VAT per region
- Sales tax
- Tax reporting

---

## 3. Förbättringsområden

### 3.1 Type Safety (Medel prioritet)

**Problem:** `any` types används

**Exempel:**
```typescript
// app/api/ads/stripe/daily-charge/route.ts
} catch (stripeError: any) {
```

**Lösning:**
```typescript
catch (stripeError: Stripe.StripeError) {
```

---

### 3.2 Error Handling Consistency (Medel prioritet)

**Problem:** Inconsistent error responses

**Exempel:**
```typescript
// Vissa rutter
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// Andra rutter
return NextResponse.json({ success: false, message: 'No charge needed' });
```

**Lösning:**
```typescript
// lib/api-response.ts
export function apiError(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess(data: any) {
  return NextResponse.json({ success: true, ...data });
}
```

---

### 3.3 Code Organization (Låg prioritet)

**Problem:** Stora API-rutter, ingen separation

**Exempel:**
- `app/api/checkout/route.ts` - 60+ rader
- `app/api/ads/stripe/daily-charge/route.ts` - 200+ rader

**Lösning:**
- Extrahera business logic till lib
- Använd service pattern

---

### 3.4 Mobile App Integration (Låg prioritet)

**Status:** `mobile/` mapp existerar men ej integrerad  
**Risk:** Ej kritiskt för web MVP

**Saknas:**
- API endpoints för mobile
- Auth flow för mobile
- Push notifications

---

### 3.5 Documentation (Låg prioritet)

**Status:** Bra dokumentation men spridd  
**Risk:** Onboarding tid

**Saknas:**
- API documentation (OpenAPI/Swagger)
- Component documentation (Storybook)
- Architecture diagrams (uppdaterade)

---

## 4. Prioriteringsmatris

| Gap | Prioritet | Komplexitet | Impact | Tid |
|-----|-----------|-------------|--------|-----|
| Checkout-validering | Kritisk | Låg | Hög | 1-2 dagar |
| Payout implementation | Hög | Hög | Hög | 2-3 veckor |
| Enhetstestning | Hög | Medel | Hög | 1-2 veckor |
| Profile lookup refaktor | Medel | Låg | Medel | 1 dag |
| Loggning & monitoring | Medel | Medel | Medel | 1 vecka |
| GDPR compliance | Medel | Medel | Medel | 1 vecka |
| Rate limiting | Medel | Medel | Medel | 3-5 dagar |
| Stripe helper refaktor | Låg | Låg | Låg | 1 dag |
| Type safety | Låg | Låg | Låg | 2-3 dagar |
| Error handling consistency | Låg | Låg | Låg | 1 dag |
| Multi-currency | Låg | Hög | Låg | 2-3 veckor |
| Tax calculation | Låg | Hög | Låg | 2-3 veckor |

---

## 5. Rekommenderad Roadmap

### Sprint 1 (1-2 veckor) - Kritiska Gap

1. **Checkout-validering** (1-2 dagar)
   - Skapa zod-scheman
   - Implementera validering i checkout route
   - Testa edge cases

2. **Profile lookup refaktor** (1 dag)
   - Skapa `lib/profile-helpers.ts`
   - Uppdatera 30+ API-rutter
   - Testa

3. **Enhetstestning start** (3-5 dagar)
   - Sätt upp Jest/Vitest
   - Skapa tester för Split Engine
   - Skapa tester för Treasury
   - Skapa tester för Auth helpers

---

### Sprint 2 (2-3 veckor) - Hög Impact

1. **Loggning & monitoring** (1 vecka)
   - Implementera logger helper
   - Lägg till correlation ID middleware
   - Integrera med log aggregator

2. **Rate limiting** (3-5 dagar)
   - Implementera Redis-based rate limiting
   - Lägg till rate limiting middleware

3. **GDPR compliance** (1 vecka)
   - Implementera data export API
   - Implementera data delete API

---

### Sprint 3 (2-3 veckor) - Långsiktiga

1. **Payout implementation** (2-3 veckor)
   - Stripe Connect onboarding
   - Connected account creation
   - Payout API integration

2. **Multi-currency** (2-3 veckor)
   - Valutakonvertering
   - Multi-currency checkout

---

## 6. Kodkvalitetsmått

### Nuvarande status

| Metrik | Värde | Mål |
|--------|-------|-----|
| Duplicerad kod | ~500 rader | <50 rader |
| Test coverage | 0% | >70% |
| Type safety | ~20 `any` types | 0 `any` types |
| API endpoints | 122 | 122 |
| Migrationer | 70 | 70 |
| RLS policies | 100% coverage | 100% coverage |

### Mål

- **Kodduplication:** <50 rader (90% reduktion)
- **Test coverage:** >70% för kritiska paths
- **Type safety:** 0 `any` types
- **Error handling:** 100% consistent

---

## 7. Teknisk Skuld

### Hög skuld

- Checkout-validering saknas
- Payout ej implementerat
- Ingen enhetstestning

### Medel skuld

- Duplicerad kod (profile lookup)
- Ingen loggning/monitoring
- Ingen rate limiting

### Låg skuld

- Type safety (any types)
- Error handling consistency
- Mobile app ej integrerad

---

## 8. Sammanfattning

### Kritiska gap
1. **Checkout-validering** - Risk för invalid data
2. **Payout implementation** - Communities kan inte ta ut pengar
3. **Enhetstestning** - Risk för regression bugs

### Duplicerad kod
1. **Profile lookup** - 30+ upprepningar
2. **Stripe helpers** - 2 upprepningar
3. **Auth validation** - 30+ upprepningar

### Förbättringsområden
1. **Loggning & monitoring** - Svårt att debugga
2. **Rate limiting** - Risk för abuse
3. **Type safety** - Bättre dev experience

### Rekommenderad första steg
1. Implementera checkout-validering (1-2 dagar)
2. Refaktorera profile lookup (1 dag)
3. Sätt upp enhetstestning (3-5 dagar)

---

**Dokumentversion:** 1.0  
**Senast uppdaterad:** 2026-05-31  
**Nästa granskning:** Efter Sprint 1
