import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { id } = params;

    const { error } = await supabaseAdmin
      .from('sellers')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.apiError('POST', '/api/admin/sellers/[id]/deactivate', error as Error, { sellerId: params.id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
