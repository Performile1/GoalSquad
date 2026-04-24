import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/api-auth';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: warehouse, error } = await supabase
      .from('warehouse_partners')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !warehouse) return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });

    if (warehouse.user_id !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ warehouse });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    return NextResponse.json({ error: 'Failed to fetch warehouse' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: warehouse } = await supabase
      .from('warehouse_partners')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!warehouse || warehouse.user_id !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { data: updated, error } = await supabase
      .from('warehouse_partners')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ warehouse: updated });
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 });
  }
}
