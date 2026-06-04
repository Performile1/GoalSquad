'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  items: OrderItem[];
}

export default function CreateReturnRequestPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedOrderId) {
      const order = orders.find(o => o.id === selectedOrderId);
      setSelectedOrder(order || null);
      setSelectedItems(new Set());
    }
  }, [selectedOrderId, orders]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Kunde inte hämta beställningar');
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrderId || selectedItems.size === 0 || !reason) {
      alert('Vänligen välj en order, produkter att returnera och en anledning');
      return;
    }

    setSubmitting(true);
    try {
      const items = Array.from(selectedItems).map(itemId => ({
        orderItemId: itemId,
        quantity: 1
      }));

      const response = await fetch('/api/returns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderId,
          reasonCategory: reason,
          customerNote,
          items
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Kunde inte skapa retur');
      
      alert(`Retur skapad! Retur-ID: ${data.returnRequestId}`);
      router.push('/returns');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Laddar beställningar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Skapa retur</h1>
          <p className="text-sm text-slate-500 mt-1">Välj order och produkter du vill returnera</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Order Selection */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Välj beställning
            </label>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Välj en beställning --</option>
              {orders.filter(o => o.status !== 'cancelled').map((order) => (
                <option key={order.id} value={order.id}>
                  Order #{order.id.substring(0, 8)} - {new Date(order.created_at).toLocaleDateString('sv-SE')} - {order.total_amount} SEK
                </option>
              ))}
            </select>
          </div>

          {/* Product Selection */}
          {selectedOrder && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <label className="block text-sm font-semibold text-slate-700 mb-4">
                Välj produkter att returnera
              </label>
              <div className="space-y-3">
                {selectedOrder.items?.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition ${
                      selectedItems.has(item.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => toggleItemSelection(item.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{item.product_name}</p>
                      <p className="text-sm text-slate-500">Antal: {item.quantity} | Pris: {item.unit_price} SEK</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reason Selection */}
          {selectedOrder && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Anledning till retur
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Välj anledning --</option>
                <option value="wrong_item">Fel produkt skickad</option>
                <option value="damaged">Produkten är skadad</option>
                <option value="defective">Produkten är defekt</option>
                <option value="not_as_described">Produkten matchar inte beskrivningen</option>
                <option value="no_longer_needed">Behöver inte längre produkten</option>
                <option value="other">Annan anledning</option>
              </select>
            </div>
          )}

          {/* Customer Note */}
          {selectedOrder && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Ytterligare information (valfritt)
              </label>
              <textarea
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Beskriv problemet eller lägg till mer information..."
              />
            </div>
          )}

          {/* Submit Button */}
          {selectedOrder && (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/returns')}
                className="flex-1 px-4 py-3 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={submitting || selectedItems.size === 0}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50"
              >
                {submitting ? 'Skickar...' : 'Skicka retur'}
              </button>
            </div>
          )}
        </form>

      </div>
    </div>
  );
}
