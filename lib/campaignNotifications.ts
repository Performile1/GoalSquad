import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function sendCampaignSuccessNotification(campaignId: string) {
  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('campaigns')
    .select('*, groups(name, leader_id)')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) return;

  const { data: leader } = await supabaseAdmin
    .from('profiles')
    .select('email, first_name')
    .eq('id', campaign.groups?.leader_id)
    .single();

  await supabaseAdmin.from('notifications').insert({
    user_id: campaign.groups?.leader_id,
    title: 'Kampanj uppnådde sitt mål!',
    message: `Grattis! Kampanjen "${campaign.name}" har nått sitt MOQ-mål. Samlingspacksedeln är nu tillgänglig i adminpanelen.`,
    type: 'success',
    metadata: { campaign_id: campaignId }
  });

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: 'system-worker',
    action: 'CAMPAIGN_SUCCESS_NOTIFICATION_SENT',
    entity_type: 'campaigns',
    entity_id: campaignId,
    changes: { recipient: leader?.email }
  });
}

export async function sendCampaignFailureNotification(campaignId: string) {
  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('campaigns')
    .select('*, groups(name, leader_id)')
    .eq('id', campaignId)
    .single();

  if (campaignError || !campaign) return;

  const { data: leader } = await supabaseAdmin
    .from('profiles')
    .select('email, first_name')
    .eq('id', campaign.groups?.leader_id)
    .single();

  await supabaseAdmin.from('notifications').insert({
    user_id: campaign.groups?.leader_id,
    title: 'Kampanj nådde inte sitt mål',
    message: `Tyvärr nådde kampanjen "${campaign.name}" inte sitt MOQ-mål. Alla reservationer har hävats och inga pengar har debiterats.`,
    type: 'warning',
    metadata: { campaign_id: campaignId }
  });

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: 'system-worker',
    action: 'CAMPAIGN_FAILURE_NOTIFICATION_SENT',
    entity_type: 'campaigns',
    entity_id: campaignId,
    changes: { recipient: leader?.email }
  });
}
