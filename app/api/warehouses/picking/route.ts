/**
 * Warehouse Picking API
 * POST /api/warehouses/picking
 *
 * When a campaign (class sale) closes, this generates campaign-linked
 * picking tasks at the warehouse. Idempotent: a deterministic
 * picking_lock (warehouse + campaign + sku) prevents duplicate tasks
 * even under concurrent requests (unique constraint => 23505).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const itemSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
});

const pickingSchema = z.object({
  warehouseId: z.string().uuid(),
  campaignId: z.string().uuid(),
  itemsToPick: z.array(itemSchema).min(1).max(1000),
});

type PickResult = {
  sku: string;
  status: 'CREATED' | 'ALREADY_EXISTS' | 'FAILED';
  taskId?: string;
  message?: string;
  error?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { warehouseId, campaignId, itemsToPick } = pickingSchema.parse(body);

    const processResults: PickResult[] = [];

    for (const item of itemsToPick) {
      const lockKey = `PICK-${warehouseId}-${campaignId}-${item.sku}`.toUpperCase();

      const { data, error } = await supabaseAdmin
        .from('warehouse_picking_tasks')
        .insert({
          warehouse_id: warehouseId,
          campaign_id: campaignId,
          sku: item.sku,
          quantity_to_pick: item.quantity,
          picking_lock: lockKey,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) {
        if (error.code === '23505') {
          processResults.push({
            sku: item.sku,
            status: 'ALREADY_EXISTS',
            message: 'Plockorder redan genererad för denna produkt.',
          });
        } else {
          logger.dbError('INSERT', 'warehouse_picking_tasks', error as unknown as Error, {
            warehouseId,
          });
          processResults.push({ sku: item.sku, status: 'FAILED', error: error.message });
        }
      } else {
        processResults.push({ sku: item.sku, status: 'CREATED', taskId: data.id });
      }
    }

    return NextResponse.json({ success: true, tasks: processResults });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    logger.apiError('POST', '/api/warehouses/picking', error as Error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
