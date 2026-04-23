'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ShopIcon, CommunityIcon, LeaderboardIcon, SearchIcon, ChevronDownIcon } from '@/app/components/BrandIcons';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navLinks = [
    { href: '/products', label: 'Shop', icon: <ShopIcon size={16} />, hasDropdown: true },
    { href: '/communities', label: 'Communities', icon: <CommunityIcon size={16} /> },
    { href: '/leaderboard', label: 'Leaderboard', icon: <LeaderboardIcon size={16} /> },
    { href: '/search', label: 'Sök', icon: <SearchIcon size={16} /> },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-50 border-b" style={{ background: '#F8F9FA', borderColor: '#EAECEE', boxShadow: '0 2px 8px rgba(0,59,61,0.08)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="font-bold text-xl hover:opacity-80 transition"
            style={{ color: '#003B3D' }}
          >
            Goal<span style={{ color: '#003B3D' }}>Squad</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <div key={link.href} className="relative">
                {link.hasDropdown ? (
                  <>
                    <div className="flex items-center gap-0.5">
                      <Link
                        href={link.href}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                          isActive(link.href)
                            ? 'font-semibold'
                            : 'text-gray-600 hover:text-[#003B3D]'
                        }`}
                        style={isActive(link.href) ? { color: '#003B3D', background: 'rgba(0,59,61,0.07)' } : {}}
                      >
                        <span className="icon-brand">{link.icon}</span>
                        {link.label}
                      </Link>
                      <button
                        onClick={() => setShopDropdownOpen(!shopDropdownOpen)}
                        className="p-1.5 rounded-lg transition text-gray-500 hover:text-[#003B3D] hover:bg-[rgba(0,59,61,0.07)]"
                      >
                        <ChevronDownIcon size={14} />
                      </button>
                    </div>
                    {shopDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl border border-[#EAECEE] py-1.5 z-50" style={{ boxShadow: '0 8px 24px rgba(0,59,61,0.14)' }}>
                        {user && (
                          <>
                            {[
                              { href: '/account', label: 'Mina Ordrar' },
                              { href: '/account/gamification', label: 'Gamification' },
                              { href: '/account/discount-codes', label: 'Rabattkoder' },
                              { href: '/returns', label: 'Returer' },
                            ].map(item => (
                              <Link key={item.href} href={item.href} onClick={() => setShopDropdownOpen(false)}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-[rgba(0,59,61,0.06)] hover:text-[#003B3D] transition-colors">
                                {item.label}
                              </Link>
                            ))}
                            <div className="my-1.5 border-t border-[#EAECEE]" />
                          </>
                        )}
                        <Link href="/products" onClick={() => setShopDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-[rgba(0,59,61,0.06)] hover:text-[#003B3D] transition-colors">
                          Alla produkter
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive(link.href) ? 'font-semibold' : 'text-gray-600 hover:text-[#003B3D]'
                    }`}
                    style={isActive(link.href) ? { color: '#003B3D', background: 'rgba(0,59,61,0.07)' } : {}}
                  >
                    <span className="icon-brand">{link.icon}</span>
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Cart */}
            <Link href="/cart" title="Varukorg"
              className="p-2 rounded-lg text-gray-500 hover:text-[#003B3D] hover:bg-[rgba(0,59,61,0.07)] transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </Link>

            {/* Join CTA — btn-primary */}
            <Link href="/join" className="btn-primary text-sm px-4 py-2">
              Registrera dig →
            </Link>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-1.5">
                <Link href="/dashboard"
                  className="px-3.5 py-2 text-sm font-medium rounded-lg transition-all text-gray-700 hover:text-[#003B3D] hover:bg-[rgba(0,59,61,0.06)]">
                  Min sida
                </Link>
                <button onClick={() => signOut()}
                  className="px-3.5 py-2 text-sm font-medium rounded-lg transition-all text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                  Logga ut
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="btn-outline text-sm px-4 py-2">
                Logga in
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-[rgba(0,59,61,0.07)] transition-colors">
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#EAECEE] py-3 space-y-0.5">
            {navLinks.map((link) => (
              <div key={link.href}>
                <Link href={link.href} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.href) ? 'font-semibold' : 'text-gray-600'
                  }`}
                  style={isActive(link.href) ? { color: '#003B3D', background: 'rgba(0,59,61,0.07)' } : {}}>
                  <span className="icon-brand">{link.icon}</span>
                  {link.label}
                </Link>
                {link.hasDropdown && user && (
                  <div className="pl-8 space-y-0.5 mt-0.5">
                    {[
                      { href: '/account', label: 'Mina Ordrar' },
                      { href: '/account/gamification', label: 'Gamification' },
                      { href: '/account/discount-codes', label: 'Rabattkoder' },
                      { href: '/returns', label: 'Returer' },
                    ].map(item => (
                      <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                        className="block px-4 py-2 rounded-lg text-sm text-gray-600 hover:text-[#003B3D] hover:bg-[rgba(0,59,61,0.06)] transition-colors">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-3 border-t border-[#EAECEE] space-y-2">
              <Link href="/cart" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:text-[#003B3D] hover:bg-[rgba(0,59,61,0.06)] transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Varukorg
              </Link>
              <Link href="/merchants/onboard" onClick={() => setMobileOpen(false)} className="btn-primary w-full text-center block py-3">
                Bli Merchant →
              </Link>
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                    Min sida
                  </Link>
                  <button onClick={() => { signOut(); setMobileOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors">
                    Logga ut
                  </button>
                </>
              ) : (
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="btn-outline w-full text-center block py-3">
                  Logga in
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
