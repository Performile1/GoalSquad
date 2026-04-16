/**
 * Webhook Queue Worker
 * GET /api/cron/webhook-worker
 * 
 * Processes queued warehouse webhook events
 * Should be called via Vercel Cron every minute
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let processedCount = 0;
    const maxJobs = 10; // Process max 10 jobs per run

    // Process jobs until queue is empty or max reached
    for (let i = 0; i < maxJobs; i++) {
      // Get next job from queue
      const { data: job, error: dequeueError } = await supabaseAdmin
        .rpc('dequeue_webhook_event');

      if (dequeueError || !job || job.length === 0) {
        break; // No more jobs
      }

      const jobData = job[0];
      const { queue_id, event_type, payload, warehouse_partner_id } = jobData;

      try {
        // Process event based on type
        let result;
        switch (event_type) {
          case 'inbound_received':
            result = await handleInboundReceived(payload);
            break;
          case 'inbound_verified':
            result = await handleInboundVerified(payload);
            break;
          case 'linehaul_ready':
            result = await handleLinehaulReady(payload);
            break;
          case 'linehaul_dispatched':
            result = await handleLinehaulDispatched(payload);
            break;
          case 'split_completed':
            result = await handleSplitCompleted(payload);
            break;
          case 'outbound_scanned':
            result = await handleOutboundScanned(payload);
            break;
          case 'damage_reported':
            result = await handleDamageReported(payload);
            break;
          default:
            throw new Error(`Unknown event type: ${event_type}`);
        }

        // Mark job as completed
        await supabaseAdmin.rpc('complete_webhook_job', {
          p_queue_id: queue_id,
        });

        // Update warehouse_events table
        if (payload.order_id) {
          await supabaseAdmin
            .from('warehouse_events')
            .update({
              processed: true,
              processed_at: new Date().toISOString(),
            })
            .eq('order_id', payload.order_id)
            .eq('event_type', event_type);
        }

        processedCount++;
      } catch (error) {
        console.error(`Failed to process job ${queue_id}:`, error);

        // Mark job as failed (will retry with exponential backoff)
        await supabaseAdmin.rpc('fail_webhook_job', {
          p_queue_id: queue_id,
          p_error_message: String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Webhook worker error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

async function handleInboundReceived(payload: any) {
  const { data, shipment_id } = payload;
  const { asn_number, received_at, items } = data;

  await supabaseAdmin
    .from('asn_notices')
    .update({
      status: 'received',
      received_at: received_at || new Date().toISOString(),
    })
    .eq('asn_number', asn_number);

  return { success: true };
}

async function handleInboundVerified(payload: any) {
  const { data } = payload;
  const { asn_number, verified_items, discrepancies } = data;

  await supabaseAdmin
    .from('asn_notices')
    .update({
      status: discrepancies && discrepancies.length > 0 ? 'discrepancy' : 'verified',
      discrepancies: discrepancies || [],
    })
    .eq('asn_number', asn_number);

  return { success: true };
}

async function handleLinehaulReady(payload: any) {
  const { data } = payload;
  const { pallet_id, sscc_label, destination_hub } = data;

  // TODO: Generate shipping label
  // TODO: Notify destination hub

  return { success: true };
}

async function handleLinehaulDispatched(payload: any) {
  const { data, shipment_id } = payload;
  const { pallet_id, tracking_number, carrier, dispatched_at } = data;

  if (shipment_id) {
    await supabaseAdmin
      .from('shipments')
      .update({
        status: 'in_transit',
        tracking_number,
        carrier,
        shipped_at: dispatched_at || new Date().toISOString(),
      })
      .eq('id', shipment_id);
  }

  return { success: true };
}

async function handleSplitCompleted(payload: any) {
  const { data, order_id } = payload;
  const { split_packages } = data;

  if (order_id) {
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'processing',
        metadata: { split_completed: true, split_packages },
      })
      .eq('id', order_id);
  }

  return { success: true };
}

async function handleOutboundScanned(payload: any) {
  const { data, order_id } = payload;
  const { tracking_number, carrier, scanned_at } = data;

  if (order_id) {
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'shipped',
        tracking_number,
        shipped_at: scanned_at || new Date().toISOString(),
      })
      .eq('id', order_id);

    // TODO: Send shipping notification to customer
  }

  return { success: true };
}

async function handleDamageReported(payload: any) {
  const { data, order_id } = payload;
  const { damage_description, damage_photos, affected_items } = data;

  if (order_id) {
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'issue_reported',
        metadata: {
          damage_reported: true,
          damage_description,
          damage_photos,
          affected_items,
        },
      })
      .eq('id', order_id);

    // TODO: Notify merchant and customer
    // TODO: Initiate refund/replacement process
  }

  return { success: true };
}
