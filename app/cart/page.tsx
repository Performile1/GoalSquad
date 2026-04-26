'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CartIcon } from '@/app/components/BrandIcons';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  merchantName: string;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="mb-6 flex justify-center"><CartIcon size={80} /></div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Din varukorg är tom</h1>
        <p className="text-gray-500 mb-8 text-center">
          Lägg till produkter från shoppen för att komma igång.
        </p>
        <Link
          href="/products"
          className="px-8 py-4 bg-primary-900 text-white font-semibold rounded-xl hover:bg-primary-600 transition shadow-lg"
        >
          Gå till shoppen
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 flex items-center gap-3"><CartIcon size={40} /> Din varukorg</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-6"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    ''
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.merchantName}</p>
                  <p className="text-lg font-bold text-primary-900 mt-1">
                    {item.price.toLocaleString()} kr
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold transition"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold transition"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl shadow-sm p-6 h-fit sticky top-20">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Ordersammanfattning</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Delsumma</span>
                <span>{total.toLocaleString()} kr</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Frakt</span>
                <span className="text-primary-600">Beräknas i kassan</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg text-gray-900">
                <span>Totalt</span>
                <span>{total.toLocaleString()} kr</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="block w-full text-center bg-primary-900 text-white font-semibold py-4 rounded-xl hover:bg-primary-600 transition shadow"
            >
              Till kassan →
            </Link>
            <Link
              href="/products"
              className="block w-full text-center mt-3 text-sm text-primary-900 hover:text-primary-600 transition"
            >
              ← Fortsätt handla
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
