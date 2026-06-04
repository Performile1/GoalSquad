import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET: Hämta plattformsinställningar
export async function GET() {
  const loggerContext = { route: '/api/admin/settings', method: 'GET' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Kontrollera admin behörighet
    const userRole = session.user.user_metadata?.role;
    const userDetailedRole = session.user.user_metadata?.detailed_role;
    if (!['admin', 'platform_admin'].includes(userRole || userDetailedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('platform_settings')
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, settings: data });
  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// POST: Uppdatera plattformsinställningar
export async function POST(request: Request) {
  const loggerContext = { route: '/api/admin/settings', method: 'POST' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Kontrollera admin behörighet
    const userRole = session.user.user_metadata?.role;
    const userDetailedRole = session.user.user_metadata?.detailed_role;
    if (!['admin', 'platform_admin'].includes(userRole || userDetailedRole || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settings = await request.json();

    // Hämta nuvarande värden för audit log
    const { data: currentSettings } = await supabaseAdmin
      .from('platform_settings')
      .select('*')
      .single();

    const { data: updatedSettings, error } = await supabaseAdmin
      .from('platform_settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('id', currentSettings?.id)
      .select()
      .single();

    if (error) throw error;

    // Skriv till audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'PLATFORM_SETTINGS_UPDATE',
      entity_type: 'platform_settings',
      entity_id: updatedSettings.id,
      changes: {
        before: currentSettings,
        after: updatedSettings
      }
    });

    console.log(JSON.stringify({ level: 'info', message: 'Platform settings updated by admin', ...loggerContext }));

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
