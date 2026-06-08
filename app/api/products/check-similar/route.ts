/**
 * Check Similar Products API
 * POST /api/products/check-similar
 * 
 * Find similar/duplicate products to prevent duplicates
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  let name = '';
  let ean: string | null = null;
  let brand: string | null = null;
  try {
    const body = await req.json();
    name = body.name;
    ean = body.ean;
    brand = body.brand;

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
      logger.apiError('POST', '/api/products/check-similar', error, { name, ean, brand });
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
    logger.apiError('POST', '/api/products/check-similar', error as Error, { name, ean, brand });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
