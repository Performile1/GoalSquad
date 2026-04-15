/**
 * Advanced Search API
 * GET /api/search/advanced?q=query&type=all
 * 
 * Full-text search across sellers, communities, and products
 * Uses PostgreSQL tsvector for Swedish language support
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Use database function for full-text search
    const { data, error } = await supabaseAdmin.rpc('search_all', {
      search_query: query,
      search_type: type,
      result_limit: limit,
    });

    if (error) {
      console.error('Search error:', error);
      // Fallback to basic search if function fails
      return fallbackSearch(query, type, limit);
    }

    return NextResponse.json({ results: data || [] });
  } catch (error) {
    console.error('Advanced search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Fallback search using ILIKE (slower but works without full-text indexes)
 */
async function fallbackSearch(query: string, type: string, limit: number) {
  const results: any[] = [];

  try {
    // Search sellers
    if (type === 'all' || type === 'sellers') {
      const { data: sellers } = await supabaseAdmin
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          seller_profile:seller_profiles (
            current_level,
            total_sales,
            shop_url,
            community:communities (name)
          )
        `)
        .eq('role', 'seller')
        .ilike('full_name', `%${query}%`)
        .limit(limit);

      if (sellers) {
        results.push(
          ...sellers.map((seller: any) => ({
            id: seller.id,
            type: 'seller',
            name: seller.full_name,
            description: `Level ${seller.seller_profile?.current_level || 1} Seller`,
            imageUrl: seller.avatar_url,
            metadata: {
              communityName: seller.seller_profile?.community?.name || 'No community',
              totalSales: seller.seller_profile?.total_sales || 0,
              level: seller.seller_profile?.current_level || 1,
              shopUrl: seller.seller_profile?.shop_url,
            },
            rank: 1,
          }))
        );
      }
    }

    // Search communities
    if (type === 'all' || type === 'communities') {
      const { data: communities } = await supabaseAdmin
        .from('communities')
        .select('*')
        .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
        .limit(limit);

      if (communities) {
        results.push(
          ...communities.map((community: any) => ({
            id: community.id,
            type: 'community',
            name: community.name,
            description: `${community.community_type} i ${community.city}`,
            imageUrl: community.logo_url,
            metadata: {
              city: community.city,
              country: community.country,
              totalMembers: community.total_members,
              totalSales: community.total_sales,
            },
            rank: 1,
          }))
        );
      }
    }

    // Search products
    if (type === 'all' || type === 'products') {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          stock_quantity,
          category_id,
          merchant:merchants (name)
        `)
        .eq('status', 'active')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(limit);

      if (products) {
        results.push(
          ...products.map((product: any) => ({
            id: product.id,
            type: 'product',
            name: product.name,
            description: product.description,
            imageUrl: product.image_url,
            metadata: {
              price: product.price,
              merchantName: product.merchant?.name,
              categoryId: product.category_id,
              stock: product.stock_quantity,
            },
            rank: 1,
          }))
        );
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Fallback search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
