'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MOQProgressProps {
  productId: string;
  postalCode: string;
  onStatusChange?: (canFulfill: boolean) => void;
}

export default function MOQProgress({ productId, postalCode, onStatusChange }: MOQProgressProps) {
  const [moqStatus, setMoqStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (postalCode) {
      checkMOQ();
    }
  }, [productId, postalCode]);

  const checkMOQ = async () => {
    try {
      const response = await fetch('/api/products/check-moq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, postalCode }),
      });

      const data = await response.json();
      setMoqStatus(data);

      if (onStatusChange) {
        onStatusChange(data.moqReached || !data.moqEnabled);
      }
    } catch (error) {
      console.error('MOQ check error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
    );
  }

  if (!moqStatus || !moqStatus.moqEnabled) {
    return null;
  }

  const percentage = moqStatus.percentage || 0;
  const isReady = moqStatus.moqReached;

  return (
    <div className={`rounded-xl p-6 ${isReady ? 'bg-green-50 border-2 border-green-500' : 'bg-primary-50 border-2 border-primary-600'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg mb-1">
            {isReady ? '✅ Minsta beställning uppnådd!' : '📦 Sambeställning pågår'}
          </h3>
          <p className="text-sm text-gray-600">
            {isReady
              ? 'Produkten skickas inom kort'
              : 'Beställ nu och få rabatt när minsta antal nås'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">
            {moqStatus.currentQuantity}/{moqStatus.targetQuantity}
          </div>
          <div className="text-xs text-gray-500">enheter</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full ${isReady ? 'bg-green-500' : 'bg-primary-900'}`}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
          {percentage.toFixed(0)}%
        </div>
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm">
        {!isReady && (
          <div className="flex items-center gap-2 text-gray-700">
            <span>⏱️</span>
            <span>
              <strong>{moqStatus.targetQuantity - moqStatus.currentQuantity}</strong> enheter kvar
            </span>
          </div>
        )}
        
        {moqStatus.estimatedShipDate && (
          <div className="flex items-center gap-2 text-gray-700">
            <span>📅</span>
            <span>
              Beräknad leverans: <strong>{moqStatus.estimatedShipDate}</strong>
            </span>
          </div>
        )}

        {!isReady && (
          <div className="mt-4 p-3 bg-white rounded-lg">
            <p className="text-xs text-gray-600">
              💡 <strong>Så fungerar det:</strong> När tillräckligt många beställer samma produkt
              till ditt område skickas alla beställningar tillsammans. Detta ger lägre pris och
              mindre miljöpåverkan!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact version for product cards
export function MOQBadge({ current, target }: { current: number; target: number }) {
  const percentage = Math.round((current / target) * 100);
  const isReady = current >= target;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
      isReady ? 'bg-green-100 text-green-700' : 'bg-primary-100 text-primary-900'
    }`}>
      <span>{isReady ? '✅' : '📦'}</span>
      <span>{current}/{target}</span>
      <span className="text-[10px]">({percentage}%)</span>
    </div>
  );
}

// Warehouse assignment display
export function WarehouseAssignment({ warehouseName, city, processingDays }: {
  warehouseName: string;
  city: string;
  processingDays: number;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className="text-3xl">🏭</div>
        <div>
          <div className="font-semibold text-gray-900">{warehouseName}</div>
          <div className="text-sm text-gray-600">{city}</div>
          <div className="text-xs text-gray-500 mt-1">
            Bearbetningstid: {processingDays} dagar
          </div>
        </div>
      </div>
    </div>
  );
}
