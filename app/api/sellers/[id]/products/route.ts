import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';
import { validateParams, idParamSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sellers/[id]/products
 * Returns all campaign products available to a seller.
 * Sellers see products from campaigns they have joined (or their community's active campaigns).
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paramCheck = validateParams(params, idParamSchema);
    if ('error' in paramCheck) return paramCheck.error;
    const sellerProfileId = paramCheck.data.id;

    // 1. Resolve seller profile
    const { data: sellerProfile, error: sellerErr } = await supabaseAdmin
      .from('seller_profiles')
      .select('id, user_id, community_id')
      .eq('id', sellerProfileId)
      .single();

    if (sellerErr || !sellerProfile) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // 2. Ownership check
    if (sellerProfile.user_id !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Find campaigns this seller has joined
    const { data: joinedCampaigns, error: campaignErr } = await supabaseAdmin
      .from('campaign_sellers')
      .select('campaign_id')
      .eq('seller_id', sellerProfile.id)
      .eq('status', 'active');

    if (campaignErr) throw campaignErr;

    const campaignIds = (joinedCampaigns || []).map((c: any) => c.campaign_id);

    if (campaignIds.length === 0) {
      return NextResponse.json({ products: [], campaigns: [] });
    }

    // 4. Fetch products for those campaigns
    const { data: campaignProducts, error: cpError } = await supabaseAdmin
      .from('campaign_products')
      .select(`
        id,
        campaign_price,
        moq_per_seller,
        is_active,
        sort_order,
        campaigns:campaign_id (id, name, start_date, end_date),
        products:product_id (id, name, description, base_price, retail_price, category, brand, images, stock_quantity, weight_grams, status),
        community_products:community_product_id (id, price, stock, seller_name, image_urls)
      `)
      .in('campaign_id', campaignIds)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(200);

    if (cpError) throw cpError;

    // 5. Format response
    const formatted = (campaignProducts || []).map((row: any) => {
      const product = row.products;
      const cp = row.community_products;
      const campaign = row.campaigns;

      return {
        campaignProductId: row.id,
        campaign: {
          id: campaign?.id,
          name: campaign?.name,
          startDate: campaign?.start_date,
          endDate: campaign?.end_date,
        },
        product: {
          id: product?.id ?? cp?.id,
          name: product?.name ?? cp?.seller_name ?? 'Okänd produkt',
          description: product?.description,
          basePrice: product?.base_price,
          retailPrice: product?.retail_price,
          campaignPrice: row.campaign_price ?? cp?.price ?? product?.base_price,
          category: product?.category,
          brand: product?.brand,
          imageUrl: cp?.image_urls?.[0] ?? product?.images?.[0] ?? null,
          stockQuantity: cp?.stock ?? product?.stock_quantity ?? 0,
          weightGrams: product?.weight_grams,
          status: product?.status ?? 'active',
        },
        moqPerSeller: row.moq_per_seller ?? 1,
      };
    });

    return NextResponse.json({
      products: formatted,
      campaigns: campaignIds.length,
    });
  } catch (error) {
    logger.apiError('GET', `/api/sellers/${params.id}/products`, error as Error, { sellerId: params.id });
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
