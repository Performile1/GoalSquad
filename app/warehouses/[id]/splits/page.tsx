'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TruckIcon, AlertIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface OrderItem { id: string; product_id: string; quantity: number; unit_price: number; }
interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  shipping_name: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  order_items: OrderItem[];
}

export default function WarehouseSplitsPage() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params.id as string;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch(`/api/warehouses/${warehouseId}/orders?status=processing`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Kunde inte hämta ordrar');
        setOrders(data.orders || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [warehouseId]);

  // Split candidates = orders that contain more than one distinct line.
  const splitCandidates = orders.filter((o) => (o.order_items?.length ?? 0) > 1);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-100"><TruckIcon size={32} className="text-primary-900" /></div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Splitordrar</h1>
              <p className="text-gray-600">Ordrar med flera rader som kan delas upp för plockning</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-2 text-red-700">
            <AlertIcon size={18} /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-primary-900 border-t-transparent animate-spin" />
          </div>
        ) : splitCandidates.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center text-gray-500">
            <TruckIcon size={56} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Inga splitordrar att hantera just nu</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {splitCandidates.map((o) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">Order {o.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">
                      {o.shipping_name || 'Okänd'} · {o.shipping_postal_code} {o.shipping_city}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{o.order_items.length} rader</p>
                    <p className="text-sm text-gray-500">{o.total_amount?.toLocaleString('sv-SE')} kr</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {o.order_items.map((it) => (
                    <span key={it.id} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                      {it.quantity} × {it.product_id.slice(0, 8)}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => router.push(`/warehouses/${warehouseId}/terminal/breakdown?orderId=${o.id}`)}
                  className="px-5 py-2.5 bg-primary-900 text-white rounded-xl font-semibold hover:bg-primary-700 transition"
                >
                  Öppna split-terminal →
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
