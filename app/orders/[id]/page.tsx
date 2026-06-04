'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  image_url?: string;
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  shipment_status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Kunde inte hämta order');
      setOrder(data.order);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm('Är du säker på att du vill avbryta denna order?')) return;
    
    setCancelling(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Kunde inte avbryta order');
      
      await fetchOrder();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Laddar order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-sm text-red-700 max-w-md">
          <p className="font-semibold">Ett fel uppstod:</p>
          <p>{error || 'Order hittades inte'}</p>
          <button
            onClick={() => router.push('/orders')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Tillbaka till mina beställningar
          </button>
        </div>
      </div>
    );
  }

  const canCancel = !['shipped', 'delivered', 'cancelled'].includes(order.shipment_status || '') && order.status !== 'cancelled';

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Order #{order.id.substring(0, 8)}</h1>
              <p className="text-sm text-slate-500 mt-1">
                Skapad: {new Date(order.created_at).toLocaleString('sv-SE')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/orders')}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Tillbaka
              </button>
              {canCancel && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50"
                >
                  {cancelling ? 'Avbryter...' : 'Avbryt order'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Orderstatus</p>
            <p className="text-lg font-bold text-slate-900 capitalize">{order.status}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Leveransstatus</p>
            <p className="text-lg font-bold text-slate-900 capitalize">{order.shipment_status || 'Pending'}</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Produkter</h2>
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.product_name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{item.product_name}</p>
                  <p className="text-sm text-slate-500">Antal: {item.quantity}</p>
                </div>
                <p className="font-semibold text-slate-900">
                  {item.unit_price * item.quantity} SEK
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-200 flex justify-between items-center">
            <p className="text-lg font-bold text-slate-900">Totalt</p>
            <p className="text-2xl font-bold text-blue-600">{order.total_amount} SEK</p>
          </div>
        </div>

        {/* Tracking Link */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Spåra din leverans</h2>
          <button
            onClick={() => router.push(`/tracking/${orderId}`)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Visa spårning
          </button>
        </div>

      </div>
    </div>
  );
}
