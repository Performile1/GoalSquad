/**
 * ============================================================
 * MIGRATION 094 — SYNC orders.total <-> orders.total_amount
 * ============================================================
 *
 * Context: The codebase migrated to total_amount but some legacy
 * inserts still write to `total`. This migration:
 * 1. Ensures total_amount column exists
 * 2. Syncs any missing data from total -> total_amount
 * 3. Installs a trigger so future writes to either column
 *    automatically mirror to the other.
 * ============================================================
 */

-- 1. Ensure total_amount exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN total_amount DECIMAL(10,2);
  END IF;
END $$;

-- 2. Backfill total_amount from total where null
UPDATE public.orders
SET total_amount = total
WHERE total_amount IS NULL AND total IS NOT NULL;

-- 3. Backfill total from total_amount where null
UPDATE public.orders
SET total = total_amount
WHERE total IS NULL AND total_amount IS NOT NULL;

-- 4. Create trigger function to keep columns in sync
CREATE OR REPLACE FUNCTION sync_order_total_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.total IS DISTINCT FROM OLD.total AND NEW.total_amount IS DISTINCT FROM NEW.total THEN
      NEW.total_amount := NEW.total;
    ELSIF NEW.total_amount IS DISTINCT FROM OLD.total_amount AND NEW.total IS DISTINCT FROM NEW.total_amount THEN
      NEW.total := NEW.total_amount;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach trigger
DROP TRIGGER IF EXISTS sync_order_total ON public.orders;
CREATE TRIGGER sync_order_total
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_order_total_columns();
