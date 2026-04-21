'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { ShopIcon, SearchIcon, TrophyIcon, MerchantIcon } from '@/app/components/BrandIcons';

interface Merchant {
  id: string;
  name: string;
  company_slug: string;
  company_description?: string;
  logo_url?: string;
  website_url?: string;
  total_products: number;
  total_sold: number;
  categories: string[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  stock: number;
  sales_count: number;
  category_name: string;
  tags: string[];
}

export default function MerchantCompanyPage() {
  const params = useParams();
  const merchantId = params.id as string;
  
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMerchant();
    fetchProducts();
  }, [merchantId]);

  const fetchMerchant = async () => {
    try {
      const response = await fetch(`/api/merchants/${merchantId}`);
      const data = await response.json();
      setMerchant(data.merchant);
    } catch (error) {
      console.error('Failed to fetch merchant:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/merchants/${merchantId}/products`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShopIcon size={64} className="animate-bounce text-primary-900 mx-auto mb-4" />
          <p className="text-xl text-primary-900 font-semibold">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShopIcon size={64} className="text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Företaget hittades inte</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Company Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Logo */}
            <div className="w-32 h-32 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              {merchant.logo_url ? (
                <img
                  src={merchant.logo_url}
                  alt={merchant.name}
                  className="max-h-full max-w-full object-contain p-4"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-primary-900 flex items-center justify-center text-white text-4xl font-extrabold">
                  {merchant.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Company Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-primary-900 mb-3">{merchant.name}</h1>
              {merchant.company_description && (
                <p className="text-gray-600 mb-4 max-w-2xl">{merchant.company_description}</p>
              )}
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6 mb-4">
                <div>
                  <div className="text-2xl font-bold text-primary-900">{merchant.total_products}</div>
                  <div className="text-sm text-gray-500">Produkter</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary-900">{merchant.total_sold.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Sålda</div>
                </div>
              </div>

              {/* Categories */}
              {merchant.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {merchant.categories.map((category) => (
                    <span
                      key={category}
                      className="bg-primary-50 text-primary-900 px-3 py-1 rounded-full text-sm font-semibold"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex-shrink-0">
              {merchant.website_url && (
                <a
                  href={merchant.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-primary-900 text-white rounded-xl font-semibold hover:bg-primary-700 transition"
                >
                  Besök hemsida
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <SearchIcon size={20} />
            </div>
            <input
              type="text"
              placeholder="Sök produkter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl">
            <ShopIcon size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600">
              {searchQuery ? 'Inga produkter matchar din sökning' : 'Inga produkter än'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} merchantId={merchantId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, index, merchantId }: { product: Product; index: number; merchantId: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden group cursor-pointer"
    >
      {/* Image */}
      <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShopIcon size={64} className="text-gray-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category */}
        <span className="bg-primary-50 text-primary-900 px-3 py-1 rounded-full text-xs font-semibold mb-2 inline-block">
          {product.category_name}
        </span>

        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {product.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price & Sales */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <div>
            <div className="text-2xl font-bold text-primary-900">{product.price.toLocaleString()} kr</div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <TrophyIcon size={12} />
              {product.sales_count} sålda
            </div>
          </div>
          {product.stock > 0 ? (
            <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
              I lager
            </div>
          ) : (
            <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
              Slut
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
