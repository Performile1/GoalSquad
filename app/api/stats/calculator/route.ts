/**
 * Calculator Stats API
 * GET /api/stats/calculator
 * 
 * Get real statistics for calculator page
 * Real data only - no mock
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    // Get total communities
    const { count: communitiesCount } = await supabase
      .from('communities')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get total revenue from completed orders
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_amount')
      .in('status', ['completed', 'delivered']);

    const totalRevenue = (revenueData || []).reduce(
      (sum, order) => sum + (parseFloat(order.total_amount) || 0),
      0
    );

    // Calculate average profit percentage from products
    const { data: productsData } = await supabase
      .from('products')
      .select('price, cost_price')
      .not('cost_price', 'is', null)
      .eq('is_active', true);

    let averageProfit = 0;
    if (productsData && productsData.length > 0) {
      const profitPercentages = productsData.map((p: any) => {
        const price = parseFloat(p.price) || 0;
        const cost = parseFloat(p.cost_price) || 0;
        return price > 0 ? ((price - cost) / price) * 100 : 0;
      });
      averageProfit = profitPercentages.reduce((a, b) => a + b, 0) / profitPercentages.length;
    }

    return NextResponse.json({
      totalCommunities: communitiesCount || 0,
      totalRevenue: totalRevenue,
      averageProfit: Math.round(averageProfit),
    });
  } catch (error) {
    console.error('Calculator stats API error:', error);
    return NextResponse.json(
      {
        totalCommunities: 0,
        totalRevenue: 0,
        averageProfit: 0,
      },
      { status: 500 }
    );
  }
}
