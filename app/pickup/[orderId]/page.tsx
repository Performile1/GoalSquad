'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { BoxIcon, CheckIcon, LockIcon } from '@/app/components/BrandIcons';

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  total_amount: number;
  currency: string;
  sellerName: string;
  items: { name: string; quantity: number }[];
}

export default function PickupPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    if (!orderId) return;

    // Fetch order details
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data.order || null);
        // Generate QR payload: orderId + timestamp + simple checksum
        const payload = JSON.stringify({
          orderId,
          t: Date.now(),
          v: '1',
        });
        setQrData(btoa(payload));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Laddar order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <BoxIcon size={64} className="text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Order hittades inte</h1>
        <p className="text-gray-500">Kontrollera att order-ID:t är korrekt.</p>
      </div>
    );
  }

  const isReady = ['processing', 'ready_for_pickup', 'completed'].includes(order.status);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-primary-900 text-white px-8 py-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-white/15 rounded-full flex items-center justify-center">
                <BoxIcon size={32} />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-1">Hämta din order</h1>
            <p className="text-white/70">Visa QR-koden för personalen</p>
          </div>

          {/* Order info */}
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-500">Order</p>
                <p className="text-lg font-bold text-gray-900">#{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Summa</p>
                <p className="text-lg font-bold text-primary-900">
                  {order.total_amount?.toLocaleString()} {order.currency}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {isReady ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-green-700 font-medium">Klar för hämtning</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span className="text-yellow-700 font-medium">Bearbetas</span>
                </>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="px-8 py-4 border-b border-gray-100">
            <p className="text-sm text-gray-500 mb-3">Produkter</p>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="text-gray-500">× {item.quantity}</span>
                </div>
              )) || <p className="text-gray-400 text-sm">Orderdetaljer ej tillgängliga</p>}
            </div>
          </div>

          {/* QR Code */}
          <div className="px-8 py-8 text-center">
            {isReady ? (
              <>
                <div className="bg-white p-4 rounded-2xl border-2 border-primary-100 inline-block mb-4">
                  {/* Simple QR code representation using an API */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`}
                    alt="Hämtnings-QR"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-gray-500 mb-2">Scanning-kod</p>
                <p className="text-xs text-gray-400 font-mono break-all max-w-xs mx-auto">{qrData}</p>
              </>
            ) : (
              <div className="py-8">
                <LockIcon size={64} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">QR-kod genereras när ordern är klar</p>
                <p className="text-sm text-gray-400 mt-2">Kom tillbaka senare</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 text-center">
            <p className="text-xs text-gray-400">
              Säljare: {order.sellerName || 'GoalSquad'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
