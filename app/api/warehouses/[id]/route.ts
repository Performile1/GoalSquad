import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';
import { validateParams, idParamSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  let warehouseId = params.id;
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const paramCheck = validateParams(params, idParamSchema);
    if ('error' in paramCheck) return paramCheck.error;
    warehouseId = paramCheck.data.id;

    const { data: warehouse, error } = await supabaseAdmin
      .from('warehouse_partners')
      .select('*')
      .eq('id', warehouseId)
      .single();

    if (error || !warehouse) return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });

    if (warehouse.user_id !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ warehouse });
  } catch (error) {
    logger.apiError('GET', '/api/warehouses/[id]', error as Error, { warehouseId });
    return NextResponse.json({ error: 'Failed to fetch warehouse' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  let warehouseId = params.id;
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const paramCheck = validateParams(params, idParamSchema);
    if ('error' in paramCheck) return paramCheck.error;
    warehouseId = paramCheck.data.id;

    const { data: warehouse } = await supabaseAdmin
      .from('warehouse_partners')
      .select('user_id')
      .eq('id', warehouseId)
      .single();

    if (!warehouse || warehouse.user_id !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { data: updated, error } = await supabaseAdmin
      .from('warehouse_partners')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', warehouseId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ warehouse: updated });
  } catch (error) {
    logger.apiError('PATCH', '/api/warehouses/[id]', error as Error, { warehouseId });
    return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 });
  }
}
