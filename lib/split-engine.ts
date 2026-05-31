/**
 * The Split Engine - GoalSquad's Triple-Dip Margin System
 * 
 * Handles real-time fund splitting across:
 * 1. Sales Margin (Retail vs Merchant base price)
 * 2. Handling Fee (Fixed platform fee)
 * 3. Shipping Spread (Carrier arbitrage)
 * 
 * Money NEVER lands in a single account - it's split virtually at checkout.
 */

import { supabaseAdmin as supabase } from './supabase';

export interface SplitConfiguration {
  platformPercent: number;
  communityPercent: number;
  sellerPercent: number;
  warehousePercent: number;
  handlingFee: number;
  shippingSpreadPercent: number;
}

export interface OrderSplitResult {
  transactionId: string;
  totalAmount: number;
  splits: {
    platformShare: number;
    communityShare: number;
    sellerShare: number;
    warehouseShare: number;
    handlingFee: number;
    platformRevenue: number;
  };
  ledgerEntries: any[];
}

export class SplitEngine {
  /**
   * Get split configuration for a merchant/product
   */
  static async getSplitConfig(
    merchantId?: string,
    productCategory?: string
  ): Promise<SplitConfiguration> {
    const { data, error } = await supabase
      .from('split_configurations')
      .select('*')
      .eq('active', true)
      .or(`merchant_id.eq.${merchantId},merchant_id.is.null`)
      .or(`product_category.eq.${productCategory},product_category.is.null`)
      .limit(1)
      .single();

    if (error || !data) {
      // Return platform defaults
      return {
        platformPercent: 12.0,
        communityPercent: 60.0,
        sellerPercent: 20.0,
        warehousePercent: 8.0,
        handlingFee: 25.0,
        shippingSpreadPercent: 20.0,
      };
    }

    return {
      platformPercent: parseFloat(data.platform_percent),
      communityPercent: parseFloat(data.community_percent),
      sellerPercent: parseFloat(data.seller_percent),
      warehousePercent: parseFloat(data.warehouse_percent),
      handlingFee: parseFloat(data.handling_fee),
      shippingSpreadPercent: parseFloat(data.shipping_spread_percent),
    };
  }

  /**
   * Calculate splits for an order item (no longer used - using percentage-based split)
   */
  static calculateItemSplit(
    quantity: number,
    unitPrice: number,
    merchantBasePrice: number,
    config: SplitConfiguration
  ) {
    // Not used in new percentage-based split logic
    return { subtotal: 0, salesMargin: 0, merchantPayout: 0 };
  }

  /**
   * Process order payment and split funds.
   * Called when Stripe checkout completes.
   *
   * The actual splitting now runs inside the atomic Postgres function
   * `process_order_split` (migration 063): single transaction, row-locked,
   * exact DECIMAL math, idempotent, residual platform share, and real escrow
   * (seller/warehouse go to treasury_holds). This wrapper just invokes it.
   */
  static async processOrderSplit(orderId: string): Promise<OrderSplitResult> {
    const { data, error } = await supabase.rpc('process_order_split', {
      p_order_id: orderId,
    });

    if (error) {
      throw new Error(`Split failed for order ${orderId}: ${error.message}`);
    }

    const result = (data ?? {}) as {
      status?: string;
      transaction_id?: string;
      total?: number | string;
      splits?: {
        platform?: number | string;
        handling?: number | string;
        community?: number | string;
        seller?: number | string;
        warehouse?: number | string;
      };
    };

    const num = (v: number | string | undefined) =>
      typeof v === 'string' ? parseFloat(v) : v ?? 0;

    const splits = result.splits ?? {};
    const platformShare = num(splits.platform);
    const handlingFee = num(splits.handling);

    return {
      transactionId: result.transaction_id ?? '',
      totalAmount: num(result.total),
      splits: {
        platformShare,
        communityShare: num(splits.community),
        sellerShare: num(splits.seller),
        warehouseShare: num(splits.warehouse),
        handlingFee,
        platformRevenue: platformShare + handlingFee,
      },
      ledgerEntries: [],
    };
  }

  /**
   * Get wallet balance for an owner
   */
  static async getWalletBalance(
    ownerType: 'platform' | 'merchant' | 'carrier' | 'hub',
    ownerId: string
  ) {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('owner_type', ownerType)
      .eq('owner_id', ownerId)
      .single();

    if (error || !data) {
      return { balance: 0, currency: 'SEK' };
    }

    return {
      balance: parseFloat(data.balance),
      currency: data.currency,
    };
  }

  /**
   * Get transaction history for a wallet
   */
  static async getTransactionHistory(
    ownerType: 'platform' | 'merchant' | 'carrier' | 'hub',
    ownerId: string,
    limit = 50
  ) {
    // First get the wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('owner_type', ownerType)
      .eq('owner_id', ownerId)
      .single();

    if (!wallet) {
      return [];
    }

    // Get ledger entries
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }
}
