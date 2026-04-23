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

import { v4 as uuidv4 } from 'uuid';
import { Treasury } from './treasury';
import { GamificationEngine } from './gamification-engine';
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
   * Process order payment and split funds
   * This is called when Stripe checkout completes
   * Uses 4-way percentage split: platform% + community% + seller% + warehouse%
   */
  static async processOrderSplit(orderId: string): Promise<OrderSplitResult> {
    // Fetch order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          merchant:merchants (id, organization_id)
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const transactionId = uuidv4();
    const ledgerEntries: any[] = [];

    // Get platform wallet
    const { data: platformWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('owner_type', 'platform')
      .eq('owner_id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (!platformWallet) {
      throw new Error('Platform wallet not found');
    }

    // Calculate total order amount (excluding shipping)
    const totalOrderAmount = parseFloat(order.total_amount ?? order.total ?? '0');
    const handlingFee = 25.0; // Default handling fee

    // Get split configuration
    const config = await this.getSplitConfig();

    // Calculate splits (4-way percentage split)
    const platformAmount = (totalOrderAmount * config.platformPercent) / 100 - handlingFee;
    const communityAmount = (totalOrderAmount * config.communityPercent) / 100;
    const sellerAmount = (totalOrderAmount * config.sellerPercent) / 100;
    const warehouseAmount = (totalOrderAmount * config.warehousePercent) / 100;

    // Record platform share (after handling fee deduction)
    ledgerEntries.push({
      transaction_id: transactionId,
      wallet_id: platformWallet.id,
      entry_type: 'credit',
      amount: Math.max(0, platformAmount),
      currency: order.currency,
      reference_type: 'order',
      reference_id: orderId,
      description: `Platform share for order ${order.order_number}`,
      metadata: { category: 'platform_share', percent: config.platformPercent },
    });

    // Record handling fee
    ledgerEntries.push({
      transaction_id: transactionId,
      wallet_id: platformWallet.id,
      entry_type: 'credit',
      amount: handlingFee,
      currency: order.currency,
      reference_type: 'order',
      reference_id: orderId,
      description: `Handling fee for order ${order.order_number}`,
      metadata: { category: 'handling_fee' },
    });

    // Record community share (if community_id exists on order)
    if (order.community_id) {
      // Get or create community wallet
      let { data: communityWallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('owner_type', 'community')
        .eq('owner_id', order.community_id)
        .single();

      if (!communityWallet) {
        const { data: newWallet } = await supabase
          .from('wallets')
          .insert({
            owner_type: 'community',
            owner_id: order.community_id,
            currency: order.currency,
            balance: 0,
          })
          .select()
          .single();
        communityWallet = newWallet;
      }

      if (communityWallet) {
        ledgerEntries.push({
          transaction_id: transactionId,
          wallet_id: communityWallet.id,
          entry_type: 'credit',
          amount: communityAmount,
          currency: order.currency,
          reference_type: 'order',
          reference_id: orderId,
          description: `Community share for order ${order.order_number}`,
          metadata: { category: 'community_share', percent: config.communityPercent },
        });

        await supabase
          .from('wallets')
          .update({
            balance: parseFloat(communityWallet.balance) + communityAmount,
          })
          .eq('id', communityWallet.id);
      }
    }

    // Record seller share (if seller_id exists on order)
    if (order.seller_id) {
      let { data: sellerWallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('owner_type', 'seller')
        .eq('owner_id', order.seller_id)
        .single();

      if (!sellerWallet) {
        const { data: newWallet } = await supabase
          .from('wallets')
          .insert({
            owner_type: 'seller',
            owner_id: order.seller_id,
            currency: order.currency,
            balance: 0,
          })
          .select()
          .single();
        sellerWallet = newWallet;
      }

      if (sellerWallet) {
        ledgerEntries.push({
          transaction_id: transactionId,
          wallet_id: sellerWallet.id,
          entry_type: 'credit',
          amount: sellerAmount,
          currency: order.currency,
          reference_type: 'order',
          reference_id: orderId,
          description: `Seller share for order ${order.order_number}`,
          metadata: { category: 'seller_share', percent: config.sellerPercent },
        });

        await supabase
          .from('wallets')
          .update({
            balance: parseFloat(sellerWallet.balance) + sellerAmount,
          })
          .eq('id', sellerWallet.id);
      }
    }

    // Record warehouse share (if warehouse_id exists on order)
    if (order.warehouse_id) {
      let { data: warehouseWallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('owner_type', 'warehouse')
        .eq('owner_id', order.warehouse_id)
        .single();

      if (!warehouseWallet) {
        const { data: newWallet } = await supabase
          .from('wallets')
          .insert({
            owner_type: 'warehouse',
            owner_id: order.warehouse_id,
            currency: order.currency,
            balance: 0,
          })
          .select()
          .single();
        warehouseWallet = newWallet;
      }

      if (warehouseWallet) {
        ledgerEntries.push({
          transaction_id: transactionId,
          wallet_id: warehouseWallet.id,
          entry_type: 'credit',
          amount: warehouseAmount,
          currency: order.currency,
          reference_type: 'order',
          reference_id: orderId,
          description: `Warehouse share for order ${order.order_number}`,
          metadata: { category: 'warehouse_share', percent: config.warehousePercent },
        });

        await supabase
          .from('wallets')
          .update({
            balance: parseFloat(warehouseWallet.balance) + warehouseAmount,
          })
          .eq('id', warehouseWallet.id);
      }
    }

    // Insert all ledger entries
    const { error: ledgerError } = await supabase
      .from('ledger_entries')
      .insert(ledgerEntries);

    if (ledgerError) {
      throw new Error(`Failed to create ledger entries: ${ledgerError.message}`);
    }

    // Update platform wallet balance
    const totalPlatformAmount = Math.max(0, platformAmount) + handlingFee;
    await supabase
      .from('wallets')
      .update({
        balance: parseFloat(platformWallet.balance) + totalPlatformAmount,
      })
      .eq('id', platformWallet.id);

    return {
      transactionId,
      totalAmount: totalOrderAmount,
      splits: {
        platformShare: Math.max(0, platformAmount),
        communityShare: communityAmount,
        sellerShare: sellerAmount,
        warehouseShare: warehouseAmount,
        handlingFee,
        platformRevenue: totalPlatformAmount,
      },
      ledgerEntries,
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
