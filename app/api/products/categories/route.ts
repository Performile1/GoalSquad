/**
 * Product Categories API
 * GET /api/products/categories
 * 
 * Get all product categories with product counts
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    // Use database function for category tree
    const { data, error } = await supabaseAdmin.rpc('get_category_tree');

    if (error) {
      logger.apiError('GET', '/api/products/categories', error, { usingFunction: true });
      // Fallback to basic query
      const { data: categories } = await supabaseAdmin
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      const formattedCategories = (categories || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        iconEmoji: cat.icon_emoji || '',
        parentId: cat.parent_id,
        productCount: 0, // Would need separate query
      }));

      return NextResponse.json({ categories: formattedCategories });
    }

    const formattedCategories = (data || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      iconEmoji: cat.icon_emoji || '',
      parentId: cat.parent_id,
      productCount: parseInt(cat.product_count || 0),
    }));

    return NextResponse.json({ categories: formattedCategories });
  } catch (error) {
    logger.apiError('GET', '/api/products/categories', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
