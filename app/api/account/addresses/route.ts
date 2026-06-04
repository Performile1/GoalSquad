import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Hämta användarens adresser
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('address_line1, address_line2, city, postal_code, country, phone')
      .eq('id', session.user.id)
      .single();

    if (error) throw error;

    // För enkelhetens skull returnerar vi profilsadress som en enda adress
    // I en fullständig implementation skulle vi ha en separat address_book tabell
    const addresses = data ? [{
      id: session.user.id,
      user_id: session.user.id,
      label: 'Standard',
      full_name: session.user.user_metadata?.full_name || '',
      address_line1: data.address_line1 || '',
      address_line2: data.address_line2 || '',
      city: data.city || '',
      postal_code: data.postal_code || '',
      country: data.country || 'SE',
      phone: data.phone || '',
      is_default: true,
      created_at: new Date().toISOString()
    }] : [];

    return NextResponse.json({ success: true, addresses });
  } catch (error: any) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Skapa ny adress
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Uppdatera profilsadress
    const { error } = await supabase
      .from('profiles')
      .update({
        address_line1: body.address_line1,
        address_line2: body.address_line2,
        city: body.city,
        postal_code: body.postal_code,
        country: body.country,
        phone: body.phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error creating address:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
