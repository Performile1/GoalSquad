/**
 * Split Shipment API
 * POST /api/orders/[id]/split-shipment
 * 
 * Create split shipments for order with MOQ blocking
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add permission check (user owns order)

    const { data, error } = await supabaseAdmin.rpc('create_split_shipments', {
      p_order_id: params.id,
      p_strategy: 'split_shipment',
    });

    if (error) throw error;

    if (!data.success) {
      return NextResponse.json(
        { error: data.error },
        { status: 400 }
      );
    }

    // TODO: Send notification to customer about split shipment

    return NextResponse.json(data);
  } catch (error) {
    console.error('Split shipment error:', error);
    return NextResponse.json(
      { error: 'Failed to create split shipment' },
      { status: 500 }
    );
  }
}
