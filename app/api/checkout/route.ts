/**
 * POST /api/checkout - Create order and Stripe Checkout session
 *
 * Body:
 *   items: { productId, communityProductId?, quantity }[]
 *   shippingAddress: { name, email, phone, address, city, postalCode, country }
 *   warehouseId?: string
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
});

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { items, shippingAddress, warehouseId } = body;

    if (!items?.length || !shippingAddress) {
      return NextResponse.json({ error: 'Missing items or shipping address' }, { status: 400 });
    }

    // --- Fetch products ---
    const productIds = items.map((i: any) => i.productId).filter(Boolean);
    const communityProductIds = items.map((i: any) => i.communityProductId).filter(Boolean);

    const { data: products, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, title, name, price, currency, merchant_id')
      .in('id', productIds);

    if (productError || !products?.length) {
      return NextResponse.json({ error: 'Products not found' }, { status: 404 });
    }

    const productMap = new Map(products.map((p: any) => [p.id, p]));

    // --- Fetch community products if any ---
    let communityProductMap = new Map();
    if (communityProductIds.length > 0) {
      const { data: communityProducts } = await supabaseAdmin
        .from('community_products')
        .select('id, title, price, seller_name, community_name')
        .in('id', communityProductIds);
      if (communityProducts) {
        communityProductMap = new Map(communityProducts.map((p: any) => [p.id, p]));
      }
    }

    // --- Build order items & Stripe line items ---
    let orderTotal = 0;
    const orderItems: any[] = [];
    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let orderCommunityId: string | null = null;
    let orderSellerId: string | null = null;

    // If warehouse_id is provided, check if it's a warehouse partner (community)
    if (warehouseId) {
      const { data: warehouse } = await supabaseAdmin
        .from('warehouses')
        .select('id, community_id')
        .eq('id', warehouseId)
        .single();
      if (warehouse?.community_id) {
        orderCommunityId = warehouse.community_id;
      }
    }

    for (const item of items) {
      const product = productMap.get(item.productId);
      const communityProduct = communityProductMap.get(item.communityProductId);

      // Use community product if available, otherwise regular product
      const unitPrice = communityProduct ? parseFloat(communityProduct.price) : parseFloat(product.price);
      const productName = communityProduct ? communityProduct.title : (product.title ?? product.name);
      const subtotal = unitPrice * item.quantity;
      orderTotal += subtotal;

      // If community product, set community_id (seller would be linked via user profile)
      if (communityProduct && !orderCommunityId) {
        // Look up community by name - this is a simplified approach
        // In production, community_products should have community_id FK
        const { data: community } = await supabaseAdmin
          .from('communities')
          .select('id')
          .eq('name', communityProduct.community_name)
          .single();
        if (community) {
          orderCommunityId = community.id;
        }
      }

      orderItems.push({
        product_id: item.productId,
        community_product_id: item.communityProductId ?? null,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal,
        sku: product?.id ?? communityProduct?.id,
      });

      stripeLineItems.push({
        price_data: {
          currency: 'SEK',
          product_data: {
            name: productName ?? 'Produkt',
            metadata: {
              product_id: item.productId,
              community_product_id: item.communityProductId ?? '',
            },
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity: item.quantity,
      });
    }

    if (!orderItems.length) {
      return NextResponse.json({ error: 'No valid items' }, { status: 400 });
    }

    // --- Create order in DB ---
    const orderNumber = `GS-${Date.now().toString(36).toUpperCase()}`;

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: user.id,
        status: 'pending',
        total_amount: orderTotal,
        total: orderTotal,
        currency: 'SEK',
        shipping_address: shippingAddress,
        warehouse_id: warehouseId ?? null,
        community_id: orderCommunityId,
        seller_id: orderSellerId,
        metadata: {},
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Failed to create order:', orderError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // --- Insert order items ---
    const itemsWithOrderId = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    await supabaseAdmin.from('order_items').insert(itemsWithOrderId);

    // --- Create Stripe Checkout session ---
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: stripeLineItems,
      mode: 'payment',
      customer_email: shippingAddress.email,
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
        user_id: user.id,
      },
      success_url: `${baseUrl}/orders?session_id={CHECKOUT_SESSION_ID}&order=${order.id}`,
      cancel_url: `${baseUrl}/cart`,
    });

    // --- Save Stripe session ID on order ---
    await supabaseAdmin
      .from('orders')
      .update({ metadata: { stripe_session_id: session.id } })
      .eq('id', order.id);

    return NextResponse.json({
      sessionId: session.id,
      sessionUrl: session.url,
      orderId: order.id,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
