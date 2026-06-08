import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { userHasRole } from '@/lib/api-auth';

export async function POST(request: Request) {
  const loggerContext = { route: '/api/admin/users/update', method: 'POST' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    // 1. Autentiseringskontroll
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Strikt rollkontroll - Endast existerande admins får ändra roller
    if (!(await userHasRole(session.user.id, 'gs_admin'))) {
      console.log(JSON.stringify({ level: 'warn', message: 'Unauthorized RBAC modification attempt', actor: session.user.id, ...loggerContext }));
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const { targetUserId, newRole } = await request.json();
    const validRoles = ['gs_admin', 'merchant', 'seller', 'community', 'warehouse', 'user'];

    if (!targetUserId || !validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid payload parameters' }, { status: 400 });
    }

    // 3. Hämta nuvarande roll för att dokumentera förändringen (Audit trail)
    const { data: currentProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('id', targetUserId)
      .single();

    if (profileError || !currentProfile) {
      return NextResponse.json({ error: 'Target user profile not found' }, { status: 404 });
    }

    // Evita att en admin råkar nedgradera sig själv om det är sista admin
    if (targetUserId === session.user.id && newRole !== 'gs_admin') {
      return NextResponse.json({ error: 'You cannot demote your own admin account.' }, { status: 400 });
    }

    // 4. Uppdatera profilen i databasen
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', targetUserId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 5. Skriv till vår oförstörbara Audit Log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'USER_ROLE_UPDATE',
      entity_type: 'profiles',
      entity_id: targetUserId,
      changes: {
        before: { role: currentProfile.role, email: currentProfile.email },
        after: { role: newRole, email: currentProfile.email }
      }
    });

    console.log(JSON.stringify({ 
      level: 'info', 
      message: `User ${targetUserId} role updated from ${currentProfile.role} to ${newRole} by admin ${session.user.id}`, 
      ...loggerContext 
    }));

    return NextResponse.json({ success: true, profile: updatedProfile });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
