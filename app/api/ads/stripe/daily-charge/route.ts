import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { getProfile } from '@/lib/profile-helpers';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or system
    const profile = await getProfile(user.id, 'role');

    if (!profile || (profile.role !== 'gs_admin' && profile.role !== 'system')) {
      return NextResponse.json({ error: 'Only admins can process daily charges' }, { status: 403 });
    }

    const body = await request.json();
    const { adId } = body;

    if (!adId) {
      return NextResponse.json({ error: 'Missing ad ID' }, { status: 400 });
    }

    // Get ad details
    const { data: ad, error: adError } = await supabaseAdmin
      .from('ads')
      .select('*')
      .eq('id', adId)
      .single();

    if (adError || !ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    // Check if daily charge is needed
    const { data: shouldCharge } = await supabaseAdmin.rpc('should_charge_daily', { p_ad_id: adId });

    if (!shouldCharge) {
      return NextResponse.json({ success: true, message: 'No charge needed' });
    }

    // Calculate daily charge amount
    const { data: chargeAmount } = await supabaseAdmin.rpc('calculate_daily_charge_amount', { p_ad_id: adId });

    if (!chargeAmount || chargeAmount <= 0) {
      return NextResponse.json({ success: true, message: 'No charge amount' });
    }

    // Calculate current date for idempotency
    const chargeDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const amountCents = Math.round(chargeAmount * 100);

    // OPTIMISTIC LOCK: Attempt to insert pending charge record
    // If this fails with unique constraint violation, the ad has already been charged today
    let chargeRecordId: string | null = null;
    try {
      const { data: chargeRecord, error: insertError } = await supabaseAdmin
        .from('ad_daily_charges')
        .insert({
          ad_id: adId,
          charge_date: chargeDate,
          amount_cents: amountCents,
        })
        .select('id')
        .single();

      if (insertError) {
        // Check if it's a unique constraint violation (already charged today)
        if (insertError.code === '23505') {
          return NextResponse.json({ success: true, message: 'Already charged today' });
        }
        throw insertError;
      }

      chargeRecordId = chargeRecord.id;
    } catch (error) {
      logger.dbError('INSERT', 'ad_daily_charges', error, { adId, userId: user?.id });
      return NextResponse.json({ error: 'Failed to lock charge record' }, { status: 500 });
    }

    // Get user's Stripe customer ID and default payment method
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', ad.advertiser_id)
      .single();

    if (!userProfile?.stripe_customer_id) {
      // Clean up pending record since we can't proceed
      await supabaseAdmin.from('ad_daily_charges').delete().eq('id', chargeRecordId);
      return NextResponse.json({ error: 'No payment method on file' }, { status: 400 });
    }

    // Get customer's default payment method
    const customer = await stripe.customers.retrieve(userProfile.stripe_customer_id);
    const paymentMethodId = (customer as Stripe.Customer).invoice_settings?.default_payment_method as string;

    if (!paymentMethodId) {
      // Clean up pending record
      await supabaseAdmin.from('ad_daily_charges').delete().eq('id', chargeRecordId);
      return NextResponse.json({ error: 'No default payment method' }, { status: 400 });
    }

    // STRIPE IDEMPOTENCY: Use deterministic key based on ad_id and date
    const idempotencyKey = `adcharge_${adId}_${chargeDate}`;

    try {
      // Create payment intent with idempotency key
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: amountCents,
          currency: 'sek',
          customer: userProfile.stripe_customer_id,
          payment_method: paymentMethodId,
          confirm: true,
          off_session: true,
          metadata: {
            adId: adId,
            userId: ad.advertiser_id,
            type: 'daily_charge',
            chargeDate,
          },
        },
        {
          idempotencyKey,
        }
      );

      if (paymentIntent.status === 'succeeded') {
        // Update charge record with Stripe payment intent ID
        await supabaseAdmin
          .from('ad_daily_charges')
          .update({
            stripe_payment_intent_id: paymentIntent.id,
          })
          .eq('id', chargeRecordId);

        // Update ad with charge info
        await supabaseAdmin
          .from('ads')
          .update({
            last_daily_charge_date: new Date().toISOString(),
            total_daily_charged: (ad.total_daily_charged || 0) + chargeAmount,
          })
          .eq('id', adId);

        // Create transaction record
        await supabaseAdmin
          .from('ad_payment_transactions')
          .insert({
            ad_id: adId,
            transaction_type: 'daily_charge',
            amount: chargeAmount,
            currency: 'SEK',
            status: 'completed',
            stripe_payment_intent_id: paymentIntent.id,
            stripe_charge_id: paymentIntent.latest_charge as string,
            metadata: {
              charge_date: new Date().toISOString(),
            },
          });
      }

      return NextResponse.json({
        success: paymentIntent.status === 'succeeded',
        status: paymentIntent.status,
        amount: chargeAmount,
        paymentIntentId: paymentIntent.id,
      });
    } catch (stripeError: any) {
      // If Stripe fails completely, clean up pending record so it can be retried
      logger.paymentError('daily_charge', adId, stripeError, { userId: user?.id });
      await supabaseAdmin.from('ad_daily_charges').delete().eq('id', chargeRecordId);

      // If it's an idempotency error, the charge already succeeded
      if (stripeError.type === 'IdempotencyError') {
        return NextResponse.json({ success: true, message: 'Charge already processed' });
      }

      return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
    }
  } catch (error) {
    logger.apiError('POST', '/api/ads/stripe/daily-charge', error as Error, { userId: user?.id });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
