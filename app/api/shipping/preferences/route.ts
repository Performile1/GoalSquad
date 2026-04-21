import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'merchant') {
      return NextResponse.json({ error: 'Only merchants can access shipping preferences' }, { status: 403 });
    }

    const { data: preferences, error } = await supabase
      .from('merchant_shipping_preferences')
      .select('*')
      .eq('merchant_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ preferences: preferences || null });
  } catch (error: any) {
    console.error('Error fetching shipping preferences:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'merchant') {
      return NextResponse.json({ error: 'Only merchants can set shipping preferences' }, { status: 403 });
    }

    const body = await request.json();
    const {
      allows_individual_shipments,
      allows_bulk_shipments,
      individual_shipment_cost,
      bulk_shipment_cost,
      minimum_bulk_quantity,
      shipping_regions,
      delivery_time_days,
      notes,
    } = body;

    const { data: preferences, error } = await supabase
      .from('merchant_shipping_preferences')
      .upsert({
        merchant_id: user.id,
        allows_individual_shipments: allows_individual_shipments || false,
        allows_bulk_shipments: allows_bulk_shipments || true,
        individual_shipment_cost: individual_shipment_cost || 0,
        bulk_shipment_cost: bulk_shipment_cost || 0,
        minimum_bulk_quantity: minimum_bulk_quantity || 10,
        shipping_regions: shipping_regions || [],
        delivery_time_days: delivery_time_days || 7,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ preferences });
  } catch (error: any) {
    console.error('Error saving shipping preferences:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updateData: any = { updated_at: new Date().toISOString() };

    if (body.allows_individual_shipments !== undefined) updateData.allows_individual_shipments = body.allows_individual_shipments;
    if (body.allows_bulk_shipments !== undefined) updateData.allows_bulk_shipments = body.allows_bulk_shipments;
    if (body.individual_shipment_cost !== undefined) updateData.individual_shipment_cost = body.individual_shipment_cost;
    if (body.bulk_shipment_cost !== undefined) updateData.bulk_shipment_cost = body.bulk_shipment_cost;
    if (body.minimum_bulk_quantity !== undefined) updateData.minimum_bulk_quantity = body.minimum_bulk_quantity;
    if (body.shipping_regions !== undefined) updateData.shipping_regions = body.shipping_regions;
    if (body.delivery_time_days !== undefined) updateData.delivery_time_days = body.delivery_time_days;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { error } = await supabase
      .from('merchant_shipping_preferences')
      .update(updateData)
      .eq('merchant_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating shipping preferences:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
