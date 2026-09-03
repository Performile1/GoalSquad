'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { BoxIcon, TruckIcon, DashboardIcon, ShoppingBagIcon, ArrowRightIcon, UserIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface IncomingPallet {
  id: string;
  fromCompany: string;
  palletId: string;
  itemCount: number;
  status: 'pending' | 'received' | 'processing';
  receivedAt: string;
}

interface ConsolidationGroup {
  id: string;
  targetWarehouse: string;
  sourcePallets: IncomingPallet[];
  status: 'pending' | 'consolidated' | 'shipped';
  createdAt: string;
}

interface Shipment {
  id: string;
  toWarehouse: string;
  palletCount: number;
  status: 'pending' | 'shipped' | 'delivered';
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
}

interface InventoryItem {
  id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  last_restocked_at: string;
  updated_at: string;
  products: Product;
}

export default function WarehouseManagement() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params.id as string;
  
  const [incomingPallets, setIncomingPallets] = useState<IncomingPallet[]>([]);
  const [consolidationGroups, setConsolidationGroups] = useState<ConsolidationGroup[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'incoming' | 'consolidate' | 'ship' | 'inventory'>('incoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [warehouseId]);

  const fetchData = async () => {
    try {
      const [palletsRes, groupsRes, shipmentsRes, inventoryRes] = await Promise.all([
        apiFetch(`/api/warehouses/${warehouseId}/incoming-pallets`),
        apiFetch(`/api/warehouses/${warehouseId}/consolidation-groups`),
        apiFetch(`/api/warehouses/${warehouseId}/shipments`),
        apiFetch(`/api/warehouses/${warehouseId}/inventory`),
      ]);

      const palletsData = await palletsRes.json();
      const groupsData = await groupsRes.json();
      const shipmentsData = await shipmentsRes.json();
      const inventoryData = await inventoryRes.json();

      setIncomingPallets(palletsData.pallets || []);
      setConsolidationGroups(groupsData.groups || []);
      setShipments(shipmentsData.shipments || []);
      setInventory(inventoryData.inventory || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjust = async (productId: string, delta: number) => {
    try {
      setUpdatingId(productId);
      const response = await apiFetch(`/api/warehouses/${warehouseId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, stockDelta: delta }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Kunde inte uppdatera lagret');
      }
      
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReceivePallet = async (palletId: string) => {
    try {
      await apiFetch(`/api/warehouses/${warehouseId}/pallets/${palletId}/receive`, {
        method: 'POST',
      });
      fetchData();
    } catch (error) {
      console.error('Failed to receive pallet:', error);
    }
  };

  const handleCreateConsolidation = async (selectedPallets: string[], targetWarehouseId: string) => {
    try {
      await apiFetch(`/api/warehouses/${warehouseId}/consolidations`, {
        method: 'POST',
                body: JSON.stringify({ palletIds: selectedPallets, targetWarehouseId }),
      });
      fetchData();
    } catch (error) {
      console.error('Failed to create consolidation:', error);
    }
  };

  const handleShipConsolidation = async (groupId: string) => {
    try {
      await apiFetch(`/api/warehouses/${warehouseId}/consolidations/${groupId}/ship`, {
        method: 'POST',
      });
      fetchData();
    } catch (error) {
      console.error('Failed to ship consolidation:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary-900 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-primary-900 font-semibold">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Lagerhantering</h1>
          <p className="text-gray-600">Hantera pallar, konsolideringar och sändningar</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                activeTab === 'incoming'
                  ? 'bg-primary-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BoxIcon size={20} className="inline mr-2" />
              Inkommande pallar
            </button>
            <button
              onClick={() => setActiveTab('consolidate')}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                activeTab === 'consolidate'
                  ? 'bg-primary-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <DashboardIcon size={20} className="inline mr-2" />
              Konsolideringar
            </button>
            <button
              onClick={() => setActiveTab('ship')}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                activeTab === 'ship'
                  ? 'bg-primary-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TruckIcon size={20} className="inline mr-2" />
              Sändningar
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                activeTab === 'inventory'
                  ? 'bg-primary-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ShoppingBagIcon size={20} className="inline mr-2" />
              Lagersaldo
            </button>
          </div>

          {/* Incoming Pallets Tab */}
          {activeTab === 'incoming' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Inkommande pallar</h2>
                <span className="text-sm text-gray-600">{incomingPallets.length} pallar</span>
              </div>
              <div className="space-y-4">
                {incomingPallets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Inga inkommande pallar
                  </div>
                ) : (
                  incomingPallets.map((pallet, index) => (
                    <motion.div
                      key={pallet.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-2 border-gray-200 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <BoxIcon size={32} className="text-primary-900" />
                        <div>
                          <p className="font-semibold text-gray-900">{pallet.palletId}</p>
                          <p className="text-sm text-gray-600">Från: {pallet.fromCompany}</p>
                          <p className="text-sm text-gray-600">{pallet.itemCount} produkter</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          pallet.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          pallet.status === 'received' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {pallet.status === 'pending' ? 'Väntar' :
                           pallet.status === 'received' ? 'Mottagen' : 'Behandlas'}
                        </span>
                        {pallet.status === 'pending' && (
                          <button
                            onClick={() => handleReceivePallet(pallet.id)}
                            className="bg-primary-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
                          >
                            Ta emot
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Consolidations Tab */}
          {activeTab === 'consolidate' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Konsolideringar</h2>
                <button className="bg-primary-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition">
                  + Ny konsolidering
                </button>
              </div>
              <div className="space-y-4">
                {consolidationGroups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Inga konsolideringar
                  </div>
                ) : (
                  consolidationGroups.map((group, index) => (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-2 border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <DashboardIcon size={32} className="text-primary-900" />
                          <div>
                            <p className="font-semibold text-gray-900">Till: {group.targetWarehouse}</p>
                            <p className="text-sm text-gray-600">{group.sourcePallets.length} pallar</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          group.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          group.status === 'consolidated' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {group.status === 'pending' ? 'Väntar' :
                           group.status === 'consolidated' ? 'Konsoliderad' : 'Skickad'}
                        </span>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Källpallar:</p>
                        <div className="flex flex-wrap gap-2">
                          {group.sourcePallets.map((pallet) => (
                            <span key={pallet.id} className="bg-gray-100 px-3 py-1 rounded-lg text-sm">
                              {pallet.palletId}
                            </span>
                          ))}
                        </div>
                      </div>
                      {group.status === 'consolidated' && (
                        <button
                          onClick={() => handleShipConsolidation(group.id)}
                          className="bg-primary-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
                        >
                          Skicka
                        </button>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Shipments Tab */}
          {activeTab === 'ship' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Sändningar</h2>
                <span className="text-sm text-gray-600">{shipments.length} sändningar</span>
              </div>
              <div className="space-y-4">
                {shipments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Inga sändningar
                  </div>
                ) : (
                  shipments.map((shipment, index) => (
                    <motion.div
                      key={shipment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-2 border-gray-200 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <TruckIcon size={32} className="text-primary-900" />
                        <div>
                          <p className="font-semibold text-gray-900">Till: {shipment.toWarehouse}</p>
                          <p className="text-sm text-gray-600">{shipment.palletCount} pallar</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        shipment.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {shipment.status === 'pending' ? 'Väntar' :
                         shipment.status === 'shipped' ? 'Skickad' : 'Levererad'}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Lagersaldo</h2>
                <button
                  onClick={fetchData}
                  className="text-sm text-primary-900 hover:text-primary-700 font-semibold"
                >
                  Uppdatera
                </button>
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Sök på produktnamn eller SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-900 focus:border-transparent outline-none"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Produkt</th>
                      <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase">SKU</th>
                      <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase text-center">Totalt</th>
                      <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase text-center">Reserverat</th>
                      <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase text-center">Tillgängligt</th>
                      <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase text-right">Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inventory.filter(item => 
                      item.products.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.products.sku.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          Inga produkter matchar sökningen
                        </td>
                      </tr>
                    ) : (
                      inventory.filter(item => 
                        item.products.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.products.sku.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{item.products.name}</td>
                          <td className="py-3 px-4 text-gray-600 font-mono text-sm">{item.products.sku}</td>
                          <td className="py-3 px-4 text-center font-semibold text-gray-900">{item.quantity}</td>
                          <td className="py-3 px-4 text-center text-gray-600">{item.reserved_quantity}</td>
                          <td className="py-3 px-4 text-center font-semibold text-green-600">{item.available_quantity}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleStockAdjust(item.products.id, -1)}
                                disabled={updatingId === item.products.id || item.quantity === 0}
                                className="p-1 text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-gray-200 rounded transition disabled:opacity-50"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleStockAdjust(item.products.id, 1)}
                                disabled={updatingId === item.products.id}
                                className="p-1 text-gray-500 hover:text-green-600 bg-gray-100 hover:bg-gray-200 rounded transition disabled:opacity-50"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>

        {/* Workflow Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Workflow</h2>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="bg-primary-100 rounded-xl p-4 mb-2">
                <ShoppingBagIcon size={32} className="text-primary-900" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Företag</p>
              <p className="text-xs text-gray-600">Skickar pallar</p>
            </div>
            <ArrowRightIcon size={24} className="text-gray-400" />
            <div className="text-center">
              <div className="bg-primary-100 rounded-xl p-4 mb-2">
                <BoxIcon size={32} className="text-primary-900" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Lager A</p>
              <p className="text-xs text-gray-600">Tar emot & splitar</p>
            </div>
            <ArrowRightIcon size={24} className="text-gray-400" />
            <div className="text-center">
              <div className="bg-primary-100 rounded-xl p-4 mb-2">
                <DashboardIcon size={32} className="text-primary-900" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Konsolidering</p>
              <p className="text-xs text-gray-600">Slå ihop A, B, C</p>
            </div>
            <ArrowRightIcon size={24} className="text-gray-400" />
            <div className="text-center">
              <div className="bg-primary-100 rounded-xl p-4 mb-2">
                <TruckIcon size={32} className="text-primary-900" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Lager B</p>
              <p className="text-xs text-gray-600">Tar emot & splitar</p>
            </div>
            <ArrowRightIcon size={24} className="text-gray-400" />
            <div className="text-center">
              <div className="bg-primary-100 rounded-xl p-4 mb-2">
                <UserIcon size={32} className="text-primary-900" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Konsumenter</p>
              <p className="text-xs text-gray-600">Får leverans</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
