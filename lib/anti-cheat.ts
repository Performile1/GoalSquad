/**
 * Anti-Cheat System for Gamification
 * Detects suspicious XP velocity and fraudulent activity
 * Based on Gemini recommendation
 */

import { supabaseAdmin } from './supabase';

interface VelocityCheck {
  userId: string;
  isSuspicious: boolean;
  reason?: string;
  flagged: boolean;
}

interface UserStats {
  avgXpPerDay: number;
  avgOrderValue: number;
  totalOrders: number;
  accountAgeDays: number;
}

/**
 * Check if XP gain velocity is suspicious
 */
export class AntiCheat {
  /**
   * Analyze XP velocity for suspicious patterns
   */
  static async checkXPVelocity(
    userId: string,
    newXP: number,
    eventType: string
  ): Promise<VelocityCheck> {
    try {
      // Get user's historical stats
      const stats = await this.getUserStats(userId);

      // Calculate expected XP range
      const expectedXP = this.getExpectedXP(eventType, stats);
      const maxDeviation = expectedXP * 3; // 3x normal is suspicious

      // Check if new XP is abnormally high
      if (newXP > maxDeviation) {
        await this.flagUser(userId, 'xp_velocity_anomaly', {
          newXP,
          expectedXP,
          eventType,
        });

        return {
          userId,
          isSuspicious: true,
          reason: `XP gain (${newXP}) exceeds 3x normal rate (${expectedXP})`,
          flagged: true,
        };
      }

      // Check for rapid-fire events (multiple events in short time)
      const recentEvents = await this.getRecentXPEvents(userId, 5); // Last 5 minutes
      if (recentEvents.length > 10) {
        await this.flagUser(userId, 'rapid_fire_events', {
          eventCount: recentEvents.length,
          timeWindow: '5 minutes',
        });

        return {
          userId,
          isSuspicious: true,
          reason: `Too many XP events in short time (${recentEvents.length} in 5 min)`,
          flagged: true,
        };
      }

      // Check for impossible order patterns
      if (eventType === 'sale_completed') {
        const impossiblePattern = await this.checkImpossibleOrderPattern(userId);
        if (impossiblePattern) {
          return {
            userId,
            isSuspicious: true,
            reason: impossiblePattern,
            flagged: true,
          };
        }
      }

      return {
        userId,
        isSuspicious: false,
        flagged: false,
      };
    } catch (error) {
      console.error('Anti-cheat velocity check failed:', error);
      // Fail open - don't block legitimate users due to check errors
      return {
        userId,
        isSuspicious: false,
        flagged: false,
      };
    }
  }

  /**
   * Get user's historical statistics
   */
  private static async getUserStats(userId: string): Promise<UserStats> {
    const { data: profile } = await supabaseAdmin
      .from('seller_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: user } = await supabaseAdmin
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .single();

    if (!profile || !user) {
      return {
        avgXpPerDay: 0,
        avgOrderValue: 0,
        totalOrders: 0,
        accountAgeDays: 0,
      };
    }

    const accountAgeDays = Math.max(
      1,
      Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    const avgXpPerDay = profile.xp_total / accountAgeDays;
    const avgOrderValue =
      profile.total_orders > 0
        ? parseFloat(profile.total_sales) / profile.total_orders
        : 0;

    return {
      avgXpPerDay,
      avgOrderValue,
      totalOrders: profile.total_orders,
      accountAgeDays,
    };
  }

  /**
   * Get expected XP for event type based on user history
   */
  private static getExpectedXP(eventType: string, stats: UserStats): number {
    switch (eventType) {
      case 'sale_completed':
        // Expected: 50 base + (avg_order_value / 100)
        return 50 + stats.avgOrderValue / 100;
      case 'daily_login':
        return 10;
      case 'achievement_unlocked':
        return 100; // Average achievement value
      case 'streak_bonus':
        return 50;
      default:
        return stats.avgXpPerDay || 50; // Use historical average
    }
  }

  /**
   * Get recent XP events within time window
   */
  private static async getRecentXPEvents(
    userId: string,
    minutesAgo: number
  ): Promise<any[]> {
    const { data: events } = await supabaseAdmin
      .from('xp_events')
      .select('*')
      .eq('user_id', userId)
      .gte(
        'created_at',
        new Date(Date.now() - minutesAgo * 60 * 1000).toISOString()
      );

    return events || [];
  }

  /**
   * Check for impossible order patterns
   */
  private static async checkImpossibleOrderPattern(
    userId: string
  ): Promise<string | null> {
    // Get recent orders (last hour)
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('customer_id', userId)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (!recentOrders || recentOrders.length === 0) {
      return null;
    }

    // Check 1: Too many orders in short time
    if (recentOrders.length > 20) {
      await this.flagUser(userId, 'impossible_order_volume', {
        orderCount: recentOrders.length,
        timeWindow: '1 hour',
      });
      return `Impossible order volume: ${recentOrders.length} orders in 1 hour`;
    }

    // Check 2: Identical orders (potential duplication exploit)
    const orderHashes = recentOrders.map((o) =>
      JSON.stringify({
        total: o.total_amount,
        items: o.order_items?.length || 0,
      })
    );
    const uniqueHashes = new Set(orderHashes);
    if (uniqueHashes.size < orderHashes.length / 2) {
      await this.flagUser(userId, 'duplicate_orders', {
        totalOrders: orderHashes.length,
        uniqueOrders: uniqueHashes.size,
      });
      return 'Suspicious duplicate orders detected';
    }

    // Check 3: Orders immediately cancelled (XP farming)
    const cancelledCount = recentOrders.filter(
      (o) => o.status === 'cancelled'
    ).length;
    if (cancelledCount > recentOrders.length * 0.5) {
      await this.flagUser(userId, 'high_cancellation_rate', {
        totalOrders: recentOrders.length,
        cancelledOrders: cancelledCount,
        rate: (cancelledCount / recentOrders.length) * 100,
      });
      return `High cancellation rate: ${cancelledCount}/${recentOrders.length} orders`;
    }

    return null;
  }

  /**
   * Flag user for manual review
   */
  private static async flagUser(
    userId: string,
    flagType: string,
    metadata: any
  ): Promise<void> {
    // Create flag record
    await supabaseAdmin.from('anti_cheat_flags').insert({
      user_id: userId,
      flag_type: flagType,
      metadata,
      status: 'pending_review',
    });

    // Update seller profile
    await supabaseAdmin
      .from('seller_profiles')
      .update({
        metadata: {
          flagged_for_review: true,
          flag_type: flagType,
          flagged_at: new Date().toISOString(),
        },
      })
      .eq('user_id', userId);

    // TODO: Send notification to admin dashboard
    console.warn(`User ${userId} flagged for ${flagType}`, metadata);
  }

  /**
   * Check if user is currently flagged
   */
  static async isUserFlagged(userId: string): Promise<boolean> {
    const { data: flags } = await supabaseAdmin
      .from('anti_cheat_flags')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending_review')
      .limit(1);

    return (flags?.length || 0) > 0;
  }

  /**
   * Clear user flag (after manual review)
   */
  static async clearUserFlag(
    userId: string,
    reviewedBy: string,
    resolution: 'legitimate' | 'cheating'
  ): Promise<void> {
    await supabaseAdmin
      .from('anti_cheat_flags')
      .update({
        status: resolution === 'legitimate' ? 'cleared' : 'confirmed',
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'pending_review');

    if (resolution === 'cheating') {
      // Suspend account
      await supabaseAdmin
        .from('profiles')
        .update({
          metadata: {
            suspended: true,
            suspension_reason: 'anti_cheat_violation',
            suspended_at: new Date().toISOString(),
          },
        })
        .eq('id', userId);
    } else {
      // Clear flag from profile
      await supabaseAdmin
        .from('seller_profiles')
        .update({
          metadata: {
            flagged_for_review: false,
          },
        })
        .eq('user_id', userId);
    }
  }
}

// Anti-cheat flags table schema (add to security-hardening.sql)
/*
CREATE TABLE IF NOT EXISTS anti_cheat_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  flag_type TEXT NOT NULL,
  metadata JSONB,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'cleared', 'confirmed')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_anti_cheat_flags_user ON anti_cheat_flags(user_id);
CREATE INDEX idx_anti_cheat_flags_status ON anti_cheat_flags(status);
*/
