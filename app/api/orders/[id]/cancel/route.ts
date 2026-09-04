import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getUserRole } from '@/lib/api-auth';
import { rateLimit } from '@/lib/rate-limit';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' as any })
  : null;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const orderId = params.id;
  const loggerContext = { route: `/api/orders/${orderId}/cancel`, method: 'POST' };

  try {
    const limit = rateLimit(request, 'order-cancel', 10);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many cancellation attempts' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } });

    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Hämta orderns nuvarande status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, status, shipment_status, stripe_payment_intent_id, payment_status, total_amount')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Kolla rättigheter (ägare eller admin)
    const userRole = await getUserRole(session.user.id);
    if (order.user_id !== session.user.id && !['admin', 'gs_admin'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Validera om ordern KAN avbrytas (får inte vara skickad eller redan avbruten)
    if (['shipped', 'delivered', 'picked', 'processing'].includes(order.shipment_status || '') || order.status === 'cancelled') {
      return NextResponse.json({ 
        error: 'Cannot cancel order. It has already been processed or shipped.' 
      }, { status: 400 });
    }

    if (order.stripe_payment_intent_id && order.payment_status === 'paid') {
      if (!stripe) return NextResponse.json({ error: 'Payment provider is not configured' }, { status: 503 });
      await stripe.refunds.create(
        { payment_intent: order.stripe_payment_intent_id },
        { idempotencyKey: `order-cancel-refund-${orderId}` }
      );
    }

    // 3. Uppdatera orderstatus till 'cancelled'
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled', payment_status: order.stripe_payment_intent_id ? 'refunded' : order.payment_status, updated_at: new Date().toISOString() })
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

    console.log(JSON.stringify({ level: 'info', message: `Order ${orderId} successfully cancelled by user`, ...loggerContext }));
    return NextResponse.json({ success: true, order: updatedOrder });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
