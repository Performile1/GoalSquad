'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBagIcon, AlertIcon, ArrowRightIcon, PackageIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface CampaignProduct {
  campaignProductId: string;
  campaign: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  product: {
    id: string;
    name: string;
    description?: string;
    basePrice: number;
    retailPrice: number;
    campaignPrice: number;
    category?: string;
    brand?: string;
    imageUrl: string | null;
    stockQuantity: number;
    weightGrams?: number;
    status: string;
  };
  moqPerSeller: number;
}

export default function SellerProductsPage() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params.id as string;

  const [products, setProducts] = useState<CampaignProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [campaignCount, setCampaignCount] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [sellerId]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/sellers/${sellerId}/products`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kunde inte hämta produkter');
      setProducts(data.products || []);
      setCampaignCount(data.campaigns || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter((p) =>
    p.product.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.product.category || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.product.brand || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalStock = filtered.reduce((sum, p) => sum + (p.product.stockQuantity || 0), 0);
  const avgMargin = filtered.length > 0
    ? filtered.reduce((sum, p) => {
        const margin = (p.product.retailPrice || p.product.campaignPrice) - (p.product.basePrice || 0);
        return sum + margin;
      }, 0) / filtered.length
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary-900 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Mina produkter</h1>
            <p className="text-gray-600">
              {campaignCount > 0
                ? `${products.length} produkter från ${campaignCount} kampanj(er)`
                : 'Du har inte anmält dig till några kampanjer ännu'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/communities"
              className="px-5 py-3 rounded-xl font-semibold text-white transition-colors"
              style={{ backgroundColor: '#003B3D' }}
            >
              <span className="flex items-center gap-2">
                <ArrowRightIcon size={18} />
                Hitta kampanjer
              </span>
            </Link>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Stats cards */}
        {!error && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-primary-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Produkter</h3>
                <ShoppingBagIcon size={24} className="text-primary-900" />
              </div>
              <p className="text-3xl font-bold text-primary-900">{products.length}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Total lager</h3>
                <PackageIcon size={24} className="text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-orange-600">{totalStock}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-primary-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Snittmarginal</h3>
                <ShoppingBagIcon size={24} className="text-primary-900" />
              </div>
              <p className="text-3xl font-bold text-primary-900">{avgMargin.toFixed(0)} kr</p>
            </div>
          </div>
        )}

        {/* Search */}
        {products.length > 0 && (
          <div className="mb-6">
            <input
              type="text"
              placeholder="Sök produkter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-96 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
            />
          </div>
        )}

        {/* Empty state */}
        {!error && products.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center"
          >
            <AlertIcon size={64} className="text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Inga produkter ännu</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Du har inte anmält dig till några kampanjer. Gå till din förening och anmäl dig till en pågående kampanj för att börja sälja produkter.
            </p>
            <Link
              href="/communities"
              className="inline-block px-6 py-3 rounded-xl font-semibold text-white transition-colors"
              style={{ backgroundColor: '#003B3D' }}
            >
              Utforska communities →
            </Link>
          </motion.div>
        )}

        {/* Product grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item, index) => (
              <motion.div
                key={item.campaignProductId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className="h-48 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center relative">
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PackageIcon size={64} className="text-primary-300" />
                  )}
                  <span className="absolute top-3 right-3 bg-primary-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {item.campaign.name}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{item.product.name}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.product.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.product.category && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">{item.product.category}</span>
                    )}
                    {item.product.brand && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">{item.product.brand}</span>
                    )}
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Kampanjpris</p>
                      <p className="text-xl font-bold text-primary-900">{item.product.campaignPrice?.toLocaleString()} kr</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Lager</p>
                      <p className={`text-lg font-semibold ${item.product.stockQuantity < item.moqPerSeller ? 'text-red-600' : 'text-green-600'}`}>
                        {item.product.stockQuantity}
                      </p>
                    </div>
                  </div>
                  {item.product.stockQuantity < item.moqPerSeller && (
                    <p className="text-xs text-red-600 mt-2">
                      Lager under MOQ ({item.moqPerSeller} st)
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
