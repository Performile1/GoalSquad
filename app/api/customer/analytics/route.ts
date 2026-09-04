import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: orders, error } = await supabaseAdmin.from('orders').select('id, total, total_amount, status, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Failed to fetch customer analytics' }, { status: 500 });
  const rows = orders || [];
  const totalSpent = rows.reduce((sum, order) => sum + Number(order.total_amount ?? order.total ?? 0), 0);
  const completedOrders = rows.filter((order) => ['paid', 'confirmed', 'processing', 'shipped', 'delivered'].includes(order.status)).length;
  return NextResponse.json({ analytics: { totalOrders: rows.length, completedOrders, totalSpent, averageOrderValue: rows.length ? totalSpent / rows.length : 0, monthly: rows.reduce<Record<string, { orders: number; spent: number }>>((result, order) => { const month = order.created_at.slice(0, 7); result[month] ||= { orders: 0, spent: 0 }; result[month].orders += 1; result[month].spent += Number(order.total_amount ?? order.total ?? 0); return result; }, {}) } });
}
