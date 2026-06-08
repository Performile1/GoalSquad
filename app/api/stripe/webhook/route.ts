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
import { GamificationEngine } from '@/lib/gamification-engine';
import { logger } from '@/lib/logger';

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
    logger.webhookError('signature_verification', err, { message: err.message });
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
    logger.dbError('INSERT', 'stripe_events', dedupError, { eventId: event.id });
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
    logger.webhookError(event.type, error as Error, { eventId: event.id });
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    logger.warn('checkout.session.completed: missing order_id in metadata', { sessionId: session.id });
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
      logger.info('Split processed for order', { orderId, splits: splitResult.splits });

      // 3. Gamification + sales stats — ONLY on the first real split.
      //    The split RPC returns 'already_processed' on repeats (ledger guard),
      //    so gating on 'processed' keeps XP / total_sales increments idempotent
      //    even if Stripe redelivers the webhook.
      if (splitResult.status === 'processed') {
        await creditSellerForCompletedOrder(orderId);
      }
    } catch (splitError) {
      logger.paymentError('split_engine', orderId, splitError as Error, { sessionId: session.id });
      // Do not re-throw — order is still paid, split can be retried manually
    }
}

/**
 * Credits the seller for a completed order: bumps seller_profiles
 * total_sales/total_orders and awards XP via the gamification engine.
 *
 * Idempotency: callers must only invoke this when process_order_split
 * returned 'processed' (first time), so the increments run exactly once.
 *
 * NOTE: depends on orders.seller_id being set. Checkout does not yet
 * populate it (separate bug) — when absent we log and skip rather than guess.
 */
async function creditSellerForCompletedOrder(orderId: string) {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, seller_id, total_amount, shipping_country')
    .eq('id', orderId)
    .single();

  if (!order?.seller_id) {
    logger.warn('Order has no seller_id — skipping gamification credit', { orderId });
    return;
  }

  // Resolve the seller profile by user_id first, then by profile id.
  let { data: seller } = await supabaseAdmin
    .from('seller_profiles')
    .select('id, user_id, total_sales, total_orders')
    .eq('user_id', order.seller_id)
    .maybeSingle();

  if (!seller) {
    const byId = await supabaseAdmin
      .from('seller_profiles')
      .select('id, user_id, total_sales, total_orders')
      .eq('id', order.seller_id)
      .maybeSingle();
    seller = byId.data;
  }

  if (!seller) {
    logger.warn('No seller_profile found for order seller_id', { orderId });
    return;
  }

  const amount = Number(order.total_amount ?? 0);

  // Bump sales stats (leaderboard sorts on total_sales).
  await supabaseAdmin
    .from('seller_profiles')
    .update({
      total_sales: Number(seller.total_sales ?? 0) + amount,
      total_orders: Number(seller.total_orders ?? 0) + 1,
    })
    .eq('id', seller.id);

  // Award XP / streak / achievements.
  const isInternational = (order.shipping_country ?? 'SE') !== 'SE';
  await GamificationEngine.processSaleCompletion(seller.user_id, orderId, amount, isInternational);
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
