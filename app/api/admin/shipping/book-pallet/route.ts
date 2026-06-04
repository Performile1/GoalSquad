import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  const loggerContext = { route: '/api/admin/shipping/book-pallet', method: 'POST' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || session.user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { campaignId, warehouseAddress, deliveryAddress, totalWeight } = await request.json();

    const shippingResponse = await fetch('https://api.shipmondo.com/v3/shipments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SHIPMONDO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: warehouseAddress.partner_name,
          address1: warehouseAddress.street,
          zipcode: warehouseAddress.zip,
          city: warehouseAddress.city,
          country: 'SE'
        },
        receiver: {
          name: deliveryAddress.parent_name,
          address1: deliveryAddress.street,
          zipcode: deliveryAddress.zip,
          city: deliveryAddress.city,
          country: 'SE',
          phone: deliveryAddress.phone
        },
        parcels: [
          {
            quantity: 1,
            parcel_type: 'EUR_PALLET',
            weight: totalWeight
          }
        ],
        carrier: 'dhl_freight',
        product_code: 'dhl_freight_home_delivery'
      })
    });

    const shippingData = await shippingResponse.json();

    await supabaseAdmin.from('bulk_shipments').insert({
      campaign_id: campaignId,
      merchant_id: warehouseAddress.merchant_id,
      warehouse_id: warehouseAddress.warehouse_id,
      shipping_provider: 'dhl_freight',
      tracking_number: shippingData.tracking_number,
      status: 'pending',
      total_weight_kg: totalWeight
    });

    await supabaseAdmin.from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'SHIPPING_BOOKED',
      entity_type: 'bulk_shipments',
      entity_id: campaignId,
      changes: { 
        tracking_number: shippingData.tracking_number,
        provider: 'dhl_freight'
      }
    });

    return NextResponse.json({ 
      success: true, 
      tracking_number: shippingData.tracking_number,
      label_url: shippingData.labels.pdf 
    });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
