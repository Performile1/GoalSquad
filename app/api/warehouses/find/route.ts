/**
 * Find Warehouse API
 * GET /api/warehouses/find?postalCode=11122
 * 
 * Find nearest warehouse by postal code
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const postalCode = searchParams.get('postalCode');
    const country = searchParams.get('country') || 'SE';

    if (!postalCode) {
      return NextResponse.json(
        { error: 'Postal code required' },
        { status: 400 }
      );
    }

    const { data: warehouseId, error } = await supabase.rpc('find_nearest_warehouse', {
      p_postal_code: postalCode,
      p_country: country,
    });

    if (error) throw error;

    if (!warehouseId) {
      return NextResponse.json(
        { error: 'No warehouse found' },
        { status: 404 }
      );
    }

    const { data: warehouse } = await supabase
      .from('consolidation_warehouses')
      .select('*')
      .eq('id', warehouseId)
      .single();

    return NextResponse.json({
      warehouse: {
        id: warehouse.id,
        name: warehouse.name,
        code: warehouse.code,
        city: warehouse.city,
        postalCode: warehouse.postal_code,
        processingDays: warehouse.processing_days,
      },
    });
  } catch (error) {
    console.error('Find warehouse error:', error);
    return NextResponse.json(
      { error: 'Failed to find warehouse' },
      { status: 500 }
    );
  }
}
