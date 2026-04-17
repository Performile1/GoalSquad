/**
 * Community Products API
 * GET  /api/community-products  - List approved community-listed products
 * POST /api/community-products  - Submit a new product listing for review
 *
 * This endpoint handles the "Community Marketplace" where associations,
 * classes, and individual sellers can list their own products.
 * GoalSquad charges a platform_fee_percent on each sale.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const PLATFORM_FEE_PERCENT = 12;

const createSchema = z.object({
  title: z.string().min(2).max(255),
  description: z.string().min(10),
  price: z.number().positive(),
  category: z.enum(['jersey', 'handmade', 'equipment', 'food', 'other']),
  sellerType: z.enum(['community', 'class', 'individual']),
  sellerName: z.string().min(2),
  communityName: z.string().optional(),
  location: z.string().optional(),
  stock: z.number().int().positive(),
  shippingInfo: z.string().min(10),
  contactEmail: z.string().email(),
  imageUrls: z.array(z.string()).optional(),
  platformFeePercent: z.number().default(PLATFORM_FEE_PERCENT),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'approved';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabaseAdmin
      .from('community_products')
      .select(`
        id,
        title,
        description,
        price,
        image_urls,
        category,
        seller_type,
        seller_name,
        community_name,
        location,
        stock,
        platform_fee_percent,
        status,
        created_at,
        is_featured,
        is_discounted,
        discount_percent,
        sells_fast,
        low_stock_threshold
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('community-products GET error:', error);
      return NextResponse.json({ products: [] });
    }

    const products = (data || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: parseFloat(p.price),
      imageUrl: p.image_urls?.[0] || null,
      imageUrls: p.image_urls || [],
      category: p.category,
      sellerType: p.seller_type,
      sellerName: p.seller_name,
      communityName: p.community_name,
      location: p.location,
      stock: p.stock,
      platformFeePercent: p.platform_fee_percent,
      status: p.status,
      createdAt: p.created_at,
      is_featured: p.is_featured,
      is_discounted: p.is_discounted,
      discount_percent: p.discount_percent,
      sells_fast: p.sells_fast,
      low_stock_threshold: p.low_stock_threshold,
    }));

    return NextResponse.json({ products });
  } catch (error) {
    console.error('community-products GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const { data: product, error } = await supabaseAdmin
      .from('community_products')
      .insert({
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category,
        seller_type: data.sellerType,
        seller_name: data.sellerName,
        community_name: data.communityName || null,
        location: data.location || null,
        stock: data.stock,
        shipping_info: data.shippingInfo,
        contact_email: data.contactEmail,
        image_urls: data.imageUrls || [],
        platform_fee_percent: data.platformFeePercent ?? PLATFORM_FEE_PERCENT,
        status: 'pending_review',
      })
      .select()
      .single();

    if (error) {
      console.error('community-products POST error:', error);
      return NextResponse.json(
        { error: 'Failed to create listing', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: { id: product.id, status: product.status },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('community-products POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
