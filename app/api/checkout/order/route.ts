import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { 
      campaignId, 
      sellerId, 
      supporterName, 
      supporterEmail, 
      totalAmount, 
      deliveryMethod, 
      idempotencyKey 
    } = await request.json();

    if (!campaignId || !sellerId || !idempotencyKey) {
      return NextResponse.json({ success: false, error: 'Saknar obligatoriska parametrar' }, { status: 400 });
    }

    // 1. Kontrollera om denna unika checkout-session redan har skapat en order
    const { data: existingOrder, error: checkError } = await supabaseAdmin
      .from('supporter_orders')
      .select('id, status')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingOrder) {
      return NextResponse.json({ 
        success: true, 
        message: 'Order redan processad (idempotent)', 
        orderId: existingOrder.id,
        isDuplicate: true 
      });
    }

    // 2. Skapa den nya ordern
    const { data: newOrder, error: insertError } = await supabaseAdmin
      .from('supporter_orders')
      .insert({
        campaign_id: campaignId,
        seller_id: sellerId,
        supporter_name: supporterName,
        supporter_email: supporterEmail,
        total_amount_sek: totalAmount,
        delivery_method: deliveryMethod,
        idempotency_key: idempotencyKey,
        status: 'completed'
      })
      .select()
      .single();

    if (insertError && insertError.code === '23505') {
      return NextResponse.json({ success: true, message: 'Order redan sparad via spärr.' });
    } else if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Order sparad framgångsrikt', 
      orderId: newOrder.id,
      isDuplicate: false 
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
