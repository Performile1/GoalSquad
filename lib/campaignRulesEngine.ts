import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface CampaignRules {
  id: string;
  moq_target: number;
  current_sold_units: number;
  end_date: string;
  grace_period_hours: number;
  auto_extend_enabled: boolean;
  auto_extend_days: number;
  auto_extend_threshold_pct: number;
  manual_dispense_granted: boolean;
}

export interface RuleEvaluationResult {
  action: 'HOLD' | 'EXECUTE_SUCCESS' | 'EXECUTE_FAILURE' | 'AUTO_EXTEND';
  reason: string;
  newEndDate?: string;
}

export async function evaluateCampaignRules(campaign: CampaignRules): Promise<RuleEvaluationResult> {
  const now = new Date();
  const endDateWithGrace = new Date(campaign.end_date);
  endDateWithGrace.setHours(endDateWithGrace.getHours() + campaign.grace_period_hours);

  // Regelfall 1: Kampanjen har inte nått sitt (justerade) slutdatum än
  if (now < endDateWithGrace) {
    return { 
      action: 'HOLD', 
      reason: 'Kampanjen är fortfarande aktiv (eller befinner sig i grace period).' 
    };
  }

  // Räkna ut måluppfyllnad i procent
  const completionPct = (campaign.current_sold_units / campaign.moq_target) * 100;

  // Regelfall 2: MOQ är uppnått ELLER administratör har beviljat manuell dispens
  if (campaign.current_sold_units >= campaign.moq_target || campaign.manual_dispense_granted) {
    return { 
      action: 'EXECUTE_SUCCESS', 
      reason: campaign.manual_dispense_granted ? 'Godkänd via manuell dispens.' : 'MOQ uppnått.' 
    };
  }

  // Regelfall 3: MOQ har missats, men Automatisk Förlängning är aktiverad
  if (campaign.auto_extend_enabled) {
    // Kolla om de ligger tillräckligt nära målet för att förtjäna en förlängning
    if (completionPct >= campaign.auto_extend_threshold_pct) {
      const newEndDate = new Date(campaign.end_date);
      newEndDate.setDate(newEndDate.getDate() + campaign.auto_extend_days);

      return {
        action: 'AUTO_EXTEND',
        newEndDate: newEndDate.toISOString(),
        reason: `Nådde ${Math.round(completionPct)}% av målet. Förlänger automatiskt med ${campaign.auto_extend_days} dagar.` 
      };
    }
  }

  // Regelfall 4: Alla chanser är uttömda -> Kampanjen har misslyckats
  return { 
    action: 'EXECUTE_FAILURE', 
    reason: 'Slutdatum passerat utan att MOQ uppnåtts eller regler triggats.' 
  };
}

export async function getCampaignForEvaluation(campaignId: string): Promise<CampaignRules | null> {
  const { data: campaign, error } = await supabaseAdmin
    .from('campaigns')
    .select(`
      id,
      moq_target,
      end_date,
      grace_period_hours,
      auto_extend_enabled,
      auto_extend_days,
      auto_extend_threshold_pct,
      manual_dispense_granted,
      orders (
        id,
        order_items (
          quantity
        )
      )
    `)
    .eq('id', campaignId)
    .eq('status', 'active')
    .single();

  if (error || !campaign) return null;

  const currentSoldUnits = campaign.orders?.reduce((sum: number, order: any) => {
    return sum + (order.order_items?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0);
  }, 0) || 0;

  return {
    id: campaign.id,
    moq_target: campaign.moq_target,
    current_sold_units: currentSoldUnits,
    end_date: campaign.end_date,
    grace_period_hours: campaign.grace_period_hours || 0,
    auto_extend_enabled: campaign.auto_extend_enabled || false,
    auto_extend_days: campaign.auto_extend_days || 3,
    auto_extend_threshold_pct: campaign.auto_extend_threshold_pct || 90,
    manual_dispense_granted: campaign.manual_dispense_granted || false,
  };
}

export async function getActiveCampaignsForEvaluation(): Promise<CampaignRules[]> {
  const { data: campaigns, error } = await supabaseAdmin
    .from('campaigns')
    .select(`
      id,
      moq_target,
      end_date,
      grace_period_hours,
      auto_extend_enabled,
      auto_extend_days,
      auto_extend_threshold_pct,
      manual_dispense_granted,
      orders (
        id,
        order_items (
          quantity
        )
      )
    `)
    .eq('status', 'active')
    .lte('end_date', new Date().toISOString())
    .order('end_date', { ascending: true });

  if (error || !campaigns) return [];

  return campaigns.map((campaign: any) => {
    const currentSoldUnits = campaign.orders?.reduce((sum: number, order: any) => {
      return sum + (order.order_items?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0);
    }, 0) || 0;

    return {
      id: campaign.id,
      moq_target: campaign.moq_target,
      current_sold_units: currentSoldUnits,
      end_date: campaign.end_date,
      grace_period_hours: campaign.grace_period_hours || 0,
      auto_extend_enabled: campaign.auto_extend_enabled || false,
      auto_extend_days: campaign.auto_extend_days || 3,
      auto_extend_threshold_pct: campaign.auto_extend_threshold_pct || 90,
      manual_dispense_granted: campaign.manual_dispense_granted || false,
    };
  });
}
