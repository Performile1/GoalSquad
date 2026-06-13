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

export const dynamic = 'force-dynamic';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
});

// Zod validation schema for checkout request
const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid('Invalid product ID format'),
      communityProductId: z.string().uuid('Invalid community product ID format').optional().nullable(),
      quantity: z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1'),
    })
  ).min(1, 'At least one item is required'),
  shippingAddress: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    postalCode: z.string().min(3, 'Postal code is too short').max(10, 'Postal code is too long'),
    country: z.string().length(2, 'Country code must be 2 characters (ISO format)'),
  }),
  warehouseId: z.string().uuid('Invalid warehouse ID format').optional().nullable(),
  // The seller_profile.id (UUID) that should be credited for this order.
  sellerId: z.string().uuid('Invalid seller ID format').optional().nullable(),
  campaignId: z.string().uuid('Invalid campaign ID format').optional().nullable(),
});

export async function POST(req: NextRequest) {
  let userId: string | null = null;
  try {
    const user = await getAuthUser(req);
    userId = user?.id ?? null;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate request body with Zod
    const validatedData = checkoutSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validatedData.error.format() 
        },
        { status: 400 }
      );
    }
    
    const { items, shippingAddress, warehouseId, sellerId, campaignId } = validatedData.data;

    // --- Fetch products ---
    const productIds = items.map((i) => i.productId).filter(Boolean);
    const communityProductIds = items.map((i) => i.communityProductId).filter(Boolean);

    const { data: products, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, title, name, price, currency, merchant_id')
      .in('id', productIds);

    if (productError || !products?.length) {
      return NextResponse.json({ error: 'Products not found' }, { status: 404 });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // --- Fetch community products if any ---
    let communityProductMap = new Map();
    if (communityProductIds.length > 0) {
      const { data: communityProducts } = await supabaseAdmin
        .from('community_products')
        .select('id, title, price, seller_name, community_name')
        .in('id', communityProductIds);
      if (communityProducts) {
        communityProductMap = new Map(communityProducts.map((p) => [p.id, p]));
      }
    }

    // --- Build order items & Stripe line items ---
    let orderTotal = 0;
    const orderItems: Array<{
      product_id: string;
      community_product_id: string | null;
      quantity: number;
      unit_price: number;
      subtotal: number;
      sku: string;
    }> = [];
    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let orderCommunityId: string | null = null;
    let orderSellerId: string | null = null;

    // If warehouse_id is provided, check if it's a warehouse partner (community)
    if (warehouseId) {
      const { data: warehouse } = await supabaseAdmin
        .from('warehouse_partners')
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

      // Kontrollera att produkten faktiskt existerar innan vi beräknar pris
      if (!communityProduct && !product) {
        return NextResponse.json({ error: 'Product not found in database' }, { status: 400 });
      }

      // Use community product if available, otherwise regular product
      const unitPrice = communityProduct ? parseFloat(communityProduct.price) : parseFloat(product!.price);
      const productName = communityProduct ? communityProduct.title : (product!.title ?? product!.name);
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
        currency: 'SEK',
        shipping_address: shippingAddress,
        warehouse_id: warehouseId ?? null,
        community_id: orderCommunityId,
        seller_id: sellerId ?? orderSellerId,
        metadata: {},
      })
      .select()
      .single();

    if (orderError || !order) {
      logger.dbError('INSERT', 'orders', orderError ?? new Error('Unknown order error'), { userId: user?.id });
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
        seller_id: sellerId ?? '',
        campaign_id: campaignId ?? '',
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
    logger.apiError('POST', '/api/checkout', error as Error, { userId: userId ?? 'unknown' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
