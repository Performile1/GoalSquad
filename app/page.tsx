'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { SplitEngineIcon, LogisticsIcon, AuditIcon, NoImagePlaceholder, TrophyIcon, CommunityIcon } from '@/app/components/BrandIcons'

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
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 text-white">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col md:flex-row items-center gap-12">
          <motion.div
            className="flex-1 text-center md:text-left"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block bg-white/10 text-white/80 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-6">
              Community Commerce Platform
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              Handla &amp; stöd din<br />
              <span className="text-white/70">förening</span>
            </h1>
            <p className="text-lg text-white/70 mb-10 max-w-lg">
              Varje köp stödjer en lokal förening. GoalSquad delar intäkterna rättvist med säljare, föreningar och logistikpartners.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <Link
                href="/products"
                className="px-8 py-4 bg-white text-primary-900 rounded-xl font-bold hover:bg-primary-50 transition shadow-xl text-lg"
              >
                Handla nu →
              </Link>
              <Link
                href="/merchants/onboard"
                className="px-8 py-4 border-2 border-white/40 text-white rounded-xl font-bold hover:bg-white/10 transition text-lg"
              >
                Bli Merchant
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="flex-shrink-0 grid grid-cols-2 gap-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {[
              { value: '500+', label: 'Föreningar' },
              { value: '10K+', label: 'Produkter' },
              { value: '3x', label: 'Mer intäkt' },
              { value: '100%', label: 'Säkert' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center min-w-[120px]"
              >
                <div className="text-3xl font-extrabold text-white mb-1">{stat.value}</div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

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
              href="/merchants/onboard"
              className="px-8 py-4 border-2 border-white/40 text-white rounded-xl font-bold hover:bg-white/10 transition"
            >
              Bli Merchant →
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
