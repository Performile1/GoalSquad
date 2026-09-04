import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getAuthUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabaseAdmin.from('referrals').select('id, referral_code, referred_id, status, bonus_amount, completed_at, created_at').eq('referrer_id', user.id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
  return NextResponse.json({ referrals: data || [] });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const code = `GS-${randomBytes(5).toString('hex').toUpperCase()}`;
  const { data, error } = await supabaseAdmin.from('referrals').insert({ referrer_id: user.id, referral_code: code, expires_at: new Date(Date.now() + 90 * 86400000).toISOString() }).select('id, referral_code, status, expires_at, created_at').single();
  if (error) return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
  return NextResponse.json({ referral: data }, { status: 201 });
}
