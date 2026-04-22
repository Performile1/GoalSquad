'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { SplitEngineIcon, LogisticsIcon, AuditIcon, NoImagePlaceholder, CommunityIcon, TrophyIcon, LaptopIcon, MerchantIcon, ShopIcon, UserIcon, DashboardIcon } from '@/app/components/BrandIcons'
import AdBanner from '@/app/components/AdBanner'

// ─── Hero Slider ──────────────────────────────────────────────────────────────

const HERO_SLIDES = [
  {
    id: 'sports',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=80&auto=format&fit=crop',
    badge: 'För idrottsföreningar',
    title: ['Låt laget', 'finansieras'],
    subtitle: 'Registrera din idrottsförening. Era spelare säljer produkter, föreningen får sin del — automatiskt.',
    cta: { label: 'Registrera förening', href: '/join/community' },
    ctaAlt: { label: 'Se hur det funkar', href: '/how-it-works' },
  },
  {
    id: 'seller',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1920&q=80&auto=format&fit=crop',
    badge: 'För säljare',
    title: ['Tjäna pengar', 'för din förening'],
    subtitle: 'Bli säljare och sälj produkter för att stödja din förening, klass eller klubb. Enkelt och flexibelt.',
    cta: { label: 'Bli säljare', href: '/sellers/join' },
    ctaAlt: { label: 'Se hur det funkar', href: '/how-it-works' },
  },
  {
    id: 'class',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1920&q=80&auto=format&fit=crop',
    badge: 'För klasser & skolgrupper',
    title: ['Fyll på', 'klasskassan'],
    subtitle: 'Klasser och skolgrupper samlar enkelt in pengar till resor, utrustning och aktiviteter.',
    cta: { label: 'Registrera din klass', href: '/join/community' },
    ctaAlt: { label: 'Beräkna intäkter', href: '#kalkylator' },
  },
  {
    id: 'merchant',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80&auto=format&fit=crop',
    badge: 'För företag & varumärken',
    title: ['Nå tusentals', 'föreningssäljare'],
    subtitle: 'Registrera ditt företag, ladda upp produkter och låt föreningar sälja åt dig. Vi hanterar logistik och betalning.',
    cta: { label: 'Registrera ditt företag', href: '/merchants/onboard' },
    ctaAlt: { label: 'Se produkter', href: '/products' },
  },
]

function HeroSlider() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const next = useCallback(() => setCurrent((c) => (c + 1) % HERO_SLIDES.length), [])
  const prev = () => setCurrent((c) => (c - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
  useEffect(() => {
    if (paused) return
    const id = setInterval(next, 6000)
    return () => clearInterval(id)
  }, [paused, next])
  const slide = HERO_SLIDES[current]
  return (
    <section className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {HERO_SLIDES.map((s, i) => (
        <div key={s.id} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: i === current ? 1 : 0 }}>
          <img src={s.image} alt="" className="w-full h-full object-cover" />
        </div>
      ))}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,59,61,0.92) 0%, rgba(0,59,61,0.75) 50%, rgba(0,59,61,0.55) 100%)' }} />
      <div className="relative h-full flex flex-col justify-center max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <AnimatePresence mode="wait">
          <motion.div key={slide.id} initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.55 }} className="max-w-3xl">
            <span className="inline-block bg-white/15 backdrop-blur text-white text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 border border-white/20">{slide.badge}</span>
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-extrabold text-white leading-tight mb-6 drop-shadow-xl">
              {slide.title[0]}<br /><span className="text-white/80">{slide.title[1]}</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/75 mb-10 max-w-xl leading-relaxed">{slide.subtitle}</p>
            <div className="flex flex-wrap gap-4">
              <Link href={slide.cta.href} className="btn-hero text-base px-8 py-4">{slide.cta.label} →</Link>
              <Link href={slide.ctaAlt.href} className="btn-ghost-dark text-base px-8 py-4">{slide.ctaAlt.label}</Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <button onClick={prev} className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 border border-white/30 text-white flex items-center justify-center hover:bg-white/20 transition backdrop-blur text-xl font-bold" aria-label="Föregående">‹</button>
      <button onClick={next} className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 border border-white/30 text-white flex items-center justify-center hover:bg-white/20 transition backdrop-blur text-xl font-bold" aria-label="Nästa">›</button>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5 items-center">
        {HERO_SLIDES.map((s, i) => (
          <button key={s.id} onClick={() => setCurrent(i)} className={`rounded-full transition-all duration-300 ${i === current ? 'w-8 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'}`} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <motion.div key={`${current}-progress`} className="h-full bg-white/60" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 6, ease: 'linear' }} />
      </div>
    </section>
  )
}

// ─── Earnings Calculator ───────────────────────────────────────────────────────

function EarningsCalculator() {
  const [sellers, setSellers] = useState(20)
  const [salesPerSeller, setSalesPerSeller] = useState(5)
  const avgMargin = 85
  const totalEarnings = sellers * salesPerSeller * avgMargin

  return (
    <section id="kalkylator" className="section-dark py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-white mb-3">Beräkna er intäkt</h2>
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.6)' }}>Dra i reglagen och se hur mycket er förening kan tjäna</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-8" style={{ boxShadow: '0 0 40px 8px rgba(255,215,0,0.12), 0 4px 24px rgba(0,0,0,0.3)' }}>
          <div className="grid md:grid-cols-2 gap-10 mb-8">
            {/* Slider: Antal säljare */}
            <div>
              <div className="flex justify-between mb-3">
                <span className="font-semibold" style={{ color: '#003B3D' }}>Antal säljare</span>
                <span className="text-2xl font-bold" style={{ color: '#003B3D' }}>{sellers}</span>
              </div>
              <input
                type="range" min={1} max={100} value={sellers}
                onChange={(e) => setSellers(Number(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#003B3D' }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1</span><span>100</span></div>
            </div>

            {/* Slider: Försäljningar per säljare */}
            <div>
              <div className="flex justify-between mb-3">
                <span className="font-semibold" style={{ color: '#003B3D' }}>Försäljningar / säljare</span>
                <span className="text-2xl font-bold" style={{ color: '#003B3D' }}>{salesPerSeller}</span>
              </div>
              <input
                type="range" min={1} max={30} value={salesPerSeller}
                onChange={(e) => setSalesPerSeller(Number(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#003B3D' }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1</span><span>30</span></div>
            </div>
          </div>

          {/* Result */}
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(0,59,61,0.06)', border: '2px solid rgba(0,59,61,0.15)' }}>
            <p className="text-sm font-semibold mb-1 uppercase tracking-wide" style={{ color: '#003B3D' }}>Beräknad intäkt till er förening</p>
            <motion.p
              key={totalEarnings}
              initial={{ scale: 0.9, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-5xl font-extrabold mb-2"
              style={{ color: '#003B3D' }}
            >
              {totalEarnings.toLocaleString('sv-SE')} kr
            </motion.p>
            <p className="text-xs text-gray-500">Baserat på snittmarginal {avgMargin} kr/produkt · Verkliga siffror varierar per produkt</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Link href="/calculator" className="btn-primary flex-1 text-center py-3">
              Detaljerad kalkylator →
            </Link>
            <Link href="/join/community" className="btn-outline flex-1 text-center py-3">
              Registrera förening
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Product carousel ─────────────────────────────────────────────────────────

interface Product {
  id: string; name: string; description: string; price: number;
  imageUrl?: string; merchantName: string; categoryName: string;
}

function ProductCarousel({ products }: { products: Product[] }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const visibleCount = 3
  const next = useCallback(() => setCurrent((c) => (c + 1) % Math.max(1, products.length - visibleCount + 1)), [products.length])
  const prev = () => setCurrent((c) => c === 0 ? Math.max(0, products.length - visibleCount) : c - 1)
  useEffect(() => {
    if (paused || products.length <= visibleCount) return
    const id = setInterval(next, 4000)
    return () => clearInterval(id)
  }, [paused, next, products.length])
  if (products.length === 0) return null
  const visible = products.slice(current, current + visibleCount)
  while (visible.length < visibleCount) visible.push(null as any)
  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {visible.map((product, i) => product ? (
            <motion.div key={product.id + current} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35, delay: i * 0.07 }}>
              <Link href={`/products/${product.id}`} className="card block overflow-hidden group">
                <div className="h-52 overflow-hidden rounded-t-xl">
                  {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" /> : <NoImagePlaceholder width={400} height={208} className="w-full h-full" />}
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#003B3D' }}>{product.categoryName}</p>
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 transition" style={{ }}>{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{product.merchantName}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold" style={{ color: '#003B3D' }}>{product.price.toLocaleString()} kr</span>
                    <span className="badge-petrol">Köp nu →</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ) : <div key={`empty-${i}`} className="hidden md:block" />)}
        </AnimatePresence>
      </div>
      {products.length > visibleCount && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button onClick={prev} className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition font-bold" style={{ borderColor: '#003B3D', color: '#003B3D' }}>←</button>
          <div className="flex gap-2">
            {Array.from({ length: Math.max(1, products.length - visibleCount + 1) }).map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className="rounded-full transition-all" style={{ width: i === current ? 24 : 10, height: 10, background: i === current ? '#003B3D' : '#99c1c2' }} />
            ))}
          </div>
          <button onClick={next} className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition font-bold" style={{ borderColor: '#003B3D', color: '#003B3D' }}>→</button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    fetch('/api/products?sort=popular&limit=9')
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false))
  }, [])

  return (
    <main className="section-light">

      {/* ── Hero Slider ── */}
      <HeroSlider />

      {/* ── Ad Banner ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdBanner placementName="homepage_hero" className="w-full" />
      </section>

      {/* ── Audience Segments ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">Vem är GoalSquad för?</h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">Oavsett om du är en idrottsförening, en skolklass eller ett företag — GoalSquad har en lösning för dig.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: TrophyIcon,
              title: 'Förening & Klubb',
              desc: 'Fotbollsklubbar, idrottsföreningar, scout-grupper. Låt era spelare och medlemmar sälja produkter och dela intäkterna rättvist.',
              features: ['Automatisk intäktsdelning', 'Sälj egna produkter (t.ex. matchställ)', 'Inga förskottskostnader'],
              href: '/join/community',
              cta: 'Registrera förening',
            },
            {
              icon: LaptopIcon,
              title: 'Klass & Skolgrupp',
              desc: 'Fyll på klasskassan inför resor, aktiviteter och utrustning. Enkelt för lärare och elever att komma igång.',
              features: ['Klassvis försäljning', 'Sälj saker klassen har gjort', 'Transparent redovisning'],
              href: '/join/community',
              cta: 'Registrera din klass',
            },
            {
              icon: MerchantIcon,
              title: 'Företag & Varumärke',
              desc: 'Nå tusentals aktiva föreningssäljare i Norden. Ladda upp produkter, sätt marginaler och vi sköter resten.',
              features: ['Distribuerad försäljning', 'Vi hanterar logistik', 'Månadsvis utbetalning'],
              href: '/merchants/onboard',
              cta: 'Bli leverantör',
            },
          ].map((seg, i) => (
            <motion.div key={seg.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card p-8 flex flex-col">
              <div className="flex justify-center mb-4 icon-brand"><seg.icon size={48} /></div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: '#003B3D' }}>{seg.title}</h3>
              <p className="text-gray-600 mb-5 flex-1">{seg.desc}</p>
              <ul className="space-y-2 mb-6">
                {seg.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#003B3D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={seg.href} className="btn-primary w-full text-center py-3">
                {seg.cta} →
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Earnings Calculator ── */}
      <EarningsCalculator />

      {/* ── How It Works ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">Hur det fungerar</h2>
          <p className="text-gray-500 text-lg">Tre enkla steg — från registrering till utbetalning</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Registrera', desc: 'Skapa ett gratis konto för din förening eller klass på bara några minuter. Inga förskottskostnader.', icon: <UserIcon size={32} /> },
            { step: '02', title: 'Välj & sälj', desc: 'Välj produkter från våra leverantörspartners och dela din unika länk med laget, familj och vänner.', icon: <ShopIcon size={32} /> },
            { step: '03', title: 'Inkassera', desc: 'Vi levererar direkt till kunden. Ni ser varje försäljning i realtid och pengarna betalas ut månadsvis.', icon: <TrophyIcon size={32} /> },
          ].map((s, i) => (
            <motion.div key={s.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
              <div className="w-20 h-20 rounded-2xl text-white flex items-center justify-center mx-auto mb-5" style={{ background: '#003B3D', boxShadow: '0 4px 16px rgba(0,59,61,0.3)' }}>{s.icon}</div>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#003B3D' }}>{s.step}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-500">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="section-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-extrabold" style={{ color: '#1A1A1A' }}>Utvalda produkter</h2>
              <p className="text-gray-500 mt-1">Populärt bland våra föreningar just nu</p>
            </div>
            <Link href="/products" className="font-semibold transition flex items-center gap-1" style={{ color: '#003B3D' }}>Visa alla →</Link>
          </div>
          {loadingProducts ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => <div key={i} className="bg-white rounded-2xl h-80 animate-pulse" />)}
            </div>
          ) : products.length > 0 ? (
            <ProductCarousel products={products} />
          ) : (
            <div className="text-center py-16 text-gray-400">Produkter laddas snart...</div>
          )}
        </div>
      </section>

      {/* ── Returns CTA ── */}
      <section className="py-12" style={{ background: '#F8F9FA' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="section-dark rounded-2xl p-8" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
            <h2 className="text-2xl font-bold text-white mb-3">Behöver du returnera en produkt?</h2>
            <p className="mb-6" style={{ color: 'rgba(255,255,255,0.65)' }}>Enkel och smidig returhantering med QR-kod för returfraktsedel</p>
            <Link href="/returns" className="btn-hero inline-block px-8 py-3">
              Skapa retur →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why GoalSquad ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">Varför GoalSquad?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Gratis att komma igång', description: 'Inga förskottskostnader. Registrera din förening eller klass och börja sälja direkt.', icon: <TrophyIcon size={48} /> },
            { title: 'Automatisk intäktsdelning', description: 'Transparent redovisning i realtid. Ni ser exakt hur mycket ni tjänar på varje försäljning.', icon: <DashboardIcon size={48} /> },
            { title: 'Distribuerad Logistik', description: 'Vi hanterar leverans direkt till kunden. Inga lager, ingen frakt, ingen hantering.', icon: <LogisticsIcon size={48} /> },
            { title: 'MOQ Fördelning', description: 'MOQ fördelas automatiskt över flera klubbar, föreningar och slutkonsumenter. Ingen låsning.', icon: <ShopIcon size={48} /> },
          ].map((feature, index) => (
            <motion.div key={feature.title} className="card p-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
              <div className="mb-4 icon-brand">{feature.icon}</div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-gray-500 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Key Differentiator ── */}
      <section style={{ background: '#F8F9FA' }} className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold mb-6" style={{ color: '#003B3D' }}>Det som skiljer oss från andra</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Till skillnad från traditionell klubb- och klassförsäljning där du är låst till en produkt, låter GoalSquad både säljare och slutkonsumenter välja fritt från flera olika produkter och leverantörer.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="card p-6">
              <h3 className="font-bold mb-3" style={{ color: '#003B3D' }}>Flera produkter, inga begränsningar</h3>
              <p className="text-gray-600 text-sm">
                Säljare och kunder kan välja från hundratals produkter från olika leverantörer. Ingen låsning till en specifik produkt eller kategori.
              </p>
            </div>
            <div className="card p-6">
              <h3 className="font-bold mb-3" style={{ color: '#003B3D' }}>MOQ fördelas automatiskt</h3>
              <p className="text-gray-600 text-sm">
                Minimum Order Quantity fördelas över flera klubbar, föreningar, klasser och slutkonsumenter. Ni behöver inte nå MOQ själva.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── App Download ── */}
      <section className="section-dark py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <span className="badge-gold-outline mb-4 inline-flex">Snart tillgänglig</span>
              <h2 className="text-4xl font-extrabold text-white mb-4">
                GoalSquad — <span style={{ color: '#FFD700' }}>i din ficka</span>
              </h2>
              <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Säljare och föreningsledare kan snart hantera allt direkt i appen.
                Spåra försäljning, se leaderboard och ta emot utbetalningar — var du än är.
              </p>
              <div className="flex flex-wrap gap-4">
                {/* iOS */}
                <a
                  href="#app-coming-soon"
                  onClick={(e) => e.preventDefault()}
                  title="Kommer snart på App Store"
                  className="flex items-center gap-3 px-5 py-3 rounded-xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.25)', cursor: 'not-allowed', opacity: 0.75 }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-xs text-white/60">Ladda ner på</p>
                    <p className="text-sm font-bold text-white">App Store</p>
                  </div>
                  <span className="badge-gold text-xs ml-1">Snart</span>
                </a>

                {/* Android */}
                <a
                  href="#app-coming-soon"
                  onClick={(e) => e.preventDefault()}
                  title="Kommer snart på Google Play"
                  className="flex items-center gap-3 px-5 py-3 rounded-xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.25)', cursor: 'not-allowed', opacity: 0.75 }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.18 23.76c.3.17.64.17.94.02l11.8-6.54-2.5-2.5L3.18 23.76zm16.44-9.98L16.44 12l3.18-1.78c.9-.5.9-1.96 0-2.46L5.96.28C5.6.06 5.18.07 4.84.26L14.42 9.84l5.2-5.2c.35.2.58.57.58.98v13.76c0 .41-.23.78-.58.98l-5.2-5.2-9.58 9.58c.34.19.76.2 1.12-.02L19.62 13.78zm-15.44 9.98C3.88 23.59 3.6 23.25 3.6 22.86V1.14c0-.39.28-.73.58-.9L14.42 9.84 4.18 23.76z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-xs text-white/60">Hämta på</p>
                    <p className="text-sm font-bold text-white">Google Play</p>
                  </div>
                  <span className="badge-gold text-xs ml-1">Snart</span>
                </a>
              </div>
              <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                * Appen är under utveckling och kommer lanseras på App Store och Google Play inom kort.
              </p>
            </div>

            {/* Phone mockup */}
            <div className="flex justify-center">
              <div
                className="relative rounded-[2.5rem] p-2 w-56"
                style={{ background: '#2A2A2A', boxShadow: '0 0 40px 8px rgba(255,215,0,0.15), 0 8px 32px rgba(0,0,0,0.5)', border: '2px solid rgba(255,215,0,0.2)' }}
              >
                {/* Screen */}
                <div className="rounded-[2rem] overflow-hidden" style={{ background: '#1A1A1A', aspectRatio: '9/19' }}>
                  <div className="p-4 h-full flex flex-col">
                    {/* Status bar */}
                    <div className="flex justify-between text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      <span>9:41</span><span>●●●</span>
                    </div>
                    {/* Logo */}
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center" style={{ background: '#003B3D' }}>
                        <span className="text-lg font-extrabold" style={{ color: '#FFD700' }}>GS</span>
                      </div>
                      <p className="text-white font-bold text-sm">GoalSquad</p>
                    </div>
                    {/* Stats preview */}
                    {[
                      { label: 'Sålt idag', value: '3 st' },
                      { label: 'Intäkt', value: '255 kr' },
                      { label: 'XP', value: '+120 🏆' },
                    ].map((s) => (
                      <div key={s.label} className="flex justify-between items-center mb-2 px-2 py-1.5 rounded-lg" style={{ background: '#2A2A2A' }}>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
                        <span className="text-xs font-bold" style={{ color: '#FFD700' }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Home indicator */}
                <div className="flex justify-center mt-2">
                  <div className="w-16 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="section-dark py-20" style={{ borderTop: '1px solid rgba(255,215,0,0.12)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <div className="flex justify-center mb-6 icon-achievement"><CommunityIcon size={64} /></div>
          <h2 className="text-4xl font-extrabold mb-4">Redo att börja?</h2>
          <p className="text-lg mb-10 max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Registrera din förening, klass eller ditt företag idag. Det är gratis att komma igång.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/join" className="btn-hero px-8 py-4 text-base">Kom igång gratis →</Link>
            <Link href="/about" className="btn-ghost-dark px-8 py-4 text-base">Läs mer om oss</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
