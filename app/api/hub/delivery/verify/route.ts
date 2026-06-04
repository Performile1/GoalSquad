import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { campaignId, sellerId, scannedBy } = await request.json();

    if (!campaignId || !sellerId || !scannedBy) {
      return NextResponse.json({ success: false, error: 'Saknar obligatoriska parametrar' }, { status: 400 });
    }

    const payoutLock = `PAYOUT-${campaignId}-${sellerId}`.toUpperCase();

    const { data: existingReceipt } = await supabaseAdmin
      .from('hub_payouts_receipts')
      .select('id, status, created_at')
      .eq('payout_lock', payoutLock)
      .maybeSingle();

    if (existingReceipt) {
      return NextResponse.json({ 
        success: false, 
        error: 'CONFLICT',
        message: `Denna utdelning skannades redan den ${new Date(existingReceipt.created_at).toLocaleDateString('sv-SE')}.`
      }, { status: 409 });
    }

    const { data: newReceipt, error: insertError } = await supabaseAdmin
      .from('hub_payouts_receipts')
      .insert({
        campaign_id: campaignId,
        seller_id: sellerId,
        scanned_by: scannedBy,
        status: 'completed',
        payout_lock: payoutLock
      })
      .select()
      .single();

    if (insertError && insertError.code === '23505') {
      return NextResponse.json({ success: false, error: 'Utdelning redan registrerad (race condition).' }, { status: 409 });
    } else if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Utdelning registrerad och kvitterad.', 
      receipt: newReceipt 
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
