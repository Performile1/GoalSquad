import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { campaignId, recipients, notificationType, channel } = await request.json();

    if (!campaignId || !recipients || !notificationType || !channel) {
      return NextResponse.json({ success: false, error: 'Saknar obligatorisk data' }, { status: 400 });
    }

    const results = [];

    for (const recipient of recipients) {
      const lockKey = `NOTIF-${campaignId}-${recipient.id}-${notificationType}-${channel}`.toUpperCase();

      const { data: existingNotif } = await supabaseAdmin
        .from('campaign_notifications')
        .select('id, status')
        .eq('idempotency_lock', lockKey)
        .maybeSingle();

      if (existingNotif) {
        results.push({
          recipientId: recipient.id,
          status: 'SKIPPED_DUPLICATE',
          message: `Avisering '${notificationType}' har redan hanterats för denna mottagare.` 
        });
        continue;
      }

      try {
        const { data: newNotif, error: insertError } = await supabaseAdmin
          .from('campaign_notifications')
          .insert({
            campaign_id: campaignId,
            recipient_id: recipient.id,
            notification_type: notificationType,
            channel: channel,
            idempotency_lock: lockKey,
            status: 'pending'
          })
          .select()
          .single();

        if (insertError) throw insertError;

        await supabaseAdmin
          .from('campaign_notifications')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', newNotif.id);

        results.push({ recipientId: recipient.id, status: 'SENT' });

      } catch (innerErr: any) {
        if (innerErr.code === '23505') {
          results.push({ recipientId: recipient.id, status: 'SKIPPED_RACE_CONDITION' });
        } else {
          results.push({ recipientId: recipient.id, status: 'FAILED', error: innerErr.message });
        }
      }
    }

    return NextResponse.json({ success: true, processed: results });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
