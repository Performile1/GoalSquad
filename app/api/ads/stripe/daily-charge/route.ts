import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export async function POST(request: NextRequest) {
  try {

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or system
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

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

    // Get user's Stripe customer ID and default payment method
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', ad.advertiser_id)
      .single();

    if (!userProfile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No payment method on file' }, { status: 400 });
    }

    // Get customer's default payment method
    const customer = await stripe.customers.retrieve(userProfile.stripe_customer_id);
    const paymentMethodId = (customer as Stripe.Customer).invoice_settings?.default_payment_method as string;

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'No default payment method' }, { status: 400 });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(chargeAmount * 100), // Convert to cents
      currency: 'sek',
      customer: userProfile.stripe_customer_id,
      payment_method: paymentMethodId,
      confirm: true,
      off_session: true,
      metadata: {
        adId: adId,
        userId: ad.advertiser_id,
        type: 'daily_charge',
      },
    });

    if (paymentIntent.status === 'succeeded') {
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
  } catch (error) {
    console.error('Error processing daily charge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
