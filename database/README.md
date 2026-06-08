# `database/` — legacy / supplementary SQL

> **Source of truth is `supabase/migrations/`.** Do not run the scripts here to
> set up or reset a database — they predate the migration history and conflict
> with it (e.g. multiple incompatible `warehouse_inventory` definitions).

## What happened
This folder used to contain several full "setup" scripts that defined the
schema independently of `supabase/migrations/`. That dual source caused schema
drift and phantom-table bugs (see `docs/analysis/DATABASE_INTEGRITY_AUDIT.md`).

The redundant full-setup scripts were moved to `docs/legacy/`:

- `CLEAN_INSTALL.sql`, `COMPLETE_SETUP.sql`, `COMPLETE_MASTER_SETUP.sql`,
  `FINAL_COMPLETE_SETUP.sql`, `MASTER_SETUP.sql`, `PRODUCTION_READY.sql`,
  `VERIFIED_COMPLETE.sql`, `VERIFY_SETUP.sql`

## Remaining files
The feature-specific scripts still here (e.g. `product-flow-tracking.sql`,
`messaging-system.sql`) may contain views/functions not yet captured as
migrations. Before relying on any of them:

1. Check whether the object already exists in `supabase/migrations/`.
2. If it contains schema that is missing from migrations, extract it into a
   **new numbered migration** rather than running the file directly.

## Setting up a database
```bash
supabase db reset            # applies supabase/migrations in order
# or, against a remote project:
supabase db push
```

## Detecting drift
```powershell
pwsh scripts/check-schema-drift.ps1
```
