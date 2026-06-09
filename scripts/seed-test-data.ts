/**
 * GoalSquad Test Data Seeder
 *
 * Creates a full test environment with:
 * - 2 test merchants with products
 * - 2 test warehouse partners
 * - 2 test communities (klubbar)
 * - 4 test sellers (2 per community)
 * - 2 active campaigns with products
 * - Gamification data (XP, achievements)
 * - Sample orders for treasury testing
 *
 * Run: npx tsx scripts/seed-test-data.ts
 * Requires: SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually (works without dotenv package)
function loadEnv(path: string) {
  try {
    const content = readFileSync(resolve(path), 'utf-8');
    for (const line of content.split('\n')) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch { /* ignore */ }
}
loadEnv('.env.local');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('Add them to .env.local or export as environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Fixed UUIDs for idempotent seeding
const USERS = {
  merchant1: '11111111-1111-1111-1111-111111111111',
  merchant2: '22222222-2222-2222-2222-222222222222',
  warehouse1: '33333333-3333-3333-3333-333333333333',
  warehouse2: '44444444-4444-4444-4444-444444444444',
  seller1: '55555555-5555-5555-5555-555555555555',
  seller2: '66666666-6666-6666-6666-666666666666',
  seller3: '77777777-7777-7777-7777-777777777777',
  seller4: '88888888-8888-8888-8888-888888888888',
  communityAdmin1: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  communityAdmin2: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  consumer1: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
};

async function createAuthUser(id: string, email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    id,
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error && !error.message.includes('already been registered')) {
    console.error(`Failed to create auth user ${email}:`, error.message);
    return null;
  }
  console.log(`  Auth user ${email} ready`);
  return data?.user ?? { id };
}

async function upsertProfile(id: string, role: string, fullName: string, extra: Record<string, any> = {}) {
  const { error } = await supabase.from('profiles').upsert({
    id,
    email: `${role}${id.slice(0, 4)}@test.goalsquad.shop`,
    full_name: fullName,
    role,
    is_active: true,
    is_verified: true,
    ...extra,
  }, { onConflict: 'id' });
  if (error) console.error(`  Profile upsert error for ${fullName}:`, error.message);
  else console.log(`  Profile ${fullName} ready`);
}

async function seed() {
  console.log('\n🌱 GoalSquad Test Data Seeder\n');

  // ─── 1. AUTH USERS ───
  console.log('1️⃣  Creating auth users...');
  await createAuthUser(USERS.merchant1, 'merchant1@test.goalsquad.shop', 'Test123!', 'GoalSquad Sports AB');
  await createAuthUser(USERS.merchant2, 'merchant2@test.goalsquad.shop', 'Test123!', 'Nordic Gear Oy');
  await createAuthUser(USERS.warehouse1, 'warehouse1@test.goalsquad.shop', 'Test123!', 'LogiCenter Stockholm');
  await createAuthUser(USERS.warehouse2, 'warehouse2@test.goalsquad.shop', 'Test123!', 'Fria Lager Malmö');
  await createAuthUser(USERS.seller1, 'seller1@test.goalsquad.shop', 'Test123!', 'Anna Svensson');
  await createAuthUser(USERS.seller2, 'seller2@test.goalsquad.shop', 'Test123!', 'Erik Johansson');
  await createAuthUser(USERS.seller3, 'seller3@test.goalsquad.shop', 'Test123!', 'Lisa Karlsson');
  await createAuthUser(USERS.seller4, 'seller4@test.goalsquad.shop', 'Test123!', 'Jonas Nilsson');
  await createAuthUser(USERS.communityAdmin1, 'admin1@test.goalsquad.shop', 'Test123!', 'IFK Göteborg Admin');
  await createAuthUser(USERS.communityAdmin2, 'admin2@test.goalsquad.shop', 'Test123!', 'Malmö FF Admin');
  await createAuthUser(USERS.consumer1, 'consumer1@test.goalsquad.shop', 'Test123!', 'Test Kund');

  // ─── 2. PROFILES ───
  console.log('\n2️⃣  Upserting profiles...');
  await upsertProfile(USERS.merchant1, 'merchant', 'GoalSquad Sports AB', { phone: '0701111111' });
  await upsertProfile(USERS.merchant2, 'merchant', 'Nordic Gear Oy', { phone: '0702222222' });
  await upsertProfile(USERS.warehouse1, 'warehouse', 'LogiCenter Stockholm', { phone: '0703333333' });
  await upsertProfile(USERS.warehouse2, 'warehouse', 'Fria Lager Malmö', { phone: '0704444444' });
  await upsertProfile(USERS.seller1, 'seller', 'Anna Svensson');
  await upsertProfile(USERS.seller2, 'seller', 'Erik Johansson');
  await upsertProfile(USERS.seller3, 'seller', 'Lisa Karlsson');
  await upsertProfile(USERS.seller4, 'seller', 'Jonas Nilsson');
  await upsertProfile(USERS.communityAdmin1, 'community', 'IFK Göteborg Admin');
  await upsertProfile(USERS.communityAdmin2, 'community', 'Malmö FF Admin');
  await upsertProfile(USERS.consumer1, 'user', 'Test Kund');

  // ─── 3. MERCHANTS ───
  console.log('\n3️⃣  Creating merchants...');
  const merchants = [
    { id: 'm1', user_id: USERS.merchant1, name: 'GoalSquad Sports AB', slug: 'goalsquad-sports', org_number: '5590011111', is_verified: true },
    { id: 'm2', user_id: USERS.merchant2, name: 'Nordic Gear Oy', slug: 'nordic-gear', org_number: '5590022222', is_verified: true },
  ];
  for (const m of merchants) {
    const { error } = await supabase.from('merchants').upsert(m, { onConflict: 'id' });
    if (error) console.error(`  Merchant error:`, error.message);
    else console.log(`  Merchant ${m.name} ready`);
  }

  // ─── 4. WAREHOUSE PARTNERS ───
  console.log('\n4️⃣  Creating warehouse partners...');
  const warehouses = [
    { id: 'w1', user_id: USERS.warehouse1, name: 'LogiCenter Stockholm', city: 'Stockholm', country: 'SE', capacity_m3: 5000, is_active: true },
    { id: 'w2', user_id: USERS.warehouse2, name: 'Fria Lager Malmö', city: 'Malmö', country: 'SE', capacity_m3: 3000, is_active: true },
  ];
  for (const w of warehouses) {
    const { error } = await supabase.from('warehouse_partners').upsert(w, { onConflict: 'id' });
    if (error) console.error(`  Warehouse error:`, error.message);
    else console.log(`  Warehouse ${w.name} ready`);
  }

  // ─── 5. COMMUNITIES ───
  console.log('\n5️⃣  Creating communities...');
  const communities = [
    { id: 'c1', owner_id: USERS.communityAdmin1, name: 'IFK Göteborg', slug: 'ifk-goteborg', city: 'Göteborg', country: 'SE', sport_type: 'Fotboll', member_count: 120 },
    { id: 'c2', owner_id: USERS.communityAdmin2, name: 'Malmö FF', slug: 'malmo-ff', city: 'Malmö', country: 'SE', sport_type: 'Fotboll', member_count: 85 },
  ];
  for (const c of communities) {
    const { error } = await supabase.from('communities').upsert(c, { onConflict: 'id' });
    if (error) console.error(`  Community error:`, error.message);
    else console.log(`  Community ${c.name} ready`);
  }

  // ─── 6. SELLER PROFILES ───
  console.log('\n6️⃣  Creating seller profiles...');
  const sellerProfiles = [
    { id: 'sp1', user_id: USERS.seller1, community_id: 'c1', shop_url: 'anna-shop', total_sales: 15000, total_orders: 12, total_commission: 750, streak_days: 5, current_level: 3, xp_total: 450 },
    { id: 'sp2', user_id: USERS.seller2, community_id: 'c1', shop_url: 'erik-shop', total_sales: 8200, total_orders: 8, total_commission: 410, streak_days: 3, current_level: 2, xp_total: 280 },
    { id: 'sp3', user_id: USERS.seller3, community_id: 'c2', shop_url: 'lisa-shop', total_sales: 22500, total_orders: 18, total_commission: 1125, streak_days: 7, current_level: 4, xp_total: 620 },
    { id: 'sp4', user_id: USERS.seller4, community_id: 'c2', shop_url: 'jonas-shop', total_sales: 5400, total_orders: 5, total_commission: 270, streak_days: 1, current_level: 1, xp_total: 120 },
  ];
  for (const sp of sellerProfiles) {
    const { error } = await supabase.from('seller_profiles').upsert(sp, { onConflict: 'id' });
    if (error) console.error(`  Seller profile error:`, error.message);
    else console.log(`  Seller profile ${sp.id} ready`);
  }

  // ─── 7. SELLER XP ───
  console.log('\n7️⃣  Creating seller XP records...');
  const xpRecords = [
    { seller_profile_id: 'sp1', current_xp: 180, current_level: 3, total_xp_earned: 450, multiplier_active: false, multiplier_value: 1.0 },
    { seller_profile_id: 'sp2', current_xp: 80, current_level: 2, total_xp_earned: 280, multiplier_active: true, multiplier_value: 1.5, multiplier_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
    { seller_profile_id: 'sp3', current_xp: 320, current_level: 4, total_xp_earned: 620, multiplier_active: false, multiplier_value: 1.0 },
    { seller_profile_id: 'sp4', current_xp: 20, current_level: 1, total_xp_earned: 120, multiplier_active: false, multiplier_value: 1.0 },
  ];
  for (const xp of xpRecords) {
    const { error } = await supabase.from('seller_xp').upsert(xp, { onConflict: 'seller_profile_id' });
    if (error) console.error(`  XP error:`, error.message);
    else console.log(`  XP for ${xp.seller_profile_id} ready`);
  }

  // ─── 8. PRODUCTS ───
  console.log('\n8️⃣  Creating products...');
    const products = [
    { id: '00000000-0000-0000-0000-000000000011', merchant_id: '00000000-0000-0000-0000-000000000001', title: 'GoalSquad Träningsjacka', name: 'GoalSquad Träningsjacka', description: 'Vind- och vattenavvisande jacka perfekt för träning i alla väder.', sku: 'GS-JACKA-001', ean: '7312345678901', category_id: '00000000-0000-0000-0000-000000000101', brand: 'GoalSquad', price: 699.00, base_price: 450.00, retail_price: 699.00, currency: 'SEK', weight_grams: 420, length_mm: 350, width_mm: 280, height_mm: 80, stock_quantity: 200, image_url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=600&q=80', tags: ['jacka','träning','sportkläder','vindtät'], status: 'active' },
    { id: '00000000-0000-0000-0000-000000000012', merchant_id: '00000000-0000-0000-0000-000000000001', title: 'GoalSquad Fotboll', name: 'GoalSquad Fotboll', description: 'FIFA-godkänd fotboll i premiumkvalitet.', sku: 'GS-BOLL-001', ean: '7312345678902', category_id: '00000000-0000-0000-0000-000000000102', brand: 'GoalSquad', price: 299.00, base_price: 180.00, retail_price: 299.00, currency: 'SEK', weight_grams: 450, length_mm: 220, width_mm: 220, height_mm: 220, stock_quantity: 150, image_url: 'https://images.unsplash.com/photo-1486286701208-11713a29d79c?w=600&q=80', tags: ['fotboll','matchboll','fifa'], status: 'active' },
    { id: '00000000-0000-0000-0000-000000000013', merchant_id: '00000000-0000-0000-0000-000000000001', title: 'GoalSquad Träningsbyxor', name: 'GoalSquad Träningsbyxor', description: 'Löparbyxor med reflexdetaljer.', sku: 'GS-BYXA-001', ean: '7312345678903', category_id: '00000000-0000-0000-0000-000000000101', brand: 'GoalSquad', price: 449.00, base_price: 280.00, retail_price: 449.00, currency: 'SEK', weight_grams: 320, length_mm: 300, width_mm: 250, height_mm: 50, stock_quantity: 180, image_url: 'https://images.unsplash.com/photo-1518600506278-4e8ef466b810?w=600&q=80', tags: ['byxor','löpning','reflex','sportkläder'], status: 'active' },
    { id: '00000000-0000-0000-0000-000000000014', merchant_id: '00000000-0000-0000-0000-000000000002', title: 'Nordic Vinterhandske', name: 'Nordic Vinterhandske', description: 'Värmeisolerade handskar för vinterträning.', sku: 'NG-HAND-001', ean: '7312345678904', category_id: '00000000-0000-0000-0000-000000000104', brand: 'Nordic Gear', price: 199.00, base_price: 120.00, retail_price: 199.00, currency: 'SEK', weight_grams: 180, length_mm: 250, width_mm: 150, height_mm: 40, stock_quantity: 300, image_url: 'https://images.unsplash.com/photo-1583416750470-965b6387ece4?w=600&q=80', tags: ['handskar','vinter','isolering','tillbehör'], status: 'active' },
    { id: '00000000-0000-0000-0000-000000000015', merchant_id: '00000000-0000-0000-0000-000000000002', title: 'Nordic Pannband', name: 'Nordic Pannband', description: 'Svettavvisande pannband i merinoull.', sku: 'NG-PANN-001', ean: '7312345678905', category_id: '00000000-0000-0000-0000-000000000104', brand: 'Nordic Gear', price: 149.00, base_price: 80.00, retail_price: 149.00, currency: 'SEK', weight_grams: 45, length_mm: 200, width_mm: 80, height_mm: 20, stock_quantity: 250, image_url: 'https://images.unsplash.com/photo-1576872381149-7847515ce5d8?w=600&q=80', tags: ['pannband','merino','ull','tillbehör'], status: 'active' },
    { id: '00000000-0000-0000-0000-000000000016', merchant_id: '00000000-0000-0000-0000-000000000002', title: 'Nordic Vattenflaska', name: 'Nordic Vattenflaska', description: 'BPA-fri flaska med dubbelväggsisolering.', sku: 'NG-FLAS-001', ean: '7312345678906', category_id: '00000000-0000-0000-0000-000000000103', brand: 'Nordic Gear', price: 99.00, base_price: 55.00, retail_price: 99.00, currency: 'SEK', weight_grams: 300, length_mm: 250, width_mm: 80, height_mm: 80, stock_quantity: 400, image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80', tags: ['flaska','vatten','isolering','träning'], status: 'active' },
  ];
  for (const p of products) {
    const { error } = await supabase.from('products').upsert(p, { onConflict: 'id' });
    if (error) console.error(`  Product error:`, error.message);
    else console.log(`  Product ${p.name} ready`);
  }

  // ─── 9. CAMPAIGNS ───
  console.log('\n9️⃣  Creating campaigns...');
  const now = new Date();
  const campaigns = [
    { id: 'camp1', community_id: 'c1', name: 'Vårkampanj 2025', description: 'Förbered dig för säsongen med våra bästa produkter!', start_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), end_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), status: 'active', target_amount: 50000 },
    { id: 'camp2', community_id: 'c2', name: 'Sommarträningskampanj', description: 'Allt du behöver för sommarträningen.', start_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), end_date: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(), status: 'active', target_amount: 75000 },
  ];
  for (const c of campaigns) {
    const { error } = await supabase.from('campaigns').upsert(c, { onConflict: 'id' });
    if (error) console.error(`  Campaign error:`, error.message);
    else console.log(`  Campaign ${c.name} ready`);
  }

  // ─── 10. CAMPAIGN PRODUCTS ───
  console.log('\n10️⃣ Creating campaign products...');
  const campaignProducts = [
    { id: 'cp1', campaign_id: 'camp1', product_id: 'p1', campaign_price: 599, moq_per_seller: 5, sort_order: 1 },
    { id: 'cp2', campaign_id: 'camp1', product_id: 'p2', campaign_price: 249, moq_per_seller: 10, sort_order: 2 },
    { id: 'cp3', campaign_id: 'camp1', product_id: 'p3', campaign_price: 399, moq_per_seller: 5, sort_order: 3 },
    { id: 'cp4', campaign_id: 'camp2', product_id: 'p4', campaign_price: 169, moq_per_seller: 15, sort_order: 1 },
    { id: 'cp5', campaign_id: 'camp2', product_id: 'p5', campaign_price: 129, moq_per_seller: 20, sort_order: 2 },
    { id: 'cp6', campaign_id: 'camp2', product_id: 'p6', campaign_price: 79, moq_per_seller: 20, sort_order: 3 },
  ];
  for (const cp of campaignProducts) {
    const { error } = await supabase.from('campaign_products').upsert(cp, { onConflict: 'id' });
    if (error) console.error(`  Campaign product error:`, error.message);
    else console.log(`  Campaign product ${cp.id} ready`);
  }

  // ─── 11. CAMPAIGN SELLERS ───
  console.log('\n11️⃣ Joining sellers to campaigns...');
  const campaignSellers = [
    { campaign_id: 'camp1', seller_id: 'sp1', status: 'active', campaign_sales: 8500, campaign_orders: 7 },
    { campaign_id: 'camp1', seller_id: 'sp2', status: 'active', campaign_sales: 4200, campaign_orders: 4 },
    { campaign_id: 'camp2', seller_id: 'sp3', status: 'active', campaign_sales: 12000, campaign_orders: 10 },
    { campaign_id: 'camp2', seller_id: 'sp4', status: 'active', campaign_sales: 2100, campaign_orders: 2 },
  ];
  for (const cs of campaignSellers) {
    const { error } = await supabase.from('campaign_sellers').upsert(cs, { onConflict: 'campaign_id, seller_id' });
    if (error) console.error(`  Campaign seller error:`, error.message);
    else console.log(`  Seller ${cs.seller_id} joined campaign ${cs.campaign_id}`);
  }

  // ─── 12. ACHIEVEMENTS ───
  console.log('\n12️⃣ Creating achievements...');
  const achievements = [
    { id: 'ach1', name: 'Första Försäljning', description: 'Genomför din första försäljning', icon_url: '/achievements/first-sale.png', rarity: 'common', xp_reward: 50 },
    { id: 'ach2', name: '10-Club', description: 'Sälj 10 produkter', icon_url: '/achievements/10-club.png', rarity: 'rare', xp_reward: 150 },
    { id: 'ach3', name: 'Streak Master', description: '7 dagars streak', icon_url: '/achievements/streak.png', rarity: 'epic', xp_reward: 300 },
    { id: 'ach4', name: 'Toppsäljare', description: 'Omsätt över 20 000 kr', icon_url: '/achievements/top-seller.png', rarity: 'legendary', xp_reward: 500 },
  ];
  for (const a of achievements) {
    const { error } = await supabase.from('achievements').upsert(a, { onConflict: 'id' });
    if (error) console.error(`  Achievement error:`, error.message);
    else console.log(`  Achievement ${a.name} ready`);
  }

  // ─── 13. USER ACHIEVEMENTS ───
  console.log('\n13️⃣ Awarding user achievements...');
  const userAchievements = [
    { user_id: USERS.seller1, achievement_id: 'ach1', unlocked_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
    { user_id: USERS.seller1, achievement_id: 'ach2', unlocked_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
    { user_id: USERS.seller3, achievement_id: 'ach1', unlocked_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
    { user_id: USERS.seller3, achievement_id: 'ach3', unlocked_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { user_id: USERS.seller3, achievement_id: 'ach4', unlocked_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  ];
  for (const ua of userAchievements) {
    const { error } = await supabase.from('user_achievements').upsert(ua, { onConflict: 'user_id, achievement_id' });
    if (error) console.error(`  User achievement error:`, error.message);
    else console.log(`  Achievement awarded to ${ua.user_id}`);
  }

  // ─── 14. XP EVENTS ───
  console.log('\n14️⃣ Creating XP events...');
  const xpEvents = [
    { user_id: USERS.seller1, event_type: 'sale_completed', xp_amount: 50, reference_id: 'ord-001', metadata: { product_name: 'Träningsjacka' } },
    { user_id: USERS.seller1, event_type: 'streak_bonus', xp_amount: 25, reference_id: 'streak-5', metadata: { days: 5 } },
    { user_id: USERS.seller3, event_type: 'sale_completed', xp_amount: 50, reference_id: 'ord-002', metadata: { product_name: 'Vinterhandske' } },
    { user_id: USERS.seller3, event_type: 'achievement_unlocked', xp_amount: 500, reference_id: 'ach4', metadata: { achievement: 'Toppsäljare' } },
  ];
  for (const xe of xpEvents) {
    const { error } = await supabase.from('xp_events').upsert(xe);
    if (error) console.error(`  XP event error:`, error.message);
    else console.log(`  XP event created`);
  }

  // ─── 15. TREASURY HOLDS ───
  console.log('\n15️⃣ Creating treasury holds...');
  const holds = [
    { order_id: 'ord-001', transaction_id: 'pi_test_001', holder_type: 'seller', holder_id: 'sp1', amount: 450, currency: 'SEK', hold_until: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'released' },
    { order_id: 'ord-002', transaction_id: 'pi_test_002', holder_type: 'seller', holder_id: 'sp3', amount: 620, currency: 'SEK', hold_until: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), status: 'held' },
    { order_id: 'ord-003', transaction_id: 'pi_test_003', holder_type: 'merchant', holder_id: 'm1', amount: 1200, currency: 'SEK', hold_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), status: 'held' },
  ];
  for (const h of holds) {
    const { error } = await supabase.from('treasury_holds').upsert(h);
    if (error) console.error(`  Treasury hold error:`, error.message);
    else console.log(`  Treasury hold ${h.order_id} ready`);
  }

  // ─── 16. COMMUNITY MEMBERS ───
  console.log('\n16️⃣ Creating community memberships...');
  const members = [
    { community_id: 'c1', user_id: USERS.seller1, role: 'seller', can_sell: true, status: 'active' },
    { community_id: 'c1', user_id: USERS.seller2, role: 'seller', can_sell: true, status: 'active' },
    { community_id: 'c2', user_id: USERS.seller3, role: 'seller', can_sell: true, status: 'active' },
    { community_id: 'c2', user_id: USERS.seller4, role: 'seller', can_sell: true, status: 'active' },
    { community_id: 'c1', user_id: USERS.consumer1, role: 'member', status: 'active' },
    { community_id: 'c2', user_id: USERS.consumer1, role: 'member', status: 'active' },
  ];
  for (const m of members) {
    const { error } = await supabase.from('community_members').upsert(m, { onConflict: 'community_id, user_id' });
    if (error) console.error(`  Member error:`, error.message);
    else console.log(`  Member ${m.user_id} in ${m.community_id} ready`);
  }

  console.log('\n✅ Seed complete!');
  console.log('\n📋 Test accounts:');
  console.log('  Merchants:    merchant1@test.goalsquad.shop / Test123!');
  console.log('                merchant2@test.goalsquad.shop / Test123!');
  console.log('  Sellers:      seller1@test.goalsquad.shop / Test123!');
  console.log('                seller2@test.goalsquad.shop / Test123!');
  console.log('                seller3@test.goalsquad.shop / Test123!');
  console.log('                seller4@test.goalsquad.shop / Test123!');
  console.log('  Warehouses:   warehouse1@test.goalsquad.shop / Test123!');
  console.log('                warehouse2@test.goalsquad.shop / Test123!');
  console.log('  Communities:  admin1@test.goalsquad.shop / Test123!');
  console.log('                admin2@test.goalsquad.shop / Test123!');
  console.log('  Consumer:     consumer1@test.goalsquad.shop / Test123!');
  console.log('\n🚀 Stripe sandbox setup required for payments — see docs/deployment/STRIPE_SANDBOX_SETUP.md');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
