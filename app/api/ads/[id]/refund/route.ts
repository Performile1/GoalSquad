import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reason, rejectAd } = body;

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'gs_admin') {
      return NextResponse.json({ error: 'Only admins can process refunds' }, { status: 403 });
    }

    // Get ad details
    const { data: ad, error: adError } = await supabaseAdmin
      .from('ads')
      .select('*')
      .eq('id', params.id)
      .single();

    if (adError || !ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    // Check if ad is eligible for refund
    if (ad.payment_type !== 'advance' || ad.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Ad is not eligible for refund' }, { status: 400 });
    }

    if (ad.payment_status === 'refunded' || ad.payment_status === 'partial_refund') {
      return NextResponse.json({ error: 'Ad has already been refunded' }, { status: 400 });
    }

    // Get admin fee configuration
    const { data: feeConfig } = await supabaseAdmin
      .from('admin_fee_config')
      .select('fee_percent, fixed_fee')
      .eq('fee_type', 'ad_rejection')
      .eq('is_active', true)
      .single();

    const adminFeePercent = feeConfig?.fee_percent || 5;
    const fixedFee = feeConfig?.fixed_fee || 50;

    // Calculate refund amount with admin fee deduction
    const { data: refundAmount } = await supabaseAdmin.rpc('calculate_refund_amount', {
      p_paid_amount: ad.discounted_price,
      p_admin_fee_percent: adminFeePercent,
      p_fixed_fee: fixedFee,
    });

    // Update ad status
    const { error: updateError } = await supabaseAdmin
      .from('ads')
      .update({
        payment_status: 'refunded',
        refund_amount: refundAmount,
        refund_date: new Date().toISOString(),
        refund_reason: reason,
        approval_status: rejectAd ? 'rejected' : ad.approval_status,
      })
      .eq('id', params.id);

    if (updateError) throw updateError;

    // Create refund transaction record
    const { error: transactionError } = await supabaseAdmin
      .from('ad_payment_transactions')
      .insert({
        ad_id: ad.id,
        transaction_type: 'refund',
        amount: refundAmount,
        currency: 'SEK',
        status: 'completed',
        metadata: {
          original_amount: ad.discounted_price,
          admin_fee_percent: adminFeePercent,
          fixed_fee: fixedFee,
          refund_reason: reason,
        },
      });

    if (transactionError) throw transactionError;

    // Note: In production, you would also process the actual Stripe refund here
    // using the stripe_payment_intent_id stored in the ad record

    return NextResponse.json({ 
      success: true, 
      refundAmount,
      adminFee: ad.discounted_price - refundAmount,
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
