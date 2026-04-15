/**
 * Order MOQ Status API
 * GET /api/orders/[id]/moq-status
 * 
 * Check if order has items blocked by MOQ
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase.rpc('check_order_moq_blocking', {
      p_order_id: params.id,
    });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('MOQ status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check MOQ status' },
      { status: 500 }
    );
  }
}
