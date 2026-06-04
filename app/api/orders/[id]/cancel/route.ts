import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const orderId = params.id;
  const loggerContext = { route: `/api/orders/${orderId}/cancel`, method: 'POST' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Hämta orderns nuvarande status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, status, shipment_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Kolla rättigheter (ägare eller admin)
    if (order.user_id !== session.user.id && session.user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Validera om ordern KAN avbrytas (får inte vara skickad eller redan avbruten)
    if (['shipped', 'delivered', 'picked', 'processing'].includes(order.shipment_status || '') || order.status === 'cancelled') {
      return NextResponse.json({ 
        error: 'Cannot cancel order. It has already been processed or shipped.' 
      }, { status: 400 });
    }

    // 3. Uppdatera orderstatus till 'cancelled'
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 4. Skriv händelsen till vår Immutable Audit Log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'ORDER_CANCELLED',
      entity_type: 'orders',
      entity_id: orderId,
      changes: {
        before: { status: order.status },
        after: { status: 'cancelled' }
      }
    });

    // TODO: Här integreras Stripe Refund-anrop i framtiden baserat på order.stripe_payment_intent_id

    console.log(JSON.stringify({ level: 'info', message: `Order ${orderId} successfully cancelled by user`, ...loggerContext }));
    return NextResponse.json({ success: true, order: updatedOrder });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
