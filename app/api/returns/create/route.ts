import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  const loggerContext = { route: '/api/returns/create', method: 'POST' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, reasonCategory, customerNote, items } = await request.json();
    // items förväntas vara en array: [{ orderItemId: string, quantity: number }]

    // 1. Verifiera att ordern existerar och tillhör användaren
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.user_id !== session.user.id && session.user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Spara huvudreturen (return_requests/returns)
    const { data: returnRequest, error: returnError } = await supabaseAdmin
      .from('returns')
      .insert({
        order_id: orderId,
        customer_id: order.user_id,
        status: 'pending',
        return_type: 'refund',
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (returnError) throw returnError;

    // 3. Strukturera och spara alla return_items
    const returnItemsPayload = items.map((item: any) => ({
      return_id: returnRequest.id,
      order_item_id: item.orderItemId,
      quantity_returned: item.quantity,
      status: 'pending'
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('return_items')
      .insert(returnItemsPayload);

    if (itemsError) throw itemsError;

    // 4. Skriv till Audit Log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'RETURN_REQUEST_CREATED',
      entity_type: 'returns',
      entity_id: returnRequest.id,
      changes: { before: null, after: { id: returnRequest.id, items_count: items.length } }
    });

    console.log(JSON.stringify({ level: 'info', message: `Return request ${returnRequest.id} created for order ${orderId}`, ...loggerContext }));

    return NextResponse.json({ 
      success: true, 
      returnRequestId: returnRequest.id,
      returnNumber: returnRequest.return_number
    });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
