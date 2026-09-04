import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthUser, getUserRole } from '@/lib/api-auth';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request as any);
    if (!authUser) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { bulkShipmentId, action, sku, quantityPicked } = await request.json();

    if (!bulkShipmentId || !action) {
      return NextResponse.json({ success: false, error: 'Saknar parametrar' }, { status: 400 });
    }

    const { data: shipment } = await supabaseAdmin
      .from('bulk_shipments')
      .select('warehouse_id')
      .eq('id', bulkShipmentId)
      .maybeSingle();
    const role = await getUserRole(authUser.id);
    const { data: warehouse } = shipment?.warehouse_id
      ? await supabaseAdmin.from('warehouse_partners').select('user_id').eq('id', shipment.warehouse_id).maybeSingle()
      : { data: null };
    if (warehouse?.user_id !== authUser.id && !['gs_admin', 'admin'].includes(role || '')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // 1. Reservera plockuppdrag för en specifik medarbetare
    if (action === 'start_picking') {
      const { error } = await supabaseAdmin
        .from('bulk_shipments')
        .update({ 
          status: 'picking',
          metadata: { picker_id: authUser.id, started_picking_at: new Date().toISOString() }
        })
        .eq('id', bulkShipmentId)
        .eq('status', 'pending');

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Plockning påbörjad' });
    }

    // 2. Bekräfta plockad rad / SKU
    if (action === 'confirm_item') {
      if (!sku || quantityPicked === undefined) {
        return NextResponse.json({ success: false, error: 'Saknar SKU eller antal' }, { status: 400 });
      }

      await supabaseAdmin.from('audit_logs').insert({
        actor_id: authUser.id,
        action: 'WAREHOUSE_ITEM_PICKED',
        entity_type: 'bulk_shipments',
        entity_id: bulkShipmentId,
        changes: { sku, quantity_picked: quantityPicked }
      });

      return NextResponse.json({ success: true, message: 'Artikel bekräftad' });
    }

    // 3. Slutför hela plocklistan och generera cross-dock-kön automatiskt
    if (action === 'finalize_picklist') {
      const { error: shipmentError } = await supabaseAdmin
        .from('bulk_shipments')
        .update({ status: 'picked', updated_at: new Date().toISOString() })
        .eq('id', bulkShipmentId);

      if (shipmentError) throw shipmentError;

      const { data: shipment } = await supabaseAdmin
        .from('bulk_shipments')
        .select('campaign_id')
        .eq('id', bulkShipmentId)
        .single();

      if (shipment) {
        await supabaseAdmin.from('warehouse_cross_dock_queue').insert({
          bulk_shipment_id: bulkShipmentId,
          campaign_id: shipment.campaign_id,
          status: 'pending'
        });
      }

      return NextResponse.json({ success: true, message: 'Plocklista slutförd. Skickad till Cross-Dock-kö.' });
    }

    return NextResponse.json({ success: false, error: 'Ogiltig åtgärd' }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
