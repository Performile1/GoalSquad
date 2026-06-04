import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function PATCH(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  const campaignId = params.campaignId;
  const loggerContext = { route: `/api/admin/campaigns/${campaignId}/rules`, method: 'PATCH' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || session.user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      grace_period_hours,
      auto_extend_enabled,
      auto_extend_days,
      auto_extend_threshold_pct,
      manual_dispense_granted
    } = body;

    const { error } = await supabaseAdmin
      .from('community_campaigns')
      .update({
        grace_period_hours,
        auto_extend_enabled,
        auto_extend_days,
        auto_extend_threshold_pct,
        manual_dispense_granted,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    if (error) throw error;

    await supabaseAdmin.from('audit_logs').insert({
      actor_id: session.user.id,
      action: 'CAMPAIGN_RULES_UPDATED',
      entity_type: 'community_campaigns',
      entity_id: campaignId,
      changes: body
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
