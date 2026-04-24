import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/api-auth';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: seller, error } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    if (seller.user_id !== authUser.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, phone, address_line1, city, postal_code, country')
      .eq('id', authUser.id)
      .single();

    return NextResponse.json({ seller, profile });
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: seller } = await supabase
      .from('seller_profiles')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!seller || seller.user_id !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { seller: sellerData, profile: profileData } = await req.json();

    const [sellerUpdate, profileUpdate] = await Promise.all([
      supabase
        .from('seller_profiles')
        .update({ ...sellerData, updated_at: new Date().toISOString() })
        .eq('id', params.id)
        .select()
        .single(),
      supabase
        .from('profiles')
        .update({ ...profileData, updated_at: new Date().toISOString() })
        .eq('id', authUser.id)
        .select()
        .single(),
    ]);

    if (sellerUpdate.error) throw sellerUpdate.error;
    if (profileUpdate.error) throw profileUpdate.error;

    return NextResponse.json({ seller: sellerUpdate.data, profile: profileUpdate.data });
  } catch (error) {
    console.error('Error updating seller profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
