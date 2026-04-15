/**
 * Product Creation API (with GS1 dimensions)
 * POST /api/products/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const productSchema = z.object({
  merchantId: z.string().uuid(),
  
  // Identification
  sku: z.string().min(1).max(100),
  ean: z.string().length(13).optional(),
  gtin: z.string().length(14).optional(),
  
  // Basic info
  name: z.string().min(1).max(500),
  description: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  
  // Pricing
  basePrice: z.number().positive(),
  retailPrice: z.number().positive(),
  currency: z.string().length(3).default('NOK'),
  
  // GS1 Physical Dimensions (for shipping matrix)
  weightGrams: z.number().int().positive(),
  lengthMm: z.number().int().positive(),
  widthMm: z.number().int().positive(),
  heightMm: z.number().int().positive(),
  
  // Inventory
  stockQuantity: z.number().int().nonnegative().default(0),
  stockLocation: z.string().optional(),
  
  // Media
  images: z.array(z.string().url()).default([]),
  
  // Status
  status: z.enum(['draft', 'active', 'inactive', 'archived']).default('draft'),
  
  // Metadata
  metadata: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = productSchema.parse(body);

    // Verify merchant exists and is verified
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id, verification_status')
      .eq('id', validatedData.merchantId)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      );
    }

    if (merchant.verification_status !== 'verified') {
      return NextResponse.json(
        { error: 'Merchant must be verified before adding products' },
        { status: 403 }
      );
    }

    // Check if SKU already exists for this merchant
    const { data: existingProduct } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('merchant_id', validatedData.merchantId)
      .eq('sku', validatedData.sku)
      .single();

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product SKU already exists for this merchant' },
        { status: 400 }
      );
    }

    // Generate platform SKU if needed (GS-XXXXX format)
    let platformSku = validatedData.sku;
    if (!platformSku.startsWith('GS-')) {
      // Generate unique platform SKU
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 7);
      platformSku = `GS-${timestamp}${random}`.toUpperCase();
    }

    // Create product
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        merchant_id: validatedData.merchantId,
        sku: platformSku,
        ean: validatedData.ean,
        gtin: validatedData.gtin,
        name: validatedData.name,
        description: validatedData.description,
        category: validatedData.category,
        brand: validatedData.brand,
        base_price: validatedData.basePrice,
        retail_price: validatedData.retailPrice,
        currency: validatedData.currency,
        weight_grams: validatedData.weightGrams,
        length_mm: validatedData.lengthMm,
        width_mm: validatedData.widthMm,
        height_mm: validatedData.heightMm,
        stock_quantity: validatedData.stockQuantity,
        stock_location: validatedData.stockLocation,
        images: validatedData.images,
        status: validatedData.status,
        metadata: validatedData.metadata,
      })
      .select()
      .single();

    if (productError || !product) {
      console.error('Failed to create product:', productError);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    // Calculate volumetric weight (for shipping matrix)
    const volumetricWeightGrams = 
      (validatedData.lengthMm * validatedData.widthMm * validatedData.heightMm) / 5000;
    
    const chargeableWeight = Math.max(validatedData.weightGrams, volumetricWeightGrams);

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        basePrice: product.base_price,
        retailPrice: product.retail_price,
        dimensions: {
          weight: validatedData.weightGrams,
          length: validatedData.lengthMm,
          width: validatedData.widthMm,
          height: validatedData.heightMm,
          volumetricWeight: Math.round(volumetricWeightGrams),
          chargeableWeight: Math.round(chargeableWeight),
        },
        status: product.status,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
