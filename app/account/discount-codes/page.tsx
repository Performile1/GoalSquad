'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { CouponIcon, GiftIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface DiscountCode {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_purchase_amount: number | null;
  max_discount_amount: number | null;
  valid_from: string;
  valid_until: string | null;
  usage_limit: number | null;
  times_used: number;
  is_active: boolean;
}

export default function CustomerDiscountCodesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchDiscountCodes();
    }
  }, [user, loading]);

  const fetchDiscountCodes = async () => {
    try {
      const res = await apiFetch('/api/customer/discount-codes');
      if (res.ok) {
        const data = await res.json();
        setDiscountCodes(data);
      }
    } catch (err) {
      console.error('Failed to fetch discount codes:', err);
    } finally {
      setLoadingCodes(false);
    }
  };

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  const isNotStarted = (validFrom: string) => {
    return new Date(validFrom) > new Date();
  };

  const isValid = (code: DiscountCode) => {
    return code.is_active && !isExpired(code.valid_until) && !isNotStarted(code.valid_from);
  };

  if (loading || loadingCodes) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center animate-pulse"><CouponIcon size={52} /></div>
          <p className="text-gray-500">Laddar rabattkoder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mina Rabattkoder</h1>
          <p className="text-gray-600">Använd dina rabattkoder i kassan för att spara pengar</p>
        </div>

        {/* Active Codes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Aktiva Rabattkoder</h2>
          {discountCodes.filter(isValid).length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="mb-4 flex justify-center"><GiftIcon size={64} className="text-gray-300" /></div>
              <p className="text-gray-500">Du har inga aktiva rabattkoder just nu</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {discountCodes.filter(isValid).map((code) => (
                <div key={code.id} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold text-primary-900">{code.code}</span>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Aktiv
                        </span>
                      </div>
                      <p className="text-gray-600">{code.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-900">
                        {code.discount_type === 'percentage' ? `${code.discount_value}%` : `${code.discount_value} kr`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    {code.min_purchase_amount && (
                      <span>Min. köp: {code.min_purchase_amount} kr</span>
                    )}
                    {code.max_discount_amount && (
                      <span>Max rabatt: {code.max_discount_amount} kr</span>
                    )}
                    {code.usage_limit && (
                      <span>Använd: {code.times_used}/{code.usage_limit}</span>
                    )}
                    <span>Gäller till: {code.valid_until ? new Date(code.valid_until).toLocaleDateString('sv-SE') : 'Obegränsad'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expired Codes */}
        {discountCodes.some(c => !isValid(c)) && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Utgångna/Inaktiva Rabattkoder</h2>
            <div className="grid gap-4">
              {discountCodes.filter(c => !isValid(c)).map((code) => (
                <div key={code.id} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-gray-300 opacity-60">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold text-gray-700">{code.code}</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                          {isExpired(code.valid_until) ? 'Utgången' : isNotStarted(code.valid_from) ? 'Ej startad' : 'Inaktiv'}
                        </span>
                      </div>
                      <p className="text-gray-600">{code.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-700">
                        {code.discount_type === 'percentage' ? `${code.discount_value}%` : `${code.discount_value} kr`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    {code.min_purchase_amount && (
                      <span>Min. köp: {code.min_purchase_amount} kr</span>
                    )}
                    {code.max_discount_amount && (
                      <span>Max rabatt: {code.max_discount_amount} kr</span>
                    )}
                    {code.usage_limit && (
                      <span>Använd: {code.times_used}/{code.usage_limit}</span>
                    )}
                    <span>Gällde till: {code.valid_until ? new Date(code.valid_until).toLocaleDateString('sv-SE') : 'Obegränsad'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
