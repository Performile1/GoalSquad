/**
 * E2E Integration Test: GoalSquad Campaign Ecosystem
 *
 * Verifies the unbroken flow:
 *   Merchant bulk upsert  ->  Warehouse campaign picking (idempotency lock)
 *
 * Run with the dev server running on NEXT_PUBLIC_APP_URL:
 *   npm run dev               # terminal 1
 *   npm run test:e2e          # terminal 2  (vitest run, no extra deps)
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in .env.local
 * (loaded automatically below). The test seeds the FK parent rows
 * (merchant, warehouse, campaign) and cleans everything up afterwards.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { SplitEngine } from '../../lib/split-engine';
import { GamificationEngine } from '../../lib/gamification-engine';

// --- Minimal .env loader (no dotenv dependency) -----------------------------
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const content = readFileSync(resolve(process.cwd(), file), 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
        if (!(key in process.env)) process.env[key] = value;
      }
    } catch {
      // file not present, ignore
    }
  }
}
loadEnv();

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Deterministic test UUIDs (seeded + cleaned up).
const TEST_MERCHANT_ID = '00000000-0000-0000-0000-0000000000a1';
const TEST_CAMPAIGN_ID = '00000000-0000-0000-0000-0000000000a2';
const TEST_WAREHOUSE_ID = '00000000-0000-0000-0000-0000000000a3';
const TEST_SKU = 'GOAL-COFFEE-E2E-01';

let admin: SupabaseClient;

describe('Campaign Ecosystem E2E', () => {
  beforeAll(async () => {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local.'
      );
    }
    admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    // Seed FK parents (idempotent upserts on fixed UUIDs).
    const seedErrors: string[] = [];

    const { error: mErr } = await admin
      .from('merchants')
      .upsert({ id: TEST_MERCHANT_ID, name: 'E2E Test Merchant' }, { onConflict: 'id' });
    if (mErr) seedErrors.push(`merchants: ${mErr.message}`);

    const { error: wErr } = await admin.from('consolidation_warehouses').upsert(
      {
        id: TEST_WAREHOUSE_ID,
        name: 'E2E Test Warehouse',
        address: 'Testgatan 1',
        city: 'Stockholm',
        postal_code: '11111',
      },
      { onConflict: 'id' }
    );
    if (wErr) seedErrors.push(`consolidation_warehouses: ${wErr.message}`);

    const { error: cErr } = await admin.from('campaigns').upsert(
      {
        id: TEST_CAMPAIGN_ID,
        title: 'E2E Test Campaign',
        slug: `e2e-test-campaign-${TEST_CAMPAIGN_ID}`,
      },
      { onConflict: 'id' }
    );
    if (cErr) seedErrors.push(`campaigns: ${cErr.message}`);

    if (seedErrors.length) {
      throw new Error(`Seeding failed:\n${seedErrors.join('\n')}`);
    }
  });

  afterAll(async () => {
    if (!admin) return;
    // Delete children before parents (FK order).
    await admin.from('warehouse_picking_tasks').delete().eq('campaign_id', TEST_CAMPAIGN_ID);
    await admin.from('products').delete().eq('merchant_id', TEST_MERCHANT_ID);
    await admin.from('campaigns').delete().eq('id', TEST_CAMPAIGN_ID);
    await admin.from('consolidation_warehouses').delete().eq('id', TEST_WAREHOUSE_ID);
    await admin.from('merchants').delete().eq('id', TEST_MERCHANT_ID);
  });

  // ===========================================================================
  // STEG 1: Merchant bulk upsert (idempotent on merchant_id,sku)
  // ===========================================================================
  it('performs an idempotent merchant bulk upsert', async () => {
    const payload = {
      merchantId: TEST_MERCHANT_ID,
      idempotencyKey: `TEST-KEY-${Date.now()}`,
      products: [
        { sku: TEST_SKU, name: 'Premium Gotlandskaffe', price: 150, stock: 1000 },
      ],
    };

    const first = await fetch(`${BASE_URL}/api/merchants/bulk/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const firstData = await first.json();
    expect(first.ok).toBe(true);
    expect(firstData.success).toBe(true);

    // Repeat -> upsert must not create a duplicate.
    const second = await fetch(`${BASE_URL}/api/merchants/bulk/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const secondData = await second.json();
    expect(secondData.success).toBe(true);

    const { count } = await admin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', TEST_MERCHANT_ID)
      .eq('sku', TEST_SKU);
    expect(count).toBe(1);
  });

  // ===========================================================================
  // STEG 2: Warehouse campaign picking with idempotency lock (23505)
  // ===========================================================================
  it('creates a picking task and blocks duplicates via picking_lock', async () => {
    const payload = {
      warehouseId: TEST_WAREHOUSE_ID,
      campaignId: TEST_CAMPAIGN_ID,
      itemsToPick: [{ sku: TEST_SKU, quantity: 150 }],
    };

    const first = await fetch(`${BASE_URL}/api/warehouses/picking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const firstData = await first.json();
    expect(firstData.success).toBe(true);
    expect(firstData.tasks?.[0]?.status).toBe('CREATED');

    // Same call again -> unique picking_lock must trigger ALREADY_EXISTS.
    const second = await fetch(`${BASE_URL}/api/warehouses/picking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const secondData = await second.json();
    expect(secondData.tasks?.[0]?.status).toBe('ALREADY_EXISTS');

    // Exactly one task exists in the DB.
    const { count } = await admin
      .from('warehouse_picking_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', TEST_CAMPAIGN_ID)
      .eq('sku', TEST_SKU);
    expect(count).toBe(1);
  });
});

// =============================================================================
// Helpers shared by the payment-flow suites below.
// =============================================================================
const PLATFORM_OWNER = '00000000-0000-0000-0000-000000000001';

function makeAdmin(): SupabaseClient {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local.');
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

async function getPlatformBalance(db: SupabaseClient): Promise<number> {
  const { data } = await db
    .from('wallets')
    .select('balance')
    .eq('owner_type', 'platform')
    .eq('owner_id', PLATFORM_OWNER)
    .maybeSingle();
  return Number(data?.balance ?? 0);
}

async function resetPlatformBalance(db: SupabaseClient, balance: number) {
  await db
    .from('wallets')
    .update({ balance })
    .eq('owner_type', 'platform')
    .eq('owner_id', PLATFORM_OWNER);
}

// =============================================================================
// STEG 3a: SplitEngine ledger idempotency (direct lib call, no dev server)
// =============================================================================
describe('SplitEngine ledger idempotency', () => {
  const ORDER_ID = '00000000-0000-0000-0000-0000000000b1';
  const SELLER_ID = '00000000-0000-0000-0000-0000000000b2';
  let db: SupabaseClient;
  let platformBalanceBefore = 0;

  beforeAll(async () => {
    db = makeAdmin();
    platformBalanceBefore = await getPlatformBalance(db);

    await db.from('orders').upsert(
      {
        id: ORDER_ID,
        order_number: `GS-SPLIT-${ORDER_ID.slice(-6)}`,
        seller_id: SELLER_ID,
        total_amount: 1000,
        total: 1000,
        currency: 'SEK',
        status: 'processing',
      },
      { onConflict: 'id' }
    );
    // Start from a clean ledger for this order.
    await db.from('ledger_entries').delete().eq('reference_id', ORDER_ID);
    await db.from('treasury_holds').delete().eq('order_id', ORDER_ID);
  });

  afterAll(async () => {
    if (!db) return;
    await db.from('ledger_entries').delete().eq('reference_id', ORDER_ID);
    await db.from('treasury_holds').delete().eq('order_id', ORDER_ID);
    await db.from('orders').delete().eq('id', ORDER_ID);
    await resetPlatformBalance(db, platformBalanceBefore);
  });

  it('processes once, then short-circuits without creating duplicate ledger rows', async () => {
    const first = await SplitEngine.processOrderSplit(ORDER_ID);
    expect(first.status).toBe('processed');

    const { count: afterFirst } = await db
      .from('ledger_entries')
      .select('id', { count: 'exact', head: true })
      .eq('reference_id', ORDER_ID);
    expect(afterFirst ?? 0).toBeGreaterThan(0);

    // Re-run: the Postgres ledger guard must short-circuit.
    const second = await SplitEngine.processOrderSplit(ORDER_ID);
    expect(second.status).toBe('already_processed');

    const { count: afterSecond } = await db
      .from('ledger_entries')
      .select('id', { count: 'exact', head: true })
      .eq('reference_id', ORDER_ID);
    expect(afterSecond).toBe(afterFirst);
  });
});

// =============================================================================
// STEG 3b: GamificationEngine awards XP (direct lib call)
// =============================================================================
describe('GamificationEngine sale completion', () => {
  const SELLER_UID = '00000000-0000-0000-0000-0000000000c1';
  let db: SupabaseClient;

  beforeAll(async () => {
    db = makeAdmin();
    await db.from('seller_profiles').upsert(
      {
        user_id: SELLER_UID,
        xp_total: 0,
        current_level: 1,
        total_sales: 0,
        total_orders: 0,
      },
      { onConflict: 'user_id' }
    );
  });

  afterAll(async () => {
    if (!db) return;
    await db.from('seller_profiles').delete().eq('user_id', SELLER_UID);
  });

  it('increases xp_total for a completed sale', async () => {
    await GamificationEngine.processSaleCompletion(SELLER_UID, 'order-gamification-test', 1000, false);

    const { data: profile } = await db
      .from('seller_profiles')
      .select('xp_total')
      .eq('user_id', SELLER_UID)
      .single();

    // baseXP = floor(orderAmount / 10) = 100
    expect(Number(profile?.xp_total ?? 0)).toBeGreaterThanOrEqual(100);
  });
});

// =============================================================================
// STEG 3c: Stripe webhook idempotency + leaderboard credit (HTTP)
// Requires the dev server running AND STRIPE_WEBHOOK_SECRET set to the same
// value the server uses. Skipped automatically when the secret is absent.
// =============================================================================
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

describe.skipIf(!WEBHOOK_SECRET)('Stripe webhook idempotency + leaderboard credit', () => {
  const ORDER_ID = '00000000-0000-0000-0000-0000000000d1';
  const SELLER_UID = '00000000-0000-0000-0000-0000000000d2';
  const EVENT_ID = `evt_e2e_${Date.now()}`;
  let db: SupabaseClient;
  let platformBalanceBefore = 0;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
    apiVersion: '2024-04-10' as any,
  });

  const eventPayload = JSON.stringify({
    id: EVENT_ID,
    object: 'event',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_e2e',
        object: 'checkout.session',
        metadata: { order_id: ORDER_ID },
      },
    },
  });

  function postEvent() {
    const header = stripe.webhooks.generateTestHeaderString({
      payload: eventPayload,
      secret: WEBHOOK_SECRET,
    });
    return fetch(`${BASE_URL}/api/stripe/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': header },
      body: eventPayload,
    });
  }

  beforeAll(async () => {
    db = makeAdmin();
    platformBalanceBefore = await getPlatformBalance(db);

    await db.from('seller_profiles').upsert(
      { user_id: SELLER_UID, xp_total: 0, current_level: 1, total_sales: 0, total_orders: 0 },
      { onConflict: 'user_id' }
    );
    await db.from('orders').upsert(
      {
        id: ORDER_ID,
        order_number: `GS-WH-${ORDER_ID.slice(-6)}`,
        seller_id: SELLER_UID,
        total_amount: 1000,
        total: 1000,
        currency: 'SEK',
        status: 'pending',
        shipping_country: 'SE',
      },
      { onConflict: 'id' }
    );
    await db.from('ledger_entries').delete().eq('reference_id', ORDER_ID);
    await db.from('treasury_holds').delete().eq('order_id', ORDER_ID);
    await db.from('stripe_events').delete().eq('id', EVENT_ID);
  });

  afterAll(async () => {
    if (!db) return;
    await db.from('ledger_entries').delete().eq('reference_id', ORDER_ID);
    await db.from('treasury_holds').delete().eq('order_id', ORDER_ID);
    await db.from('stripe_events').delete().eq('id', EVENT_ID);
    await db.from('orders').delete().eq('id', ORDER_ID);
    await db.from('seller_profiles').delete().eq('user_id', SELLER_UID);
    await resetPlatformBalance(db, platformBalanceBefore);
  });

  it('credits the seller once and blocks duplicate webhook deliveries', async () => {
    const first = await postEvent();
    expect(first.ok).toBe(true);

    const { data: afterFirst } = await db
      .from('seller_profiles')
      .select('total_sales, total_orders, xp_total')
      .eq('user_id', SELLER_UID)
      .single();
    expect(Number(afterFirst?.total_sales ?? 0)).toBe(1000);
    expect(Number(afterFirst?.total_orders ?? 0)).toBe(1);
    expect(Number(afterFirst?.xp_total ?? 0)).toBeGreaterThanOrEqual(100);

    // Redeliver the SAME event id -> stripe_events 23505 -> acked as duplicate.
    const second = await postEvent();
    const secondBody = await second.json();
    expect(secondBody.duplicate).toBe(true);

    // No double credit.
    const { data: afterSecond } = await db
      .from('seller_profiles')
      .select('total_sales, total_orders')
      .eq('user_id', SELLER_UID)
      .single();
    expect(Number(afterSecond?.total_sales ?? 0)).toBe(1000);
    expect(Number(afterSecond?.total_orders ?? 0)).toBe(1);
  });
});
