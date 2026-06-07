import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: `Order updated to ${status}` });
  } catch (error) {
    logger.apiError('PATCH', `/api/admin/orders/${params.id}/status`, error as Error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
