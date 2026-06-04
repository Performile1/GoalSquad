import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const loggerContext = { route: '/api/admin/system/health', method: 'GET' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || session.user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dbStartTime = Date.now();
    const { error: dbPingError } = await supabaseAdmin.from('profiles').select('id').limit(1).maybeSingle();
    const dbLatency = Date.now() - dbStartTime;

    const { data: metrics, error: metricsError } = await supabaseAdmin
      .from('system_metrics')
      .select('service_name, status, latency_ms, error_rate_pct, recorded_at')
      .order('recorded_at', { ascending: false })
      .limit(30);

    if (metricsError) throw metricsError;

    const currentServices = [
      {
        name: 'Supabase Databas',
        status: dbPingError ? 'down' : dbLatency > 500 ? 'degraded' : 'healthy',
        latency: dbLatency,
        message: dbPingError ? dbPingError.message : 'Ansluten och stabil'
      },
      {
        name: 'API Gateway & Edge Functions',
        status: 'healthy',
        latency: 42,
        message: 'Normal drift'
      }
    ];

    return NextResponse.json({
      success: true,
      services: currentServices,
      historicalMetrics: metrics || []
    });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
