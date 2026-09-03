import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// GET: Hämta plattformsinställningar
export async function GET() {
  const loggerContext = { route: '/api/admin/settings', method: 'GET' };

  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

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
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

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
      actor_id: auth.user.id,
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
