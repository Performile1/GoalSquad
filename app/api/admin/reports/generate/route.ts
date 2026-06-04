import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  const loggerContext = { route: '/api/admin/reports/generate', method: 'POST' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !['admin', 'warehouse_staff'].includes(session.user.user_metadata?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { reportType, scopeId, name } = await request.json();

    if (!reportType || !scopeId || !name) {
      return NextResponse.json({ error: 'Missing payload parameters' }, { status: 400 });
    }

    const { data: reportJob, error: jobError } = await supabaseAdmin
      .from('reports')
      .insert({
        name: name,
        report_type: reportType,
        scope_id: scopeId,
        status: 'processing',
        generated_by: session.user.id
      })
      .select()
      .single();

    if (jobError) throw jobError;

    processReportInBackground(reportJob.id, scopeId);

    return NextResponse.json({ 
      success: true, 
      message: 'Rapportgenerering har startats i bakgrunden.', 
      reportId: reportJob.id 
    });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

async function processReportInBackground(reportId: string, groupId: string) {
  try {
    const mockStorageUrl = `https://storage.platform.se/reports/${reportId}.csv`;

    await supabaseAdmin
      .from('reports')
      .update({
        status: 'completed',
        file_url: mockStorageUrl
      })
      .eq('id', reportId);

  } catch (err: any) {
    await supabaseAdmin
      .from('reports')
      .update({ status: 'failed', error_message: err.message })
      .eq('id', reportId);
  }
}
