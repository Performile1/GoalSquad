import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');

    if (!warehouseId) {
      return NextResponse.json({ success: false, error: 'Warehouse ID required' }, { status: 400 });
    }

    // Hämta aktiva och nyligen processade kö-objekt
    const { data: queue, error } = await supabaseAdmin
      .from('warehouse_cross_dock_queue')
      .select(`
        id,
        campaign_id,
        bulk_shipment_id,
        status,
        assigned_bin,
        created_at,
        processed_at
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, queue });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { queueItemId, action, note } = await request.json();

    if (!queueItemId || !action) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    let updateData: any = {};
    
    if (action === 'force_process') {
      updateData = {
        status: 'processed',
        assigned_bin: 'MANUELL-FORCERING',
        processed_at: new Date().toISOString()
      };
    } else if (action === 'flag_discrepancy') {
      updateData = {
        status: 'failed'
      };
      
      // Skapa en avvikelsepost
      await supabaseAdmin
        .from('warehouse_discrepancies')
        .insert({
          queue_item_id: queueItemId,
          discrepancy_type: 'damaged_or_missing',
          notes: note || 'Flaggad manuellt från Cross-Dock Queue Management'
        });
    }

    const { error } = await supabaseAdmin
      .from('warehouse_cross_dock_queue')
      .update(updateData)
      .eq('id', queueItemId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: `Queue item updated via action: ${action}` });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
