import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireUser } from '@/lib/api-auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const auth = await requireUser()
    if ('error' in auth) return auth.error
    const { user } = auth

    // 1. Resolve seller profile from auth user
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('seller_profiles')
      .select('id, community_id, total_sales, total_orders')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      logger.apiError('GET', '/api/sellers/dashboard/stats', profileError ?? new Error('Profile not found'), { userId: user.id })
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 })
    }

    // 2. Gamification / XP
    let xpData = { currentXp: 0, currentLevel: 1 }
    try {
      const { data: xpRow } = await supabaseAdmin
        .from('seller_xp')
        .select('total_xp, current_level')
        .eq('seller_id', profile.id)
        .single()
      if (xpRow) {
        xpData = { currentXp: xpRow.total_xp ?? 0, currentLevel: xpRow.current_level ?? 1 }
      }
    } catch {
      // silently fallback
    }

    // 3. Recent orders (5 latest)
    let recentOrders: any[] = []
    try {
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('id, total_amount, status, created_at')
        .eq('seller_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5)
      recentOrders = orders ?? []
    } catch {
      // silently fallback
    }

    // 4. Active campaigns
    let activeCampaigns: any[] = []
    if (profile.community_id) {
      try {
        const { data: campaigns } = await supabaseAdmin
          .from('campaigns')
          .select('id, title, description, status, moq_target, moq_current')
          .eq('community_id', profile.community_id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(5)
        activeCampaigns = campaigns ?? []
      } catch {
        // silently fallback
      }
    }

    // 5. Ledger balance (available for payout)
    let availableBalance = 0
    try {
      const { data: ledger } = await supabaseAdmin
        .from('ledger_entries')
        .select('amount, type')
        .eq('seller_id', profile.id)
      if (ledger) {
        availableBalance = ledger.reduce((sum, entry) => {
          return sum + (entry.type === 'credit' ? (entry.amount ?? 0) : -(entry.amount ?? 0))
        }, 0)
      }
    } catch {
      // silently fallback
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        totalSales: profile.total_sales ?? 0,
        totalOrders: profile.total_orders ?? 0,
        availableBalance,
      },
      xp: xpData,
      recentOrders,
      activeCampaigns,
    })
  } catch (error) {
    logger.apiError('GET', '/api/sellers/dashboard/stats', error as Error, {})
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
