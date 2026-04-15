'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Warehouse {
  id: string;
  name: string;
  code: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  postalCodeRanges: string[];
  coverageRadiusKm: number;
  isActive: boolean;
  pendingOrders?: number;
  capacity?: number;
}

interface WarehouseMapProps {
  selectedWarehouse?: string;
  onWarehouseSelect?: (warehouseId: string) => void;
  showCoverage?: boolean;
}

export default function WarehouseMap({ 
  selectedWarehouse, 
  onWarehouseSelect,
  showCoverage = true 
}: WarehouseMapProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredWarehouse, setHoveredWarehouse] = useState<string | null>(null);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses');
      const data = await response.json();
      setWarehouses(data.warehouses || []);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sweden bounds for map
  const swedenBounds = {
    minLat: 55.0,
    maxLat: 69.0,
    minLng: 10.0,
    maxLng: 24.0,
  };

  // Convert lat/lng to SVG coordinates
  const latLngToXY = (lat: number, lng: number) => {
    const x = ((lng - swedenBounds.minLng) / (swedenBounds.maxLng - swedenBounds.minLng)) * 800;
    const y = ((swedenBounds.maxLat - lat) / (swedenBounds.maxLat - swedenBounds.minLat)) * 1000;
    return { x, y };
  };

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-2xl h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🗺️</div>
          <p className="text-gray-600">Laddar karta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          🗺️ Konsolideringslager i Sverige
        </h2>
        <div className="flex gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Aktivt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span>Inaktivt</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-xl overflow-hidden border-2 border-gray-200">
            <svg viewBox="0 0 800 1000" className="w-full h-[600px]">
              {/* Sweden outline (simplified) */}
              <path
                d="M 400 50 L 450 100 L 480 200 L 500 350 L 490 500 L 470 650 L 450 750 L 420 850 L 400 950 L 380 850 L 350 750 L 330 650 L 310 500 L 320 350 L 340 200 L 370 100 Z"
                fill="#e0f2fe"
                stroke="#0284c7"
                strokeWidth="2"
              />

              {/* Coverage circles */}
              {showCoverage && warehouses.map((warehouse) => {
                const { x, y } = latLngToXY(warehouse.latitude, warehouse.longitude);
                const radius = (warehouse.coverageRadiusKm / 100) * 150; // Scale for visualization
                
                return (
                  <circle
                    key={`coverage-${warehouse.id}`}
                    cx={x}
                    cy={y}
                    r={radius}
                    fill={warehouse.id === selectedWarehouse ? 'rgba(59, 130, 246, 0.2)' : 'rgba(156, 163, 175, 0.1)'}
                    stroke={warehouse.id === selectedWarehouse ? '#3b82f6' : '#9ca3af'}
                    strokeWidth="1"
                    strokeDasharray="5,5"
                  />
                );
              })}

              {/* Warehouse markers */}
              {warehouses.map((warehouse, index) => {
                const { x, y } = latLngToXY(warehouse.latitude, warehouse.longitude);
                const isSelected = warehouse.id === selectedWarehouse;
                const isHovered = warehouse.id === hoveredWarehouse;
                
                return (
                  <g
                    key={warehouse.id}
                    onMouseEnter={() => setHoveredWarehouse(warehouse.id)}
                    onMouseLeave={() => setHoveredWarehouse(null)}
                    onClick={() => onWarehouseSelect?.(warehouse.id)}
                    className="cursor-pointer"
                  >
                    {/* Marker */}
                    <motion.circle
                      cx={x}
                      cy={y}
                      r={isSelected || isHovered ? 12 : 8}
                      fill={warehouse.isActive ? '#3b82f6' : '#9ca3af'}
                      stroke="white"
                      strokeWidth="2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    />
                    
                    {/* Label */}
                    {(isSelected || isHovered) && (
                      <text
                        x={x}
                        y={y - 20}
                        textAnchor="middle"
                        className="text-xs font-bold fill-gray-900"
                      >
                        {warehouse.city}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
              <div className="font-bold mb-2">Täckningsområden</div>
              {warehouses.map((w) => (
                <div key={w.id} className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${w.isActive ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  <span>{w.city}: {w.postalCodeRanges.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Warehouse List */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900 mb-4">Lagerpartners</h3>
          {warehouses.map((warehouse) => (
            <motion.div
              key={warehouse.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => onWarehouseSelect?.(warehouse.id)}
              onMouseEnter={() => setHoveredWarehouse(warehouse.id)}
              onMouseLeave={() => setHoveredWarehouse(null)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                warehouse.id === selectedWarehouse
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold text-gray-900">{warehouse.name}</h4>
                  <p className="text-sm text-gray-600">{warehouse.city}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${warehouse.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              </div>
              
              <div className="text-xs text-gray-600 space-y-1">
                <div>📮 {warehouse.postalCode}</div>
                <div>📍 Täcker: {warehouse.postalCodeRanges.join(', ')}</div>
                <div>📏 Radie: {warehouse.coverageRadiusKm} km</div>
                {warehouse.pendingOrders !== undefined && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="font-semibold text-blue-600">
                      📦 {warehouse.pendingOrders} väntande order
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Compact warehouse selector
export function WarehouseSelector({ 
  postalCode, 
  onSelect 
}: { 
  postalCode: string; 
  onSelect?: (warehouse: any) => void;
}) {
  const [warehouse, setWarehouse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (postalCode) {
      findWarehouse();
    }
  }, [postalCode]);

  const findWarehouse = async () => {
    try {
      const response = await fetch(`/api/warehouses/find?postalCode=${postalCode}`);
      const data = await response.json();
      setWarehouse(data.warehouse);
      if (onSelect) onSelect(data.warehouse);
    } catch (error) {
      console.error('Find warehouse error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Söker lager...</div>;
  }

  if (!warehouse) {
    return <div className="text-sm text-red-600">Inget lager hittat för {postalCode}</div>;
  }

  return (
    <div className="bg-blue-50 rounded-lg p-3 text-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-2xl">🏭</span>
        <span className="font-bold text-blue-900">{warehouse.name}</span>
      </div>
      <div className="text-blue-700">
        {warehouse.city} • {warehouse.postalCode}
      </div>
    </div>
  );
}
