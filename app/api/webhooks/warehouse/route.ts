/**
 * Warehouse Webhook Handler
 * POST /api/webhooks/warehouse
 * 
 * Receives warehouse events and queues them for async processing
 * Based on Gemini recommendation to prevent race conditions
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

/**
 * Get priority for webhook event type
 * Higher priority = processed first
 */
function getPriority(eventType: string): number {
  const priorities: Record<string, number> = {
    'damage_reported': 10,      // Highest priority
    'outbound_scanned': 8,       // Customer-facing
    'split_completed': 7,
    'linehaul_dispatched': 6,
    'linehaul_ready': 5,
    'inbound_verified': 4,
    'inbound_received': 3,       // Lowest priority
  };
  return priorities[eventType] || 5; // Default medium priority
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-warehouse-signature');
    const partnerId = req.headers.get('x-partner-id');
    const body = await req.json();

    if (!signature || !partnerId) {
      return NextResponse.json(
        { error: 'Missing signature or partner ID' },
        { status: 401 }
      );
    }

    // Get warehouse partner
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('warehouse_partners')
      .select('*')
      .eq('id', partnerId)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Invalid partner ID' },
        { status: 401 }
      );
    }

    // Verify signature
    const expectedSignature = createHash('sha256')
      .update(JSON.stringify(body) + partner.webhook_secret)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Validate event data
    const { event_type, shipment_id, order_id, data } = body;

    if (!event_type) {
      return NextResponse.json(
        { error: 'Missing event_type' },
        { status: 400 }
      );
    }

    // Enqueue event for async processing (prevents race conditions)
    const { data: queueResult, error: queueError } = await supabaseAdmin
      .rpc('enqueue_webhook_event', {
        p_event_type: event_type,
        p_payload: {
          shipment_id,
          order_id,
          data: data || {},
        },
        p_warehouse_partner_id: partnerId,
        p_priority: getPriority(event_type),
      });

    if (queueError) {
      console.error('Failed to enqueue webhook event:', queueError);
      return NextResponse.json(
        { error: 'Failed to queue event' },
        { status: 500 }
      );
    }

    // Log to warehouse_events for tracking
    await supabaseAdmin
      .from('warehouse_events')
      .insert({
        warehouse_partner_id: partnerId,
        event_type,
        shipment_id,
        order_id,
        event_data: data || {},
        processed: false,
      });

    // Return 200 OK immediately (async processing will happen via worker)
    return NextResponse.json({
      success: true,
      queueId: queueResult,
      message: 'Event queued for processing',
    });
  } catch (error) {
    console.error('Warehouse webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle inbound_received event
 * Triggered when warehouse receives goods from merchant
 */
async function handleInboundReceived(eventId: string, data: any) {
  try {
    const { asn_number, received_at, items } = data;

    // Update ASN status
    await supabaseAdmin
      .from('asn_notices')
      .update({
        status: 'received',
        received_at: received_at || new Date().toISOString(),
      })
      .eq('asn_number', asn_number);

    // TODO: Trigger merchant notification

    return { success: true };
  } catch (error) {
    console.error('Failed to handle inbound_received:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Handle inbound_verified event
 * Triggered after warehouse verifies received goods
 * This triggers merchant payment and handling fee
 */
async function handleInboundVerified(eventId: string, data: any) {
  try {
    const { asn_number, verified_items, discrepancies } = data;

    // Update ASN
    await supabaseAdmin
      .from('asn_notices')
      .update({
        status: discrepancies && discrepancies.length > 0 ? 'discrepancy' : 'received',
        discrepancies: discrepancies || [],
      })
      .eq('asn_number', asn_number);

    // TODO: Trigger handling fee payment to warehouse
    // TODO: If discrepancies, notify merchant

    return { success: true };
  } catch (error) {
    console.error('Failed to handle inbound_verified:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Handle linehaul_ready event
 * Triggered when pallet is built and ready for transport
 */
async function handleLinehaulReady(eventId: string, data: any) {
  try {
    const { pallet_id, sscc_label, destination_hub, items } = data;

    // TODO: Generate shipping label
    // TODO: Notify destination hub

    return { success: true };
  } catch (error) {
    console.error('Failed to handle linehaul_ready:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Handle linehaul_dispatched event
 * Triggered when pallet leaves warehouse
 * This triggers carrier payment
 */
async function handleLinehaulDispatched(eventId: string, data: any) {
  try {
    const { pallet_id, tracking_number, carrier, dispatched_at } = data;

    // TODO: Update shipment status
    // TODO: Trigger carrier payment

    return { success: true };
  } catch (error) {
    console.error('Failed to handle linehaul_dispatched:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Handle split_completed event
 * Triggered when warehouse completes order splitting
 */
async function handleSplitCompleted(eventId: string, data: any) {
  try {
    const { community_id, packages, ready_for_pickup } = data;

    // TODO: Notify community distributor
    // TODO: Generate QR codes for package pickup

    return { success: true };
  } catch (error) {
    console.error('Failed to handle split_completed:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Handle outbound_scanned event
 * Triggered when package is scanned out for delivery
 * This triggers final payment release
 */
async function handleOutboundScanned(eventId: string, data: any) {
  try {
    const { shipment_id, scanned_at, scanned_by } = data;

    // Update shipment status
    await supabaseAdmin
      .from('shipments')
      .update({
        status: 'in_transit',
        shipped_at: scanned_at || new Date().toISOString(),
      })
      .eq('id', shipment_id);

    // TODO: Trigger warehouse handling fee payment
    // TODO: Update tracking

    return { success: true };
  } catch (error) {
    console.error('Failed to handle outbound_scanned:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Handle damage_reported event
 * Triggered when warehouse finds damaged goods
 */
async function handleDamageReported(eventId: string, data: any) {
  try {
    const { shipment_id, order_id, damage_photos, description } = data;

    // TODO: Create claim
    // TODO: Notify merchant and customer
    // TODO: Initiate refund process if needed

    return { success: true };
  } catch (error) {
    console.error('Failed to handle damage_reported:', error);
    return { success: false, error: String(error) };
  }
}
