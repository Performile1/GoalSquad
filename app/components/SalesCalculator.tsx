'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  merchantName: string;
  price: number;
  cost: number;
  profit: number;
  profitPercentage: number;
  category: string;
  image?: string;
  moq?: number;
}

interface SalesCalculatorProps {
  initialProducts?: Product[];
}

export default function SalesCalculator({ initialProducts }: SalesCalculatorProps) {
  const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(new Map());
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'selected'>('all');

  useEffect(() => {
    if (initialProducts) {
      setProducts(initialProducts);
      setLoading(false);
    } else {
      fetchProducts();
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products/calculator-products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const newMap = new Map(selectedProducts);
    if (quantity > 0) {
      newMap.set(productId, quantity);
    } else {
      newMap.delete(productId);
    }
    setSelectedProducts(newMap);
  };

  const calculateTotals = () => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalItems = 0;

    selectedProducts.forEach((quantity, productId) => {
      const product = products.find(p => p.id === productId);
      if (product) {
        totalRevenue += product.price * quantity;
        totalCost += product.cost * quantity;
        totalProfit += product.profit * quantity;
        totalItems += quantity;
      }
    });

    return {
      revenue: totalRevenue,
      cost: totalCost,
      profit: totalProfit,
      items: totalItems,
      profitPercentage: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    };
  };

  const totals = calculateTotals();

  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.merchantName]) {
      acc[product.merchantName] = [];
    }
    acc[product.merchantName].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-2xl p-12 text-center">
        <div className="text-6xl mb-4 animate-bounce">🧮</div>
        <p className="text-xl text-gray-600">Laddar kalkylator...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-8">
        <h2 className="text-4xl font-bold mb-2">💰 Försäljningskalkylator</h2>
        <p className="text-green-100 text-lg">
          Räkna ut hur mycket din förening kan tjäna
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Left: Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 bg-white rounded-xl p-2 shadow">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Alla Produkter ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('selected')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                activeTab === 'selected'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Valda ({selectedProducts.size})
            </button>
          </div>

          {/* Products by Merchant */}
          <div className="space-y-4">
            {activeTab === 'all' ? (
              Object.entries(groupedProducts).map(([merchantName, merchantProducts]) => (
                <div key={merchantName} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4">
                    <h3 className="text-xl font-bold">{merchantName}</h3>
                    <p className="text-sm text-blue-100">{merchantProducts.length} produkter</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {merchantProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        quantity={selectedProducts.get(product.id) || 0}
                        onQuantityChange={(qty) => updateQuantity(product.id, qty)}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6">
                {selectedProducts.size === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🛒</div>
                    <p className="text-xl font-bold text-gray-900 mb-2">
                      Inga produkter valda
                    </p>
                    <p className="text-gray-600">
                      Välj produkter från "Alla Produkter" för att se din kalkyl
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Array.from(selectedProducts.entries()).map(([productId, quantity]) => {
                      const product = products.find(p => p.id === productId);
                      if (!product) return null;
                      return (
                        <ProductCard
                          key={product.id}
                          product={product}
                          quantity={quantity}
                          onQuantityChange={(qty) => updateQuantity(product.id, qty)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-6">
          {/* Totals Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-6 sticky top-6"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              📊 Sammanfattning
            </h3>

            <div className="space-y-4">
              {/* Total Items */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600">Antal produkter:</span>
                <span className="text-2xl font-bold text-gray-900">
                  {totals.items} st
                </span>
              </div>

              {/* Revenue */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600">Försäljningsvärde:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {totals.revenue.toLocaleString('sv-SE')} kr
                </span>
              </div>

              {/* Cost */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-gray-600">Kostnad:</span>
                <span className="text-xl font-semibold text-gray-500">
                  -{totals.cost.toLocaleString('sv-SE')} kr
                </span>
              </div>

              {/* Profit */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                <div className="text-sm font-semibold mb-2">Er vinst</div>
                <div className="text-4xl font-bold mb-2">
                  {totals.profit.toLocaleString('sv-SE')} kr
                </div>
                <div className="text-green-100 text-sm">
                  {totals.profitPercentage.toFixed(1)}% marginal
                </div>
              </div>

              {/* Visual Breakdown */}
              {totals.revenue > 0 && (
                <div className="pt-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    Fördelning:
                  </div>
                  <div className="h-8 rounded-full overflow-hidden flex">
                    <div
                      className="bg-green-500 flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: `${totals.profitPercentage}%` }}
                    >
                      {totals.profitPercentage > 15 && `${totals.profitPercentage.toFixed(0)}%`}
                    </div>
                    <div
                      className="bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-bold"
                      style={{ width: `${100 - totals.profitPercentage}%` }}
                    >
                      {(100 - totals.profitPercentage) > 15 && `${(100 - totals.profitPercentage).toFixed(0)}%`}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>Vinst</span>
                    <span>Kostnad</span>
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            {selectedProducts.size > 0 && (
              <button className="w-full mt-6 bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transition">
                🚀 Starta Försäljning
              </button>
            )}
          </motion.div>

          {/* Info Card */}
          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
            <h4 className="font-bold text-blue-900 mb-3">💡 Så fungerar det</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span>1️⃣</span>
                <span>Välj produkter från olika företag</span>
              </li>
              <li className="flex items-start gap-2">
                <span>2️⃣</span>
                <span>Se direkt hur mycket ni tjänar</span>
              </li>
              <li className="flex items-start gap-2">
                <span>3️⃣</span>
                <span>Kombinera för maximal vinst</span>
              </li>
              <li className="flex items-start gap-2">
                <span>4️⃣</span>
                <span>Starta försäljning när ni är redo</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Product Card Component
function ProductCard({
  product,
  quantity,
  onQuantityChange,
}: {
  product: Product;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}) {
  return (
    <motion.div
      layout
      className={`border-2 rounded-xl p-4 transition ${
        quantity > 0
          ? 'border-green-500 bg-green-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Product Info */}
        <div className="flex-1">
          <h4 className="font-bold text-gray-900">{product.name}</h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-600">
              Pris: <strong className="text-blue-600">{product.price} kr</strong>
            </span>
            <span className="text-sm text-green-600 font-semibold">
              +{product.profit} kr vinst
            </span>
          </div>
          {product.moq && (
            <div className="text-xs text-orange-600 mt-1">
              MOQ: {product.moq} st
            </div>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
            disabled={quantity === 0}
            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
          >
            −
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => onQuantityChange(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-16 text-center border-2 border-gray-300 rounded-lg py-1 font-bold"
            min="0"
          />
          <button
            onClick={() => onQuantityChange(quantity + 1)}
            className="w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 text-white font-bold"
          >
            +
          </button>
        </div>
      </div>

      {/* Subtotal */}
      <AnimatePresence>
        {quantity > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-green-200"
          >
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Försäljning:</span>
              <span className="font-semibold text-blue-600">
                {(product.price * quantity).toLocaleString('sv-SE')} kr
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-gray-900">Er vinst:</span>
              <span className="text-green-600">
                {(product.profit * quantity).toLocaleString('sv-SE')} kr
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
