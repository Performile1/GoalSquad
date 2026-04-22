/**
 * Admin Users API
 * GET /api/admin/users
 *
 * Query params:
 *   page, pageSize, sortField, sortDir, search, role, active
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, parseInt(searchParams.get('page')     ?? '1'));
    const pageSize = Math.min(100, parseInt(searchParams.get('pageSize') ?? '20'));
    const sortField = searchParams.get('sortField') ?? 'created_at';
    const sortDir   = searchParams.get('sortDir')   === 'asc' ? true : false;
    const search    = searchParams.get('search')   ?? '';
    const role      = searchParams.get('role')     ?? '';
    const activeOnly = searchParams.get('active')  === 'true';

    const fieldMap: Record<string, string> = {
      created_at: 'created_at',
      email: 'email',
      display_name: 'full_name',
      role: 'role',
    };
    const safeSort = fieldMap[sortField] ?? 'created_at';

    let query = supabaseAdmin
      .from('profiles')
      .select(
        `id, email, full_name, display_name, avatar_url, role, is_active, created_at,
         seller_id, community_id, merchant_id`,
        { count: 'exact' }
      )
      .order(safeSort, { ascending: sortDir })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }
    if (role) {
      query = query.eq('role', role);
    }
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Admin users query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      users: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (err) {
    console.error('Admin users error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
