import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adId = params.id;
    const { reason } = await request.json();

    // Get current user (admin)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin status
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'gs_admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Update ad status to rejected
    const { data, error } = await supabaseAdmin
      .from('ads')
      .update({
        status: 'rejected',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', adId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, ad: data });
  } catch (error) {
    console.error('Error rejecting ad:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
