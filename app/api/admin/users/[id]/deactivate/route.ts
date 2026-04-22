/**
 * Admin: Toggle user active state
 * POST /api/admin/users/[id]/deactivate
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: current, error: fetchErr } = await supabaseAdmin
      .from('profiles')
      .select('is_active')
      .eq('id', params.id)
      .single();

    if (fetchErr || !current) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: !current.is_active })
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, is_active: !current.is_active });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
