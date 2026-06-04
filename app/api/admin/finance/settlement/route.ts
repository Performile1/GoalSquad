import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { campaignId, totalRevenue, platformCut, payoutClass } = await request.json();

    if (!campaignId || !totalRevenue || !platformCut || !payoutClass) {
      return NextResponse.json({ success: false, error: 'Saknar parametrar' }, { status: 400 });
    }

    // 1. Kontrollera om redan finns (Idempotency Guard)
    const { data: existingSettlement, error: checkError } = await supabaseAdmin
      .from('financial_settlements')
      .select('id, status, created_at')
      .eq('campaign_id', campaignId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingSettlement) {
      return NextResponse.json({ 
        success: false, 
        error: 'CONFLICT',
        message: `Denna kampanj slutavräknades redan den ${new Date(existingSettlement.created_at).toLocaleDateString('sv-SE')}.`,
        existingId: existingSettlement.id
      }, { status: 409 });
    }

    // 2. Skapa slutavräkning
    const uniquePayoutRef = `PAY-CAMP-${campaignId.slice(0,8).toUpperCase()}-${Date.now()}`;

    const { data: newSettlement, error: insertError } = await supabaseAdmin
      .from('financial_settlements')
      .insert({
        campaign_id: campaignId,
        total_revenue_sek: totalRevenue,
        platform_cut_sek: platformCut,
        payout_class_sek: payoutClass,
        status: 'pending',
        payout_reference: uniquePayoutRef
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ 
      success: true, 
      message: 'Slutavräkning skapad framgångsrikt.', 
      settlement: newSettlement 
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { data: settlements, error } = await supabaseAdmin
      .from('financial_settlements')
      .select(`
        id,
        campaign_id,
        total_revenue_sek,
        platform_cut_sek,
        payout_class_sek,
        status,
        payout_reference,
        created_at,
        campaigns (name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, settlements });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
