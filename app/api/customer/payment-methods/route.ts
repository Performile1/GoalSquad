import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuthUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('customer_payment_methods').select('id, brand, last4, exp_month, exp_year, is_default, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
  return NextResponse.json({ paymentMethods: data || [] });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  if (!body.paymentMethodId || typeof body.paymentMethodId !== 'string') return NextResponse.json({ error: 'Stripe payment method required' }, { status: 400 });
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Payment provider is not configured' }, { status: 503 });
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' as any });
    const paymentMethod = await stripe.paymentMethods.retrieve(body.paymentMethodId);
    if (paymentMethod.type !== 'card' || !paymentMethod.card) return NextResponse.json({ error: 'Only card payment methods are supported' }, { status: 400 });
    const { data, error } = await supabaseAdmin.from('customer_payment_methods').insert({ user_id: user.id, stripe_payment_method_id: paymentMethod.id, brand: paymentMethod.card.brand, last4: paymentMethod.card.last4, exp_month: paymentMethod.card.exp_month, exp_year: paymentMethod.card.exp_year, is_default: Boolean(body.isDefault) }).select('id, brand, last4, exp_month, exp_year, is_default, created_at').single();
    if (error) throw error;
    return NextResponse.json({ paymentMethod: data }, { status: 201 });
  } catch (error) {
    console.error('Payment method creation failed', error);
    return NextResponse.json({ error: 'Failed to save payment method' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Payment method id required' }, { status: 400 });
  const { data: method } = await supabaseAdmin.from('customer_payment_methods').select('stripe_payment_method_id').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!method) return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
  if (process.env.STRIPE_SECRET_KEY) await new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' as any }).paymentMethods.detach(method.stripe_payment_method_id);
  const { error } = await supabaseAdmin.from('customer_payment_methods').delete().eq('id', id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'Failed to delete payment method' }, { status: 500 });
  return NextResponse.json({ success: true });
}
