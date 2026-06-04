import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Hämta användarens önskelista
export async function GET() {
  const loggerContext = { route: '/api/wishlist', method: 'GET' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('consumer_product_preferences')
      .select(`
        id,
        created_at,
        products (id, name, sku, price, image_url)
      `)
      .eq('user_id', session.user.id)
      .eq('is_favorite', true);

    if (error) throw error;

    return NextResponse.json({ success: true, wishlist: data });
  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// POST: Lägg till eller ta bort (toggle) en produkt i önskelistan
export async function POST(request: Request) {
  const loggerContext = { route: '/api/wishlist', method: 'POST' };

  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Kontrollera om produkten redan finns i önskelistan
    const { data: existing } = await supabase
      .from('consumer_product_preferences')
      .select('id, is_favorite')
      .eq('user_id', session.user.id)
      .eq('product_id', productId)
      .single();

    if (existing) {
      // Om den finns -> Toggle is_favorite
      const newFavoriteStatus = !existing.is_favorite;
      const { error: updateError } = await supabase
        .from('consumer_product_preferences')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', existing.id);

      if (updateError) throw updateError;

      return NextResponse.json({ success: true, action: newFavoriteStatus ? 'added' : 'removed' });
    } else {
      // Om den inte finns -> Lägg till den
      const { data: inserted, error: insertError } = await supabase
        .from('consumer_product_preferences')
        .insert({
          user_id: session.user.id,
          product_id: productId,
          is_favorite: true
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return NextResponse.json({ success: true, action: 'added', data: inserted });
    }
  } catch (error: any) {
    console.error(JSON.stringify({ level: 'error', message: error.message, ...loggerContext }));
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
