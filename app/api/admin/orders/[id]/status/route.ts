import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { validateParams, idParamSchema, validateBody } from '@/lib/validation';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum(['pending','paid','processing','ready_for_pickup','shipped','completed','cancelled','refunded']),
});

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const paramCheck = validateParams(params, idParamSchema);
    if ('error' in paramCheck) return paramCheck.error;
    const { id } = paramCheck.data;

    const bodyCheck = await validateBody(req, statusSchema);
    if ('error' in bodyCheck) return bodyCheck.error;
    const { status } = bodyCheck.data;

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: `Order updated to ${status}` });
  } catch (error) {
    logger.apiError('PATCH', `/api/admin/orders/${params.id}/status`, error as Error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
