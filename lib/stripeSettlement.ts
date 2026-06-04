import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function processCampaignSettlement(campaignId: string) {
  const { data: orders, error: fetchError } = await supabaseAdmin
    .from('orders')
    .select('id, payment_intent_id, total_amount, merchant_id, stripe_connect_account_id')
    .eq('campaign_id', campaignId)
    .eq('payment_status', 'authorized');

  if (fetchError || !orders) {
    console.error(`[CRITICAL] Kunde inte hämta ordrar för kampanj ${campaignId}:`, fetchError);
    return;
  }

  console.log(`[SETTLEMENT] Startar debitering för ${orders.length} ordrar i kampanj ${campaignId}`);

  for (const order of orders) {
    if (!order.payment_intent_id) {
      console.warn(`[WARN] Order ${order.id} saknar payment_intent_id. Skippar.`);
      continue;
    }

    try {
      const idempotencyKey = `capture_order_${order.id}_moq_success`;

      await stripe.paymentIntents.capture(order.payment_intent_id, {
        // application_fee_amount kan läggas till här för Stripe Connect
      }, {
        idempotencyKey: idempotencyKey
      });

      await supabaseAdmin
        .from('orders')
        .update({ 
          payment_status: 'paid',
          order_status: 'ready_for_picking',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      await supabaseAdmin.from('audit_logs').insert({
        actor_id: 'system-worker',
        action: 'order.stripe_capture_success',
        entity_type: 'order',
        entity_id: order.id,
        changes: { campaign_id: campaignId, amount: order.total_amount }
      });

    } catch (stripeError: any) {
      console.error(`[ERROR] Stripe Capture misslyckades för order ${order.id}:`, stripeError.message);
      
      await supabaseAdmin
        .from('orders')
        .update({ 
          payment_status: 'capture_failed',
          order_status: 'payment_issue',
          internal_notes: `Stripe Capture fel: ${stripeError.message}` 
        })
        .eq('id', order.id);
    }
  }

  await supabaseAdmin
    .from('community_campaigns')
    .update({ 
      processed_at: new Date().toISOString()
    })
    .eq('id', campaignId);
    
  console.log(`[SETTLEMENT] Kampanj ${campaignId} är nu helt stängd och avräknad.`);
}

export async function processCampaignVoid(campaignId: string) {
  const { data: orders, error: fetchError } = await supabaseAdmin
    .from('orders')
    .select('id, payment_intent_id')
    .eq('campaign_id', campaignId)
    .eq('payment_status', 'authorized');

  if (fetchError || !orders) {
    console.error(`[CRITICAL] Kunde inte hämta ordrar för void i kampanj ${campaignId}:`, fetchError);
    return;
  }

  console.log(`[VOID] Startar hävning av ${orders.length} ordrar i kampanj ${campaignId}`);

  for (const order of orders) {
    if (!order.payment_intent_id) {
      console.warn(`[WARN] Order ${order.id} saknar payment_intent_id. Skippar.`);
      continue;
    }

    try {
      const idempotencyKey = `void_order_${order.id}_moq_failed`;

      await stripe.paymentIntents.cancel(order.payment_intent_id, {
        idempotencyKey: idempotencyKey
      });

      await supabaseAdmin
        .from('orders')
        .update({ 
          payment_status: 'voided',
          order_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      await supabaseAdmin.from('audit_logs').insert({
        actor_id: 'system-worker',
        action: 'order.stripe_void_success',
        entity_type: 'order',
        entity_id: order.id,
        changes: { campaign_id: campaignId }
      });

    } catch (stripeError: any) {
      console.error(`[ERROR] Stripe Void misslyckades för order ${order.id}:`, stripeError.message);
      
      await supabaseAdmin
        .from('orders')
        .update({ 
          payment_status: 'void_failed',
          order_status: 'payment_issue',
          internal_notes: `Stripe Void fel: ${stripeError.message}` 
        })
        .eq('id', order.id);
    }
  }

  await supabaseAdmin
    .from('community_campaigns')
    .update({ 
      processed_at: new Date().toISOString()
    })
    .eq('id', campaignId);
    
  console.log(`[VOID] Kampanj ${campaignId} har alla ordrar hävda.`);
}
