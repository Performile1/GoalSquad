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
    if (!authUser || authUser.role !== 'gs_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const sortField = searchParams.get('sortField') || 'total_sales';
    const sortDir = searchParams.get('sortDir') || 'desc';
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('communities')
      .select(`
        id,
        name,
        slug,
        community_type,
        total_members,
        total_sales,
        total_commission,
        treasury_available,
        treasury_held,
        is_active,
        location,
        created_at
      `, { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (type === 'forening') {
      query = query.eq('community_type', 'forening');
    } else if (type === 'klubb') {
      query = query.eq('community_type', 'klubb');
    } else if (type === 'klass') {
      query = query.eq('community_type', 'klass');
    }

    query = query.order(sortField as any, { ascending: sortDir === 'asc' });

    const { data: communities, error, count } = await query.range(offset, offset + pageSize - 1);

    if (error) throw error;

    const formattedCommunities = (communities || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      community_type: c.community_type,
      total_members: c.total_members || 0,
      total_sales: c.total_sales || 0,
      total_commission: c.total_commission || 0,
      treasury_available: c.treasury_available || 0,
      treasury_held: c.treasury_held || 0,
      is_active: c.is_active,
      location: c.location,
      created_at: c.created_at,
    }));

    return NextResponse.json({
      communities: formattedCommunities,
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Admin communities API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
