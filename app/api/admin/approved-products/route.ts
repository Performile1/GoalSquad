import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  const { data: communityProducts, error } = await supabaseAdmin
    .from('community_products')
    .select('id, title, category, seller_name, approved_at, status')
    .eq('status', 'approved')
    .order('approved_at', { ascending: false, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch approved products' }, { status: 500 });
  }

  const { data: merchantProducts, error: merchantError } = await supabaseAdmin
    .from('products')
    .select('id, name, title, status, created_at, merchants(name, business_name, merchant_name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (merchantError) {
    return NextResponse.json({ error: 'Failed to fetch merchant products' }, { status: 500 });
  }

  return NextResponse.json({
    products: [
      ...(communityProducts || []).map((product) => ({
      id: product.id,
      name: product.title,
      category: product.category,
      company: product.seller_name,
      approvedAt: product.approved_at || new Date(0).toISOString(),
      status: product.status === 'pending_review' ? 'pending' : product.status === 'approved' ? 'approved' : 'rejected',
      restrictions: [],
      minAge: null,
      requiresParentalConsent: false,
      })),
      ...(merchantProducts || []).map((product: any) => ({
        id: product.id,
        name: product.name || product.title || 'Produkt',
        category: 'Webshop',
        company: product.merchants?.name || product.merchants?.business_name || product.merchants?.merchant_name || 'Merchant',
        approvedAt: product.created_at,
        status: 'approved',
        restrictions: [],
        minAge: null,
        requiresParentalConsent: false,
      })),
    ],
  });
}