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

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { Treasury } from './treasury';
import { GamificationEngine } from './gamification-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SplitConfiguration {
  salesMarginPercent: number;
  handlingFeeFixed: number;
  shippingSpreadPercent: number;
}

export interface OrderSplitResult {
  transactionId: string;
  totalAmount: number;
  splits: {
    merchantPayout: number;
    salesMargin: number;
    handlingFee: number;
    shippingSpread: number;
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
      .order('priority', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // Return platform defaults
      return {
        salesMarginPercent: 15.0,
        handlingFeeFixed: 25.0,
        shippingSpreadPercent: 20.0,
      };
    }

    return {
      salesMarginPercent: parseFloat(data.sales_margin_percent),
      handlingFeeFixed: parseFloat(data.handling_fee_fixed),
      shippingSpreadPercent: parseFloat(data.shipping_spread_percent),
    };
  }

  /**
   * Calculate splits for an order item
   */
  static calculateItemSplit(
    quantity: number,
    unitPrice: number,
    merchantBasePrice: number,
    config: SplitConfiguration
  ) {
    const subtotal = quantity * unitPrice;
    const merchantSubtotal = quantity * merchantBasePrice;

    // 1. Sales Margin = (Retail - Merchant Base) * quantity
    const salesMargin = subtotal - merchantSubtotal;

    // 2. Handling Fee = Fixed fee (applied once per order, not per item)
    // This will be calculated at order level

    // 3. Merchant Payout = Merchant base * quantity
    const merchantPayout = merchantSubtotal;

    return {
      subtotal,
      salesMargin,
      merchantPayout,
    };
  }

  /**
   * Calculate shipping spread
   */
  static calculateShippingSpread(
    carrierCost: number,
    config: SplitConfiguration
  ) {
    const customerCost = carrierCost * (1 + config.shippingSpreadPercent / 100);
    const shippingSpread = customerCost - carrierCost;

    return {
      carrierCost,
      customerCost,
      shippingSpread,
    };
  }

  /**
   * Process order payment and split funds
   * This is called when Stripe checkout completes
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

    // Fetch shipment for shipping spread
    const { data: shipment } = await supabase
      .from('shipments')
      .select('*')
      .eq('order_id', orderId)
      .single();

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

    let totalSalesMargin = 0;
    let totalMerchantPayout = 0;
    const merchantPayouts = new Map<string, number>();

    // Process each order item
    for (const item of order.order_items) {
      const config = await this.getSplitConfig(item.merchant_id);

      const split = this.calculateItemSplit(
        item.quantity,
        parseFloat(item.unit_price),
        parseFloat(item.merchant_base_price),
        config
      );

      totalSalesMargin += split.salesMargin;
      totalMerchantPayout += split.merchantPayout;

      // Accumulate merchant payouts
      const currentPayout = merchantPayouts.get(item.merchant_id) || 0;
      merchantPayouts.set(item.merchant_id, currentPayout + split.merchantPayout);

      // Record sales margin to platform
      ledgerEntries.push({
        transaction_id: transactionId,
        order_id: orderId,
        wallet_id: platformWallet.id,
        entry_type: 'credit',
        amount: split.salesMargin,
        currency: order.currency,
        category: 'sales_margin',
        description: `Sales margin for order ${order.order_number}, item ${item.sku}`,
      });
    }

    // Get split config for handling fee
    const config = await this.getSplitConfig();
    const handlingFee = config.handlingFeeFixed;

    // Record handling fee to platform
    ledgerEntries.push({
      transaction_id: transactionId,
      order_id: orderId,
      wallet_id: platformWallet.id,
      entry_type: 'credit',
      amount: handlingFee,
      currency: order.currency,
      category: 'handling_fee',
      description: `Handling fee for order ${order.order_number}`,
    });

    // Calculate shipping spread
    let shippingSpread = 0;
    if (shipment) {
      const carrierCost = parseFloat(shipment.carrier_cost || '0');
      const customerCost = parseFloat(order.shipping_total);
      shippingSpread = customerCost - carrierCost;

      // Record shipping spread to platform
      ledgerEntries.push({
        transaction_id: transactionId,
        order_id: orderId,
        shipment_id: shipment.id,
        wallet_id: platformWallet.id,
        entry_type: 'credit',
        amount: shippingSpread,
        currency: order.currency,
        category: 'shipping_spread',
        description: `Shipping spread for order ${order.order_number}`,
      });
    }

    // Process merchant payouts
    for (const [merchantId, payoutAmount] of merchantPayouts.entries()) {
      // Get or create merchant wallet
      let { data: merchantWallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('owner_type', 'merchant')
        .eq('owner_id', merchantId)
        .single();

      if (!merchantWallet) {
        const { data: newWallet } = await supabase
          .from('wallets')
          .insert({
            owner_type: 'merchant',
            owner_id: merchantId,
            currency: order.currency,
          })
          .select()
          .single();

        merchantWallet = newWallet;
      }

      // Record merchant payout
      ledgerEntries.push({
        transaction_id: transactionId,
        order_id: orderId,
        wallet_id: merchantWallet!.id,
        entry_type: 'credit',
        amount: payoutAmount,
        currency: order.currency,
        category: 'merchant_payout',
        description: `Merchant payout for order ${order.order_number}`,
      });

      // Update merchant wallet balance
      await supabase
        .from('wallets')
        .update({
          balance: parseFloat(merchantWallet!.balance) + payoutAmount,
        })
        .eq('id', merchantWallet!.id);
    }

    // Insert all ledger entries
    const { error: ledgerError } = await supabase
      .from('ledger_entries')
      .insert(ledgerEntries);

    if (ledgerError) {
      throw new Error(`Failed to create ledger entries: ${ledgerError.message}`);
    }

    // Update platform wallet balance
    const platformRevenue = totalSalesMargin + handlingFee + shippingSpread;
    await supabase
      .from('wallets')
      .update({
        balance: parseFloat(platformWallet.balance) + platformRevenue,
      })
      .eq('id', platformWallet.id);

    return {
      transactionId,
      totalAmount: parseFloat(order.total),
      splits: {
        merchantPayout: totalMerchantPayout,
        salesMargin: totalSalesMargin,
        handlingFee,
        shippingSpread,
        platformRevenue,
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
      return { balance: 0, currency: 'NOK' };
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
