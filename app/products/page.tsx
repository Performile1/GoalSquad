'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShopIcon, OrdersIcon } from '@/app/components/BrandIcons';

interface Category {
  id: string;
  name: string;
  slug: string;
  iconEmoji: string;
  productCount: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  merchantName: string;
  categoryName: string;
  stock: number;
  tags: string[];
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'popular'>('popular');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('sort', sortBy);

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    return matchesSearch && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-4"><ShopIcon size={56} className="opacity-90" /></div>
          <h1 className="text-5xl font-bold text-center mb-4">
            Produktkatalog
          </h1>
          <p className="text-xl text-center text-primary-100">
            Handla och stöd lokala föreningar samtidigt!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filters */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Filtrera
              </h2>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sök produkter
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Sök..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                />
              </div>

              {/* Categories */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Kategorier
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      selectedCategory === null
                        ? 'bg-primary-50 text-primary-900 font-semibold'
                        : 'hover:bg-primary-50 text-gray-700'
                    }`}
                  >
                    <span className="mr-2">🌐</span>
                    Alla kategorier
                    <span className="float-right text-sm">
                      ({products.length})
                    </span>
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.slug)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition ${
                        selectedCategory === category.slug
                          ? 'bg-primary-50 text-primary-900 font-semibold'
                          : 'hover:bg-primary-50 text-gray-700'
                      }`}
                    >
                      <span className="mr-2">{category.iconEmoji}</span>
                      {category.name}
                      <span className="float-right text-sm">
                        ({category.productCount})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Prisintervall
                </label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="50"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>0 kr</span>
                    <span className="font-semibold text-primary-600">
                      {priceRange[1]} kr
                    </span>
                  </div>
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Sortera
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                >
                  <option value="popular">Populärast</option>
                  <option value="name">Namn (A-Ö)</option>
                  <option value="price_asc">Pris (Lägst först)</option>
                  <option value="price_desc">Pris (Högst först)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {filteredProducts.length} produkter
              </h2>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-primary-900 hover:text-primary-600 font-semibold"
                >
                  ✕ Rensa filter
                </button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="mb-4 flex justify-center animate-bounce"><ShopIcon size={64} /></div>
                <p className="text-xl text-gray-600">Laddar produkter...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4 flex justify-center"><OrdersIcon size={64} /></div>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  Inga produkter hittades
                </p>
                <p className="text-gray-600">
                  Försök ändra dina filter eller sökord
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition overflow-hidden group cursor-pointer"
    >
      {/* Image */}
      <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            📦
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Category Badge */}
        <div className="mb-3">
          <span className="bg-primary-50 text-primary-900 px-3 py-1 rounded-full text-xs font-semibold">
            {product.categoryName}
          </span>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {product.description}
        </p>

        {/* Merchant */}
        <p className="text-xs text-gray-500 mb-4">
          Från {product.merchantName}
        </p>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {product.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price & Stock */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="text-3xl font-bold text-primary-900">
            {product.price.toLocaleString()} kr
          </div>
          {product.stock > 0 ? (
            <div className="bg-primary-50 text-primary-900 px-3 py-1 rounded-full text-xs font-semibold">
              ✓ I lager
            </div>
          ) : (
            <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
              ✗ Slut
            </div>
          )}
        </div>

        {/* CTA */}
        <button className="w-full mt-4 bg-primary-900 text-white py-3 rounded-xl font-semibold hover:bg-primary-600 transition">
          Köp nu →
        </button>
      </div>
    </motion.div>
  );
}
