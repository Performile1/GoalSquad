/**
 * Merchant Showcase API
 * GET /api/merchants/showcase
 * 
 * Public page showing all merchants and their stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Get all merchants with stats
    const { data: merchants, error } = await supabaseAdmin
      .from('merchants')
      .select(`
        id,
        name,
        description,
        logo_url
      `);

    if (error) {
      console.error('Failed to fetch merchants:', error);
      return NextResponse.json(
        { error: 'Failed to fetch merchants' },
        { status: 500 }
      );
    }

    // Enrich with product stats
    const enrichedMerchants = await Promise.all(
      (merchants || []).map(async (merchant: any) => {
        // Get product count
        const { count: productCount } = await supabaseAdmin
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('merchant_id', merchant.id)
          .eq('status', 'active');

        // Get total sold and revenue from order_items
        const { data: orderStats } = await supabaseAdmin
          .from('order_items')
          .select('quantity, price')
          .eq('merchant_id', merchant.id);

        const totalSold = orderStats?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        const totalRevenue = orderStats?.reduce(
          (sum, item) => sum + item.quantity * parseFloat(item.price),
          0
        ) || 0;

        return {
          id: merchant.id,
          name: merchant.name,
          description: merchant.description || 'Ingen beskrivning tillgänglig',
          logoUrl: merchant.logo_url,
          totalProducts: productCount || 0,
          totalSold,
          totalRevenue,
          categories: ['Övrigt'],
          featured: false,
        };
      })
    );

    // Sort by total revenue
    enrichedMerchants.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return NextResponse.json({ merchants: enrichedMerchants });
  } catch (error) {
    console.error('Merchant showcase error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
