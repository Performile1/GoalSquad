'use client';

import Link from 'next/link';
import { useCart } from '@/app/hooks/useCart';
import { CartIcon, UserIcon, TrashIcon } from '@/app/components/BrandIcons';

export default function CartPage() {
  const { items, updateQty, removeItem, total, count, loaded } = useCart();

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Laddar varukorg...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="mb-6 flex justify-center"><CartIcon size={80} className="text-gray-300" /></div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Din varukorg är tom</h1>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          Utforska produkter från våra säljare och stöd ditt lokala lag eller förening.
        </p>
        <div className="flex gap-4">
          <Link
            href="/marketplace"
            className="px-8 py-4 bg-primary-900 text-white font-semibold rounded-xl hover:bg-primary-600 transition shadow-lg"
          >
            Marknadsplatsen
          </Link>
          <Link
            href="/products"
            className="px-8 py-4 bg-white text-primary-900 font-semibold rounded-xl hover:bg-primary-50 transition shadow border border-primary-100"
          >
            Alla produkter
          </Link>
        </div>
      </div>
    );
  }

  // Group items by seller for a cleaner view
  const bySeller = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.sellerId || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const primarySellerId = items[0]?.sellerId;
  const primaryCampaignId = items[0]?.campaignId;

  const checkoutHref = primarySellerId
    ? `/checkout?sellerId=${encodeURIComponent(primarySellerId)}${primaryCampaignId ? `&campaignId=${encodeURIComponent(primaryCampaignId)}` : ''}`
    : '/checkout';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <CartIcon size={40} /> Din varukorg
        </h1>
        <p className="text-gray-500 mb-8">{count} produkt{count !== 1 ? 'er' : ''} · Totalt {total.toLocaleString()} kr</p>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items grouped by seller */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(bySeller).map(([sellerId, sellerItems]) => (
              <div key={sellerId} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Seller header */}
                <div className="px-6 py-4 bg-primary-50 border-b border-primary-100 flex items-center gap-3">
                  {sellerItems[0].sellerAvatar ? (
                    <img src={sellerItems[0].sellerAvatar} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <UserIcon size={20} className="text-primary-700" />
                  )}
                  <span className="font-semibold text-primary-900">
                    {sellerItems[0].sellerName || 'Okänd säljare'}
                  </span>
                </div>

                <div className="divide-y divide-gray-100">
                  {sellerItems.map((item) => (
                    <div key={item.productId} className="p-6 flex items-center gap-5">
                      <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Bild</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                        <p className="text-lg font-bold text-primary-900 mt-1">
                          {item.price.toLocaleString()} kr
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQty(item.productId, -1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold transition"
                          aria-label="Minska antal"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.productId, 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold transition"
                          aria-label="Öka antal"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="ml-2 p-2 text-gray-400 hover:text-red-500 transition"
                          aria-label="Ta bort"
                        >
                          <TrashIcon size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
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
              href={checkoutHref}
              className="block w-full text-center bg-primary-900 text-white font-semibold py-4 rounded-xl hover:bg-primary-600 transition shadow"
            >
              Till kassan →
            </Link>
            <Link
              href="/marketplace"
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
