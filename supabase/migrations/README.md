# `supabase/migrations/` — schema source of truth

## Rules

1. **Never edit a numbered migration after it has been applied to production.**
   If you need to change something, write a **new** numbered migration.

2. **Numbering convention:** `###_snake_case_description.sql`
   - Use zero-padded three-digit numbers.
   - The next free number is tracked by `scripts/check-schema-drift.ps1`.

3. **Every migration must be idempotent where possible:**
   - Use `CREATE TABLE IF NOT EXISTS`.
   - Use `ADD COLUMN IF NOT EXISTS`.
   - Use `DROP POLICY IF EXISTS ...; CREATE POLICY ...`.

4. **RLS in the same migration:** whenever a table is created, add
   `ENABLE ROW LEVEL SECURITY` and at least one policy before the file ends.

## Recent additions (audit-driven)

| #   | File                                      | Purpose                                        |
|-----|-------------------------------------------|------------------------------------------------|
| 097 | `097_fix_email_verification_sync.sql`     | Sync `profiles.is_verified` with auth state    |
| 098 | `098_warehouse_staff.sql`                 | `warehouse_staff` table + RLS                  |
| 099 | `099_warehouse_device_settings.sql`       | Printer/terminal columns on `warehouse_partners`|
| 100 | `100_seller_profiles_is_active.sql`       | `is_active` on `seller_profiles`               |
| 101 | `101_get_warehouse_flow_rpc.sql`          | Missing inventory columns + `get_warehouse_flow` RPC |
| 102 | `102_community_selected_products.sql`     | Capture existing `community_selected_products` |
| 103 | `103_warehouse_partners_community_link.sql`| `community_id` / `user_id` on `warehouse_partners` |
| 104 | `104_classes_hierarchy.sql`             | `classes` table + `seller_profiles.class_id` |
| 105 | `105_normalize_warehouse_inventory.sql`   | Converge inventory column variants               |

## Diagnostics

```bash
# Check for schema drift (code references vs migration definitions)
pwsh scripts/check-schema-drift.ps1

# Lint migrations for common issues
npx supabase db lint
```
