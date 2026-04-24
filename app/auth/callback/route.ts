import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code);

    // Fetch profile to determine role-based redirect
    if (user && next === '/dashboard') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      let redirectPath = '/dashboard';
      if (profile?.role === 'gs_admin') {
        redirectPath = '/admin/dashboard';
      } else if (profile?.role === 'merchant') {
        redirectPath = '/merchants/dashboard';
      } else if (profile?.role === 'warehouse') {
        redirectPath = '/warehouses/dashboard';
      } else if (profile?.role === 'seller') {
        // Fetch seller_id and redirect to seller dashboard
        const { data: seller } = await supabase
          .from('seller_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (seller?.id) {
          redirectPath = `/sellers/${seller.id}/dashboard`;
        } else {
          redirectPath = '/sellers/join';
        }
      }

      return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
