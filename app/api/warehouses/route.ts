/**
 * Warehouses API
 * GET /api/warehouses
 * 
 * Get all consolidation warehouses
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('warehouse_inventory')
      .select('*');

    if (error) throw error;

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
    }));

    return NextResponse.json({ warehouses });
  } catch (error) {
    console.error('Warehouses API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}
