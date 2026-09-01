import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { addressSchema, validateBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const readSessionUserId = async () => {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user.id;
};

export async function GET() {
  try {
    const userId = await readSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase
      .from('address_book')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, addresses: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Unable to load addresses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await readSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await validateBody(request, addressSchema);
    if ('error' in parsed) {
      return parsed.error;
    }

    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const payload = {
      user_id: userId,
      label: parsed.data.label,
      full_name: parsed.data.full_name,
      address_line1: parsed.data.address_line1,
      address_line2: parsed.data.address_line2 ?? null,
      city: parsed.data.city,
      postal_code: parsed.data.postal_code,
      country: parsed.data.country,
      phone: parsed.data.phone,
      is_default: parsed.data.is_default,
    };

    if (payload.is_default) {
      await supabase
        .from('address_book')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { error } = await supabase.from('address_book').insert(payload);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to create address' }, { status: 500 });
  }
}
