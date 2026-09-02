import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          res.cookies.delete({ name, ...options })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  // Public merchant pages: /merchants (list) and /merchants/[id] (profile)
  const isPublicMerchant =
    pathname === '/merchants' ||
    /^\/merchants\/[a-f0-9-]{36}$/i.test(pathname);

  // Define protected route prefixes
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/merchants/me') ||
    (pathname.startsWith('/merchants') && !isPublicMerchant) ||
    pathname.startsWith('/sellers') ||
    pathname.startsWith('/warehouses') ||
    pathname.startsWith('/guardians') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/cart') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/account')

  // Redirect to login if no session and trying to access protected routes.
  // The login page (`/auth/login`) reads the `redirect` query param.
  if (!session && isProtected) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Role-based protection for sensitive areas. `profiles.role` is the
  // single source of truth. A user may read their own profile under RLS.
  if (session) {
    const needsRoleCheck =
      pathname.startsWith('/admin') || pathname.startsWith('/warehouses')

    if (needsRoleCheck) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      const role = profile?.role
      const isAdmin = role === 'gs_admin'

      if (pathname.startsWith('/admin') && !isAdmin) {
        const url = req.nextUrl.clone()
        url.pathname = '/dashboard'
        url.search = ''
        return NextResponse.redirect(url)
      }

      if (
        pathname.startsWith('/warehouses') &&
        role !== 'warehouse' &&
        !isAdmin
      ) {
        const url = req.nextUrl.clone()
        url.pathname = '/dashboard'
        url.search = ''
        return NextResponse.redirect(url)
      }
    }
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/merchants/:path*',
    '/sellers/:path*',
    '/warehouses/:path*',
    '/guardians/:path*',
    '/orders/:path*',
    '/cart/:path*',
    '/checkout/:path*',
    '/messages/:path*',
    '/account/:path*',
  ],
}
