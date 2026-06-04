import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  const loggerContext = { route: '/api/admin/permissions/assign', method: 'POST' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || session.user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const { targetUserId, permissionIds } = await request.json();

    if (!targetUserId || !Array.isArray(permissionIds)) {
      return NextResponse.json({ error: 'Missing or malformed payload parameters' }, { status: 400 });
    }

    if (targetUserId === session.user.id && permissionIds.length === 0) {
      return NextResponse.json({ error: 'Safety lock: You cannot revoke all permissions from your own admin account.' }, { status: 400 });
    }

    const { data: beforeState } = await supabaseAdmin
      .from('profile_permissions')
      .select('permission_id')
      .eq('profile_id', targetUserId);

    const oldIds = beforeState?.map(p => p.permission_id) || [];

    const { error: deleteError } = await supabaseAdmin
      .from('profile_permissions')
      .delete()
      .eq('profile_id', targetUserId);

    if (deleteError) throw deleteError;

    if (permissionIds.length > 0) {
      const insertPayload = permissionIds.map((id: string) => ({
        profile_id: targetUserId,
        permission_id: id
      }));

      const { error: insertError } = await supabaseAdmin
        .from('profile_permissions')
        .insert(insertPayload);

      if (insertError) throw insertError;
    }

    await supabaseAdmin.from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'USER_PERMISSIONS_SYNC',
      entity_type: 'profiles',
      entity_id: targetUserId,
      changes: {
        before: { permission_ids: oldIds },
        after: { permission_ids: permissionIds }
      }
    });

    console.log(JSON.stringify({ 
      level: 'info', 
      message: `Permissions updated for user ${targetUserId} by admin ${session.user.id}`, 
      ...loggerContext 
    }));

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
