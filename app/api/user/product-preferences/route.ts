import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/api-auth';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's product preferences
    const { data: preferences, error } = await supabase
      .from('consumer_product_preferences')
      .select(`
        *,
        products (
          id,
          name,
          title,
          price
        ),
        preferred_community:communities (
          id,
          name,
          location
        )
      `)
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching product preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { product_id, preferred_community_id, reason } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    // Create or update product preference
    const { data: preference, error } = await supabase
      .from('consumer_product_preferences')
      .upsert({
        user_id: authUser.id,
        product_id,
        preferred_community_id,
        reason,
      })
      .select(`
        *,
        products (
          id,
          name,
          title,
          price
        ),
        preferred_community:communities (
          id,
          name,
          location
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ preference });
  } catch (error) {
    console.error('Error saving product preference:', error);
    return NextResponse.json({ error: 'Failed to save preference' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const product_id = searchParams.get('product_id');

    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    // Delete product preference
    const { error } = await supabase
      .from('consumer_product_preferences')
      .delete()
      .eq('user_id', authUser.id)
      .eq('product_id', product_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product preference:', error);
    return NextResponse.json({ error: 'Failed to delete preference' }, { status: 500 });
  }
}
