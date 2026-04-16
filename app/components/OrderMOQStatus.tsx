'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface OrderMOQStatusProps {
  orderId: string;
  onStrategyChange?: (strategy: 'wait_for_all' | 'split_shipment') => void;
}

export default function OrderMOQStatus({ orderId, onStrategyChange }: OrderMOQStatusProps) {
  const [moqStatus, setMoqStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSplitOption, setShowSplitOption] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkMOQBlocking();
  }, [orderId]);

  const checkMOQBlocking = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/moq-status`);
      const data = await response.json();
      setMoqStatus(data);
      setShowSplitOption(data.has_blocking && data.can_split);
    } catch (error) {
      console.error('MOQ check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSplitShipment = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/split-shipment`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Delleverans skapad! Extra kostnad: ${data.additional_cost} kr`);
        if (onStrategyChange) {
          onStrategyChange('split_shipment');
        }
        await checkMOQBlocking();
      } else {
        alert('Kunde inte skapa delleverans');
      }
    } catch (error) {
      console.error('Split shipment error:', error);
      alert('Ett fel uppstod');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
    );
  }

  if (!moqStatus || !moqStatus.has_blocking) {
    return (
      <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="text-4xl">✅</div>
          <div>
            <h3 className="font-bold text-green-900 text-lg">
              Alla produkter redo att skickas!
            </h3>
            <p className="text-sm text-green-700">
              Din beställning skickas inom 2-3 arbetsdagar
            </p>
          </div>
        </div>
      </div>
    );
  }

  const blockingItems = moqStatus.blocking_items || [];
  const readyItems = moqStatus.ready_items || [];

  return (
    <div className="space-y-6">
      {/* Blocking Warning */}
      <div className="bg-yellow-50 border-2 border-yellow-500 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="text-4xl">⏳</div>
          <div className="flex-1">
            <h3 className="font-bold text-yellow-900 text-lg mb-2">
              Vissa produkter väntar på minsta beställning
            </h3>
            <p className="text-sm text-yellow-800">
              Din beställning innehåller produkter som kräver att fler beställer innan de kan skickas.
            </p>
          </div>
        </div>

        {/* Blocking Items */}
        <div className="bg-white rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-gray-900 mb-3">
            Produkter som väntar:
          </h4>
          <div className="space-y-3">
            {blockingItems.map((item: any, index: number) => (
              <motion.div
                key={item.item_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {item.product_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    Antal: {item.quantity} st
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-yellow-700">
                    {item.moq_status?.current_quantity || 0}/{item.moq_status?.target_quantity || 0}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.moq_status?.percentage || 0}% uppnått
                  </div>
                  {item.moq_status?.tracking_scope === 'global' && (
                    <div className="text-xs text-primary-900 mt-1">
                      🌍 Global räkning
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Ready Items */}
        {readyItems.length > 0 && (
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-3">
              Produkter redo att skickas:
            </h4>
            <div className="space-y-2">
              {readyItems.map((item: any) => (
                <div key={item.item_id} className="flex items-center justify-between text-sm">
                  <span className="text-green-800">✓ {item.product_name}</span>
                  <span className="text-green-600">{item.quantity} st</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Split Shipment Option */}
      {showSplitOption && (
        <div className="bg-white border-2 border-primary-600 rounded-xl p-6">
          <h3 className="font-bold text-primary-900 text-lg mb-4">
            💡 Vill du ha delleverans?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Option 1: Wait */}
            <div className="border-2 border-gray-300 rounded-lg p-4 hover:border-gray-400 transition">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  name="shipment-strategy"
                  value="wait"
                  defaultChecked
                  className="w-4 h-4"
                />
                <h4 className="font-bold text-gray-900">Vänta på allt</h4>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>✓ Allt skickas tillsammans</p>
                <p>✓ Lägre fraktkostnad (89 kr)</p>
                <p>✓ Färre paket</p>
                <p className="text-yellow-700 font-semibold mt-2">
                  ⏱️ Leverans: 5-10 dagar
                </p>
              </div>
            </div>

            {/* Option 2: Split */}
            <div className="border-2 border-primary-600 rounded-lg p-4 bg-primary-50">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  name="shipment-strategy"
                  value="split"
                  className="w-4 h-4"
                />
                <h4 className="font-bold text-primary-900">Delleverans</h4>
              </div>
              <div className="text-sm text-primary-800 space-y-1">
                <p>✓ Få redo produkter nu</p>
                <p>✓ Resten kommer senare</p>
                <p className="text-red-700 font-semibold">
                  ⚠️ Extra kostnad: +49 kr
                </p>
                <div className="mt-2 pt-2 border-t border-primary-200">
                  <p className="font-semibold">Leverans 1: 2-3 dagar</p>
                  <p className="text-xs">{readyItems.length} produkter</p>
                  <p className="font-semibold mt-1">Leverans 2: 5-10 dagar</p>
                  <p className="text-xs">{blockingItems.length} produkter</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Total fraktkostnad med delleverans: <strong>138 kr</strong> (89 + 49 kr)
            </div>
            <button
              onClick={handleSplitShipment}
              disabled={processing}
              className="bg-primary-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-800 transition disabled:opacity-50"
            >
              {processing ? 'Skapar...' : '📦 Välj delleverans'}
            </button>
          </div>
        </div>
      )}

      {/* Progress Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">
          📊 Hur fungerar det?
        </h4>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            • Produkter med minsta beställning väntar tills tillräckligt många har beställt
          </p>
          <p>
            • Du kan se progress i realtid (t.ex. 40/50 påsar)
          </p>
          <p>
            • När minsta antal nås får alla som väntat rabatt och leverans
          </p>
          <p>
            • Du kan välja delleverans för att få vissa produkter tidigare
          </p>
        </div>
      </div>
    </div>
  );
}

// Compact version for order list
export function MOQBlockingBadge({ hasBlocking, blockingCount }: { hasBlocking: boolean; blockingCount: number }) {
  if (!hasBlocking) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
        <span>✓</span>
        <span>Redo</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
      <span>⏳</span>
      <span>{blockingCount} väntar MOQ</span>
    </span>
  );
}
