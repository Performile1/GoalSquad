/**
 * Treasury System - 30-Day Escrow Logic
 *
 * Handles:
 * - Holding funds for 30 days after sale
 * - Automatic release after hold period
 * - Dispute management
 * - Refund processing (Stripe refunds)
 * - Payout requests (Stripe Connect - not yet implemented)
 */

import { supabaseAdmin } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
});

export interface TreasuryHold {
  orderId: string;
  transactionId: string;
  holderType: 'merchant' | 'community' | 'seller' | 'warehouse';
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
   * Release a specific hold.
   *
   * Delegates to the atomic Postgres function `release_treasury_hold`
   * (migration 063): it claims the hold with a conditional UPDATE
   * (status='held' → 'released') so only the winning caller credits the
   * wallet — eliminating the previous read-modify-write double-release race.
   */
  static async releaseHold(holdId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin.rpc('release_treasury_hold', {
        p_hold_id: holdId,
      });

      if (error) {
        console.error('Failed to release hold:', holdId, error.message);
        return false;
      }

      // RPC returns true only if THIS call transitioned the hold.
      return data === true;
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
   * Refund a hold (returns money to customer via Stripe)
   */
  static async refundHold(holdId: string): Promise<boolean> {
    try {
      // Fetch the hold with order details
      const { data: hold, error: fetchError } = await supabaseAdmin
        .from('treasury_holds')
        .select('*, orders!inner(stripe_payment_intent_id)')
        .eq('id', holdId)
        .single();

      if (fetchError || !hold) {
        console.error('Failed to fetch hold for refund:', fetchError);
        return false;
      }

      if (hold.status !== 'held') {
        console.error('Hold is not in held status:', hold.status);
        return false;
      }

      const paymentIntentId = hold.orders?.stripe_payment_intent_id;
      if (!paymentIntentId) {
        console.error('No payment intent ID found for order:', hold.order_id);
        return false;
      }

      // Trigger Stripe refund
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round(parseFloat(hold.amount) * 100), // Convert to cents
        metadata: {
          hold_id: holdId,
          order_id: hold.order_id,
        },
      });

      if (refund.status !== 'succeeded') {
        console.error('Stripe refund failed:', refund);
        return false;
      }

      // Update hold status after successful refund
      const { error: updateError } = await supabaseAdmin
        .from('treasury_holds')
        .update({
          status: 'refunded',
          released_at: new Date().toISOString(),
          metadata: {
            ...(hold.metadata || {}),
            stripe_refund_id: refund.id,
            refunded_at: new Date().toISOString(),
          },
        })
        .eq('id', holdId);

      if (updateError) {
        console.error('Failed to update hold status after refund:', updateError);
        return false;
      }

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
   *
   * NOTE: This is NOT YET IMPLEMENTED. It requires Stripe Connect setup:
   * - Communities must have connected accounts
   * - Platform must have Connect integration configured
   * - Bank account verification flow needed
   *
   * Current behavior: returns error indicating not in production.
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
          error: `Insufficient available balance. Available: ${balance.available} SEK, Requested: ${amount} SEK`,
        };
      }

      // NOT YET IMPLEMENTED: Requires Stripe Connect integration
      console.error(`Payout requested but not implemented: ${amount} SEK to ${bankAccount} for community ${communityId}`);

      return {
        success: false,
        error: 'Payout functionality not yet implemented. Requires Stripe Connect setup.',
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
