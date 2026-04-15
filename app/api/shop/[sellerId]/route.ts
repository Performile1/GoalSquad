/**
 * Public Seller Shop API
 * GET /api/shop/[sellerId]
 * 
 * Anyone can view a seller's shop and buy products
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { sellerId: string } }
) {
  try {
    const sellerId = params.sellerId;

    // Get seller profile (public info)
    const { data: seller, error: sellerError } = await supabaseAdmin
      .from('seller_profiles')
      .select(`
        shop_url,
        total_sales,
        total_orders,
        current_level,
        avatar_data,
        user:profiles (
          full_name,
          avatar_url
        ),
        community:communities (
          name,
          city,
          country
        )
      `)
      .eq('user_id', sellerId)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Get seller's available products
    const { data: products } = await supabaseAdmin
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        stock_quantity,
        merchant:merchants (
          name
        )
      `)
      .eq('status', 'active')
      .gt('stock_quantity', 0);

    return NextResponse.json({
      seller: {
        shopUrl: seller.shop_url,
        fullName: seller.user?.full_name,
        avatarUrl: seller.user?.avatar_url,
        avatarData: seller.avatar_data,
        level: seller.current_level,
        totalSales: parseFloat(seller.total_sales),
        totalOrders: seller.total_orders,
        community: seller.community,
      },
      products: products || [],
    });
  } catch (error) {
    console.error('Shop API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
