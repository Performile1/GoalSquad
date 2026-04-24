'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertIcon } from '@/app/components/BrandIcons';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="white" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="white" d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.791-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.256h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
}

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signInWithOAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  // Get contextual message based on redirect
  const getContextualMessage = (redirectPath: string) => {
    if (redirectPath.includes('marketplace/new')) {
      return 'För att kunna lägga in egna produkter måste ni logga in';
    }
    if (redirectPath.includes('orders') || redirectPath.includes('dashboard')) {
      return 'För att se era ordrar måste ni logga in';
    }
    if (redirectPath.includes('calculator/merchant')) {
      return 'För att kunna räkna ut era intäkter som företag måste ni logga in';
    }
    if (redirectPath.includes('merchants') || redirectPath.includes('sellers')) {
      return 'För att få tillgång till säljar-backend måste ni logga in';
    }
    return 'Logga in på ditt konto';
  };

  const contextualMessage = getContextualMessage(redirect);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
      } else if (data.user) {
        // Fetch profile to determine role-based redirect
        const supabase = createClientComponentClient();
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        // Check if redirect is specified, otherwise use role-based routing
        if (redirect !== '/dashboard') {
          router.push(redirect);
        } else if (profile?.role === 'gs_admin') {
          router.push('/admin/dashboard');
        } else if (profile?.role === 'merchant') {
          // Fetch merchant_id and redirect to merchant dashboard
          const { data: merchant } = await supabase
            .from('merchants')
            .select('id')
            .eq('user_id', data.user.id)
            .single();
          
          if (merchant?.id) {
            router.push(`/merchants/${merchant.id}/dashboard`);
          } else {
            router.push('/merchants/onboard');
          }
        } else if (profile?.role === 'warehouse') {
          // Fetch warehouse_id and redirect to warehouse dashboard
          const { data: warehouse } = await supabase
            .from('warehouse_partners')
            .select('id')
            .eq('user_id', data.user.id)
            .single();
          
          if (warehouse?.id) {
            router.push(`/warehouses/${warehouse.id}/dashboard`);
          } else {
            router.push('/warehouses/onboard');
          }
        } else if (profile?.role === 'seller') {
          // Fetch seller_id and redirect to seller dashboard
          const { data: seller } = await supabase
            .from('seller_profiles')
            .select('id')
            .eq('user_id', data.user.id)
            .single();
          
          if (seller?.id) {
            router.push(`/sellers/${seller.id}/dashboard`);
          } else {
            router.push('/sellers/join');
          }
        } else if (profile?.role === 'community') {
          // Fetch community_id and redirect to community dashboard
          const { data: community } = await supabase
            .from('communities')
            .select('id')
            .eq('owner_id', data.user.id)
            .single();
          
          if (community?.id) {
            router.push(`/communities/${community.id}/dashboard`);
          } else {
            router.push('/communities');
          }
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            GoalSquad
          </h1>
          <p className="text-gray-600">
            {contextualMessage}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg flex items-center gap-3">
            <AlertIcon size={20} className="text-red-600" />
            <p className="text-red-700 text-sm font-semibold">
              {error}
            </p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              E-postadress
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="din@email.com"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Lösenord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 accent-primary-900 rounded"
              />
              <span className="text-sm text-gray-600">Kom ihåg mig</span>
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary-900 hover:text-primary-600 font-semibold"
            >
              Glömt lösenord?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-sm text-gray-500">eller</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => signInWithOAuth('google')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-primary-900 text-white rounded-xl hover:bg-primary-700 transition font-semibold"
          >
            <GoogleLogo />
            Fortsätt med Google
          </button>
          <button
            type="button"
            onClick={() => signInWithOAuth('facebook')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-primary-900 text-white rounded-xl hover:bg-primary-700 transition font-semibold"
          >
            <FacebookLogo />
            Fortsätt med Facebook
          </button>
        </div>

        {/* Sign Up Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Har du inget konto?{' '}
            <Link
              href="/auth/register-select"
              className="text-primary-900 hover:text-primary-600 font-bold"
            >
              Registrera dig här
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
