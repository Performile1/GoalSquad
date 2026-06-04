import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const communityId = params.id;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const featured = searchParams.get('featured');

    // Verify user is a member of the community
    const { data: member, error: memberError } = await supabaseAdmin
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', authUser.id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get community selected products
    let query = supabaseAdmin
      .from('community_selected_products')
      .select(`
        *,
        products (
          id,
          name,
          title,
          description,
          price,
          image_urls
        ),
        merchants (
          id,
          business_name,
          company_description
        )
      `)
      .eq('community_id', communityId);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    query = query.order('priority', { ascending: false }).order('created_at', { ascending: false });

    const { data: products, error } = await query;

    if (error) throw error;

    return NextResponse.json({ products });
  } catch (error) {
    logger.apiError('GET', '/api/communities/[id]/products', error as Error, { communityId: params.id });
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const communityId = params.id;
    const body = await req.json();
    const { product_id, merchant_id, commission_percent, is_featured, priority, notes } = body;

    if (!product_id || !merchant_id) {
      return NextResponse.json({ error: 'product_id and merchant_id are required' }, { status: 400 });
    }

    // Verify user is admin or moderator of the community
    const { data: member, error: memberError } = await supabaseAdmin
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', authUser.id)
      .single();

    if (memberError || !member || !['admin', 'moderator'].includes(member.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create community-product selection
    const { data: product, error } = await supabaseAdmin
      .from('community_selected_products')
      .insert({
        community_id: communityId,
        product_id,
        merchant_id,
        commission_percent: commission_percent || 12.00,
        is_featured: is_featured || false,
        priority: priority || 0,
        notes,
      })
      .select(`
        *,
        products (
          id,
          name,
          title,
          description,
          price,
          image_urls
        ),
        merchants (
          id,
          business_name,
          company_description
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ product });
  } catch (error) {
    logger.apiError('POST', '/api/communities/[id]/products', error as Error, { communityId: params.id });
    return NextResponse.json({ error: 'Failed to add product' }, { status: 500 });
  }
}
