'use client';

import { useState, useEffect } from 'react';
import CertificationBadges, { CertificationList } from '@/app/components/CertificationBadges';
import AllergenCards from '@/app/components/AllergenCards';
import { ShoppingBagIcon, BoxIcon, AlertIcon, CartIcon, CheckIcon } from '@/app/components/BrandIcons';

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
  // ... other fields
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      const data = await response.json();
      setProduct(data.product);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
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
              <button className="w-full bg-gradient-to-r from-primary-900 to-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:from-primary-800 hover:to-primary-700 transition shadow-lg">
                Lägg i varukorg
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
          </div>
        </div>
      </div>
    </div>
  );
}
