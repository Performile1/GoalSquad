/**
 * Warehouses API
 * GET /api/warehouses
 * 
 * Get all consolidation warehouses
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    // The map is backed by the warehouse master data, not inventory rows.
    const { data, error } = await supabaseAdmin
      .from('consolidation_warehouses')
      .select('*');

    if (error) throw error;

    const demandResult = await supabaseAdmin
      .from('warehouse_demand_areas')
      .select('id, name, latitude, longitude, order_count, radius_km')
      .order('order_count', { ascending: false })
      .limit(50);

    const warehouses = (data || []).map((w: any) => ({
      id: w.id,
      name: w.name,
      code: w.code,
      city: w.city,
      postalCode: w.postal_code,
      latitude: parseFloat(w.latitude) || 0,
      longitude: parseFloat(w.longitude) || 0,
      postalCodeRanges: w.postal_code_ranges || [],
      coverageRadiusKm: w.coverage_radius_km,
      isActive: w.is_active,
      pendingOrders: w.pending_orders || 0,
      capacity: w.max_capacity_m3,
      utilization: w.utilization_percentage,
      errorRate: Number(w.error_rate ?? w.metadata?.error_rate ?? 0),
    }));

    return NextResponse.json({
      warehouses,
      demandAreas: demandResult.error ? [] : (demandResult.data || []),
    });
  } catch (error) {
    logger.apiError('GET', '/api/warehouses', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}
