'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { SplitEngineIcon, LogisticsIcon, AuditIcon, NoImagePlaceholder, CommunityIcon, TrophyIcon, LaptopIcon, MerchantIcon, ShopIcon, UserIcon, DashboardIcon } from '@/app/components/BrandIcons'

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
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,40,40,0.90) 0%, rgba(0,64,64,0.75) 50%, rgba(0,102,102,0.60) 100%)' }} />
      <div className="relative h-full flex flex-col justify-center max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <AnimatePresence mode="wait">
          <motion.div key={slide.id} initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.55 }} className="max-w-3xl">
            <span className="inline-block bg-white/15 backdrop-blur text-white text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 border border-white/20">{slide.badge}</span>
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-extrabold text-white leading-tight mb-6 drop-shadow-xl">
              {slide.title[0]}<br /><span className="text-white/80">{slide.title[1]}</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/75 mb-10 max-w-xl leading-relaxed">{slide.subtitle}</p>
            <div className="flex flex-wrap gap-4">
              <Link href={slide.cta.href} className="px-8 py-4 bg-white text-primary-900 rounded-xl font-bold text-lg hover:bg-primary-50 transition shadow-xl">{slide.cta.label} →</Link>
              <Link href={slide.ctaAlt.href} className="px-8 py-4 border-2 border-white/40 text-white rounded-xl font-bold text-lg hover:bg-white/10 transition backdrop-blur">{slide.ctaAlt.label}</Link>
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
    <section id="kalkylator" className="bg-gradient-to-br from-primary-900 to-primary-600 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-white mb-3">Beräkna er intäkt</h2>
          <p className="text-white/70 text-lg">Dra i reglagen och se hur mycket er förening kan tjäna</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-10 mb-8">
            {/* Slider: Antal säljare */}
            <div>
              <div className="flex justify-between mb-3">
                <span className="font-semibold text-primary-900">Antal säljare</span>
                <span className="text-2xl font-bold text-primary-900">{sellers}</span>
              </div>
              <input
                type="range" min={1} max={100} value={sellers}
                onChange={(e) => setSellers(Number(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#004040' }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1</span><span>100</span></div>
            </div>

            {/* Slider: Försäljningar per säljare */}
            <div>
              <div className="flex justify-between mb-3">
                <span className="font-semibold text-primary-900">Försäljningar / säljare</span>
                <span className="text-2xl font-bold text-primary-900">{salesPerSeller}</span>
              </div>
              <input
                type="range" min={1} max={30} value={salesPerSeller}
                onChange={(e) => setSalesPerSeller(Number(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#004040' }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1</span><span>30</span></div>
            </div>
          </div>

          {/* Result */}
          <div className="bg-primary-50 rounded-2xl p-6 text-center border-2 border-primary-200">
            <p className="text-sm font-semibold text-primary-700 mb-1 uppercase tracking-wide">Beräknad intäkt till er förening</p>
            <motion.p
              key={totalEarnings}
              initial={{ scale: 0.9, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="text-5xl font-extrabold text-primary-900 mb-2"
            >
              {totalEarnings.toLocaleString('sv-SE')} kr
            </motion.p>
            <p className="text-xs text-gray-500">Baserat på snittmarginal {avgMargin} kr/produkt · Verkliga siffror varierar per produkt</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Link href="/calculator" className="flex-1 text-center px-6 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-700 transition">
              Detaljerad kalkylator →
            </Link>
            <Link href="/join/community" className="flex-1 text-center px-6 py-3 border-2 border-primary-900 text-primary-900 rounded-xl font-bold hover:bg-primary-50 transition">
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
              <Link href={`/products/${product.id}`} className="block bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden group">
                <div className="h-52 overflow-hidden">
                  {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" /> : <NoImagePlaceholder width={400} height={208} className="w-full h-full" />}
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold text-primary-600 mb-1 uppercase tracking-wide">{product.categoryName}</p>
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-primary-900 transition">{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{product.merchantName}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary-900">{product.price.toLocaleString()} kr</span>
                    <span className="text-xs bg-primary-50 text-primary-900 px-3 py-1 rounded-full font-semibold">Köp nu →</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ) : <div key={`empty-${i}`} className="hidden md:block" />)}
        </AnimatePresence>
      </div>
      {products.length > visibleCount && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button onClick={prev} className="w-10 h-10 rounded-full border-2 border-primary-900 text-primary-900 flex items-center justify-center hover:bg-primary-900 hover:text-white transition font-bold">←</button>
          <div className="flex gap-2">
            {Array.from({ length: Math.max(1, products.length - visibleCount + 1) }).map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className={`rounded-full transition-all ${i === current ? 'w-6 h-2.5 bg-primary-900' : 'w-2.5 h-2.5 bg-primary-200 hover:bg-primary-400'}`} />
            ))}
          </div>
          <button onClick={next} className="w-10 h-10 rounded-full border-2 border-primary-900 text-primary-900 flex items-center justify-center hover:bg-primary-900 hover:text-white transition font-bold">→</button>
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
    <main className="bg-white">

      {/* ── Hero Slider ── */}
      <HeroSlider />

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
            <motion.div key={seg.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white border-2 border-primary-100 rounded-2xl p-8 hover:border-primary-600 hover:shadow-xl transition flex flex-col">
              <div className="flex justify-center mb-4"><seg.icon size={48} /></div>
              <h3 className="text-2xl font-bold text-primary-900 mb-3">{seg.title}</h3>
              <p className="text-gray-600 mb-5 flex-1">{seg.desc}</p>
              <ul className="space-y-2 mb-6">
                {seg.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-5 h-5 text-primary-900 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={seg.href} className="block text-center bg-primary-900 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition">
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
              <div className="w-20 h-20 rounded-2xl bg-primary-900 text-white flex items-center justify-center mx-auto mb-5 shadow-lg">{s.icon}</div>
              <div className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">{s.step}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-500">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="bg-primary-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">Utvalda produkter</h2>
              <p className="text-gray-500 mt-1">Populärt bland våra föreningar just nu</p>
            </div>
            <Link href="/products" className="text-primary-900 font-semibold hover:text-primary-600 transition flex items-center gap-1">Visa alla →</Link>
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
            <motion.div key={feature.title} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-lg transition" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-gray-500 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Key Differentiator ── */}
      <section className="bg-primary-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-primary-900 mb-6">Det som skiljer oss från andra</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Till skillnad från traditionell klubb- och klassförsäljning där du är låst till en produkt, låter GoalSquad både säljare och slutkonsumenter välja fritt från flera olika produkter och leverantörer.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="bg-white p-6 rounded-xl border-2 border-primary-200">
              <h3 className="font-bold text-primary-900 mb-3">Flera produkter, inga begränsningar</h3>
              <p className="text-gray-600 text-sm">
                Säljare och kunder kan välja från hundratals produkter från olika leverantörer. Ingen låsning till en specifik produkt eller kategori.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border-2 border-primary-200">
              <h3 className="font-bold text-primary-900 mb-3">MOQ fördelas automatiskt</h3>
              <p className="text-gray-600 text-sm">
                Minimum Order Quantity fördelas över flera klubbar, föreningar, klasser och slutkonsumenter. Ni behöver inte nå MOQ själva.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #004040 0%, #006666 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <div className="flex justify-center mb-6"><CommunityIcon size={64} /></div>
          <h2 className="text-4xl font-extrabold mb-4">Redo att börja?</h2>
          <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">
            Registrera din förening, klass eller ditt företag idag. Det är gratis att komma igång.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/join" className="px-8 py-4 bg-white text-primary-900 rounded-xl font-bold hover:bg-primary-50 transition shadow-xl">Kom igång gratis →</Link>
            <Link href="/about" className="px-8 py-4 border-2 border-white/40 text-white rounded-xl font-bold hover:bg-white/10 transition">Läs mer om oss</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
