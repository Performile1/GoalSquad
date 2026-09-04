# Profile Settings Audit

Updated: 2026-09-03

## Current coverage

| Profile | Existing settings | Missing or incomplete |
| --- | --- | --- |
| Admin | Platform fee, order limits, currency/language, maintenance, registration, API keys, seller margin, warehouse handling fee, payout delay, Stripe mode, gamification and leaderboard flags | Carrier/service-level tables, country-specific shipping rates, tax rules, payout approval workflow, audit history UI, notification templates |
| Warehouse | Partner identity, contact/address, territory/postal ranges, SLA, inbound/pallet/split prices, printer/terminal and integrations | Shipping carrier contracts, outbound rate cards, packaging surcharges, capacity/error thresholds, live utilization and demand aggregation management |
| Merchant | Business identity, contact/address, bank details, verification | Product-level shipping profile, carrier/service selection, merchant shipping price rules, free-shipping threshold, return shipping responsibility, delivery countries |
| Seller | Shop, address, bank/payout details, notification preferences | Seller delivery promise, pickup/shipping preference, commission visibility, payout schedule visibility, return policy acknowledgement |
| Community | Community identity and member/campaign settings | Shipping destination preferences, collection/delivery windows, settlement visibility and notification controls |
| Consumer | Addresses, orders, gamification and notification center | Payment method management, saved delivery preferences, product reviews, referrals and spending analytics |

## Recommended model

Use JSONB configuration owned by each profile for non-secret operational preferences:

- `platform_settings.metadata`: global defaults and policy switches
- `merchants.settings`: merchant shipping and return policy
- `warehouse_partners.settings`: warehouse rate card, carriers and capacity thresholds
- `seller_profiles.metadata`: seller delivery/payout preferences
- `communities.settings`: collection windows and delivery preferences

Secrets such as Stripe secret keys and carrier credentials must remain in Vercel/Supabase secrets or a dedicated encrypted integration store. They must not be editable in the browser.

## Open implementation TODOs

1. Add carrier/service-level rate-card tables and effective-date history.
2. Add a server-side shipping quote contract used by checkout.
3. Add admin approval/audit for changes to payout and margin rules.
4. Add warehouse capacity/error metrics as measured aggregates, not manual values.
5. Add profile-specific settings sections using the JSONB ownership above.
6. Add tests for authorization, persistence and checkout quote calculation.

The existing legacy setup SQL in `database/` and `docs/legacy/` is not a second source of truth. New schema changes belong in `supabase/migrations/` only.
