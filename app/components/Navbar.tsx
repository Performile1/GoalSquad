'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navLinks = [
    { href: '/products', label: 'Shop' },
    { href: '/communities', label: 'Communities' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/search', label: 'Sök' },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/');

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/products"
            className="flex items-center gap-2 font-bold text-xl text-blue-600 hover:text-blue-700 transition"
          >
            <span className="text-2xl">⚽</span>
            <span>GoalSquad</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isActive(link.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Cart */}
            <Link
              href="/cart"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
              title="Varukorg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </Link>

            {/* Bli Merchant CTA */}
            <Link
              href="/merchants/onboard"
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition shadow-sm"
            >
              Bli Merchant →
            </Link>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
                >
                  Min sida
                </Link>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  Logga ut
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Logga in
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50"
          >
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
          <div className="md:hidden border-t border-gray-100 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition ${
                  isActive(link.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <Link
                href="/cart"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                🛒 Varukorg
              </Link>
              <Link
                href="/merchants/onboard"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center"
              >
                Bli Merchant →
              </Link>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Min sida
                  </Link>
                  <button
                    onClick={() => { signOut(); setMobileOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Logga ut
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-700 border border-gray-200 text-center hover:bg-gray-50"
                >
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
