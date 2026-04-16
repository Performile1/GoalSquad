/**
 * Products List API
 * GET /api/products?category=slug&sort=popular&limit=50
 * 
 * Get products with filtering and sorting
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const categorySlug = searchParams.get('category');
    const sortBy = searchParams.get('sort') || 'popular';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabaseAdmin
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        stock_quantity,
        tags,
        category:product_categories (
          name,
          slug
        ),
        merchant:merchants (
          name
        )
      `)
      .eq('status', 'active');

    // Filter by category
    if (categorySlug) {
      const { data: category } = await supabaseAdmin
        .from('product_categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();

      if (category) {
        query = query.eq('category_id', category.id);
      }
    }

    // Sorting
    switch (sortBy) {
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'popular':
      default:
        // Sort by stock (popular items sell out slower)
        query = query.order('stock_quantity', { ascending: false });
        break;
    }

    query = query.range(offset, offset + limit - 1);

    const { data: products, error } = await query;

    if (error) {
      console.error('Failed to fetch products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    const formattedProducts = (products || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      imageUrl: product.image_url,
      merchantName: product.merchant?.name || 'Unknown',
      categoryName: product.category?.name || 'Okategoriserad',
      categorySlug: product.category?.slug || '',
      stock: product.stock_quantity || 0,
      tags: product.tags || [],
      source: 'merchant' as const,
    }));

    // ── Merge approved community_products ──────────────────────────────────
    // Mapping from community category id → display name & slug aliases
    const COMMUNITY_CATEGORY_MAP: Record<string, { name: string; slugs: string[] }> = {
      jersey:    { name: 'Tröjor & Kläder',    slugs: ['kläder', 'clothing', 'sport'] },
      handmade:  { name: 'Hantverk & Eget',    slugs: ['handmade', 'hantverk'] },
      equipment: { name: 'Utrustning & Sport', slugs: ['utrustning', 'equipment', 'sport'] },
      food:      { name: 'Mat & Dryck',        slugs: ['mat', 'food', 'livsmedel'] },
      other:     { name: 'Övrigt',             slugs: ['övrigt', 'other'] },
    };

    let communityQuery = supabaseAdmin
      .from('community_products')
      .select('id, title, description, price, image_urls, category, seller_name, community_name, stock')
      .eq('status', 'approved')
      .gt('stock', 0)
      .limit(limit);

    // When filtering by category slug, only include community products whose
    // category maps to that slug; when no filter, include all
    if (categorySlug) {
      const matchingCats = Object.entries(COMMUNITY_CATEGORY_MAP)
        .filter(([, v]) => v.slugs.includes(categorySlug))
        .map(([k]) => k);

      if (matchingCats.length === 0) {
        // No community categories match this slug — skip community products
        communityQuery = communityQuery.in('category', []);
      } else {
        communityQuery = communityQuery.in('category', matchingCats);
      }
    }

    const { data: communityProducts } = await communityQuery;

    const formattedCommunity = (communityProducts || []).map((p: any) => {
      const catInfo = COMMUNITY_CATEGORY_MAP[p.category] ?? { name: 'Övrigt', slugs: [] };
      const sellerLabel = p.community_name
        ? `${p.seller_name} · ${p.community_name}`
        : p.seller_name;
      return {
        id: `community_${p.id}`,
        name: p.title,
        description: p.description,
        price: parseFloat(p.price),
        imageUrl: p.image_urls?.[0] || null,
        merchantName: sellerLabel,
        categoryName: catInfo.name,
        categorySlug: catInfo.slugs[0] || 'other',
        stock: p.stock,
        tags: ['community', 'eget'],
        source: 'community' as const,
      };
    });

    const allProducts = [...formattedProducts, ...formattedCommunity];

    return NextResponse.json({ products: allProducts });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
