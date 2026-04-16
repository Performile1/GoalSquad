'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { NoImagePlaceholder } from '@/app/components/BrandIcons';

const PLATFORM_FEE = 12;

const CATEGORIES = [
  { id: 'all', label: 'Alla kategorier', emoji: '🛒' },
  { id: 'jersey', label: 'Tröjor & Kläder', emoji: '👕' },
  { id: 'handmade', label: 'Eget hantverk', emoji: '🎨' },
  { id: 'equipment', label: 'Utrustning', emoji: '⚽' },
  { id: 'food', label: 'Mat & Dryck', emoji: '🍰' },
  { id: 'other', label: 'Övrigt', emoji: '📦' },
];

interface CommunityProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string;
  sellerName: string;
  communityName?: string;
  location?: string;
  stock: number;
  createdAt: string;
  status: string;
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<CommunityProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/community-products?status=approved')
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    const matchCat = category === 'all' || p.category === category;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.sellerName.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-900 to-primary-600 text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block bg-white/15 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 border border-white/20">
              Community Marketplace
            </span>
            <h1 className="text-5xl font-extrabold mb-4">Köp direkt från föreningar</h1>
            <p className="text-xl text-white/75 max-w-2xl mx-auto mb-8">
              Här säljer föreningar, klasser och säljare sina egna produkter — matchställ, hantverk, 
              utrustning och mycket mer. GoalSquad förmedlar betalningen och tar {PLATFORM_FEE}% förmedlingsavgift.
            </p>
            <Link
              href="/marketplace/new"
              className="inline-block px-8 py-4 bg-white text-primary-900 rounded-xl font-bold text-lg hover:bg-primary-50 transition shadow-xl"
            >
              + Lägg upp din produkt
            </Link>
          </motion.div>
        </div>
      </div>

      {/* How it works banner */}
      <div className="bg-primary-50 border-b border-primary-100">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: '📸', text: 'Lägg upp produkten gratis' },
              { icon: '💳', text: 'Kunden betalar säkert via GoalSquad' },
              { icon: `${PLATFORM_FEE}%`, text: 'GoalSquad tar förmedlingsavgift', isText: true },
              { icon: '💰', text: `Du får ${100 - PLATFORM_FEE}% av priset` },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <span className={`${s.isText ? 'text-2xl font-extrabold text-primary-900 bg-primary-200 rounded-full w-12 h-12 flex items-center justify-center text-sm' : 'text-3xl'}`}>
                  {s.icon}
                </span>
                <p className="text-sm font-medium text-primary-900">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Sök produkt eller säljare..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                category === cat.id
                  ? 'bg-primary-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{cat.emoji}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-2xl font-bold text-primary-900 mb-2">
              {products.length === 0 ? 'Inga produkter än' : 'Inga matchande produkter'}
            </h3>
            <p className="text-gray-500 mb-8">
              {products.length === 0
                ? 'Bli först med att sälja dina produkter här!'
                : 'Prova en annan kategori eller sökning.'}
            </p>
            <Link
              href="/marketplace/new"
              className="px-6 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-700 transition"
            >
              Lägg upp en produkt →
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Sell CTA */}
      <div className="bg-gradient-to-br from-primary-900 to-primary-600 py-16 px-4 mt-16">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-3">Har du något att sälja?</h2>
          <p className="text-white/70 mb-8">
            Föreningar, klasser och säljare kan enkelt lägga upp egna produkter. 
            Vi sköter betalning och du sköter leveransen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/marketplace/new"
              className="px-8 py-4 bg-white text-primary-900 rounded-xl font-bold hover:bg-primary-50 transition shadow-xl"
            >
              Lägg upp produkt gratis →
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 border-2 border-white/40 text-white rounded-xl font-bold hover:bg-white/10 transition"
            >
              Läs mer om avgifter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, index }: { product: CommunityProduct; index: number }) {
  const sellerReceives = product.price * (1 - PLATFORM_FEE / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl border-2 border-gray-100 hover:border-primary-300 hover:shadow-xl transition overflow-hidden group"
    >
      <div className="h-52 overflow-hidden bg-primary-50">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <NoImagePlaceholder width={400} height={208} className="w-full h-full" />
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-primary-600 uppercase tracking-wide">
            {CATEGORIES.find((c) => c.id === product.category)?.label || product.category}
          </span>
          {product.stock <= 5 && product.stock > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
              Bara {product.stock} kvar!
            </span>
          )}
        </div>

        <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-primary-900 transition line-clamp-1">
          {product.title}
        </h3>
        <p className="text-sm text-gray-500 mb-1">av {product.sellerName}</p>
        {product.communityName && (
          <p className="text-xs text-primary-600 font-semibold mb-3">🏆 {product.communityName}</p>
        )}
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{product.description}</p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-2xl font-bold text-primary-900">
              {product.price.toLocaleString('sv-SE')} kr
            </span>
            <p className="text-xs text-gray-400">
              Säljaren får: {sellerReceives.toFixed(0)} kr
            </p>
          </div>
          <button className="px-4 py-2 bg-primary-900 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition">
            Köp →
          </button>
        </div>
      </div>
    </motion.div>
  );
}
