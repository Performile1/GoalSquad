'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { SplitEngineIcon, LogisticsIcon, AuditIcon, NoImagePlaceholder, TrophyIcon, CommunityIcon } from '@/app/components/BrandIcons'

const HERO_SLIDES = [
  {
    id: 'sports',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=80&auto=format&fit=crop',
    badge: 'För idrottsföreningar',
    title: ['Låt laget', 'finansieras'],
    subtitle: 'Registrera din idrottsförening. Era spelare säljer produkter, föreningen får sin del — automatiskt.',
    cta: { label: 'Registrera förening', href: '/join/community' },
    ctaAlt: { label: 'Se hur det funkar', href: '/communities' },
  },
  {
    id: 'class',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1920&q=80&auto=format&fit=crop',
    badge: 'För klasser & skolgrupper',
    title: ['Fyll på', 'klasskassan'],
    subtitle: 'Klasser och skolgrupper samlar enkelt in pengar till resor, utrustning och aktiviteter.',
    cta: { label: 'Registrera din klass', href: '/join/community' },
    ctaAlt: { label: 'Läs mer', href: '/join' },
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
    <section
      className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background images — crossfade */}
      {HERO_SLIDES.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <img
            src={s.image}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Petroleum gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(0,40,40,0.82) 0%, rgba(0,64,64,0.68) 50%, rgba(0,102,102,0.55) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.55 }}
            className="max-w-3xl"
          >
            <span className="inline-block bg-white/15 backdrop-blur text-white text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 border border-white/20">
              {slide.badge}
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-extrabold text-white leading-tight mb-6 drop-shadow-xl">
              {slide.title[0]}<br />
              <span className="text-white/80">{slide.title[1]}</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/75 mb-10 max-w-xl leading-relaxed">
              {slide.subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={slide.cta.href}
                className="px-8 py-4 bg-white text-primary-900 rounded-xl font-bold text-lg hover:bg-primary-50 transition shadow-xl"
              >
                {slide.cta.label} →
              </Link>
              <Link
                href={slide.ctaAlt.href}
                className="px-8 py-4 border-2 border-white/40 text-white rounded-xl font-bold text-lg hover:bg-white/10 transition backdrop-blur"
              >
                {slide.ctaAlt.label}
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Arrows */}
      <button
        onClick={prev}
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 border border-white/30 text-white flex items-center justify-center hover:bg-white/20 transition backdrop-blur text-xl font-bold"
        aria-label="Föregående"
      >
        ‹
      </button>
      <button
        onClick={next}
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 border border-white/30 text-white flex items-center justify-center hover:bg-white/20 transition backdrop-blur text-xl font-bold"
        aria-label="Nästa"
      >
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5 items-center">
        {HERO_SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'w-8 h-2.5 bg-white'
                : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <motion.div
          key={`${current}-progress`}
          className="h-full bg-white/60"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 6, ease: 'linear' }}
        />
      </div>
    </section>
  )
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string
  merchantName: string
  categoryName: string
}

function ProductCarousel({ products }: { products: Product[] }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const visibleCount = 3

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % Math.max(1, products.length - visibleCount + 1))
  }, [products.length])

  const prev = () => {
    setCurrent((c) =>
      c === 0 ? Math.max(0, products.length - visibleCount) : c - 1
    )
  }

  useEffect(() => {
    if (paused || products.length <= visibleCount) return
    const id = setInterval(next, 4000)
    return () => clearInterval(id)
  }, [paused, next, products.length])

  if (products.length === 0) return null

  const visible = products.slice(current, current + visibleCount)
  // pad to always show 3 cards
  while (visible.length < visibleCount) visible.push(null as any)

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {visible.map((product, i) =>
            product ? (
              <motion.div
                key={product.id + current}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
              >
                <Link
                  href={`/products/${product.id}`}
                  className="block bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden group"
                >
                  <div className="h-52 overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <NoImagePlaceholder width={400} height={208} className="w-full h-full" />
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold text-primary-600 mb-1 uppercase tracking-wide">
                      {product.categoryName}
                    </p>
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-primary-900 transition">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">{product.merchantName}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary-900">
                        {product.price.toLocaleString()} kr
                      </span>
                      <span className="text-xs bg-primary-50 text-primary-900 px-3 py-1 rounded-full font-semibold">
                        Köp nu →
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ) : (
              <div key={`empty-${i}`} className="hidden md:block" />
            )
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {products.length > visibleCount && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full border-2 border-primary-900 text-primary-900 flex items-center justify-center hover:bg-primary-900 hover:text-white transition font-bold"
          >
            ←
          </button>
          <div className="flex gap-2">
            {Array.from({ length: Math.max(1, products.length - visibleCount + 1) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${
                  i === current
                    ? 'w-6 h-2.5 bg-primary-900'
                    : 'w-2.5 h-2.5 bg-primary-200 hover:bg-primary-400'
                }`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="w-10 h-10 rounded-full border-2 border-primary-900 text-primary-900 flex items-center justify-center hover:bg-primary-900 hover:text-white transition font-bold"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    fetch('/api/products?sort=popular&limit=12')
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false))
  }, [])

  return (
    <main className="bg-white">
      {/* ── Hero Slider ── */}
      <HeroSlider />

      {/* ── Featured Products Carousel ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Utvalda produkter</h2>
            <p className="text-gray-500 mt-1">Populärt just nu bland våra föreningar</p>
          </div>
          <Link
            href="/products"
            className="text-primary-900 font-semibold hover:text-primary-600 transition flex items-center gap-1"
          >
            Visa alla →
          </Link>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <ProductCarousel products={products} />
        ) : (
          <div className="text-center py-16 text-gray-400">
            Produkter laddas snart...
          </div>
        )}
      </section>

      {/* ── Category strips ── */}
      <section className="bg-primary-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-10 text-center">
            Populära kategorier
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Sport & Träning', emoji: '⚽', href: '/products?category=sport' },
              { label: 'Kläder', emoji: '👕', href: '/products?category=clothing' },
              { label: 'Utrustning', emoji: '🏋️', href: '/products?category=equipment' },
              { label: 'Accessoarer', emoji: '🎒', href: '/products?category=accessories' },
            ].map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="flex flex-col items-center justify-center gap-3 bg-white rounded-2xl p-8 shadow-sm hover:shadow-md hover:bg-primary-900 hover:text-white group transition"
              >
                <span className="text-4xl">{cat.emoji}</span>
                <span className="font-semibold text-gray-900 group-hover:text-white transition text-center">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust / Features ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
          Varför GoalSquad?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: 'The Split Engine',
              description: 'Triple-dip margins: Sales, Handling och Shipping spreads beräknas i realtid.',
              icon: <SplitEngineIcon size={52} />,
            },
            {
              title: 'Distribuerad Logistik',
              description: 'Multi-origin shipping med hub-konsolidering för optimal leverans.',
              icon: <LogisticsIcon size={52} />,
            },
            {
              title: 'Audit Trail',
              description: 'Oföränderliga signaturer för varje transaktion. Förtroende inbyggt.',
              icon: <AuditIcon size={52} />,
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm hover:shadow-lg transition"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              <div className="mb-5">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
              <p className="text-gray-500">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Communities CTA ── */}
      <section
        className="py-20"
        style={{ background: 'linear-gradient(135deg, #004040 0%, #006666 100%)' }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <div className="flex justify-center mb-6">
            <CommunityIcon size={64} />
          </div>
          <h2 className="text-4xl font-extrabold mb-4">
            Anslut din förening
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">
            Låt GoalSquad sköta logistik, betalning och split-mekanik — du fokuserar på din förening.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/communities"
              className="px-8 py-4 bg-white text-primary-900 rounded-xl font-bold hover:bg-primary-50 transition shadow-xl"
            >
              Se alla föreningar
            </Link>
            <Link
              href="/join"
              className="px-8 py-4 border-2 border-white/40 text-white rounded-xl font-bold hover:bg-white/10 transition"
            >
              Registrera dig →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
