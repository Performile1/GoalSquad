import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, display_name, avatar_url, role, is_active, is_verified, created_at, updated_at, seller_id, community_id, merchant_id')
      .eq('id', params.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) return NextResponse.json({ error: 'Användaren hittades inte' }, { status: 404 });

    const [orders, achievements, seller, merchant, community, warehouse] = await Promise.all([
      supabaseAdmin.from('orders').select('id, total_amount, status, created_at', { count: 'exact' }).eq('customer_id', params.id).order('created_at', { ascending: false }).limit(5),
      supabaseAdmin.from('user_achievements').select('id, xp', { count: 'exact' }).eq('user_id', params.id),
      supabaseAdmin.from('seller_profiles').select('id, full_name').eq('user_id', params.id).maybeSingle(),
      supabaseAdmin.from('merchants').select('id, merchant_name').eq('user_id', params.id).maybeSingle(),
      supabaseAdmin.from('communities').select('id, name').eq('owner_id', params.id).maybeSingle(),
      supabaseAdmin.from('warehouse_partners').select('id, partner_name').eq('user_id', params.id).maybeSingle(),
    ]);

    const totalSpent = (orders.data || []).reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const totalXp = (achievements.data || []).reduce((sum, achievement) => sum + Number(achievement.xp || 0), 0);

    return NextResponse.json({
      profile,
      stats: { orders: orders.count || 0, totalSpent, achievements: achievements.count || 0, totalXp },
      recentOrders: orders.data || [],
      entities: { seller: seller.data, merchant: merchant.data, community: community.data, warehouse: warehouse.data },
    });
  } catch (error) {
    console.error('Admin user detail failed', error);
    return NextResponse.json({ error: 'Kunde inte hämta användaren' }, { status: 500 });
  }
}
