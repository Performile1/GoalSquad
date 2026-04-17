'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export const dynamic = 'force-dynamic';

export default function SellerOrdersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/sellers/orders');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Mina ordrar</h1>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <p className="text-gray-600">Order-sida kommer snart...</p>
        </div>
      </div>
    </div>
  );
}
