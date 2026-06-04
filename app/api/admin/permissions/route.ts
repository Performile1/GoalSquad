import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get('userId');
  const loggerContext = { route: '/api/admin/permissions', method: 'GET' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || session.user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin status required.' }, { status: 403 });
    }

    const { data: allPermissions, error: permError } = await supabaseAdmin
      .from('permissions')
      .select('id, code, name, description')
      .order('code', { ascending: true });

    if (permError) throw permError;

    let assignedPermissionIds: string[] = [];
    if (targetUserId) {
      const { data: assigned, error: assignError } = await supabaseAdmin
        .from('profile_permissions')
        .select('permission_id')
        .eq('profile_id', targetUserId);

      if (assignError) throw assignError;
      assignedPermissionIds = assigned.map((p) => p.permission_id);
    }

    return NextResponse.json({
      success: true,
      allPermissions: allPermissions || [],
      assignedPermissionIds: assignedPermissionIds
    });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
