import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthUser } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: seller, error } = await supabaseAdmin
      .from('seller_profiles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    if (seller.user_id !== authUser.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, phone, address_line1, city, postal_code, country')
      .eq('id', authUser.id)
      .single();

    return NextResponse.json({ seller, profile });
  } catch (error) {
    logger.apiError('GET', '/api/sellers/[id]/profile', error as Error, { sellerId: params.id });
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: seller } = await supabaseAdmin
      .from('seller_profiles')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!seller || seller.user_id !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { seller: sellerData = {}, profile: profileData = {} } = await req.json();
    const allowedSellerFields = ['shop_url', 'shop_bio', 'shop_video_url', 'avatar_data', 'metadata'];
    const allowedProfileFields = [
      'full_name', 'phone', 'avatar_url', 'date_of_birth',
      'address_line1', 'address_line2', 'city', 'postal_code',
      'country', 'personal_id_number', 'language', 'currency',
      'timezone', 'email_notifications', 'sms_notifications',
      'push_notifications',
    ];
    const safeSellerData = Object.fromEntries(
      allowedSellerFields
        .filter((field) => field in sellerData)
        .map((field) => [field, sellerData[field]])
    );
    const safeProfileData = Object.fromEntries(
      allowedProfileFields
        .filter((field) => field in profileData)
        .map((field) => [field, profileData[field]])
    );

    const [sellerUpdate, profileUpdate] = await Promise.all([
      supabaseAdmin
        .from('seller_profiles')
        .update({ ...safeSellerData, updated_at: new Date().toISOString() })
        .eq('id', params.id)
        .select()
        .single(),
      supabaseAdmin
        .from('profiles')
        .update({ ...safeProfileData, updated_at: new Date().toISOString() })
        .eq('id', authUser.id)
        .select()
        .single(),
    ]);

    if (sellerUpdate.error) throw sellerUpdate.error;
    if (profileUpdate.error) throw profileUpdate.error;

    return NextResponse.json({ seller: sellerUpdate.data, profile: profileUpdate.data });
  } catch (error) {
    logger.apiError('PATCH', '/api/sellers/[id]/profile', error as Error, { sellerId: params.id });
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
