/**
 * Public Search API
 * GET /api/search?q=query
 * 
 * Allows anyone to search for:
 * - Users (sellers)
 * - Communities (teams, clubs)
 * - Products
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'user', 'community', 'product', or 'all'

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const results: any[] = [];

    // Search users/sellers
    if (!type || type === 'all' || type === 'user') {
      const { data: users } = await supabaseAdmin
        .from('profiles')
        .select(`
          id,
          full_name,
          role,
          avatar_url,
          seller_profile:seller_profiles (
            shop_url,
            total_sales,
            current_level
          )
        `)
        .eq('role', 'seller')
        .ilike('full_name', `%${query}%`)
        .limit(10);

      if (users) {
        results.push(
          ...users.map((user: any) => ({
            id: user.id,
            type: 'user',
            name: user.full_name,
            description: `Level ${user.seller_profile?.current_level || 1} Seller`,
            avatarUrl: user.avatar_url,
            shopUrl: user.seller_profile?.shop_url,
            totalSales: user.seller_profile?.total_sales || 0,
          }))
        );
      }
    }

    // Search communities
    if (!type || type === 'all' || type === 'community') {
      const { data: communities } = await supabaseAdmin
        .from('communities')
        .select('*')
        .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
        .limit(10);

      if (communities) {
        results.push(
          ...communities.map((community: any) => ({
            id: community.id,
            type: 'community',
            name: community.name,
            description: `${community.community_type} i ${community.city}`,
            memberCount: community.total_members,
            city: community.city,
            country: community.country,
          }))
        );
      }
    }

    // Search products
    if (!type || type === 'all' || type === 'product') {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          merchant:merchants (
            name
          )
        `)
        .ilike('name', `%${query}%`)
        .eq('status', 'active')
        .limit(10);

      if (products) {
        results.push(
          ...products.map((product: any) => ({
            id: product.id,
            type: 'product',
            name: product.name,
            description: product.description,
            price: product.price,
            imageUrl: product.image_url,
            merchantName: product.merchant?.name,
          }))
        );
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
