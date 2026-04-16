'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ShopIcon, OrdersIcon, CommunityIcon, MessageIcon, LeaderboardIcon, MerchantIcon } from '@/app/components/BrandIcons';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 animate-pulse flex justify-center"><ShopIcon size={52} /></div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">
            Hej, {profile?.full_name || user.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-primary-100">Välkommen till din sida</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Quick links */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Snabblänkar</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition group flex flex-col gap-2"
            >
              <div className="mb-1">{link.icon}</div>
              <span className="font-bold text-gray-900 group-hover:text-primary-900 transition">
                {link.label}
              </span>
              <span className="text-sm text-gray-500">{link.desc}</span>
            </Link>
          ))}
        </div>

        {/* Account info */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Kontoinformation</h2>
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
              <p className="text-gray-900 capitalize">{profile?.role || 'user'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1">Status</label>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                profile?.is_verified
                  ? 'bg-primary-50 text-primary-900'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {profile?.is_verified ? '✓ Verifierad' : 'Ej verifierad'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
