import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const loggerContext = { route: '/api/admin/settings/global', method: 'GET' };

  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { data: settings, error } = await supabaseAdmin
      .from('platform_settings')
      .select('*');

    if (error) throw error;

    const settingsMap: Record<string, any> = {};
    settings?.forEach((s: any) => {
      settingsMap[s.key] = s.value?.data ?? s.value;
    });

    return NextResponse.json({ success: true, settings: settingsMap });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const loggerContext = { route: '/api/admin/settings/global', method: 'PUT' };

  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { settings } = await request.json();

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Malformed settings payload' }, { status: 400 });
    }

    for (const [key, value] of Object.entries(settings)) {
      const { error } = await supabaseAdmin
        .from('platform_settings')
        .upsert({
          key,
          value: { data: value },
          updated_by: auth.user.id,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
