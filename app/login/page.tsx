'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to /auth/login with all query parameters preserved
    const redirect = searchParams.get('redirect');
    const queryString = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
    router.replace(`/auth/login${queryString}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-600 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-white border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-white font-semibold">Laddar...</p>
      </div>
    </div>
  );
}
