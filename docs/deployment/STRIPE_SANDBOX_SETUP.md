# Stripe Sandbox Setup för GoalSquad

## 1. Skapa Stripe-konto

1. Gå till [stripe.com](https://stripe.com) och skapa ett konto (gratis)
2. Växla till **Test mode** (toggle uppe till höger)
3. Notera dina testnycklar under [Developers → API keys](https://dashboard.stripe.com/test/apikeys):
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

## 2. Konfigurera miljövariabler

Lägg till följande i din `.env.local`:

```bash
# Stripe Test (Sandbox)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

> **VIKTIGT:** Använd aldrig `sk_live_` i development/test!

## 3. Stripe Connect (för utbetalningar)

För att testa utbetalningar till merchants, sellers och warehouse partners måste du sätta upp **Stripe Connect**:

1. I Stripe Dashboard, gå till **Settings → Connect**
2. Aktivera **Standard accounts** (eller Express om du vill ha mer kontroll)
3. Under **Settings → Connect → Branding**, fyll i:
   - Brand name: `GoalSquad Test`
   - Icon: Ladda upp en testlogga (valfritt)
   - Accent color: `#003B3D`

## 4. Testa onboarding av säljare/merchant

När en merchant eller seller vill ta emot betalningar, skickas de till Stripe Connect onboarding. I testläge kan du använda testdata:

| Fält | Testvärde |
|------|-----------|
| Email | `test@example.com` |
| Phone | `+46701234567` |
| Address | `Testgatan 1, 12345 Stockholm` |
| DOB | `01/01/1990` |
| Bank account | `SE` → `4000000000000002` (Visa debit) |
| Personnummer | `900101-1234` |

> Stripe accepterar alla Svenska personnummer i testläge. Använd ett giltigt format: `ÅÅMMDD-XXXX`.

## 5. Testkort för betalningar

Använd dessa kort i checkout:

| Kortnummer | Brand | Resultat |
|------------|-------|----------|
| `4242 4242 4242 4242` | Visa | Godkänd |
| `4000 0025 0000 0003` | Visa (debit) | Godkänd |
| `4000 0000 0000 9995` | Visa | Avböjd (`card_declined`) |
| `4000 0000 0000 9987` | Visa | Avböjd (`insufficient_funds`) |
| `4000 0000 0000 9979` | Visa | Avböjd (`lost_card`) |

- **CVC**: Vilken 3-siffrig kod som helst
- **Datum**: Vilken framtid som helst (t.ex. `12/30`)
- **ZIP**: `12345`

## 6. Testa utbetalningar (Payouts)

För att simulera utbetalningar:

1. Skapa en order via checkout (använd testkortet)
2. Vänta 30 dagar (eller ändra `treasury_holds.hold_until` i databasen till ett förflutet datum)
3. Anropa utbetalnings-API:t:

```bash
curl -X POST http://localhost:3000/api/cron/stripe-payouts \
  -H "Authorization: Bearer <service_role_key>"
```

Alternativt, använd Stripe Dashboard för att manuellt skapa en transfer:

```bash
# Via Stripe CLI (valfritt)
stripe transfers create \
  --amount 10000 \
  --currency sek \
  --destination <connected_account_id> \
  --description "Test payout GoalSquad"
```

## 7. Stripe CLI (valfritt men rekommenderat)

Installera Stripe CLI för att testa webhooks lokalt:

```bash
# Windows (PowerShell)
scoop install stripe

# Efter installering
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Kopiera `whsec_...` som skrivs ut och sätt den som `STRIPE_WEBHOOK_SECRET`.

## 8. Testa gamification-flödet

Efter en lyckad försäljning:

1. Kontrollera att `seller_xp` uppdateras (via trigger)
2. Kontrollera att `treasury_holds` skapas
3. Kör `/api/cron/stripe-payouts` efter att hold-perioden gått ut
4. Verifiera att XP, level och treasury uppdateras korrekt i säljarens dashboard

## 9. Rensa testdata

Om du behöver börja om:

```sql
-- Radera test-orders (kör i Supabase SQL Editor)
DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE created_at > '2025-01-01');
DELETE FROM orders WHERE created_at > '2025-01-01';
DELETE FROM treasury_holds WHERE order_id LIKE 'ord-%';
DELETE FROM xp_events WHERE reference_id LIKE 'ord-%';
DELETE FROM campaign_sellers WHERE campaign_id IN ('camp1', 'camp2');
DELETE FROM campaign_products WHERE campaign_id IN ('camp1', 'camp2');
DELETE FROM campaigns WHERE id IN ('camp1', 'camp2');
```

> **OBS:** Auth-användare (i `auth.users`) raderas inte automatiskt. Gör det manuellt i Supabase Auth Dashboard om nödvändigt.

## Snabbreferens

| Vad | URL/Verktyg |
|-----|-------------|
| Stripe Dashboard (Test) | https://dashboard.stripe.com/test/dashboard |
| API Keys | https://dashboard.stripe.com/test/apikeys |
| Connect Settings | https://dashboard.stripe.com/test/settings/connect |
| Webhooks | https://dashboard.stripe.com/test/webhooks |
| Testkort | https://docs.stripe.com/testing#cards |
