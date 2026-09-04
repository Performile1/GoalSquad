import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );
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
        // Fetch merchant_id and redirect to merchant dashboard
        const { data: merchant } = await supabase
          .from('merchants')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (merchant?.id) {
          redirectPath = `/merchants/${merchant.id}/dashboard`;
        } else {
          redirectPath = '/merchants/onboard';
        }
      } else if (profile?.role === 'warehouse') {
        // Fetch warehouse_id and redirect to warehouse dashboard
        const { data: warehouse } = await supabase
          .from('warehouse_partners')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (warehouse?.id) {
          redirectPath = `/warehouses/${warehouse.id}/dashboard`;
        } else {
          redirectPath = '/warehouses/onboard';
        }
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
      } else if (profile?.role === 'community') {
        // Fetch community_id and redirect to community dashboard
        const { data: community } = await supabase
          .from('communities')
          .select('id')
          .eq('owner_id', user.id)
          .single();
        
        if (community?.id) {
          redirectPath = `/communities/${community.id}/dashboard`;
        } else {
          redirectPath = '/communities';
        }
      }

      return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
