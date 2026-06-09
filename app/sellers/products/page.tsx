'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export const dynamic = 'force-dynamic';

export default function SellerProductsRedirect() {
  const router = useRouter();
  const { user, loading, entities } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login?redirect=/sellers/products');
      } else if (entities?.seller) {
        router.replace(`/sellers/${entities.seller}/products`);
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, loading, entities, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-primary-900 border-t-transparent animate-spin" />
    </div>
  );
}
