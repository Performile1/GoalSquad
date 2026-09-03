'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const sections = [
  {
    label: 'Översikt',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard' },
      { href: '/admin/analytics', label: 'Analys' },
      { href: '/admin/system', label: 'Systemstatus' },
    ],
  },
  {
    label: 'Plattform',
    items: [
      { href: '/admin/users', label: 'Användare' },
      { href: '/admin/communities', label: 'Föreningar & klubbar' },
      { href: '/admin/sellers', label: 'Säljare' },
      { href: '/admin/merchants', label: 'Merchants' },
      { href: '/admin/warehouses', label: 'Lager' },
    ],
  },
  {
    label: 'Handel',
    items: [
      { href: '/admin/orders', label: 'Ordrar' },
      { href: '/admin/returns', label: 'Returer' },
      { href: '/admin/approved-products', label: 'Produkter' },
      { href: '/admin/campaigns', label: 'Kampanjer' },
      { href: '/admin/ads', label: 'Annonser' },
      { href: '/admin/finance', label: 'Ekonomi' },
    ],
  },
  {
    label: 'Innehåll & säkerhet',
    items: [
      { href: '/admin/blog', label: 'Blogg' },
      { href: '/admin/seo', label: 'SEO' },
      { href: '/admin/security', label: 'Säkerhet & roller' },
      { href: '/admin/sops', label: 'SOP & SLA' },
      { href: '/admin/settings', label: 'Inställningar' },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = (
    <nav className="space-y-6" aria-label="Adminnavigation">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            {section.label}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-[#003B3D] text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-[#003B3D]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        className="fixed left-4 top-[4.75rem] z-40 rounded-lg bg-[#003B3D] px-3 py-2 text-sm font-bold text-white shadow-lg lg:hidden"
        aria-expanded={mobileOpen}
        aria-controls="admin-sidebar"
      >
        {mobileOpen ? 'Stäng meny' : 'Adminmeny'}
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Stäng adminmeny"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
        />
      )}

      <aside
        id="admin-sidebar"
        className={`fixed bottom-0 left-0 top-16 z-40 w-72 overflow-y-auto border-r border-slate-200 bg-white px-4 py-6 transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 border-b border-slate-200 px-3 pb-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B68B2C]">GoalSquad</p>
          <h2 className="mt-1 text-lg font-black text-slate-900">Adminpanel</h2>
          <Link href="/dashboard" className="mt-3 inline-block text-xs font-semibold text-slate-500 hover:text-[#003B3D]">
            Till användarvyn
          </Link>
        </div>
        {navigation}
      </aside>

      <main className="min-h-[calc(100vh-4rem)] lg:pl-72">
        {children}
      </main>
    </div>
  );
}
