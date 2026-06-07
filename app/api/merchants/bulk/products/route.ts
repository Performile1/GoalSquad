/**
 * Merchant Bulk Products API
 * POST /api/merchants/bulk/products
 *
 * Lets a merchant upload/sync their full assortment in a single call.
 * Idempotent by design: upserts on (merchant_id, sku) so a retried
 * request never creates duplicate products.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative().optional(),
  description: z.string().optional(),
  currency: z.string().optional(),
});

const bulkSchema = z.object({
  merchantId: z.string().uuid(),
  products: z.array(productSchema).min(1).max(1000),
  idempotencyKey: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { merchantId, products, idempotencyKey } = bulkSchema.parse(body);

    const formattedProducts = products.map((prod) => ({
      merchant_id: merchantId,
      sku: prod.sku,
      name: prod.name,
      price: prod.price,
      stock_quantity: prod.stock ?? 0,
      description: prod.description ?? null,
      currency: prod.currency ?? 'SEK',
    }));

    // Idempotent bulk upsert keyed on (merchant_id, sku).
    const { data, error } = await supabaseAdmin
      .from('products')
      .upsert(formattedProducts, { onConflict: 'merchant_id,sku' })
      .select('id');

    if (error) {
      logger.dbError('UPSERT', 'products', error as unknown as Error, { merchantId });
      return NextResponse.json(
        { success: false, error: 'Failed to sync products' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${products.length} produkter synkroniserade.`,
      synced: data?.length ?? products.length,
      bulkKey: idempotencyKey,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    logger.apiError('POST', '/api/merchants/bulk/products', error as Error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
