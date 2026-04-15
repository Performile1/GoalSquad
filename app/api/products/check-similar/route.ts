/**
 * Check Similar Products API
 * POST /api/products/check-similar
 * 
 * Find similar/duplicate products to prevent duplicates
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { name, ean, brand } = await req.json();

    if (!name && !ean) {
      return NextResponse.json(
        { error: 'Name or EAN required' },
        { status: 400 }
      );
    }

    // Use database function for similarity search
    const { data, error } = await supabaseAdmin.rpc('find_similar_products', {
      search_name: name || '',
      search_ean: ean || null,
      search_brand: brand || null,
      similarity_threshold: 0.6,
    });

    if (error) {
      console.error('Similar products search error:', error);
      return NextResponse.json({ similar: [] });
    }

    const similar = (data || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      ean: product.ean,
      brand: product.brand,
      merchantName: product.merchant_name,
      categoryName: product.category_name,
      similarityScore: product.similarity_score,
    }));

    return NextResponse.json({ similar });
  } catch (error) {
    console.error('Check similar products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
