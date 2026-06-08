# Type Generation & RLS Policy Notes

## Generating TypeScript types from Supabase

```bash
# Using the Supabase CLI (recommended)
npx supabase gen types typescript --project-id <project-ref> --schema public > lib/database.types.ts

# Or against a local DB
npx supabase gen types typescript --local > lib/database.types.ts
```

After generating, re-export the types in `lib/supabase.ts` so they are available throughout the app:

```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export const supabase = createClient<Database>(url, key);
```

## RLS Policy hygiene checklist

- [ ] Every user-facing table has `ENABLE ROW LEVEL SECURITY`.
- [ ] Tables that should only be touched by the backend (e.g. `audit_logs`, `payout_analytics_rollup`) have a `service_role` policy and **no** `authenticated` write policy.
- [ ] The `public.spatial_ref_sys` table (PostGIS system table) is intentionally left without RLS; do **not** add policies to it unless the Supabase advisor specifically requires it for your security model.
- [ ] When adding new tables via migrations, always add RLS + at least one `authenticated` or `service_role` policy in the same migration.
- [ ] Run `supabase db lint` regularly to catch missing policies.

## Common pitfalls

1. `supabaseAdmin` bypasses RLS — use it only in API routes / server contexts.
2. Client-side `supabase` respects RLS — ensure SELECT policies exist or queries silently return empty arrays.
3. Avoid `FOR ALL` on sensitive tables; split into `FOR SELECT`, `FOR INSERT`, etc.
