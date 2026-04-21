/**
 * Calculator Products API
 * GET /api/products/calculator-products
 * 
 * Get products suitable for sales calculator
 * Real data from database - no mock
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    // Get products with merchant info and profit calculations
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        cost_price,
        category,
        minimum_order_quantity,
        merchant:merchants (
          id,
          name
        )
      `)
      .eq('is_active', true)
      .eq('is_available', true)
      .not('cost_price', 'is', null)
      .order('merchant_id', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    // Calculate profit for each product
    const calculatorProducts = (products || []).map((p: any) => {
      const price = parseFloat(p.price) || 0;
      const cost = parseFloat(p.cost_price) || 0;
      const profit = price - cost;
      const profitPercentage = price > 0 ? (profit / price) * 100 : 0;

      return {
        id: p.id,
        name: p.name,
        merchantName: p.merchant?.name || 'Okänt företag',
        price: price,
        cost: cost,
        profit: profit,
        profitPercentage: profitPercentage,
        category: p.category || 'Övrigt',
        moq: p.minimum_order_quantity,
      };
    });

    // If no products in DB, return empty array (no mock data)
    if (calculatorProducts.length === 0) {
      return NextResponse.json({
        products: [],
        message: 'Inga produkter tillgängliga än. Lägg till produkter i databasen.',
      });
    }

    return NextResponse.json({
      products: calculatorProducts,
      count: calculatorProducts.length,
    });
  } catch (error) {
    console.error('Calculator products API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calculator products', products: [] },
      { status: 500 }
    );
  }
}
