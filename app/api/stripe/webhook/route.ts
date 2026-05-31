/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events:
 *   - checkout.session.completed  → confirm order, trigger SplitEngine
 *   - payment_intent.payment_failed → mark order as failed
 *   - charge.refunded              → mark order as refunded
 *
 * Configure in Stripe Dashboard:
 *   Webhook URL: https://<your-domain>/api/stripe/webhook
 *   Secret:      STRIPE_WEBHOOK_SECRET env var
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { SplitEngine } from '@/lib/split-engine';
import { Treasury } from '@/lib/treasury';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency: record the event id first. A duplicate (Stripe retry)
  // hits the PK unique violation and we ack immediately without reprocessing.
  const { error: dedupError } = await supabaseAdmin
    .from('stripe_events')
    .insert({ id: event.id, type: event.type });

  if (dedupError) {
    // 23505 = unique_violation → already processed; ack so Stripe stops retrying.
    if ((dedupError as any).code === '23505') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error('Failed to record stripe event:', dedupError);
    // Fall through and still attempt processing (handlers are idempotent).
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(pi);
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }
      default:
        // Ignore unhandled event types
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Webhook handler error for ${event.type}:`, error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    console.warn('checkout.session.completed: missing order_id in metadata');
    return;
  }

  // 1. Mark order as paid
  await supabaseAdmin
    .from('orders')
    .update({
      status: 'processing',
      payment_status: 'paid',
      metadata: {
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        paid_at: new Date().toISOString(),
      },
    })
    .eq('id', orderId);

    // 2. Run the atomic split engine (Postgres RPC). It creates ledger entries
    //    AND the seller/warehouse treasury holds in a single transaction, and is
    //    idempotent — safe even if this handler runs more than once.
    try {
      const splitResult = await SplitEngine.processOrderSplit(orderId);
      console.log(`Split processed for order ${orderId}:`, splitResult.splits);
    } catch (splitError) {
      console.error(`Split engine failed for order ${orderId}:`, splitError);
      // Do not re-throw — order is still paid, split can be retried manually
    }
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  // Find order by stripe_payment_intent stored in metadata
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id')
    .contains('metadata', { stripe_payment_intent: pi.id });

  for (const order of orders ?? []) {
    await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled', payment_status: 'failed' })
      .eq('id', order.id);
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;
  if (!paymentIntentId) return;

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id')
    .contains('metadata', { stripe_payment_intent: paymentIntentId });

  for (const order of orders ?? []) {
    await supabaseAdmin
      .from('orders')
      .update({ status: 'refunded', payment_status: 'refunded' })
      .eq('id', order.id);

    // Dispute/cancel any treasury holds for this order
    const { data: holds } = await supabaseAdmin
      .from('treasury_holds')
      .select('id')
      .eq('order_id', order.id)
      .eq('status', 'held');

    for (const hold of holds ?? []) {
      await Treasury.disputeHold(hold.id, 'Stripe charge refunded');
    }
  }
}
