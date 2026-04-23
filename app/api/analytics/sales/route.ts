import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const rawPeriod = parseInt(searchParams.get('period') || '30', 10);
    const period = Math.min(Math.max(rawPeriod, 1), 365); // clamp 1–365 days
    const groupBy = searchParams.get('groupBy') || 'product'; // product, category, date

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Get user's role and entity info
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, entity_type')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Build query based on role
    let analytics: any[] = [];
    
    if (profile.role === 'merchant') {
      // Merchants see all their sales data
      const { data: merchantData } = await supabaseAdmin
        .from('order_items')
        .select(`
          quantity,
          price,
          products!inner (
            id,
            name,
            category_id,
            merchant_id
          ),
          orders!inner (
            created_at
          )
        `)
        .eq('products.merchant_id', user.id)
        .gte('orders.created_at', startDate.toISOString())
        .lte('orders.created_at', endDate.toISOString());

      if (merchantData) {
        analytics = merchantData;
      }
    } else if (profile.role === 'seller') {
      // Sellers see their sales with commission
      const { data: sellerData } = await supabaseAdmin
        .from('order_items')
        .select(`
          quantity,
          price,
          commission_amount,
          products!inner (
            id,
            name,
            category_id
          ),
          orders!inner (
            created_at
          )
        `)
        .eq('seller_id', user.id)
        .gte('orders.created_at', startDate.toISOString())
        .lte('orders.created_at', endDate.toISOString());

      if (sellerData) {
        analytics = sellerData;
      }
    } else if (profile.role === 'community') {
      // Communities see their members' sales
      const { data: communityData } = await supabaseAdmin
        .from('order_items')
        .select(`
          quantity,
          price,
          commission_amount,
          products!inner (
            id,
            name,
            category_id
          ),
          orders!inner (
            created_at
          ),
          community_members!inner (
            community_id
          )
        `)
        .eq('community_members.community_id', user.id)
        .gte('orders.created_at', startDate.toISOString())
        .lte('orders.created_at', endDate.toISOString());

      if (communityData) {
        analytics = communityData;
      }
    }

    // Process and group data
    const groupedData: any = {};

    analytics.forEach((item: any) => {
      let key;
      
      if (groupBy === 'product') {
        key = item.products.id;
      } else if (groupBy === 'category') {
        key = item.products.category_id || 'uncategorized';
      } else if (groupBy === 'date') {
        key = new Date(item.orders.created_at).toISOString().split('T')[0];
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          key,
          name: groupBy === 'product' ? item.products.name : key,
          quantity: 0,
          revenue: 0,
          commission: 0,
        };
      }

      groupedData[key].quantity += item.quantity || 0;
      groupedData[key].revenue += (item.quantity || 0) * (item.price || 0);
      groupedData[key].commission += item.commission_amount || 0;
    });

    // Convert to array and sort
    const result = Object.values(groupedData).sort((a: any, b: any) => {
      if (groupBy === 'date') return new Date(b.key).getTime() - new Date(a.key).getTime();
      return b.quantity - a.quantity;
    });

    // Calculate totals
    const totals = result.reduce((acc: any, item: any) => {
      acc.totalQuantity += item.quantity;
      acc.totalRevenue += item.revenue;
      acc.totalCommission += item.commission;
      return acc;
    }, { totalQuantity: 0, totalRevenue: 0, totalCommission: 0 });

    return NextResponse.json({
      analytics: result,
      totals,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching sales analytics:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
