import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Fetch recent activities from various tables
    const [orders, users, communities] = await Promise.all([
      supabase.from('orders').select('id, created_at, total_amount').order('created_at', { ascending: false }).limit(10),
      supabase.from('profiles').select('id, email, full_name, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('communities').select('id, name, created_at').order('created_at', { ascending: false }).limit(10),
    ]);

    const activities: any[] = [];

    // Map orders as sales
    orders.data?.forEach((order: any) => {
      activities.push({
        id: order.id,
        type: 'sale',
        entity: 'Order',
        description: `Ny order skapad`,
        timestamp: order.created_at,
      });
    });

    // Map users as logins
    users.data?.forEach((user: any) => {
      activities.push({
        id: user.id,
        type: 'login',
        entity: user.full_name || user.email,
        description: 'Ny användare registrerad',
        timestamp: user.created_at,
      });
    });

    // Map communities
    communities.data?.forEach((community: any) => {
      activities.push({
        id: community.id,
        type: 'login',
        entity: community.name,
        description: 'Ny community skapad',
        timestamp: community.created_at,
      });
    });

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ activities: activities.slice(0, 20) });
  } catch (error) {
    console.error('Activities error:', error);
    return NextResponse.json(
      { error: 'Misslyckades att hämta aktiviteter' },
      { status: 500 }
    );
  }
}
