'use client';

import Link from 'next/link';

const P = '#004040';
const A = '#006666';

function ProviderBadge({ label, sub }: { label: string; sub?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center px-4 py-2 rounded-lg border border-white/20 hover:border-white/50 transition min-w-[80px]"
      style={{ background: 'rgba(255,255,255,0.07)' }}
    >
      <span className="text-white font-bold text-sm tracking-wide leading-none">
        {label}
      </span>
      {sub && (
        <span className="text-white/50 text-[10px] font-medium mt-0.5 uppercase tracking-widest">
          {sub}
        </span>
      )}
    </div>
  );
}

function StripeIcon() {
  return (
    <div
      className="flex items-center justify-center px-4 py-2 rounded-lg border border-white/20 hover:border-white/50 transition"
      style={{ background: 'rgba(255,255,255,0.07)' }}
    >
      <svg width="48" height="20" viewBox="0 0 48 20" fill="none">
        <text x="2" y="15" fontSize="14" fontWeight="700" fill="white" fontFamily="system-ui">
          stripe
        </text>
      </svg>
    </div>
  );
}

function SwishIcon() {
  return (
    <div
      className="flex items-center justify-center px-4 py-2 rounded-lg border border-white/20 hover:border-white/50 transition"
      style={{ background: 'rgba(255,255,255,0.07)' }}
    >
      <svg width="54" height="20" viewBox="0 0 54 20" fill="none">
        <text x="2" y="15" fontSize="13" fontWeight="700" fill="white" fontFamily="system-ui">
          Swish
        </text>
      </svg>
    </div>
  );
}

export default function Footer() {
  const paymentProviders = [
    { label: 'STRIPE' },
    { label: 'KLARNA' },
    { label: 'SWISH' },
    { label: 'VISA' },
    { label: 'MC', sub: 'Mastercard' },
  ];

  const logisticsProviders = [
    { label: 'DHL' },
    { label: 'Instabox' },
    { label: 'Budbee' },
    { label: 'Airmee' },
    { label: 'Earlybird' },
    { label: 'Citymail' },
  ];

  return (
    <footer style={{ backgroundColor: P }} className="text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <img
                src="/logos/goalsquad-logo.png"
                alt="GoalSquad"
                className="h-8 w-auto"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span className="text-xl font-bold text-white">GoalSquad</span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed">
              Community Commerce Platform. Vi hjälper föreningar att sälja smart och dela intäkter rättvist.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Handla
            </h3>
            <ul className="space-y-2">
              {[
                { href: '/products', label: 'Alla produkter' },
                { href: '/communities', label: 'Communities' },
                { href: '/leaderboard', label: 'Leaderboard' },
                { href: '/cart', label: 'Varukorg' },
                { href: '/orders', label: 'Mina ordrar' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white text-sm transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Merchant */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Merchant
            </h3>
            <ul className="space-y-2">
              {[
                { href: '/merchants/onboard', label: 'Bli Merchant' },
                { href: '/dashboard', label: 'Min sida' },
                { href: '/merchants', label: 'Alla merchants' },
                { href: '/auth/register', label: 'Skapa konto' },
                { href: '/auth/login', label: 'Logga in' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white text-sm transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Om oss
            </h3>
            <ul className="space-y-2">
              {[
                { href: '/about', label: 'Om GoalSquad' },
                { href: '/privacy', label: 'Integritetspolicy' },
                { href: '/terms', label: 'Användarvillkor' },
                { href: '/contact', label: 'Kontakt' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white text-sm transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Providers section */}
        <div
          className="rounded-2xl p-6 mb-8"
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          {/* Payment */}
          <div className="mb-6">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">
              Betalning
            </p>
            <div className="flex flex-wrap gap-3">
              {paymentProviders.map((p) => (
                <ProviderBadge key={p.label} label={p.label} sub={p.sub} />
              ))}
            </div>
          </div>

          {/* Logistics */}
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">
              Leverans
            </p>
            <div className="flex flex-wrap gap-3">
              {logisticsProviders.map((p) => (
                <ProviderBadge key={p.label} label={p.label} />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} GoalSquad. Alla rättigheter förbehållna.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs">Säkra betalningar med</span>
            <span className="text-white/60 text-xs font-semibold">256-bit SSL</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline opacity-60">
              <rect x="3" y="7" width="10" height="8" rx="1.5" fill="white" />
              <path d="M5 7V5a3 3 0 016 0v2" stroke="white" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
        </div>
      </div>
    </footer>
  );
}
