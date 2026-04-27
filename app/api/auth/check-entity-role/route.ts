import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Check entity tables using service role to bypass RLS
    const [merchant, seller, warehouse, community] = await Promise.all([
      supabase.from('merchants').select('id').eq('user_id', userId).maybeSingle(),
      supabase.from('seller_profiles').select('id').eq('user_id', userId).maybeSingle(),
      supabase.from('warehouse_partners').select('id').eq('user_id', userId).maybeSingle(),
      supabase.from('communities').select('id').eq('owner_id', userId).maybeSingle(),
    ]);

    const result = {
      merchant: merchant.data?.id || null,
      seller: seller.data?.id || null,
      warehouse: warehouse.data?.id || null,
      community: community.data?.id || null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking entity role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
