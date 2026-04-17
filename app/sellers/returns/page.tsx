'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SellerReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadReturns();
  }, [statusFilter]);

  const loadReturns = async () => {
    setLoading(true);
    setError('');

    try {
      // Get seller's profile to find their community
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Du måste vara inloggad');
        return;
      }

      const { data: sellerProfile, error: profileError } = await supabase
        .from('seller_profiles')
        .select('community_id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get returns for orders from this seller's community
      let query = supabase
        .from('returns')
        .select(`
          *,
          return_items (*),
          orders (
            order_number,
            customer_email,
            customer_name,
            community_id
          )
        `)
        .order('requested_at', { ascending: false });

      if (sellerProfile?.community_id) {
        // Filter returns from seller's community
        const { data: communityOrders } = await supabase
          .from('orders')
          .select('id')
          .eq('community_id', sellerProfile.community_id);

        if (communityOrders && communityOrders.length > 0) {
          const orderIds = communityOrders.map((o: any) => o.id);
          query = query.in('order_id', orderIds);
        }
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error: err } = await query;

      if (err) throw err;
      setReturns(data || []);

    } catch (err: any) {
      setError(err.message || 'Error loading returns');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      in_transit: 'bg-purple-100 text-purple-800',
      received: 'bg-indigo-100 text-indigo-800',
      processed: 'bg-green-100 text-green-800',
      refunded: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (selectedReturn) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setSelectedReturn(null)}
            className="mb-4 text-gray-600 hover:text-gray-800 flex items-center"
          >
            ← Tillbaka till översikt
          </button>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-2">Retur {selectedReturn.return_number}</h1>
                <p className="text-gray-600 text-sm">
                  Order: {selectedReturn.orders?.order_number}
                </p>
                <p className="text-gray-600 text-sm">
                  Kund: {selectedReturn.orders?.customer_name} ({selectedReturn.orders?.customer_email})
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReturn.status)}`}>
                {selectedReturn.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Returinformation</h3>
                <p className="text-sm text-gray-600">Begärt: {new Date(selectedReturn.requested_at).toLocaleString('sv-SE')}</p>
                {selectedReturn.approved_at && (
                  <p className="text-sm text-gray-600">Godkänd: {new Date(selectedReturn.approved_at).toLocaleString('sv-SE')}</p>
                )}
                {selectedReturn.refunded_at && (
                  <p className="text-sm text-gray-600">Återbetald: {new Date(selectedReturn.refunded_at).toLocaleString('sv-SE')}</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Frakt</h3>
                <p className="text-sm text-gray-600">Spårningsnummer: {selectedReturn.tracking_number || 'Ej angivet'}</p>
                <p className="text-sm text-gray-600">Transportör: {selectedReturn.carrier || 'Ej angivet'}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-4">Returnerade artiklar</h3>
              <div className="space-y-4">
                {selectedReturn.return_items?.map((item: any) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">{item.product_name}</h4>
                        <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                        <p className="text-sm text-gray-600">Antal: {item.quantity_returned}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.refund_amount} kr</p>
                        <p className="text-sm text-gray-600">Status: {item.status}</p>
                      </div>
                    </div>
                    {item.reason_description && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-sm text-gray-600">Anledning: {item.reason_description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedReturn.notes && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Kundens anteckningar</h3>
                <p className="text-sm text-gray-600">{selectedReturn.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Returhantering</h1>
          <p className="text-gray-600">Se returer från din förening/klubb/klass</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-4 items-center">
            <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">
              Filtrera på status:
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Alla</option>
              <option value="pending">Väntande</option>
              <option value="approved">Godkända</option>
              <option value="rejected">Avslagna</option>
              <option value="in_transit">På väg</option>
              <option value="received">Mottagna</option>
              <option value="processed">Behandlade</option>
              <option value="refunded">Återbetalade</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Returnummer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kund
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Belopp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Åtgärder
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ret.return_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ret.orders?.order_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ret.orders?.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ret.status)}`}>
                        {ret.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ret.refund_amount || ret.return_items?.reduce((sum: number, item: any) => sum + (item.refund_amount || 0), 0)} kr
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ret.requested_at).toLocaleDateString('sv-SE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedReturn(ret)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Visa detaljer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {returns.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Inga returer hittades
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
