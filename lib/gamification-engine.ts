/**
 * Gamification Engine - GoalSquad
 * 
 * Handles:
 * - XP calculation and leveling
 * - Achievement unlocking
 * - Streak tracking
 * - Leaderboard updates
 * - Avatar progression
 * - Anti-cheat integration
 */

import { supabaseAdmin } from './supabase';
import { AntiCheat } from './anti-cheat';

export interface XPEvent {
  userId: string;
  eventType: 'sale_completed' | 'daily_login' | 'shop_customized' | 'achievement_unlocked' | 'streak_bonus' | 'team_challenge';
  xpAmount: number;
  referenceId?: string;
  metadata?: Record<string, any>;
}

export interface AchievementCheck {
  userId: string;
  type: 'total_sales' | 'total_orders' | 'consecutive_days' | 'first_sale' | 'international_sale' | 'level_reached';
  value: number;
}

export class GamificationEngine {
  /**
   * XP required for each level (exponential curve)
   */
  static getXPForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  /**
   * Calculate level from total XP
   */
  static calculateLevel(totalXP: number): number {
    let level = 1;
    let xpRequired = 0;

    while (xpRequired <= totalXP) {
      xpRequired += this.getXPForLevel(level);
      if (xpRequired <= totalXP) {
        level++;
      }
    }

    return level;
  }

  /**
   * Award XP to a user (with anti-cheat checks)
   */
  static async awardXP(event: XPEvent): Promise<{
    success: boolean;
    newXP: number;
    newLevel: number;
    leveledUp: boolean;
    flagged?: boolean;
  }> {
    try {
      // Anti-cheat velocity check
      const velocityCheck = await AntiCheat.checkXPVelocity(
        event.userId,
        event.xpAmount,
        event.eventType
      );

      if (velocityCheck.isSuspicious) {
        console.warn(`Suspicious XP activity detected for user ${event.userId}:`, velocityCheck.reason);
        // Still award XP but flag for review
      }

      // Get current seller profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('seller_profiles')
        .select('*')
        .eq('user_id', event.userId)
        .single();

      if (profileError || !profile) {
        throw new Error('Seller profile not found');
      }

      const oldXP = profile.xp_total;
      const oldLevel = profile.current_level;
      const newXP = oldXP + event.xpAmount;
      const newLevel = this.calculateLevel(newXP);
      const leveledUp = newLevel > oldLevel;

      // Update seller profile
      await supabaseAdmin
        .from('seller_profiles')
        .update({
          xp_total: newXP,
          current_level: newLevel,
        })
        .eq('user_id', event.userId);

      // Log XP event
      await supabaseAdmin
        .from('xp_events')
        .insert({
          user_id: event.userId,
          event_type: event.eventType,
          xp_amount: event.xpAmount,
          reference_id: event.referenceId,
          metadata: event.metadata,
        });

      // Check for level-based achievements
      if (leveledUp) {
        await this.checkAchievements({
          userId: event.userId,
          type: 'level_reached',
          value: newLevel,
        });
      }

      return {
        success: true,
        newXP,
        newLevel,
        leveledUp,
      };
    } catch (error) {
      console.error('Failed to award XP:', error);
      return {
        success: false,
        newXP: 0,
        newLevel: 1,
        leveledUp: false,
      };
    }
  }

  /**
   * Check and unlock achievements
   */
  static async checkAchievements(check: AchievementCheck): Promise<string[]> {
    try {
      // Get relevant achievements
      const { data: achievements, error: achievementsError } = await supabaseAdmin
        .from('achievements')
        .select('*')
        .eq('requirement_type', check.type)
        .lte('requirement_value', check.value);

      if (achievementsError || !achievements) {
        return [];
      }

      // Get already unlocked achievements
      const { data: unlocked } = await supabaseAdmin
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', check.userId);

      const unlockedIds = new Set(unlocked?.map(u => u.achievement_id) || []);

      // Find new achievements to unlock
      const newAchievements = achievements.filter(a => !unlockedIds.has(a.id));

      if (newAchievements.length === 0) {
        return [];
      }

      // Unlock achievements
      const unlockPromises = newAchievements.map(async (achievement) => {
        // Insert user achievement
        await supabaseAdmin
          .from('user_achievements')
          .insert({
            user_id: check.userId,
            achievement_id: achievement.id,
          });

        // Award XP
        if (achievement.reward_xp > 0) {
          await this.awardXP({
            userId: check.userId,
            eventType: 'achievement_unlocked',
            xpAmount: achievement.reward_xp,
            referenceId: achievement.id,
          });
        }

        // Unlock avatar item if applicable
        if (achievement.reward_item_id) {
          await this.unlockAvatarItem(check.userId, achievement.reward_item_id);
        }

        return achievement.name;
      });

      const unlockedNames = await Promise.all(unlockPromises);
      return unlockedNames;
    } catch (error) {
      console.error('Failed to check achievements:', error);
      return [];
    }
  }

  /**
   * Unlock avatar item for user
   */
  static async unlockAvatarItem(userId: string, itemId: string): Promise<boolean> {
    try {
      const { data: profile } = await supabaseAdmin
        .from('seller_profiles')
        .select('avatar_data')
        .eq('user_id', userId)
        .single();

      if (!profile) return false;

      const avatarData = profile.avatar_data || { unlocked_items: [] };
      if (!avatarData.unlocked_items.includes(itemId)) {
        avatarData.unlocked_items.push(itemId);

        await supabaseAdmin
          .from('seller_profiles')
          .update({ avatar_data: avatarData })
          .eq('user_id', userId);
      }

      return true;
    } catch (error) {
      console.error('Failed to unlock avatar item:', error);
      return false;
    }
  }

  /**
   * Update streak for user
   */
  static async updateStreak(userId: string, saleDate: Date): Promise<{
    streakDays: number;
    bonusAwarded: boolean;
  }> {
    try {
      const { data: profile } = await supabaseAdmin
        .from('seller_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        return { streakDays: 0, bonusAwarded: false };
      }

      const lastSaleDate = profile.last_sale_date ? new Date(profile.last_sale_date) : null;
      const today = new Date(saleDate);
      today.setHours(0, 0, 0, 0);

      let newStreak = 1;
      let bonusAwarded = false;

      if (lastSaleDate) {
        const lastSale = new Date(lastSaleDate);
        lastSale.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((today.getTime() - lastSale.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          // Consecutive day
          newStreak = profile.streak_days + 1;

          // Award streak bonus every 3 days
          if (newStreak % 3 === 0) {
            await this.awardXP({
              userId,
              eventType: 'streak_bonus',
              xpAmount: 50 * (newStreak / 3),
              metadata: { streak_days: newStreak },
            });
            bonusAwarded = true;
          }

          // Check for streak achievements
          await this.checkAchievements({
            userId,
            type: 'consecutive_days',
            value: newStreak,
          });
        } else if (daysDiff > 1) {
          // Streak broken
          newStreak = 1;
        } else if (daysDiff === 0) {
          // Same day, keep current streak
          newStreak = profile.streak_days;
        }
      }

      // Update profile
      await supabaseAdmin
        .from('seller_profiles')
        .update({
          streak_days: newStreak,
          last_sale_date: today.toISOString().split('T')[0],
        })
        .eq('user_id', userId);

      return { streakDays: newStreak, bonusAwarded };
    } catch (error) {
      console.error('Failed to update streak:', error);
      return { streakDays: 0, bonusAwarded: false };
    }
  }

  /**
   * Process sale completion (awards XP and checks achievements)
   */
  static async processSaleCompletion(
    userId: string,
    orderId: string,
    orderAmount: number,
    isInternational: boolean = false
  ): Promise<void> {
    try {
      // Award base XP for sale
      const baseXP = Math.floor(orderAmount / 10); // 1 XP per 10 NOK
      await this.awardXP({
        userId,
        eventType: 'sale_completed',
        xpAmount: baseXP,
        referenceId: orderId,
      });

      // Update streak
      await this.updateStreak(userId, new Date());

      // Get updated stats
      const { data: profile } = await supabaseAdmin
        .from('seller_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profile) {
        // Check achievements
        await this.checkAchievements({
          userId,
          type: 'total_sales',
          value: profile.total_sales,
        });

        await this.checkAchievements({
          userId,
          type: 'total_orders',
          value: profile.total_orders,
        });

        if (profile.total_orders === 1) {
          await this.checkAchievements({
            userId,
            type: 'first_sale',
            value: 1,
          });
        }

        if (isInternational) {
          await this.checkAchievements({
            userId,
            type: 'international_sale',
            value: 1,
          });
        }
      }
    } catch (error) {
      console.error('Failed to process sale completion:', error);
    }
  }

  /**
   * Update leaderboard for a community
   */
  static async updateLeaderboard(
    communityId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'all_time'
  ): Promise<void> {
    try {
      // Calculate date range
      const now = new Date();
      let periodStart = new Date();

      switch (period) {
        case 'daily':
          periodStart.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          periodStart.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          periodStart.setMonth(now.getMonth() - 1);
          break;
        case 'all_time':
          periodStart = new Date(0);
          break;
      }

      // Get top sellers
      const { data: sellers } = await supabaseAdmin
        .from('seller_profiles')
        .select('user_id, total_sales, total_orders, current_level, xp_total')
        .eq('community_id', communityId)
        .order('total_sales', { ascending: false })
        .limit(100);

      if (!sellers) return;

      // Format rankings
      const rankings = sellers.map((seller, index) => ({
        rank: index + 1,
        userId: seller.user_id,
        totalSales: seller.total_sales,
        totalOrders: seller.total_orders,
        level: seller.current_level,
        xp: seller.xp_total,
      }));

      // Upsert leaderboard
      await supabaseAdmin
        .from('leaderboards')
        .upsert({
          leaderboard_type: 'community',
          scope_id: communityId,
          period,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: now.toISOString().split('T')[0],
          rankings,
          updated_at: now.toISOString(),
        });
    } catch (error) {
      console.error('Failed to update leaderboard:', error);
    }
  }

  /**
   * Get user's rank in community
   */
  static async getUserRank(
    userId: string,
    communityId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time'
  ): Promise<number | null> {
    try {
      const { data: leaderboard } = await supabaseAdmin
        .from('leaderboards')
        .select('rankings')
        .eq('leaderboard_type', 'community')
        .eq('scope_id', communityId)
        .eq('period', period)
        .single();

      if (!leaderboard || !leaderboard.rankings) {
        return null;
      }

      const rankings = leaderboard.rankings as any[];
      const userRanking = rankings.find(r => r.userId === userId);

      return userRanking?.rank || null;
    } catch (error) {
      console.error('Failed to get user rank:', error);
      return null;
    }
  }
}
