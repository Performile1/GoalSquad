'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShopIcon, TrophyIcon, ShoppingCartIcon, MerchantIcon } from '@/app/components/BrandIcons';

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
  moq?: number;
  weight_grams?: number;
  dimensions?: string;
  merchant_name: string;
  merchant_id: string;
  image_seo_tags?: {
    alt_text?: string;
    title?: string;
    caption?: string;
  };
}

export default function MerchantProductPage() {
  const params = useParams();
  const router = useRouter();
  const merchantId = params.id as string;
  const productId = params.productId as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [merchantId, productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/merchants/${merchantId}/products/${productId}`);
      const data = await response.json();
      setProduct(data.product);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    // Add to cart logic
    console.log('Adding to cart:', productId, quantity);
  };

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

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShopIcon size={64} className="text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Produkten hittades inte</p>
        </div>
      </div>
    );
  }

  const seoAlt = product.image_seo_tags?.alt_text || product.name;
  const seoTitle = product.image_seo_tags?.title || product.name;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="text-primary-900 hover:text-primary-600 font-semibold text-sm"
          >
            ← Tillbaka till {product.merchant_name}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl overflow-hidden shadow-lg"
          >
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={seoAlt}
                  title={seoTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShopIcon size={128} className="text-gray-300" />
                </div>
              )}
            </div>
            
            {/* Image SEO caption */}
            {product.image_seo_tags?.caption && (
              <div className="px-6 py-4 border-t">
                <p className="text-sm text-gray-600 italic">{product.image_seo_tags.caption}</p>
              </div>
            )}
          </motion.div>

          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Category */}
            <span className="bg-primary-50 text-primary-900 px-4 py-2 rounded-full text-sm font-semibold inline-block">
              {product.category_name}
            </span>

            {/* Title */}
            <h1 className="text-4xl font-bold text-primary-900">{product.name}</h1>

            {/* Description */}
            <p className="text-gray-600 text-lg leading-relaxed">{product.description}</p>

            {/* Price */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-primary-900">
                  {product.price.toLocaleString()} kr
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <TrophyIcon size={20} className="text-primary-900" />
                  <div>
                    <div className="font-bold text-primary-900">{product.sales_count}</div>
                    <div className="text-xs text-gray-500">Sålda</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ShopIcon size={20} className="text-primary-900" />
                  <div>
                    <div className="font-bold text-primary-900">{product.stock}</div>
                    <div className="text-xs text-gray-500">I lager</div>
                  </div>
                </div>
              </div>

              {/* MOQ */}
              {product.moq && product.moq > 1 && (
                <div className="bg-primary-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-primary-900 font-semibold">
                    Minimibeställning: {product.moq} st
                  </p>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-4">
                <label className="font-semibold text-gray-700">Antal:</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-gray-100 rounded-lg font-bold hover:bg-gray-200 transition"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 h-10 text-center border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                    min="1"
                    max={product.stock}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 bg-gray-100 rounded-lg font-bold hover:bg-gray-200 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full bg-primary-900 text-white py-4 rounded-xl font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCartIcon size={24} />
                {product.stock === 0 ? 'Slut i lager' : 'Lägg i varukorg'}
              </button>
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="font-bold text-gray-900 mb-3">Etiketter</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications */}
            {(product.weight_grams || product.dimensions) && (
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="font-bold text-gray-900 mb-3">Specifikationer</h3>
                <div className="space-y-2 text-sm">
                  {product.weight_grams && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vikt:</span>
                      <span className="font-semibold">{(product.weight_grams / 1000).toFixed(2)} kg</span>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mått:</span>
                      <span className="font-semibold">{product.dimensions}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
