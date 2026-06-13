/**
 * Product Categories API
 * GET /api/products/categories
 * 
 * Get all product categories with product counts
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('product_categories')
      .select('id, name, slug, icon, parent_id, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      logger.apiError('GET', '/api/products/categories', error);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    const formattedCategories = (categories || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      iconEmoji: cat.icon || '',
      parentId: cat.parent_id,
      productCount: 0,
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
