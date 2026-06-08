import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser, userHasRole } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const warehouseId = params.id;
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: warehouse } = await supabaseAdmin
      .from('warehouse_partners')
      .select('user_id')
      .eq('id', warehouseId)
      .single();

    const isOwner = warehouse?.user_id === authUser.id;
    const isStaffOrAdmin = await userHasRole(authUser.id, ['warehouse', 'gs_admin']);
    if (!isOwner && !isStaffOrAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const status = req.nextUrl.searchParams.get('status');
    let query = supabaseAdmin
      .from('warehouse_picking_tasks')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ tasks: data ?? [] });
  } catch (error) {
    logger.apiError('GET', '/api/warehouses/[id]/picking-tasks', error as Error, { warehouseId });
    return NextResponse.json({ error: 'Failed to fetch picking tasks' }, { status: 500 });
  }
}
