/**
 * MOQ (Minimum Order Quantity) Handler
 * 
 * Handles order aggregation and warehouse assignment
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface MOQStatus {
  moqEnabled: boolean;
  targetQuantity?: number;
  currentQuantity?: number;
  moqReached?: boolean;
  percentage?: number;
  aggregationId?: string;
  estimatedShipDate?: string;
}

export interface WarehouseAssignment {
  warehouseId: string;
  warehouseName: string;
  city: string;
  estimatedProcessingDays: number;
}

/**
 * Check if product has MOQ and current status
 */
export async function checkMOQStatus(
  productId: string,
  postalCode: string
): Promise<MOQStatus> {
  try {
    // Find nearest warehouse
    const { data: warehouseId, error: warehouseError } = await supabase.rpc(
      'find_nearest_warehouse',
      {
        p_postal_code: postalCode,
        p_country: 'SE',
      }
    );

    if (warehouseError || !warehouseId) {
      return { moqEnabled: false };
    }

    // Check MOQ status
    const { data, error } = await supabase.rpc('check_moq_status', {
      p_product_id: productId,
      p_warehouse_id: warehouseId,
    });

    if (error) throw error;

    return {
      moqEnabled: data.moq_enabled,
      targetQuantity: data.target_quantity,
      currentQuantity: data.current_quantity,
      moqReached: data.moq_reached,
      percentage: data.percentage,
      aggregationId: data.aggregation_id,
    };
  } catch (error) {
    console.error('MOQ check error:', error);
    return { moqEnabled: false };
  }
}

/**
 * Add order to MOQ aggregation
 */
export async function addToMOQAggregation(
  orderId: string,
  orderItemId: string,
  productId: string,
  quantity: number,
  userId: string,
  postalCode: string
): Promise<{ success: boolean; warehouseId?: string; estimatedShipDate?: string }> {
  try {
    // Find warehouse
    const { data: warehouseId, error: warehouseError } = await supabase.rpc(
      'find_nearest_warehouse',
      {
        p_postal_code: postalCode,
        p_country: 'SE',
      }
    );

    if (warehouseError || !warehouseId) {
      throw new Error('No warehouse found for postal code');
    }

    // Get warehouse processing days
    const { data: warehouse } = await supabase
      .from('consolidation_warehouses')
      .select('processing_days')
      .eq('id', warehouseId)
      .single();

    const processingDays = warehouse?.processing_days || 2;

    // Check MOQ status
    const moqStatus = await checkMOQStatus(productId, postalCode);

    // Add to pending orders
    const { error: insertError } = await supabase
      .from('pending_moq_orders')
      .insert({
        order_id: orderId,
        order_item_id: orderItemId,
        product_id: productId,
        quantity,
        user_id: userId,
        delivery_postal_code: postalCode,
        assigned_warehouse_id: warehouseId,
        aggregation_id: moqStatus.aggregationId,
        status: moqStatus.moqReached ? 'ready' : 'pending',
        estimated_ship_date: new Date(
          Date.now() + processingDays * 24 * 60 * 60 * 1000
        ).toISOString().split('T')[0],
      });

    if (insertError) throw insertError;

    // If MOQ reached, trigger processing
    if (moqStatus.moqReached) {
      await processReadyAggregations();
    }

    return {
      success: true,
      warehouseId,
      estimatedShipDate: new Date(
        Date.now() + processingDays * 24 * 60 * 60 * 1000
      ).toISOString().split('T')[0],
    };
  } catch (error) {
    console.error('Add to MOQ aggregation error:', error);
    return { success: false };
  }
}

/**
 * Process all ready aggregations
 */
export async function processReadyAggregations(): Promise<{
  processed: number;
  aggregations: any[];
}> {
  try {
    const { data, error } = await supabase.rpc('process_ready_aggregations');

    if (error) throw error;

    // Send notifications to customers
    for (const agg of data || []) {
      await notifyCustomersOrderReady(agg.aggregation_id);
    }

    return {
      processed: data?.length || 0,
      aggregations: data || [],
    };
  } catch (error) {
    console.error('Process aggregations error:', error);
    return { processed: 0, aggregations: [] };
  }
}

/**
 * Notify customers that their order is ready to ship
 */
async function notifyCustomersOrderReady(aggregationId: string): Promise<void> {
  try {
    // Get all pending orders for this aggregation
    const { data: orders } = await supabase
      .from('pending_moq_orders')
      .select(`
        *,
        user:profiles (email, full_name),
        product:products (name)
      `)
      .eq('aggregation_id', aggregationId)
      .eq('status', 'ready');

    // Send email notifications
    for (const order of orders || []) {
      // TODO: Implement email notification
      console.log(`Notify ${order.user.email}: Order ready for ${order.product.name}`);
    }
  } catch (error) {
    console.error('Notification error:', error);
  }
}

/**
 * Get warehouse assignment for postal code
 */
export async function getWarehouseAssignment(
  postalCode: string
): Promise<WarehouseAssignment | null> {
  try {
    const { data: warehouseId } = await supabase.rpc('find_nearest_warehouse', {
      p_postal_code: postalCode,
      p_country: 'SE',
    });

    if (!warehouseId) return null;

    const { data: warehouse } = await supabase
      .from('consolidation_warehouses')
      .select('id, name, city, processing_days')
      .eq('id', warehouseId)
      .single();

    if (!warehouse) return null;

    return {
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      city: warehouse.city,
      estimatedProcessingDays: warehouse.processing_days,
    };
  } catch (error) {
    console.error('Warehouse assignment error:', error);
    return null;
  }
}

/**
 * Get aggregation progress for product at warehouse
 */
export async function getAggregationProgress(
  productId: string,
  warehouseId: string
): Promise<{
  current: number;
  target: number;
  percentage: number;
  estimatedCompletion?: string;
} | null> {
  try {
    const { data } = await supabase
      .from('order_aggregations')
      .select('*')
      .eq('product_id', productId)
      .eq('warehouse_id', warehouseId)
      .eq('status', 'collecting')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    return {
      current: data.current_quantity,
      target: data.target_quantity,
      percentage: Math.round((data.current_quantity / data.target_quantity) * 100),
      estimatedCompletion: data.period_end,
    };
  } catch (error) {
    console.error('Get aggregation progress error:', error);
    return null;
  }
}

/**
 * Check if order can be fulfilled immediately
 */
export async function canFulfillImmediately(
  productId: string,
  quantity: number,
  postalCode: string
): Promise<boolean> {
  try {
    // Get product
    const { data: product } = await supabase
      .from('products')
      .select('moq_enabled, minimum_order_quantity, allow_partial_orders')
      .eq('id', productId)
      .single();

    if (!product) return false;

    // If MOQ not enabled, can fulfill immediately
    if (!product.moq_enabled) return true;

    // If ordering more than MOQ, can fulfill immediately
    if (quantity >= product.minimum_order_quantity) return true;

    // If partial orders allowed, can fulfill immediately
    if (product.allow_partial_orders) return true;

    // Check if MOQ already reached at warehouse
    const moqStatus = await checkMOQStatus(productId, postalCode);
    return moqStatus.moqReached || false;
  } catch (error) {
    console.error('Can fulfill check error:', error);
    return false;
  }
}
