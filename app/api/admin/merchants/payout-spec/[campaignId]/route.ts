import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  const campaignId = params.campaignId;
  const loggerContext = { route: `/api/admin/merchants/payout-spec/${campaignId}`, method: 'GET' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || session.user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: spec, error } = await supabaseAdmin
      .from('order_items')
      .select(`
        quantity,
        price_at_purchase,
        products (id, sku, name, merchant_id)
      `)
      .eq('orders.campaign_id', campaignId);

    if (error) throw error;

    const merchantSummary: Record<string, any> = {};

    spec?.forEach((item: any) => {
      const merchantId = item.products?.merchant_id;
      if (!merchantId) return;

      if (!merchantSummary[merchantId]) {
        merchantSummary[merchantId] = {
          merchant_id: merchantId,
          total_quantity: 0,
          total_revenue: 0,
          items: []
        };
      }

      merchantSummary[merchantId].total_quantity += item.quantity;
      merchantSummary[merchantId].total_revenue += (item.quantity * item.price_at_purchase);
      merchantSummary[merchantId].items.push({
        sku: item.products?.sku,
        name: item.products?.name,
        quantity: item.quantity,
        price: item.price_at_purchase
      });
    });

    return NextResponse.json({
      success: true,
      campaign_id: campaignId,
      merchant_payout_summary: Object.values(merchantSummary)
    });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
