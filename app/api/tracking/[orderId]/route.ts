import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { userHasRole } from '@/lib/api-auth';

export async function GET(request: Request, { params }: { params: { orderId: string } }) {
  const orderId = params.orderId;
  const loggerContext = { route: `/api/tracking/${orderId}`, method: 'GET' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Kontrollera orderns existens och grundstatus
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, shipment_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Endast orderägaren eller lager/admin får spåra
    if (order.user_id !== session.user.id && !(await userHasRole(session.user.id, ['warehouse', 'gs_admin']))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Hämta detaljerade spårningshändelser från shipments-tabellen
    const { data: shipments, error: shipmentsError } = await supabase
      .from('shipments')
      .select('id, status, tracking_number, carrier, created_at, updated_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (shipmentsError) throw shipmentsError;

    return NextResponse.json({
      success: true,
      currentShipmentStatus: order.shipment_status,
      events: shipments || []
    });
  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
