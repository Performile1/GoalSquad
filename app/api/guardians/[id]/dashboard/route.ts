/**
 * Guardian Dashboard API
 * GET /api/guardians/[id]/dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Treasury } from '@/lib/treasury';
import { requireUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireUser(req);
    if ('error' in auth) return auth.error;

    const guardianId = params.id;

    if (guardianId !== auth.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get guardian profile
    const { data: guardian, error: guardianError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', guardianId)
      .eq('role', 'guardian')
      .single();

    if (guardianError || !guardian) {
      return NextResponse.json(
        { error: 'Guardian not found' },
        { status: 404 }
      );
    }

    // Get children (sellers with this guardian)
    const { data: children } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('guardian_id', guardianId)
      .eq('role', 'seller');

    const childrenData = await Promise.all(
      (children || []).map(async (child: any) => {
        // Get seller profile
        const { data: sellerProfile } = await supabaseAdmin
          .from('seller_profiles')
          .select('*')
          .eq('user_id', child.id)
          .single();

        // Get treasury balance
        const treasuryBalance = await Treasury.getTreasuryBalance('seller', child.id);

        // Get recent orders
        const { data: orders } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('customer_id', child.id)
          .order('created_at', { ascending: false })
          .limit(5);

        const age = child.metadata?.date_of_birth
          ? Math.floor((Date.now() - new Date(child.metadata.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 0;

        return {
          id: child.id,
          fullName: child.full_name,
          age,
          shopUrl: sellerProfile?.shop_url || '',
          currentLevel: sellerProfile?.current_level || 1,
          totalSales: parseFloat(sellerProfile?.total_sales || '0'),
          totalOrders: sellerProfile?.total_orders || 0,
          treasuryBalance,
          recentOrders: orders?.map((order: any) => ({
            id: order.id,
            orderNumber: order.order_number,
            totalAmount: parseFloat(order.total_amount),
            status: order.status,
            createdAt: order.created_at,
          })) || [],
        };
      })
    );

    const data = {
      fullName: guardian.full_name,
      email: guardian.email,
      children: childrenData,
    };

    return NextResponse.json(data);
  } catch (error) {
    logger.apiError('GET', '/api/guardians/[id]/dashboard', error as Error, { guardianId: params.id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
