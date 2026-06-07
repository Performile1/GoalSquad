import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Requires live auth cookies — must not be prerendered.
export const dynamic = 'force-dynamic';
import { requireUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  let userId: string | null = null;
  try {
    // 1. Require an authenticated session.
    const auth = await requireUser();
    if ('error' in auth) return auth.error;
    const { user, supabase } = auth;

    // 2. Resolve target. Default to the caller's own id.
    const url = new URL(request.url);
    userId = url.searchParams.get('userId') ?? user.id;

    // 3. Ownership check — only your own profile, unless you are gs_admin.
    if (userId !== user.id) {
      const { data: me } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (me?.role !== 'gs_admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // 4. Fetch the profile (service role; access already authorized above).
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.apiError('GET', '/api/auth/get-profile', error as Error, { userId: userId ?? 'unknown' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
