import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get('productId');
  if (!productId) return NextResponse.json({ error: 'Product id required' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('product_reviews').select('id, user_id, product_id, order_id, rating, title, comment, verified_purchase, helpful_count, created_at').eq('product_id', productId).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  return NextResponse.json({ reviews: data || [] });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  if (!body.productId || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) return NextResponse.json({ error: 'Product and rating 1-5 required' }, { status: 400 });
  let verifiedPurchase = false;
  if (body.orderId) {
    const { data: order } = await supabaseAdmin.from('orders').select('id').eq('id', body.orderId).eq('user_id', user.id).maybeSingle();
    if (order) verifiedPurchase = true;
  }
  const { data, error } = await supabaseAdmin.from('product_reviews').insert({ user_id: user.id, product_id: body.productId, order_id: body.orderId || null, rating: body.rating, title: body.title || null, comment: body.comment || null, verified_purchase: verifiedPurchase }).select().single();
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'Review already exists' : 'Failed to save review' }, { status: error.code === '23505' ? 409 : 500 });
  return NextResponse.json({ review: data }, { status: 201 });
}
