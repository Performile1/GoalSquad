'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Category {
  id: string;
  name: string;
  slug: string;
  iconEmoji: string;
  productCount: number;
}

export default function CategoryMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition font-semibold text-gray-900"
      >
        <span>Kategorier</span>
        <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-20 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 bg-gradient-to-r from-primary-900 to-primary-600 text-white">
                <h3 className="font-bold text-lg">Produktkategorier</h3>
                <p className="text-sm text-primary-100">
                  Bläddra bland {categories.reduce((sum, c) => sum + c.productCount, 0)} produkter
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {/* All Products */}
                <Link
                  href="/products"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">Alla</span>
                    <span className="font-semibold text-gray-900">
                      Alla produkter
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {categories.reduce((sum, c) => sum + c.productCount, 0)}
                  </span>
                </Link>

                {/* Categories */}
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition border-b border-gray-100 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl group-hover:scale-110 transition">
                        {category.iconEmoji}
                      </span>
                      <span className="font-medium text-gray-900">
                        {category.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {category.productCount}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <Link
                  href="/products"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-primary-900 hover:text-primary-900 font-semibold"
                >
                  Se alla produkter →
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Horizontal Category Bar (for homepage)
 */
export function CategoryBar() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  return (
    <div className="bg-white py-6 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <Link
            href="/products"
            className="flex-shrink-0 flex flex-col items-center gap-2 px-4 py-3 rounded-xl hover:bg-gray-50 transition group"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-3xl group-hover:scale-110 transition">
            </div>
            <span className="text-sm font-semibold text-gray-900">Alla</span>
          </Link>

          {categories.slice(0, 8).map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="flex-shrink-0 flex flex-col items-center gap-2 px-4 py-3 rounded-xl hover:bg-gray-50 transition group"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-3xl group-hover:scale-110 transition">
                {category.iconEmoji}
              </div>
              <span className="text-sm font-semibold text-gray-900 text-center max-w-[80px] truncate">
                {category.name}
              </span>
              <span className="text-xs text-gray-500">
                {category.productCount}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
