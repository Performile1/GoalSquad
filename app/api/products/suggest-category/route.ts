/**
 * Suggest Product Category API
 * POST /api/products/suggest-category
 * 
 * AI-assisted category suggestions based on product name/description
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Product name required' },
        { status: 400 }
      );
    }

    // Use database function for category suggestions
    const { data, error } = await supabaseAdmin.rpc('suggest_product_category', {
      product_name: name,
      product_description: description || null,
    });

    if (error) {
      console.error('Category suggestion error:', error);
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = (data || []).map((cat: any) => ({
      categoryId: cat.category_id,
      categoryName: cat.category_name,
      categorySlug: cat.category_slug,
      confidenceScore: cat.confidence_score,
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Suggest category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
