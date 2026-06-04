import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    // Fetch entities from various tables
    const [communities, sellers, merchants, warehouses] = await Promise.all([
      supabaseAdmin.from('communities').select('id, name, type, created_at').limit(50),
      supabaseAdmin.from('seller_profiles').select('id, full_name, created_at').limit(50),
      supabaseAdmin.from('merchants').select('id, business_name, created_at').limit(50),
      supabaseAdmin.from('warehouse_partners').select('id, company_name, created_at').limit(50),
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
    logger.apiError('GET', '/api/admin/entities', error as Error);
    return NextResponse.json(
      { error: 'Misslyckades att hämta entiteter' },
      { status: 500 }
    );
  }
}
