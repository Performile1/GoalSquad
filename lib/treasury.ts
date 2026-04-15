/**
 * Treasury System - 30-Day Escrow Logic
 * 
 * Handles:
 * - Holding funds for 30 days after sale
 * - Automatic release after hold period
 * - Dispute management
 * - Refund processing
 */

import { supabaseAdmin } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export interface TreasuryHold {
  orderId: string;
  transactionId: string;
  holderType: 'merchant' | 'community' | 'seller';
  holderId: string;
  amount: number;
  currency: string;
  holdDays: number;
}

export class Treasury {
  /**
   * Create treasury hold for an order
   */
  static async createHold(hold: TreasuryHold): Promise<{ success: boolean; holdId?: string }> {
    try {
      const holdUntil = new Date();
      holdUntil.setDate(holdUntil.getDate() + hold.holdDays);

      const { data, error } = await supabaseAdmin
        .from('treasury_holds')
        .insert({
          order_id: hold.orderId,
          transaction_id: hold.transactionId,
          holder_type: hold.holderType,
          holder_id: hold.holderId,
          amount: hold.amount,
          currency: hold.currency,
          hold_until: holdUntil.toISOString(),
          status: 'held',
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create treasury hold:', error);
        return { success: false };
      }

      return { success: true, holdId: data.id };
    } catch (error) {
      console.error('Treasury hold creation error:', error);
      return { success: false };
    }
  }

  /**
   * Release holds that have passed their hold period
   */
  static async releaseExpiredHolds(): Promise<number> {
    try {
      const now = new Date();

      // Get all expired holds
      const { data: expiredHolds, error: fetchError } = await supabaseAdmin
        .from('treasury_holds')
        .select('*')
        .eq('status', 'held')
        .lte('hold_until', now.toISOString());

      if (fetchError || !expiredHolds) {
        console.error('Failed to fetch expired holds:', fetchError);
        return 0;
      }

      let releasedCount = 0;

      // Process each hold
      for (const hold of expiredHolds) {
        const released = await this.releaseHold(hold.id);
        if (released) {
          releasedCount++;
        }
      }

      return releasedCount;
    } catch (error) {
      console.error('Failed to release expired holds:', error);
      return 0;
    }
  }

  /**
   * Release a specific hold
   */
  static async releaseHold(holdId: string): Promise<boolean> {
    try {
      // Get hold details
      const { data: hold, error: holdError } = await supabaseAdmin
        .from('treasury_holds')
        .select('*')
        .eq('id', holdId)
        .single();

      if (holdError || !hold) {
        console.error('Hold not found:', holdId);
        return false;
      }

      if (hold.status !== 'held') {
        console.log('Hold already processed:', holdId);
        return false;
      }

      // Get or create wallet for holder
      let { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('owner_type', hold.holder_type)
        .eq('owner_id', hold.holder_id)
        .eq('currency', hold.currency)
        .single();

      if (!wallet) {
        // Create wallet if it doesn't exist
        const { data: newWallet } = await supabaseAdmin
          .from('wallets')
          .insert({
            owner_type: hold.holder_type,
            owner_id: hold.holder_id,
            currency: hold.currency,
            balance: 0,
          })
          .select()
          .single();

        wallet = newWallet;
      }

      if (!wallet) {
        console.error('Failed to get/create wallet');
        return false;
      }

      // Update wallet balance
      const newBalance = parseFloat(wallet.balance) + hold.amount;
      await supabaseAdmin
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

      // Create ledger entry
      await supabaseAdmin
        .from('ledger_entries')
        .insert({
          transaction_id: uuidv4(),
          order_id: hold.order_id,
          wallet_id: wallet.id,
          entry_type: 'credit',
          amount: hold.amount,
          currency: hold.currency,
          category: hold.holder_type === 'merchant' ? 'merchant_payout' : 'platform_revenue',
          description: `Treasury release for order ${hold.order_id}`,
        });

      // Update hold status
      await supabaseAdmin
        .from('treasury_holds')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
          released_to_wallet_id: wallet.id,
        })
        .eq('id', holdId);

      console.log(`Released hold ${holdId}: ${hold.amount} ${hold.currency} to ${hold.holder_type} ${hold.holder_id}`);
      return true;
    } catch (error) {
      console.error('Failed to release hold:', error);
      return false;
    }
  }

  /**
   * Dispute a hold (e.g., for refund)
   */
  static async disputeHold(holdId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('treasury_holds')
        .update({
          status: 'disputed',
          metadata: { dispute_reason: reason, disputed_at: new Date().toISOString() },
        })
        .eq('id', holdId)
        .eq('status', 'held');

      if (error) {
        console.error('Failed to dispute hold:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Dispute hold error:', error);
      return false;
    }
  }

  /**
   * Refund a hold (returns money to customer)
   */
  static async refundHold(holdId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('treasury_holds')
        .update({
          status: 'refunded',
          released_at: new Date().toISOString(),
        })
        .eq('id', holdId);

      if (error) {
        console.error('Failed to refund hold:', error);
        return false;
      }

      // TODO: Trigger Stripe refund here

      return true;
    } catch (error) {
      console.error('Refund hold error:', error);
      return false;
    }
  }

  /**
   * Get treasury balance for a holder
   */
  static async getTreasuryBalance(
    holderType: 'merchant' | 'community' | 'seller',
    holderId: string
  ): Promise<{
    held: number;
    available: number;
    total: number;
  }> {
    try {
      // Get held amount
      const { data: holds } = await supabaseAdmin
        .from('treasury_holds')
        .select('amount')
        .eq('holder_type', holderType)
        .eq('holder_id', holderId)
        .eq('status', 'held');

      const heldAmount = holds?.reduce((sum, h) => sum + parseFloat(h.amount), 0) || 0;

      // Get wallet balance (available)
      const { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('balance')
        .eq('owner_type', holderType)
        .eq('owner_id', holderId)
        .single();

      const availableAmount = wallet ? parseFloat(wallet.balance) : 0;

      return {
        held: heldAmount,
        available: availableAmount,
        total: heldAmount + availableAmount,
      };
    } catch (error) {
      console.error('Failed to get treasury balance:', error);
      return { held: 0, available: 0, total: 0 };
    }
  }

  /**
   * Get holds for a holder
   */
  static async getHolds(
    holderType: 'merchant' | 'community' | 'seller',
    holderId: string,
    status?: 'held' | 'released' | 'disputed' | 'refunded'
  ) {
    try {
      let query = supabaseAdmin
        .from('treasury_holds')
        .select('*')
        .eq('holder_type', holderType)
        .eq('holder_id', holderId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get holds:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get holds error:', error);
      return [];
    }
  }

  /**
   * Request payout (for community treasurer)
   */
  static async requestPayout(
    communityId: string,
    amount: number,
    bankAccount: string
  ): Promise<{ success: boolean; payoutId?: string; error?: string }> {
    try {
      // Check available balance
      const balance = await this.getTreasuryBalance('community', communityId);

      if (balance.available < amount) {
        return {
          success: false,
          error: `Insufficient available balance. Available: ${balance.available}, Requested: ${amount}`,
        };
      }

      // TODO: Integrate with Stripe Connect for actual payout
      // For now, just log the request

      console.log(`Payout requested: ${amount} NOK to ${bankAccount} for community ${communityId}`);

      return {
        success: true,
        payoutId: uuidv4(),
      };
    } catch (error) {
      console.error('Payout request error:', error);
      return {
        success: false,
        error: 'Failed to process payout request',
      };
    }
  }
}
