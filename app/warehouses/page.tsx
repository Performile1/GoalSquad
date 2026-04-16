'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { LogisticsIcon, ShopIcon } from '@/app/components/BrandIcons';

interface Warehouse {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: string;
  packagesPerDay: number;
  services: string[];
  lat: number;
  lng: number;
}

const MOCK_WAREHOUSES: Warehouse[] = [
  {
    id: '1',
    name: 'Stockholm Logistik AB',
    city: 'Stockholm',
    country: 'SE',
    capacity: '10 000 pallplatser',
    packagesPerDay: 5000,
    services: ['Lagring', 'Orderhantering', 'Frakt'],
    lat: 59.33,
    lng: 18.06,
  },
  {
    id: '2',
    name: 'Göteborg Distribution',
    city: 'Göteborg',
    country: 'SE',
    capacity: '8 000 pallplatser',
    packagesPerDay: 4000,
    services: ['Lagring', 'Frakt', 'Returhantering'],
    lat: 57.71,
    lng: 11.97,
  },
  {
    id: '3',
    name: 'Malmö Hub',
    city: 'Malmö',
    country: 'SE',
    capacity: '6 000 pallplatser',
    packagesPerDay: 3000,
    services: ['Lagring', 'Orderhantering'],
    lat: 55.60,
    lng: 13.00,
  },
  {
    id: '4',
    name: 'Oslo Lagerpartner',
    city: 'Oslo',
    country: 'NO',
    capacity: '5 000 pallplatser',
    packagesPerDay: 2500,
    services: ['Lagring', 'Frakt'],
    lat: 59.91,
    lng: 10.75,
  },
  {
    id: '5',
    name: 'Copenhagen Logistics',
    city: 'Copenhagen',
    country: 'DK',
    capacity: '7 000 pallplatser',
    packagesPerDay: 3500,
    services: ['Lagring', 'Orderhantering', 'Frakt', 'Returhantering'],
    lat: 55.68,
    lng: 12.57,
  },
];

export default function WarehousesPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [hoveredWarehouse, setHoveredWarehouse] = useState<string | null>(null);

  // Simple map visualization using SVG
  const mapWidth = 800;
  const mapHeight = 600;
  const padding = 50;

  // Normalize coordinates to map
  const normalizeLat = (lat: number) => padding + ((60 - lat) / (60 - 54)) * (mapHeight - 2 * padding);
  const normalizeLng = (lng: number) => padding + ((lng - 9) / (20 - 9)) * (mapWidth - 2 * padding);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center mb-4">
            <LogisticsIcon size={64} className="opacity-90" />
          </div>
          <h1 className="text-5xl font-bold text-center mb-4">
            Våra Lagerpartners
          </h1>
          <p className="text-xl text-center text-primary-100">
            Distribuerat logistiknätverk över hela Norden
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Map */}
          <div className="lg:w-2/3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-primary-900 mb-6">Karta över lager</h2>
              <div className="relative bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl overflow-hidden" style={{ height: '500px' }}>
                <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="w-full h-full">
                  {/* Background */}
                  <rect width={mapWidth} height={mapHeight} fill="#f0fdf4" />
                  
                  {/* Simple Sweden/Norway/Denmark outline approximation */}
                  <path
                    d="M 200 100 Q 250 80 300 100 Q 350 120 400 100 Q 450 80 500 100 Q 550 120 600 100 L 600 400 Q 550 420 500 400 Q 450 380 400 400 Q 350 420 300 400 Q 250 380 200 400 Z"
                    fill="none"
                    stroke="#004040"
                    strokeWidth="2"
                    opacity="0.3"
                  />

                  {/* Warehouse pins */}
                  {MOCK_WAREHOUSES.map((warehouse) => {
                    const x = normalizeLng(warehouse.lng);
                    const y = normalizeLat(warehouse.lat);
                    const isSelected = selectedWarehouse?.id === warehouse.id;
                    const isHovered = hoveredWarehouse === warehouse.id;

                    return (
                      <g key={warehouse.id}>
                        {/* Pin */}
                        <circle
                          cx={x}
                          cy={y}
                          r={isSelected ? 20 : isHovered ? 16 : 12}
                          fill={isSelected ? '#004040' : isHovered ? '#006666' : '#004040'}
                          opacity={isSelected ? 1 : isHovered ? 0.8 : 0.6}
                          className="cursor-pointer transition-all duration-200"
                          onClick={() => setSelectedWarehouse(warehouse)}
                          onMouseEnter={() => setHoveredWarehouse(warehouse.id)}
                          onMouseLeave={() => setHoveredWarehouse(null)}
                        />
                        {/* Pin icon */}
                        <text
                          x={x}
                          y={y + 5}
                          textAnchor="middle"
                          fill="white"
                          fontSize={isSelected ? 16 : 12}
                          fontWeight="bold"
                          className="pointer-events-none"
                        >
                          📦
                        </text>
                        {/* Label */}
                        <text
                          x={x}
                          y={y - (isSelected ? 25 : isHovered ? 21 : 17)}
                          textAnchor="middle"
                          fill="#004040"
                          fontSize={isSelected ? 14 : 12}
                          fontWeight="bold"
                          className="pointer-events-none"
                        >
                          {warehouse.city}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-3 h-3 rounded-full bg-primary-900" />
                    <span>Aktivt lager</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar - List */}
          <div className="lg:w-1/3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-primary-900 mb-6">Lagerlista</h2>
              {MOCK_WAREHOUSES.map((warehouse) => (
                <motion.div
                  key={warehouse.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedWarehouse(warehouse)}
                  className={`bg-white rounded-xl p-6 cursor-pointer transition ${
                    selectedWarehouse?.id === warehouse.id
                      ? 'border-2 border-primary-900 shadow-lg'
                      : 'border-2 border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-primary-900">{warehouse.name}</h3>
                      <p className="text-sm text-gray-500">{warehouse.city}, {warehouse.country}</p>
                    </div>
                    <ShopIcon size={24} />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kapacitet:</span>
                      <span className="font-semibold text-gray-900">{warehouse.capacity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paket/dag:</span>
                      <span className="font-semibold text-gray-900">{warehouse.packagesPerDay.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {warehouse.services.map((service) => (
                        <span
                          key={service}
                          className="text-xs bg-primary-50 text-primary-900 px-2 py-1 rounded-full"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* CTA */}
              <Link
                href="/warehouses/onboard"
                className="block bg-primary-900 text-white rounded-xl p-6 text-center hover:bg-primary-700 transition"
              >
                <h3 className="font-bold text-xl mb-2">Bli lagerpartner</h3>
                <p className="text-white/80 text-sm">
                  Registrera ditt lager för att bli en del av vårt nätverk
                </p>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Selected warehouse details */}
        {selectedWarehouse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-primary-900 mb-6">{selectedWarehouse.name}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-primary-50 rounded-xl p-6">
                <div className="text-sm text-primary-700 mb-1">Plats</div>
                <div className="text-xl font-bold text-primary-900">
                  {selectedWarehouse.city}, {selectedWarehouse.country}
                </div>
              </div>
              <div className="bg-primary-50 rounded-xl p-6">
                <div className="text-sm text-primary-700 mb-1">Kapacitet</div>
                <div className="text-xl font-bold text-primary-900">
                  {selectedWarehouse.capacity}
                </div>
              </div>
              <div className="bg-primary-50 rounded-xl p-6">
                <div className="text-sm text-primary-700 mb-1">Paket per dag</div>
                <div className="text-xl font-bold text-primary-900">
                  {selectedWarehouse.packagesPerDay.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <div className="text-sm text-gray-600 mb-2">Tjänster</div>
              <div className="flex flex-wrap gap-2">
                {selectedWarehouse.services.map((service) => (
                  <span
                    key={service}
                    className="bg-primary-900 text-white px-4 py-2 rounded-full text-sm font-semibold"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
