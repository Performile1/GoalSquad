import { supabaseAdmin } from '@/lib/supabase';

export type DeliveryMethod = 'home' | 'club_distribution' | 'single_distributor';

export interface ShippingItem {
  productId: string;
  quantity: number;
  merchantId?: string | null;
  warehouseId?: string | null;
}

interface ShippingPolicy {
  default_shipping_fee?: number;
  shipping_fee?: number;
  free_shipping_threshold?: number;
  free_shipping?: { enabled?: boolean; threshold_sek?: number; delivery_methods?: DeliveryMethod[]; single_warehouse_only?: boolean; waive_handling?: boolean };
  handling_fee?: number;
  per_warehouse_fee?: number;
  distribution_fee?: number;
}

export interface ShippingQuote {
  shippingCost: number;
  handlingCost: number;
  totalCost: number;
  warehouseCount: number;
  freeShipping: boolean;
  deliveryMethod: DeliveryMethod;
  breakdown: { baseShipping: number; handling: number; distribution: number; reason: string };
}

function asPolicy(value: unknown): ShippingPolicy {
  return value && typeof value === 'object' ? value as ShippingPolicy : {};
}

function numberOr(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

export async function calculateShippingQuote(
  items: ShippingItem[],
  subtotal: number,
  deliveryMethod: DeliveryMethod,
  selectedWarehouseId?: string | null,
): Promise<ShippingQuote> {
  const warehouseIds = new Set(items.map((item) => item.warehouseId || selectedWarehouseId).filter(Boolean));
  const warehouseCount = Math.max(warehouseIds.size, selectedWarehouseId ? 1 : 0);
  const productMerchantIds = [...new Set(items.map((item) => item.merchantId).filter(Boolean))] as string[];

  const [platformResult, merchantsResult, warehousesResult] = await Promise.all([
    supabaseAdmin.from('platform_settings').select('key, value'),
    productMerchantIds.length ? supabaseAdmin.from('merchants').select('id, settings').in('id', productMerchantIds) : Promise.resolve({ data: [], error: null }),
    warehouseIds.size ? supabaseAdmin.from('warehouse_partners').select('id, settings').in('id', [...warehouseIds]) : Promise.resolve({ data: [], error: null }),
  ]);

  const platformSettings: Record<string, unknown> = {};
  for (const row of platformResult.data || []) platformSettings[row.key] = (row.value as any)?.data ?? row.value;
  const platformPolicy = asPolicy(platformSettings.shipping_policy || platformSettings);
  const merchantPolicies = (merchantsResult.data || []).map((merchant: any) => asPolicy(merchant.settings));
  const warehousePolicies = (warehousesResult.data || []).map((warehouse: any) => asPolicy(warehouse.settings));

  const defaultShipping = numberOr(platformPolicy.default_shipping_fee, 49);
  const defaultHandling = numberOr(platformPolicy.handling_fee, 0);
  const perWarehouseFee = numberOr(platformPolicy.per_warehouse_fee, defaultShipping);
  const distributionFee = numberOr(platformPolicy.distribution_fee, 0);
  const threshold = numberOr(platformPolicy.free_shipping_threshold, 0);
  const merchantThreshold = merchantPolicies.map((policy) => numberOr(policy.free_shipping?.threshold_sek ?? policy.free_shipping_threshold, 0)).filter(Boolean);
  const effectiveThreshold = merchantThreshold.length ? Math.max(threshold, ...merchantThreshold) : threshold;
  const methods = platformPolicy.free_shipping?.delivery_methods || (platformPolicy as any).free_shipping_delivery_methods || [];
  const methodIsFree = methods.includes(deliveryMethod);
  const oneWarehouseRule = Boolean(platformPolicy.free_shipping?.single_warehouse_only ?? (platformPolicy as any).free_shipping_single_warehouse) && warehouseCount === 1;
  const freeShipping = subtotal >= effectiveThreshold && effectiveThreshold > 0 || methodIsFree || oneWarehouseRule;

  const warehouseShipping = warehousePolicies.reduce((sum, policy) => sum + numberOr(policy.shipping_fee ?? policy.default_shipping_fee, perWarehouseFee), 0);
  const baseShipping = warehouseCount > 0 ? warehouseShipping : defaultShipping;
  const handlingCost = items.reduce((sum, item) => sum + numberOr(warehousePolicies[0]?.handling_fee, defaultHandling) * item.quantity, 0);
  const distributionCost = deliveryMethod === 'club_distribution' || deliveryMethod === 'single_distributor'
    ? numberOr(platformPolicy.distribution_fee, distributionFee)
    : 0;
  const waiveHandling = Boolean(platformPolicy.free_shipping?.waive_handling ?? (platformPolicy as any).free_shipping_waive_handling);
  const chargedShipping = freeShipping ? 0 : baseShipping;
  const chargedHandling = freeShipping && waiveHandling ? 0 : handlingCost;
  const reason = freeShipping
    ? methodIsFree ? 'Fri frakt enligt valt leveranssätt' : oneWarehouseRule ? 'Fri frakt vid leverans från ett lager' : 'Fri frakt enligt ordervärde'
    : 'Standardfrakt och hantering';

  return {
    shippingCost: chargedShipping,
    handlingCost: chargedHandling,
    totalCost: chargedShipping + chargedHandling + distributionCost,
    warehouseCount,
    freeShipping,
    deliveryMethod,
    breakdown: { baseShipping, handling: chargedHandling, distribution: distributionCost, reason },
  };
}
