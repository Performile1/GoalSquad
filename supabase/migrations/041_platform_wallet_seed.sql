/**
 * ============================================================
 * MIGRATION 041 — PLATFORM WALLET SEED
 * ============================================================
 * Creates the platform wallet required by SplitEngine for revenue collection.
 * Owner type: 'platform'
 * Owner ID: '00000000-0000-0000-0000-000000000001' (reserved platform ID)
 * Currency: SEK
 * ============================================================
 */

-- Create platform wallet if not exists
INSERT INTO public.wallets (
  id,
  owner_type,
  owner_id,
  balance,
  currency,
  metadata,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'platform',
  '00000000-0000-0000-0000-000000000001'::UUID,
  0,
  'SEK',
  '{"description": "GoalSquad platform revenue wallet", "type": "platform"}'::JSONB,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN RAISE NOTICE 'Migration 041: platform wallet seeded'; END $$;
