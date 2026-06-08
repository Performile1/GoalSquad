/**
 * ============================================================
 * MIGRATION 099 — WAREHOUSE DEVICE SETTINGS
 * ============================================================
 *
 * Adds printer/label and pick-terminal configuration columns to
 * warehouse_partners so each hub can configure its own hardware.
 * ============================================================
 */

ALTER TABLE public.warehouse_partners
  ADD COLUMN IF NOT EXISTS label_format          VARCHAR(20) DEFAULT 'zpl',
  ADD COLUMN IF NOT EXISTS printer_ip            VARCHAR(64),
  ADD COLUMN IF NOT EXISTS auto_print_labels     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS terminal_pin_required BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS scan_confirmation     BOOLEAN DEFAULT true;
