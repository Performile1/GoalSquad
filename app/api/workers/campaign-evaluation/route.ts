import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getActiveCampaignsForEvaluation, evaluateCampaignRules } from '@/lib/campaignRulesEngine';
import { processCampaignSettlement, processCampaignVoid } from '@/lib/stripeSettlement';
import { sendCampaignSuccessNotification, sendCampaignFailureNotification } from '@/lib/campaignNotifications';

export async function POST(request: Request) {
  const loggerContext = { route: '/api/workers/campaign-evaluation', method: 'POST' };

  try {
    const { secret } = await request.json();

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaigns = await getActiveCampaignsForEvaluation();
    const results: any[] = [];

    for (const campaign of campaigns) {
      const evaluation = await evaluateCampaignRules(campaign);

      if (evaluation.action === 'AUTO_EXTEND' && evaluation.newEndDate) {
        await supabaseAdmin
          .from('campaigns')
          .update({ end_date: evaluation.newEndDate })
          .eq('id', campaign.id);

        await supabaseAdmin.from('audit_logs').insert({
          actor_id: 'system-worker',
          action: 'CAMPAIGN_AUTO_EXTENDED',
          entity_type: 'campaigns',
          entity_id: campaign.id,
          changes: { 
            reason: evaluation.reason,
            new_end_date: evaluation.newEndDate 
          }
        });

        results.push({ campaignId: campaign.id, action: 'AUTO_EXTEND', reason: evaluation.reason });
      } 
      else if (evaluation.action === 'EXECUTE_SUCCESS') {
        await supabaseAdmin
          .from('campaigns')
          .update({ 
            status: 'moq_succeeded',
            processed_at: new Date().toISOString()
          })
          .eq('id', campaign.id);

        await supabaseAdmin.from('audit_logs').insert({
          actor_id: 'system-worker',
          action: 'CAMPAIGN_MOQ_SUCCEEDED',
          entity_type: 'campaigns',
          entity_id: campaign.id,
          changes: { reason: evaluation.reason }
        });

        await processCampaignSettlement(campaign.id);
        await sendCampaignSuccessNotification(campaign.id);

        results.push({ campaignId: campaign.id, action: 'EXECUTE_SUCCESS', reason: evaluation.reason });
      }
      else if (evaluation.action === 'EXECUTE_FAILURE') {
        await supabaseAdmin
          .from('campaigns')
          .update({ 
            status: 'moq_failed',
            processed_at: new Date().toISOString()
          })
          .eq('id', campaign.id);

        await supabaseAdmin.from('audit_logs').insert({
          actor_id: 'system-worker',
          action: 'CAMPAIGN_MOQ_FAILED',
          entity_type: 'campaigns',
          entity_id: campaign.id,
          changes: { reason: evaluation.reason }
        });

        await processCampaignVoid(campaign.id);
        await sendCampaignFailureNotification(campaign.id);

        results.push({ campaignId: campaign.id, action: 'EXECUTE_FAILURE', reason: evaluation.reason });
      }
    }

    return NextResponse.json({ 
      success: true, 
      evaluated: campaigns.length,
      results 
    });

  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
