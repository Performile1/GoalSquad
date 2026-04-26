'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  ShopIcon, OrdersIcon, CommunityIcon, MessageIcon, LeaderboardIcon,
  MerchantIcon, UserIcon, VerifiedIcon,
} from '@/app/components/BrandIcons';
import Notifications from '@/app/components/Notifications';

const ROLE_LABELS: Record<string, string> = {
  user: 'Konsument',
  merchant: 'Merchant',
  seller: 'Säljare',
  warehouse: 'Lagertjänst',
  community: 'Förening',
  gs_admin: 'Administratör',
};

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [checkingRole, setCheckingRole] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (!loading && user && profile) {
      const supabase = createClientComponentClient();

      if (profile.role === 'gs_admin') {
        router.replace('/admin/dashboard');
      } else if (profile.role === 'merchant') {
        supabase.from('merchants').select('id').eq('user_id', user.id).single()
          .then(({ data }) => {
            if (data?.id) router.replace(`/merchants/${data.id}/dashboard`);
            else router.replace('/merchants/onboard');
          });
      } else if (profile.role === 'warehouse') {
        supabase.from('warehouse_partners').select('id').eq('user_id', user.id).single()
          .then(({ data }) => {
            if (data?.id) router.replace(`/warehouses/${data.id}/dashboard`);
            else router.replace('/warehouses/onboard');
          });
      } else if (profile.role === 'seller') {
        supabase.from('seller_profiles').select('id').eq('user_id', user.id).single()
          .then(({ data }) => {
            if (data?.id) router.replace(`/sellers/${data.id}/dashboard`);
            else router.replace('/sellers/join');
          });
      } else if (profile.role === 'community') {
        supabase.from('communities').select('id').eq('owner_id', user.id).single()
          .then(({ data }) => {
            if (data?.id) router.replace(`/communities/${data.id}/dashboard`);
            else router.replace('/communities');
          });
      } else {
        setCheckingRole(true);
        Promise.all([
          supabase.from('merchants').select('id').eq('user_id', user.id).maybeSingle(),
          supabase.from('seller_profiles').select('id').eq('user_id', user.id).maybeSingle(),
          supabase.from('warehouse_partners').select('id').eq('user_id', user.id).maybeSingle(),
          supabase.from('communities').select('id').eq('owner_id', user.id).maybeSingle(),
        ]).then(([merchant, seller, warehouse, community]) => {
          if (merchant.data?.id) router.replace(`/merchants/${merchant.data.id}/dashboard`);
          else if (seller.data?.id) router.replace(`/sellers/${seller.data.id}/dashboard`);
          else if (warehouse.data?.id) router.replace(`/warehouses/${warehouse.data.id}/dashboard`);
          else if (community.data?.id) router.replace(`/communities/${community.data.id}/dashboard`);
          else setCheckingRole(false);
        });
      }
    }
  }, [user, profile, loading, router]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 animate-pulse flex justify-center">
            <ShopIcon size={52} />
          </div>
          <p className="text-gray-500">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const quickLinks = [
    { href: '/products', label: 'Handla', icon: <ShopIcon size={36} />, desc: 'Bläddra produkter' },
    { href: '/orders', label: 'Mina ordrar', icon: <OrdersIcon size={36} />, desc: 'Se orderhistorik' },
    { href: '/communities', label: 'Communities', icon: <CommunityIcon size={36} />, desc: 'Dina föreningar' },
    { href: '/messages', label: 'Meddelanden', icon: <MessageIcon size={36} />, desc: 'Inkorgen' },
    { href: '/leaderboard', label: 'Leaderboard', icon: <LeaderboardIcon size={36} />, desc: 'Topplistor' },
    { href: '/merchants/onboard', label: 'Bli Merchant', icon: <MerchantIcon size={36} />, desc: 'Sälj via GoalSquad' },
  ];

  const roleLabel = ROLE_LABELS[profile?.role || 'user'] || profile?.role || 'Konsument';
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'där';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-900 to-primary-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-700 flex items-center justify-center flex-shrink-0">
              <UserIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">Hej, {displayName}</h1>
              <p className="text-primary-200 text-sm">Välkommen tillbaka</p>
            </div>
          </div>
          <Notifications />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Snabblänkar</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition group flex flex-col gap-2"
            >
              <div className="mb-1 text-primary-900">{link.icon}</div>
              <span className="font-bold text-gray-900 group-hover:text-primary-900 transition">
                {link.label}
              </span>
              <span className="text-sm text-gray-500">{link.desc}</span>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Kontoinformation</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">E-post</label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Namn</label>
              <p className="text-gray-900">{profile?.full_name || '–'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Roll</label>
              <p className="text-gray-900">{roleLabel}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Status</label>
              {profile?.is_verified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-900">
                  <VerifiedIcon size={14} />
                  Verifierad
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                  Ej verifierad
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
