import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = params.id;

    const { data: rows, error } = await supabaseAdmin
      .from('campaign_products')
      .select(`
        id,
        campaign_price,
        moq_per_seller,
        sort_order,
        products:product_id (id, title, description, price, image_urls),
        community_products:community_product_id (id, price, stock, seller_name, image_urls)
      `)
      .eq('campaign_id', campaignId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(50);

    if (error) throw error;

    const formatted = (rows || []).map((row: any) => {
      const product = row.products;
      const cp = row.community_products;
      return {
        id: product?.id ?? cp?.id,
        title: product?.title ?? cp?.title,
        description: product?.description,
        price: row.campaign_price ?? cp?.price ?? product?.price,
        imageUrl: cp?.image_urls?.[0] ?? product?.image_urls?.[0],
        stock: cp?.stock ?? null,
        sellerName: cp?.seller_name ?? null,
        moqPerSeller: row.moq_per_seller,
      };
    });

    return NextResponse.json({ products: formatted });
  } catch (error) {
    logger.apiError('GET', `/api/campaigns/${params.id}/products`, error as Error);
    return NextResponse.json({ products: [] });
  }
}
