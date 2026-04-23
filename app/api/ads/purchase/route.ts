import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

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

    const body = await request.json();
    const {
      placement_id,
      title,
      description,
      image_url,
      link_url,
      alt_text,
      purchase_type,
      purchased_quantity,
      price_paid,
      start_date,
      end_date,
      max_views,
      max_clicks,
      placement_type,
      daily_view_limit,
      link_type,
      internal_link_path,
      auto_restart_next_day,
      button_config,
      payment_type,
      advance_discount_percent,
      save_card_for_daily_charges,
      daily_charge_limit,
      stripe_payment_method_id,
      company_name,
      company_description,
      company_website,
      backlink_url,
    } = body;

    // Validate required fields
    if (!placement_id || !title || !image_url || !link_url || !purchase_type || !purchased_quantity || !price_paid || !start_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate company description
    if (!company_description || company_description.length < 50) {
      return NextResponse.json({ error: 'Company description must be at least 50 characters' }, { status: 400 });
    }

    // Calculate discount if advance payment
    let originalPrice = price_paid;
    let discountedPrice = price_paid;
    let discountPercent = advance_discount_percent || 10;

    if (payment_type === 'advance') {
      const { data: discountResult } = await supabaseAdmin.rpc('calculate_discounted_price', {
        p_original_price: price_paid,
        p_discount_percent: discountPercent,
      });
      discountedPrice = discountResult;
    }

    // Create ad
    const { data: ad, error: adError } = await supabaseAdmin
      .from('ads')
      .insert({
        advertiser_id: user.id,
        title,
        description,
        image_url,
        link_url,
        alt_text,
        purchase_type,
        purchased_quantity,
        price_paid: discountedPrice,
        placement_id,
        start_date,
        end_date,
        max_views,
        max_clicks,
        placement_type,
        daily_view_limit,
        link_type,
        internal_link_path,
        auto_restart_next_day,
        button_config,
        approval_status: 'pending',
        payment_type: payment_type || 'daily',
        payment_status: payment_type === 'advance' ? 'paid' : 'pending',
        advance_discount_percent: discountPercent,
        original_price: originalPrice,
        discounted_price: discountedPrice,
        save_card_for_daily_charges: save_card_for_daily_charges || false,
        daily_charge_limit: daily_charge_limit,
        stripe_payment_method_id,
        company_name,
        company_description,
        company_website,
        backlink_url,
        status: 'pending',
      })
      .select()
      .single();

    if (adError) throw adError;

    // Check for prohibited content
    const { data: flagged } = await supabaseAdmin.rpc('flag_ad_content', { p_ad_id: ad.id });

    if (flagged) {
      // Get the ad to see rejection reason
      const { data: updatedAd } = await supabaseAdmin
        .from('ads')
        .select('rejection_reason')
        .eq('id', ad.id)
        .single();

      return NextResponse.json({ 
        success: false, 
        error: 'Your ad contains prohibited content and has been rejected.',
        reason: updatedAd?.rejection_reason || 'Prohibited content detected',
        requiresRefund: true,
      }, { status: 400 });
    }

    // Verify backlink if provided
    if (backlink_url) {
      await supabaseAdmin.rpc('verify_backlink', { p_ad_id: ad.id });
    }

    // Create payment transaction record
    const { error: paymentError } = await supabaseAdmin
      .from('ad_payment_transactions')
      .insert({
        ad_id: ad.id,
        transaction_type: payment_type === 'advance' ? 'payment' : 'daily_charge',
        amount: discountedPrice,
        currency: 'SEK',
        status: payment_type === 'advance' ? 'completed' : 'pending',
        metadata: {
          original_price: originalPrice,
          discount_percent: discountPercent,
          payment_type: payment_type,
        },
      });

    if (paymentError) throw paymentError;

    return NextResponse.json({ success: true, ad });
  } catch (error: any) {
    console.error('Error creating ad:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
