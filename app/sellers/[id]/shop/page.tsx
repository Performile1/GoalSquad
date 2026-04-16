'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TrophyIcon, UserIcon, CommunityIcon, SearchIcon, DashboardIcon, JerseyIcon, HandmadeIcon, EquipmentIcon, FoodIcon, ShoppingBagIcon } from '@/app/components/BrandIcons';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  sellerId: string;
}

interface Seller {
  id: string;
  name: string;
  type: 'community' | 'class' | 'individual';
  description: string;
  avatar: string;
  location: string;
  totalSales: number;
}

export default function SellerShopPage() {
  const params = useParams();
  const sellerId = params.id;
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with API call
    const mockSeller: Seller = {
      id: sellerId as string,
      name: 'IFK Göteborg Fotboll',
      type: 'community',
      description: 'Säljer merchandise och tröjor för att stötta föreningens verksamhet',
      avatar: '/images/placeholder-avatar.jpg',
      location: 'Göteborg',
      totalSales: 125000
    };

    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Hemmatröja 2025',
        description: 'Officiell hemmatröja för säsongen 2025/2026',
        price: 599,
        category: 'jersey',
        image: '/images/placeholder-jersey.jpg',
        stock: 50,
        sellerId: sellerId as string
      },
      {
        id: '2',
        name: 'Bortatröja 2025',
        description: 'Officiell bortatröja för säsongen 2025/2026',
        price: 599,
        category: 'jersey',
        image: '/images/placeholder-jersey.jpg',
        stock: 35,
        sellerId: sellerId as string
      },
      {
        id: '3',
        name: 'IFK Göteborg Scarf',
        description: 'Officiell scarf i hög kvalitet',
        price: 149,
        category: 'other',
        image: '/images/placeholder-scarf.jpg',
        stock: 100,
        sellerId: sellerId as string
      }
    ];

    setSeller(mockSeller);
    setProducts(mockProducts);
    setLoading(false);
  }, [sellerId]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'jersey', 'handmade', 'equipment', 'food', 'other'];

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'jersey': return JerseyIcon;
      case 'handmade': return HandmadeIcon;
      case 'equipment': return EquipmentIcon;
      case 'food': return FoodIcon;
      default: return DashboardIcon;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'jersey': return 'Tröjor';
      case 'handmade': return 'Hantverk';
      case 'equipment': return 'Utrustning';
      case 'food': return 'Mat & Dryck';
      default: return 'Övrigt';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar webshop...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserIcon size={64} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Säljaren hittades inte</p>
          <Link href="/marketplace" className="inline-block mt-4 px-6 py-3 bg-primary-900 text-white rounded-xl font-semibold hover:bg-primary-700 transition">
            Till Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const SellerIcon = seller.type === 'community' ? TrophyIcon : seller.type === 'class' ? CommunityIcon : UserIcon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Seller Header */}
      <div className="bg-primary-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/marketplace" className="text-white/70 hover:text-white text-sm font-semibold mb-4 inline-block transition">
            ← Tillbaka till Marketplace
          </Link>
          <div className="flex items-start gap-6 mt-6">
            <div className="w-24 h-24 bg-primary-800 rounded-2xl flex items-center justify-center flex-shrink-0">
              <SellerIcon size={48} className="text-primary-300" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-extrabold mb-2">{seller.name}</h1>
              <p className="text-white/80 mb-4">{seller.description}</p>
              <div className="flex items-center gap-6 text-sm">
                <span className="flex items-center gap-1">
                  <DashboardIcon size={16} />
                  {seller.location}
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingBagIcon size={16} />
                  {seller.totalSales.toLocaleString()} kr i försäljning
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Search and Filter */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Sök produkter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => {
                const CategoryIcon = getCategoryIcon(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition ${
                      categoryFilter === cat
                        ? 'bg-primary-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <CategoryIcon size={18} />
                    {cat === 'all' ? 'Alla' : getCategoryLabel(cat)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product, index) => {
            const CategoryIcon = getCategoryIcon(product.category);

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:border-primary-300 transition"
              >
                <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CategoryIcon size={64} className="text-primary-300" />
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-semibold text-primary-900">
                      {getCategoryLabel(product.category)}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-bold text-primary-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary-900">{product.price} kr</span>
                    <span className="text-sm text-gray-500">{product.stock} i lager</span>
                  </div>
                  <button className="w-full mt-4 px-4 py-3 bg-primary-900 text-white rounded-xl font-semibold hover:bg-primary-700 transition">
                    Lägg i varukorg
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <ShoppingBagIcon size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Inga produkter matchade din sökning</p>
          </div>
        )}
      </div>
    </div>
  );
}
