'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SearchIcon, ShoppingBagIcon, DashboardIcon, CommunityIcon, UserIcon } from '@/app/components/BrandIcons';

export default function NotFound() {
  const router = useRouter();
  const [referrer, setReferrer] = useState<string | null>(null);

  useEffect(() => {
    // Try to determine where the user came from
    const ref = document.referrer;
    setReferrer(ref);
  }, []);

  const getHelpfulLinks = () => {
    // Default links
    const links = [
      { href: '/marketplace', label: 'Marketplace', icon: ShoppingBagIcon },
      { href: '/products', label: 'Produkter', icon: SearchIcon },
      { href: '/communities', label: 'Föreningar', icon: CommunityIcon },
    ];

    // Context-aware links based on referrer
    if (referrer) {
      if (referrer.includes('marketplace')) {
        links.push({ href: '/marketplace/new', label: 'Lägg upp produkt', icon: DashboardIcon });
      } else if (referrer.includes('communities')) {
        links.push({ href: '/join/community', label: 'Bli medlem', icon: CommunityIcon });
      } else if (referrer.includes('dashboard')) {
        links.push({ href: '/dashboard', label: 'Dashboard', icon: DashboardIcon });
      }
    }

    return links;
  };

  const helpfulLinks = getHelpfulLinks();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
          {/* 404 Icon */}
          <div className="flex justify-center mb-8">
            <div className="bg-primary-100 rounded-full p-8">
              <SearchIcon size={80} className="text-primary-900" />
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-5xl font-extrabold text-primary-900 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sidan hittades inte</h2>
          <p className="text-gray-600 mb-12 max-w-md mx-auto">
            Sidan du letar efter verkar ha flyttats, raderats eller finns inte längre.
          </p>

          {/* Helpful Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {helpfulLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-6 py-4 bg-primary-50 border-2 border-primary-200 rounded-xl hover:bg-primary-100 hover:border-primary-300 transition group"
                >
                  <Icon size={24} className="text-primary-900 group-hover:scale-110 transition" />
                  <span className="font-semibold text-primary-900">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-900 font-semibold transition"
          >
            ← Gå tillbaka
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Behöver du hjälp?{' '}
          <Link href="/contact" className="text-primary-900 hover:text-primary-600 font-semibold">
            Kontakta oss
          </Link>
        </p>
      </div>
    </div>
  );
}
