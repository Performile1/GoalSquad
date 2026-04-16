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
      categoryName: product.category?.name || 'Uncategorized',
      stock: product.stock_quantity || 0,
      tags: product.tags || [],
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
