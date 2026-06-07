import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Return approved community products as campaign products
    // (No direct campaign_products table exists; this is a shim)
    const { data: products, error } = await supabaseAdmin
      .from('community_products')
      .select('id, title, description, price, image_urls, stock, seller_name, status')
      .eq('status', 'approved')
      .limit(20);

    if (error) throw error;

    const formatted = (products || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      imageUrl: p.image_urls?.[0],
      stock: p.stock,
      sellerName: p.seller_name,
    }));

    return NextResponse.json({ products: formatted });
  } catch (error) {
    logger.apiError('GET', `/api/campaigns/${params.id}/products`, error as Error);
    return NextResponse.json({ products: [] });
  }
}
