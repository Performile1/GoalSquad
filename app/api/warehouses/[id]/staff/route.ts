import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser, userHasRole } from '@/lib/api-auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';

async function authorize(req: NextRequest, warehouseId: string) {
  const authUser = await getAuthUser(req);
  if (!authUser) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  // Owner of this warehouse, or a platform admin.
  const { data: warehouse } = await supabaseAdmin
    .from('warehouse_partners')
    .select('user_id')
    .eq('id', warehouseId)
    .single();

  const isOwner = warehouse?.user_id === authUser.id;
  const isAdmin = await userHasRole(authUser.id, 'gs_admin');
  if (!isOwner && !isAdmin) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { authUser };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const warehouseId = params.id;
  try {
    const auth = await authorize(req, warehouseId);
    if ('error' in auth) return auth.error;

    const { data, error } = await supabaseAdmin
      .from('warehouse_staff')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ staff: data ?? [] });
  } catch (error) {
    logger.apiError('GET', '/api/warehouses/[id]/staff', error as Error, { warehouseId });
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

const staffSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  staff_role: z.enum(['picker', 'supervisor', 'warehouse_admin', 'driver']).default('picker'),
  pin_code: z.string().max(10).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const warehouseId = params.id;
  try {
    const auth = await authorize(req, warehouseId);
    if ('error' in auth) return auth.error;

    const body = await req.json();
    const data = staffSchema.parse(body);

    const { data: created, error } = await supabaseAdmin
      .from('warehouse_staff')
      .insert({
        warehouse_id: warehouseId,
        full_name: data.full_name,
        email: data.email || null,
        phone: data.phone || null,
        staff_role: data.staff_role,
        pin_code: data.pin_code || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ staff: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    logger.apiError('POST', '/api/warehouses/[id]/staff', error as Error, { warehouseId });
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const warehouseId = params.id;
  try {
    const auth = await authorize(req, warehouseId);
    if ('error' in auth) return auth.error;

    const staffId = req.nextUrl.searchParams.get('staffId');
    if (!staffId) return NextResponse.json({ error: 'Missing staffId' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('warehouse_staff')
      .delete()
      .eq('id', staffId)
      .eq('warehouse_id', warehouseId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.apiError('DELETE', '/api/warehouses/[id]/staff', error as Error, { warehouseId });
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
  }
}
