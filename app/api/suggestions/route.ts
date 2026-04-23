import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { productUrl, company, productInfo, category, suggestionType } = body;

    // Validate required fields based on suggestion type
    if (suggestionType === 'product_url' && !productUrl) {
      return NextResponse.json({ error: 'Product URL is required' }, { status: 400 });
    }
    if (suggestionType === 'company' && !company) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }
    if (suggestionType === 'product_info' && !productInfo) {
      return NextResponse.json({ error: 'Product info is required' }, { status: 400 });
    }
    if (suggestionType === 'category' && !category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    // Insert suggestion into product_suggestions table
    const { data, error } = await supabaseAdmin
      .from('product_suggestions')
      .insert({
        user_id: user.id,
        suggestion_type: suggestionType,
        product_url: productUrl ?? null,
        company: company ?? null,
        product_info: productInfo ?? null,
        category: category ?? null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create suggestion:', error);
      return NextResponse.json({ error: 'Failed to create suggestion' }, { status: 500 });
    }

    return NextResponse.json({ success: true, suggestion: data });
  } catch (error) {
    console.error('Suggestion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
