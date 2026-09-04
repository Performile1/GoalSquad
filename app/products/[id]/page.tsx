'use client';

import { useState, useEffect } from 'react';
import CertificationBadges, { CertificationList } from '@/app/components/CertificationBadges';
import AllergenCards from '@/app/components/AllergenCards';
import { ShoppingBagIcon, BoxIcon, AlertIcon, CartIcon, CheckIcon } from '@/app/components/BrandIcons';
import { useCart } from '@/app/hooks/useCart';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  certifications: string[];
  allergens: any[];
  canConsolidate: boolean;
  shippingRestrictions: any[];
  requiresColdChain: boolean;
  requiresFrozen: boolean;
  isFragile: boolean;
  shippingNotes?: string;
  sellerId: string;
  merchantName: string;
  stock: number;
  attributes: Record<string, any>;
  reviews: { items: { id: string; rating: number; title?: string; comment?: string; verified_purchase: boolean; created_at: string }[]; average: number; count: number };
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      const data = await response.json();
      setProduct({
        ...data.product,
        images: data.product.images || [],
        certifications: data.product.certifications || [],
        allergens: data.product.allergens || [],
        shippingRestrictions: data.product.shippingRestrictions || [],
        attributes: data.product.attributes || {},
        reviews: data.product.reviews || { items: [], average: 0, count: 0 },
      });
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product || product.stock < 1) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.images[0],
      sellerId: product.sellerId,
      sellerName: product.merchantName,
      quantity,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 animate-bounce flex justify-center"><ShoppingBagIcon size={52} className="text-primary-900" /></div>
          <p className="text-xl text-gray-600">Laddar produkt...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 flex justify-center"><ShoppingBagIcon size={52} className="text-gray-300" /></div>
          <p className="text-2xl font-bold text-gray-900">Produkt hittades inte</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Images */}
          <div>
            {/* Main Image */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-4">
              <img
                src={product.images[selectedImage] || '/placeholder.png'}
                alt={product.name}
                className="w-full h-96 object-contain"
              />
            </div>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`bg-white rounded-lg p-2 border-2 transition ${
                      selectedImage === index
                        ? 'border-primary-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-20 object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Certifications under images */}
            {product.certifications && product.certifications.length > 0 && (
              <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Certifieringar & Märkningar
                </h3>
                <CertificationBadges
                  certifications={product.certifications}
                  size="large"
                  layout="grid"
                />
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div>
            {/* Title & Price */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              
              <div className="text-5xl font-bold text-primary-900 mb-6">
                {product.price.toLocaleString()} kr
              </div>

              {/* Certification Badges (compact) */}
              {product.certifications && product.certifications.length > 0 && (
                <div className="mb-6">
                  <CertificationBadges
                    certifications={product.certifications}
                    size="medium"
                    layout="horizontal"
                  />
                </div>
              )}

              {/* Description */}
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Add to Cart */}
              <div className="flex items-center gap-3 mb-4">
                <label htmlFor="product-quantity" className="font-semibold text-gray-700">Antal</label>
                <input id="product-quantity" type="number" min="1" max={product.stock} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(product.stock, Number(event.target.value) || 1)))} className="w-20 rounded-lg border-2 border-gray-200 px-3 py-2 text-center focus:border-primary-600 focus:outline-none" />
                <span className="text-sm text-gray-500">{product.stock} i lager</span>
              </div>
              <button onClick={handleAddToCart} disabled={product.stock === 0} className="w-full bg-gradient-to-r from-primary-900 to-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:from-primary-800 hover:to-primary-700 transition shadow-lg disabled:cursor-not-allowed disabled:opacity-50">
                {added ? 'Tillagd i varukorgen' : product.stock === 0 ? 'Slut i lager' : 'Lägg i varukorg'}
              </button>
            </div>

            {/* Shipping Information */}
            {(!product.canConsolidate || product.shippingRestrictions.length > 0) && (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-bold text-yellow-900 mb-3 flex items-center gap-2">
                  Fraktinformation
                </h3>
                
                {!product.canConsolidate && (
                  <div className="mb-3 flex items-start gap-3">
                    <span><AlertIcon size={24} className="text-yellow-600" /></span>
                    <div>
                      <p className="font-semibold text-yellow-900">
                        Kan inte kombineras med andra produkter
                      </p>
                      <p className="text-sm text-yellow-800">
                        Denna produkt måste skickas separat
                      </p>
                    </div>
                  </div>
                )}

                {product.requiresFrozen && (
                  <div className="mb-3 flex items-start gap-3">
                    <span><BoxIcon size={24} className="text-blue-500" /></span>
                    <div>
                      <p className="font-semibold text-yellow-900">
                        Kräver fryst frakt
                      </p>
                      <p className="text-sm text-yellow-800">
                        Produkten måste hållas fryst under transport
                      </p>
                    </div>
                  </div>
                )}

                {product.requiresColdChain && !product.requiresFrozen && (
                  <div className="mb-3 flex items-start gap-3">
                    <span><BoxIcon size={24} className="text-blue-400" /></span>
                    <div>
                      <p className="font-semibold text-yellow-900">
                        Kräver kylkedja
                      </p>
                      <p className="text-sm text-yellow-800">
                        Produkten måste hållas kyld under transport
                      </p>
                    </div>
                  </div>
                )}

                {product.isFragile && (
                  <div className="mb-3 flex items-start gap-3">
                    <span><BoxIcon size={24} className="text-yellow-600" /></span>
                    <div>
                      <p className="font-semibold text-yellow-900">
                        Ömtålig produkt
                      </p>
                      <p className="text-sm text-yellow-800">
                        Kräver extra försiktig hantering
                      </p>
                    </div>
                  </div>
                )}

                {product.shippingRestrictions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-yellow-300">
                    <p className="text-sm font-semibold text-yellow-900 mb-2">
                      Fraktrestriktioner:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.shippingRestrictions.map((restriction: any) => (
                        <span
                          key={restriction.code}
                          className="bg-yellow-200 text-yellow-900 px-3 py-1 rounded-full text-xs font-semibold"
                        >
                          {restriction.icon} {restriction.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {product.shippingNotes && (
                  <div className="mt-4 pt-4 border-t border-yellow-300">
                    <p className="text-sm text-yellow-800">
                      <strong>Obs:</strong> {product.shippingNotes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Allergen Warnings */}
            {product.allergens && product.allergens.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Allergiinformation
                </h3>
                <AllergenCards allergens={product.allergens} mode="display" />
              </div>
            )}

            {/* Detailed Certifications */}
            {product.certifications && product.certifications.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Certifieringar i detalj
                </h3>
                <CertificationList certifications={product.certifications} />
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Produktinformation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {Object.entries(product.attributes).filter(([key]) => !['certifications', 'images'].includes(key)).slice(0, 10).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-4 border-b border-gray-100 pb-2"><span className="text-gray-500 capitalize">{key.replaceAll('_', ' ')}</span><span className="font-semibold text-gray-800 text-right">{Array.isArray(value) ? value.join(', ') : String(value)}</span></div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-gray-900">Reviews</h3><span className="text-sm font-bold text-primary-900">{product.reviews.average ? `${product.reviews.average}/5` : 'Inga betyg'} {product.reviews.count ? `(${product.reviews.count})` : ''}</span></div>
              {product.reviews.items.length ? <div className="space-y-4">{product.reviews.items.slice(0, 5).map((review) => <div key={review.id} className="border-t border-gray-100 pt-4"><div className="flex justify-between gap-3"><span className="text-amber-500">{'★'.repeat(review.rating)}<span className="text-gray-200">{'★'.repeat(5 - review.rating)}</span></span>{review.verified_purchase && <span className="text-xs font-semibold text-emerald-600">Verifierat köp</span>}</div>{review.title && <p className="mt-1 font-bold text-gray-900">{review.title}</p>}{review.comment && <p className="mt-1 text-sm leading-relaxed text-gray-600">{review.comment}</p>}</div>)}</div> : <p className="text-sm text-gray-500">Bli först med att recensera produkten.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
