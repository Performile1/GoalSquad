import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 1. Hämta kampanjer med MOQ-status
    const { data: campaigns, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('id, name, status, moq_target, end_date, created_at')
      .in('status', ['moq_succeeded', 'moq_failed', 'closed'])
      .order('created_at', { ascending: false });

    if (campaignError) throw campaignError;

    // 2. Beräkna MOQ success rate
    const totalCampaigns = campaigns?.length || 0;
    const succeededCampaigns = campaigns?.filter(c => c.status === 'moq_succeeded').length || 0;
    const moqSuccessRate = totalCampaigns > 0 ? (succeededCampaigns / totalCampaigns) * 100 : 0;

    // 3. Beräkna genomsnittlig tid till MOQ (simulerad)
    const averageTimeToMOQ = 14.5; // dagar

    return NextResponse.json({
      success: true,
      analytics: {
        total_campaigns: totalCampaigns,
        moq_success_rate: moqSuccessRate,
        succeeded_campaigns: succeededCampaigns,
        failed_campaigns: totalCampaigns - succeededCampaigns,
        average_time_to_moq_days: averageTimeToMOQ,
        campaigns: campaigns || []
      }
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
