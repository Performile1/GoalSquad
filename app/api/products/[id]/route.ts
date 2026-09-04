import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*, merchant:merchants(id, name, business_name, merchant_name)')
      .eq('id', params.id)
      .maybeSingle();

    if (error) throw error;
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const { data: reviews } = await supabaseAdmin
      .from('product_reviews')
      .select('id, rating, title, comment, verified_purchase, helpful_count, created_at')
      .eq('product_id', params.id)
      .order('created_at', { ascending: false });

    const images = Array.isArray(product.images)
      ? product.images
      : Array.isArray(product.image_urls)
        ? product.image_urls
        : product.image_url
          ? [product.image_url]
          : [];
    const reviewRows = reviews || [];
    const rating = reviewRows.length
      ? reviewRows.reduce((sum, review) => sum + review.rating, 0) / reviewRows.length
      : 0;

    return NextResponse.json({
      product: {
        ...product,
        name: product.name || product.title,
        price: Number(product.price ?? product.retail_price ?? 0),
        images,
        certifications: product.certifications || product.attributes?.certifications || [],
        attributes: product.attributes || product.metadata || {},
        stock: Number(product.stock_quantity ?? product.stock ?? 0),
        merchantName: product.merchant?.name || product.merchant?.business_name || product.merchant?.merchant_name || 'GoalSquad',
        sellerId: product.seller_id || product.merchant_id,
        canConsolidate: product.can_consolidate ?? true,
        shippingRestrictions: product.shipping_restrictions || [],
        reviews: { items: reviewRows, average: Number(rating.toFixed(1)), count: reviewRows.length },
      },
    });
  } catch (error) {
    logger.apiError('GET', '/api/products/[id]', error as Error, { productId: params.id });
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
