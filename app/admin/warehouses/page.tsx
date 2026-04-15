'use client';

import { useState } from 'react';
import WarehouseMap from '@/app/components/WarehouseMap';

export default function WarehousesAdminPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏭 Lagerpartners
          </h1>
          <p className="text-gray-600">
            Hantera konsolideringslager och täckningsområden
          </p>
        </div>

        {/* Map */}
        <WarehouseMap
          selectedWarehouse={selectedWarehouse || undefined}
          onWarehouseSelect={setSelectedWarehouse}
          showCoverage={true}
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-4xl mb-2">🏭</div>
            <div className="text-3xl font-bold text-gray-900">8</div>
            <div className="text-sm text-gray-600">Aktiva lager</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-4xl mb-2">📦</div>
            <div className="text-3xl font-bold text-blue-600">247</div>
            <div className="text-sm text-gray-600">Väntande order</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-4xl mb-2">📍</div>
            <div className="text-3xl font-bold text-green-600">100%</div>
            <div className="text-sm text-gray-600">Täckning Sverige</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-4xl mb-2">⚡</div>
            <div className="text-3xl font-bold text-purple-600">2</div>
            <div className="text-sm text-gray-600">Dagar bearbetning</div>
          </div>
        </div>
      </div>
    </div>
  );
}
