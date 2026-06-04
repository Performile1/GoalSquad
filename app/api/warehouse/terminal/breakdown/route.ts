import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { palletId, warehouseId, storageBin } = await request.json();

    if (!palletId || !warehouseId) {
      return NextResponse.json({ success: false, error: 'Pallet ID and Warehouse ID are required.' }, { status: 400 });
    }

    // 1. Verifiera pallen och hämta kampanj-ID via bulk-sändningen
    const { data: pallet, error: palletError } = await supabaseAdmin
      .from('warehouse_cross_dock_queue')
      .select('campaign_id, status, bulk_shipment_id')
      .eq('id', palletId)
      .single();

    if (palletError || !pallet) {
      return NextResponse.json({ success: false, error: 'Pallet not found in cross-dock queue.' }, { status: 404 });
    }

    // 2. Transaktion: Uppdatera logistikstatusarna i databasen
    // Slå om det sista segmentet (Hub 2 -> Class) till 'ready_for_pickup'
    const { error: segmentError } = await supabaseAdmin
      .from('shipment_segments')
      .update({ 
        status: 'ready_for_pickup',
        arrived_at: new Date().toISOString()
      })
      .eq('to_entity_id', pallet.campaign_id)
      .eq('to_entity_type', 'campaign');

    if (segmentError) throw segmentError;

    // 3. Uppdatera kön i cross-docken till uppdelad (broken_down) med lagerfack
    const { error: queueError } = await supabaseAdmin
      .from('warehouse_cross_dock_queue')
      .update({ 
        status: 'processed',
        assigned_bin: storageBin || 'A-1',
        processed_at: new Date().toISOString()
      })
      .eq('id', palletId);

    if (queueError) throw queueError;

    // 4. Logga audit
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: warehouseId,
      action: 'WAREHOUSE_PALLET_BROKEN_DOWN',
      entity_type: 'warehouse_cross_dock_queue',
      entity_id: palletId,
      changes: { campaign_id: pallet.campaign_id, storage_bin: storageBin || 'A-1' }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Pallet broken down successfully. Notification sent to class leader.',
      campaignId: pallet.campaign_id
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
