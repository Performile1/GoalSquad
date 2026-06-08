import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET: Hämta allt lager för ett specifikt warehouse
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const warehouseId = params.id;
  const loggerContext = { route: `/api/warehouses/${warehouseId}/inventory`, method: 'GET' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log(JSON.stringify({ level: 'warn', message: 'Unauthorized access attempt', ...loggerContext }));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('warehouse_inventory')
      .select(`
        id,
        quantity,
        reserved_quantity,
        available_quantity,
        last_restocked_at,
        updated_at,
        products (id, name, sku, price)
      `)
      .eq('warehouse_id', warehouseId);

    if (error) throw error;

    return NextResponse.json({ success: true, inventory: data });
  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// POST/PATCH: Justera lagersaldo
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const warehouseId = params.id;
  const loggerContext = { route: `/api/warehouses/${warehouseId}/inventory`, method: 'POST' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    const body = await request.json();
    const { productId, stockDelta } = body;

    // Säkra att endast admin eller lagerpersonal får ändra lagersaldon
    const userRole = session?.user?.user_metadata?.role;
    const userDetailedRole = session?.user?.user_metadata?.detailed_role;
    if (!session || !['admin', 'warehouse_staff', 'warehouse_admin', 'lagerpersonal', 'lager'].includes(userRole || userDetailedRole || '')) {
      console.log(JSON.stringify({ level: 'warn', message: 'Forbidden write attempt', user: session?.user?.id, ...loggerContext }));
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Hämta nuvarande status för audit log
    const { data: currentInventory } = await supabaseAdmin
      .from('warehouse_inventory')
      .select('quantity, reserved_quantity, available_quantity, last_restocked_at')
      .eq('warehouse_id', warehouseId)
      .eq('product_id', productId)
      .single();

    const currentQuantity = currentInventory?.quantity || 0;
    const newQuantity = Math.max(0, currentQuantity + (stockDelta || 0));
    const reservedQuantity = currentInventory?.reserved_quantity || 0;
    const newAvailableQuantity = Math.max(0, newQuantity - reservedQuantity);
    
    const { data: updatedInventory, error } = await supabaseAdmin
      .from('warehouse_inventory')
      .upsert({
        warehouse_id: warehouseId,
        product_id: productId,
        quantity: newQuantity,
        reserved_quantity: reservedQuantity,
        available_quantity: newAvailableQuantity,
        last_restocked_at: stockDelta > 0 ? new Date().toISOString() : currentInventory?.last_restocked_at,
        updated_at: new Date().toISOString()
      }, { onConflict: 'warehouse_id,product_id' })
      .select()
      .single();

    if (error) throw error;

    // Skriv till vår oförstörbara Audit Log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'STOCK_ADJUST',
      entity_type: 'warehouse_inventory',
      entity_id: updatedInventory.id,
      changes: {
        before: currentInventory || { quantity: 0, available_quantity: 0 },
        after: { quantity: newQuantity, available_quantity: newAvailableQuantity }
      }
    });

    console.log(JSON.stringify({ 
      level: 'info', 
      message: `Stock adjusted for product ${productId} in warehouse ${warehouseId}`, 
      ...loggerContext 
    }));

    return NextResponse.json({ success: true, data: updatedInventory });
  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
