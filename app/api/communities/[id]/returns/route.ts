import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/api-auth';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const { data: returns, error } = await supabase
      .from('returns')
      .select(`
        id,
        return_number,
        status,
        refund_amount,
        orders!inner(order_number, customer_name, seller_id),
        sellers!inner(full_name),
        created_at,
        updated_at
      `)
      .eq('community_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedReturns = (returns || []).map((r: any) => ({
      id: r.id,
      returnNumber: r.return_number,
      orderNumber: r.orders?.order_number || '',
      sellerName: r.sellers?.full_name || '',
      customerName: r.orders?.customer_name || '',
      reason: 'Return requested',
      refundAmount: r.refund_amount || 0,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({ returns: formattedReturns });
  } catch (error) {
    console.error('Community returns API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
