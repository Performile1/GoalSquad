import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Fetch entities from various tables
    const [communities, sellers, merchants, warehouses] = await Promise.all([
      supabase.from('communities').select('id, name, type, created_at').limit(50),
      supabase.from('seller_profiles').select('id, full_name, created_at').limit(50),
      supabase.from('merchants').select('id, business_name, created_at').limit(50),
      supabase.from('warehouse_partners').select('id, company_name, created_at').limit(50),
    ]);

    const entities: any[] = [];

    // Map communities
    communities.data?.forEach((c: any) => {
      entities.push({
        id: c.id,
        name: c.name,
        type: c.type || 'community',
        status: 'active',
        sales: 0,
        orders: 0,
        lastLogin: c.created_at,
        reported: false,
      });
    });

    // Map sellers
    sellers.data?.forEach((s: any) => {
      entities.push({
        id: s.id,
        name: s.full_name || 'Säljare',
        type: 'seller',
        status: 'active',
        sales: 0,
        orders: 0,
        lastLogin: s.created_at,
        reported: false,
      });
    });

    // Map merchants
    merchants.data?.forEach((m: any) => {
      entities.push({
        id: m.id,
        name: m.business_name || 'Företag',
        type: 'company',
        status: 'active',
        sales: 0,
        orders: 0,
        lastLogin: m.created_at,
        reported: false,
      });
    });

    // Map warehouses
    warehouses.data?.forEach((w: any) => {
      entities.push({
        id: w.id,
        name: w.company_name || 'Lagerpartner',
        type: 'warehouse',
        status: 'active',
        sales: 0,
        orders: 0,
        lastLogin: w.created_at,
        reported: false,
      });
    });

    return NextResponse.json({ entities });
  } catch (error) {
    console.error('Entities error:', error);
    return NextResponse.json(
      { error: 'Misslyckades att hämta entiteter' },
      { status: 500 }
    );
  }
}
