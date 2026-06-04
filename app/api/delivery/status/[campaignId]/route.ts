import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request, { params }: { params: { campaignId: string } }) {
  try {
    const { data: segments, error } = await supabaseAdmin
      .from('shipment_segments')
      .select('segment_order, from_entity_type, to_entity_type, status, tracking_number, arrived_at')
      .or(`to_entity_id.eq.${params.campaignId},bulk_shipment_id.in.(select id from bulk_shipments where campaign_id.eq.${params.campaignId})`)
      .order('segment_order', { ascending: true });

    if (error) throw error;

    let currentStep = 1;
    
    if (segments && segments.length > 0) {
      const seg1 = segments.find(s => s.segment_order === 1);
      const seg2 = segments.find(s => s.segment_order === 2);
      const seg3 = segments.find(s => s.segment_order === 3);

      if (seg1?.status === 'arrived') currentStep = 2;
      if (seg2?.status === 'arrived') currentStep = 3;
      if (seg3?.status === 'ready_for_pickup' || seg3?.status === 'arrived') currentStep = 4;
    }

    return NextResponse.json({
      success: true,
      current_step: currentStep,
      segments: segments || []
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
