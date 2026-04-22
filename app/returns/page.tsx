'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);
const supabase = typeof window !== 'undefined' ? getSupabase() : ({} as ReturnType<typeof getSupabase>);

export default function ReturnsPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [returnReasons, setReturnReasons] = useState<any[]>([]);
  const [itemReasons, setItemReasons] = useState<Record<string, { reasonId: string; description: string }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [returnCreated, setReturnCreated] = useState(false);
  const [returnNumber, setReturnNumber] = useState('');
  const [qrCode, setQrCode] = useState('');

  // Load return reasons on mount
  useEffect(() => {
    loadReturnReasons();
  }, []);

  const loadReturnReasons = async () => {
    const { data, error } = await supabase
      .from('return_reasons')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error loading return reasons:', error);
    } else {
      setReturnReasons(data || []);
    }
  };

  const searchOrder = async () => {
    setLoading(true);
    setError('');
    setOrder(null);
    setOrderItems([]);
    setSelectedItems(new Set());
    setItemReasons({});

    try {
      // Search by order number
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (orderError) throw orderError;
      if (!orderData) {
        setError('Order not found');
        return;
      }

      setOrder(orderData);

      // Get order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id);

      if (itemsError) throw itemsError;
      setOrderItems(itemsData || []);

    } catch (err: any) {
      setError(err.message || 'Error searching order');
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const updateItemReason = (itemId: string, reasonId: string, description: string) => {
    setItemReasons(prev => ({
      ...prev,
      [itemId]: { reasonId, description }
    }));
  };

  const createReturn = async () => {
    if (selectedItems.size === 0) {
      setError('Please select at least one item to return');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create return
      const { data: returnData, error: returnError } = await supabase
        .from('returns')
        .insert({
          order_id: order.id,
          customer_id: order.customer_id,
          customer_name: order.shipping_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          return_address_name: order.shipping_name,
          return_address_line1: order.shipping_address_line1,
          return_address_line2: order.shipping_address_line2,
          return_address_city: order.shipping_city,
          return_address_postal_code: order.shipping_postal_code,
          return_address_country: order.shipping_country,
          status: 'pending'
        })
        .select()
        .single();

      if (returnError) throw returnError;

      setReturnNumber(returnData.return_number);

      // Create return items
      const itemsToInsert = Array.from(selectedItems).map(itemId => {
        const item = orderItems.find(i => i.id === itemId);
        const reason = itemReasons[itemId] || { reasonId: '', description: '' };
        return {
          return_id: returnData.id,
          order_item_id: itemId,
          product_id: item.product_id,
          sku: item.sku,
          product_name: item.name,
          quantity_returned: item.quantity,
          reason_id: reason.reasonId || null,
          reason_description: reason.description,
          unit_price: item.unit_price,
          refund_amount: item.subtotal
        };
      });

      const { error: itemsError } = await supabase
        .from('return_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Generate QR code
      const qrData = `RET:${returnData.return_number}`;
      const qrCodeUrl = await QRCode.toDataURL(qrData);
      setQrCode(qrCodeUrl);

      // Update return with QR code
      await supabase
        .from('returns')
        .update({ qr_code_url: qrCodeUrl })
        .eq('id', returnData.id);

      setReturnCreated(true);

    } catch (err: any) {
      setError(err.message || 'Error creating return');
    } finally {
      setLoading(false);
    }
  };

  if (returnCreated) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Retur skapad!</h1>
              <p className="text-gray-600">Din retur har registrerats</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Returnummer: {returnNumber}</h2>
              
              {qrCode && (
                <div className="flex justify-center mb-4">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
              )}
              
              <p className="text-sm text-gray-600 text-center mb-4">
                Skanna QR-koden med din telefon för att få returfraktsedel
              </p>

              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold mb-2">Nästa steg:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Skanna QR-koden med din telefon</li>
                  <li>Ladda ner returfraktsedeln</li>
                  <li>Paketera varorna</li>
                  <li>Lämna in paketet hos angiven ombud</li>
                  <li>Du får bekräftelse när returen mottagits</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              Skriv ut returfraktsedel
            </button>

            <button
              onClick={() => {
                setReturnCreated(false);
                setOrderNumber('');
                setOrder(null);
                setOrderItems([]);
                setSelectedItems(new Set());
                setItemReasons({});
                setQrCode('');
              }}
              className="w-full mt-4 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Skapa ny retur
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Returhantering</h1>
          <p className="text-gray-600">Registrera din retur enkelt och smidigt</p>
        </div>

        {!order ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-4">Sök din order</h2>
            
            <div className="mb-4">
              <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Ordernummer
              </label>
              <input
                type="text"
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="T.ex. ORD-20250101-0001"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <button
              onClick={searchOrder}
              disabled={loading || !orderNumber}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Söker...' : 'Sök order'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Order {order.order_number}</h2>
                  <p className="text-gray-600 text-sm">Placerad: {new Date(order.created_at).toLocaleDateString('sv-SE')}</p>
                </div>
                <button
                  onClick={() => {
                    setOrder(null);
                    setOrderNumber('');
                    setOrderItems([]);
                    setSelectedItems(new Set());
                    setItemReasons({});
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Sök ny order
                </button>
              </div>

              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedItems.has(item.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                    }`}
                    onClick={() => toggleItemSelection(item.id)}
                  >
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="mt-1 h-5 w-5 text-primary-600 rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                        <p className="text-sm text-gray-600">Antal: {item.quantity}</p>
                        <p className="text-sm font-medium">{item.subtotal} kr</p>
                      </div>
                    </div>

                    {selectedItems.has(item.id) && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Returorsak
                        </label>
                        <select
                          value={itemReasons[item.id]?.reasonId || ''}
                          onChange={(e) => updateItemReason(item.id, e.target.value, itemReasons[item.id]?.description || '')}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
                        >
                          <option value="">Välj returorsak</option>
                          {returnReasons.map((reason) => (
                            <option key={reason.id} value={reason.id}>
                              {reason.name}
                            </option>
                          ))}
                        </select>

                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Beskrivning (krävs)
                        </label>
                        <textarea
                          value={itemReasons[item.id]?.description || ''}
                          onChange={(e) => updateItemReason(item.id, itemReasons[item.id]?.reasonId || '', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          rows={3}
                          placeholder="Beskriv varför du vill returnera produkten"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
                  {error}
                </div>
              )}

              <button
                onClick={createReturn}
                disabled={loading || selectedItems.size === 0}
                className="w-full mt-6 bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Skapar retur...' : 'Skapa retur'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
