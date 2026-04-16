'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ProductFlowProps {
  productId: string;
}

export default function ProductFlowVisualization({ productId }: ProductFlowProps) {
  const [flowData, setFlowData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlowData();
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchFlowData, 30000);
    return () => clearInterval(interval);
  }, [productId]);

  const fetchFlowData = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/flow`);
      const data = await response.json();
      setFlowData(data);
    } catch (error) {
      console.error('Failed to fetch flow data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-xl p-8 text-center">
        <div className="text-4xl mb-2 animate-bounce">📊</div>
        <p className="text-gray-600">Laddar produktflöde...</p>
      </div>
    );
  }

  if (!flowData) {
    return null;
  }

  const {
    pending_orders,
    in_transit_to_warehouse,
    at_warehouses,
    allocated_to_customers,
  } = flowData;

  const hasPendingOrders = pending_orders?.total_quantity > 0;
  const hasInTransit = in_transit_to_warehouse?.length > 0;
  const hasInventory = at_warehouses?.length > 0;
  const hasAllocated = allocated_to_customers?.total_quantity > 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900">
          📊 Produktflöde (Real-time)
        </h3>
        <div className="text-xs text-gray-500">
          Uppdateras automatiskt
        </div>
      </div>

      {/* Flow Diagram */}
      <div className="space-y-8">
        {/* Step 1: Pending Orders */}
        {hasPendingOrders && (
          <FlowStep
            number={1}
            title="Väntande Beställningar"
            icon="🛒"
            color="yellow"
            active={true}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Totalt antal:</span>
                <span className="font-bold text-2xl text-yellow-600">
                  {pending_orders.total_quantity} st
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Antal beställningar:</span>
                <span className="font-semibold text-yellow-600">
                  {pending_orders.order_count} st
                </span>
              </div>

              {/* By Warehouse */}
              {pending_orders.by_warehouse?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    Per lagerpartner:
                  </div>
                  <div className="space-y-2">
                    {pending_orders.by_warehouse.map((wh: any) => (
                      <div
                        key={wh.warehouse_id}
                        className="flex justify-between items-center bg-yellow-50 rounded-lg p-2"
                      >
                        <div>
                          <div className="font-semibold text-sm">{wh.warehouse_name}</div>
                          <div className="text-xs text-gray-600">{wh.city}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-yellow-700">{wh.quantity} st</div>
                          <div className="text-xs text-gray-500">{wh.order_count} order</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </FlowStep>
        )}

        {/* Arrow */}
        {hasPendingOrders && hasInTransit && (
          <div className="flex justify-center">
            <div className="text-4xl animate-bounce">↓</div>
          </div>
        )}

        {/* Step 2: In Transit from Merchant */}
        {hasInTransit && (
          <FlowStep
            number={2}
            title="På väg från Företag → Lager"
            icon="🚛"
            color="blue"
            active={true}
          >
            <div className="space-y-3">
              {in_transit_to_warehouse.map((shipment: any, index: number) => (
                <motion.div
                  key={shipment.shipment_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-primary-50 rounded-lg p-3"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-primary-900">
                        Till: {shipment.warehouse_name}
                      </div>
                      <div className="text-xs text-primary-900">
                        Status: {shipment.status}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary-900">{shipment.quantity} st</div>
                    </div>
                  </div>
                  {shipment.estimated_arrival && (
                    <div className="text-xs text-primary-900">
                      📅 Beräknad ankomst: {shipment.estimated_arrival}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </FlowStep>
        )}

        {/* Arrow */}
        {hasInTransit && hasInventory && (
          <div className="flex justify-center">
            <div className="text-4xl animate-bounce">↓</div>
          </div>
        )}

        {/* Step 3: At Warehouses */}
        {hasInventory && (
          <FlowStep
            number={3}
            title="På Konsolideringslager"
            icon="🏭"
            color="green"
            active={true}
          >
            <div className="space-y-3">
              {at_warehouses.map((wh: any, index: number) => (
                <motion.div
                  key={wh.warehouse_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-green-50 rounded-lg p-3"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-green-900">
                        {wh.warehouse_name}
                      </div>
                      <div className="text-xs text-green-700">{wh.city}</div>
                    </div>
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      {wh.status}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white rounded p-2">
                      <div className="text-gray-600">Tillgängligt</div>
                      <div className="font-bold text-green-700">{wh.quantity_available} st</div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-gray-600">Allokerat</div>
                      <div className="font-bold text-primary-900">{wh.quantity_allocated} st</div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-gray-600">Skickat</div>
                      <div className="font-bold text-gray-700">{wh.quantity_shipped} st</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </FlowStep>
        )}

        {/* Arrow */}
        {hasInventory && hasAllocated && (
          <div className="flex justify-center">
            <div className="text-4xl animate-bounce">↓</div>
          </div>
        )}

        {/* Step 4: Allocated to Customers */}
        {hasAllocated && (
          <FlowStep
            number={4}
            title="Allokerat till Kunder"
            icon="📦"
            color="purple"
            active={true}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Totalt allokerat:</span>
                <span className="font-bold text-2xl text-primary-900">
                  {allocated_to_customers.total_quantity} st
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Antal allokeringar:</span>
                <span className="font-semibold text-primary-900">
                  {allocated_to_customers.allocation_count} st
                </span>
              </div>

              {/* By Warehouse */}
              {allocated_to_customers.by_warehouse?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    Per lagerpartner:
                  </div>
                  <div className="space-y-2">
                    {allocated_to_customers.by_warehouse.map((wh: any) => (
                      <div
                        key={wh.warehouse_id}
                        className="bg-primary-50 rounded-lg p-2"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-semibold text-sm">{wh.warehouse_name}</div>
                          <div className="font-bold text-primary-900">{wh.quantity} st</div>
                        </div>
                        {wh.status_breakdown && (
                          <div className="flex gap-2 text-xs">
                            {Object.entries(wh.status_breakdown).map(([status, count]: any) => (
                              <div key={status} className="bg-white rounded px-2 py-1">
                                {status}: {count}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </FlowStep>
        )}

        {/* No Data Message */}
        {!hasPendingOrders && !hasInTransit && !hasInventory && !hasAllocated && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-xl font-bold text-gray-900 mb-2">
              Ingen produktaktivitet än
            </p>
            <p className="text-gray-600">
              När beställningar kommer in visas flödet här
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Flow Step Component
function FlowStep({
  number,
  title,
  icon,
  color,
  active,
  children,
}: {
  number: number;
  title: string;
  icon: string;
  color: 'yellow' | 'blue' | 'green' | 'purple';
  active: boolean;
  children: React.ReactNode;
}) {
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-500',
    blue: 'bg-primary-50 border-primary-600',
    green: 'bg-green-50 border-green-500',
    purple: 'bg-primary-50 border-primary-600',
  };

  const badgeColors = {
    yellow: 'bg-yellow-500',
    blue: 'bg-primary-900',
    green: 'bg-green-500',
    purple: 'bg-primary-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-2 rounded-xl p-6 ${colorClasses[color]}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full ${badgeColors[color]} text-white flex items-center justify-center font-bold`}>
          {number}
        </div>
        <div className="text-3xl">{icon}</div>
        <h4 className="text-xl font-bold text-gray-900">{title}</h4>
      </div>
      {children}
    </motion.div>
  );
}

// Compact version for product card
export function ProductFlowBadge({ productId }: { productId: string }) {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/products/${productId}/flow-summary`)
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(console.error);
  }, [productId]);

  if (!summary) return null;

  const total = 
    (summary.pending_order_quantity || 0) +
    (summary.in_transit_quantity || 0) +
    (summary.warehouse_available || 0);

  if (total === 0) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-900 rounded-full text-xs font-semibold">
      <span>📊</span>
      <span>{total} st i flöde</span>
    </div>
  );
}
