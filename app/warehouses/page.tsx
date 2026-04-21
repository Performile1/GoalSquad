'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { LogisticsIcon, ShopIcon, ShoppingBagIcon } from '@/app/components/BrandIcons';

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
  entityType?: 'warehouse' | 'community' | 'seller' | 'team';
  earnings?: {
    storage: number;
    handling: number;
    shipping: number;
    total: number;
  };
  communityName?: string;
  teamName?: string;
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
    entityType: 'warehouse',
    earnings: { storage: 25000, handling: 15000, shipping: 10000, total: 50000 },
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
    entityType: 'warehouse',
    earnings: { storage: 20000, handling: 12000, shipping: 8000, total: 40000 },
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
    entityType: 'warehouse',
    earnings: { storage: 15000, handling: 9000, shipping: 6000, total: 30000 },
  },
  {
    id: '4',
    name: 'Mölnlycke IF',
    city: 'Mölnlycke',
    country: 'SE',
    capacity: '500 pallplatser',
    packagesPerDay: 200,
    services: ['Lagring', 'Orderhantering'],
    lat: 57.66,
    lng: 12.13,
    entityType: 'community',
    communityName: 'Mölnlycke IF',
    earnings: { storage: 2500, handling: 1500, shipping: 1000, total: 5000 },
  },
  {
    id: '5',
    name: 'Mölnlycke IF - P14',
    city: 'Mölnlycke',
    country: 'SE',
    capacity: '100 pallplatser',
    packagesPerDay: 50,
    services: ['Lagring'],
    lat: 57.66,
    lng: 12.13,
    entityType: 'team',
    teamName: 'Mölnlycke IF - P14',
    earnings: { storage: 500, handling: 300, shipping: 200, total: 1000 },
  },
  {
    id: '6',
    name: 'Anna Andersson',
    city: 'Stockholm',
    country: 'SE',
    capacity: '200 pallplatser',
    packagesPerDay: 100,
    services: ['Lagring', 'Orderhantering'],
    lat: 59.33,
    lng: 18.06,
    entityType: 'seller',
    earnings: { storage: 1000, handling: 600, shipping: 400, total: 2000 },
  },
  {
    id: '7',
    name: 'Oslo Lagerpartner',
    city: 'Oslo',
    country: 'NO',
    capacity: '5 000 pallplatser',
    packagesPerDay: 2500,
    services: ['Lagring', 'Frakt'],
    lat: 59.91,
    lng: 10.75,
    entityType: 'warehouse',
    earnings: { storage: 12500, handling: 7500, shipping: 5000, total: 25000 },
  },
];

export default function WarehousesPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [hoveredWarehouse, setHoveredWarehouse] = useState<string | null>(null);

  // Europe-focused map coordinates
  // Lat range: 72°N to 45°N, Lng range: -5°W to 35°E
  const normalizeLat = (lat: number) => ((72 - lat) / (72 - 45)) * 100;
  const normalizeLng = (lng: number) => ((lng - (-5)) / (35 - (-5))) * 100;

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
              <div className="relative rounded-xl overflow-hidden" style={{ height: '500px' }}>
                {/* Europe-focused Map Image */}
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/8/84/Europe_blank_map.png"
                  alt="Europakarta"
                  className="w-full h-full object-contain bg-gray-100"
                  style={{ filter: 'grayscale(20%)' }}
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                {/* Warehouse pins */}
                {MOCK_WAREHOUSES.map((warehouse) => {
                  const x = normalizeLng(warehouse.lng);
                  const y = normalizeLat(warehouse.lat);
                  const isSelected = selectedWarehouse?.id === warehouse.id;
                  const isHovered = hoveredWarehouse === warehouse.id;

                  return (
                    <div
                      key={warehouse.id}
                      className="absolute cursor-pointer transition-all duration-200"
                      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                      onClick={() => setSelectedWarehouse(warehouse)}
                      onMouseEnter={() => setHoveredWarehouse(warehouse.id)}
                      onMouseLeave={() => setHoveredWarehouse(null)}
                    >
                      {/* Pin */}
                      <div
                        className="rounded-full flex items-center justify-center transition-all duration-200"
                        style={{
                          width: isSelected ? '40px' : isHovered ? '32px' : '24px',
                          height: isSelected ? '40px' : isHovered ? '32px' : '24px',
                          backgroundColor: isSelected ? '#004040' : isHovered ? '#006666' : '#004040',
                          opacity: isSelected ? 1 : isHovered ? 0.9 : 0.7,
                        }}
                      >
                        <ShoppingBagIcon size={16} className="text-white" />
                      </div>
                      {/* Label */}
                      <div
                        className="absolute whitespace-nowrap text-sm font-bold text-primary-900 bg-white/90 backdrop-blur px-2 py-1 rounded shadow-sm"
                        style={{
                          top: isSelected ? '-30px' : isHovered ? '-26px' : '-22px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                        }}
                      >
                        {warehouse.city}
                      </div>
                    </div>
                  );
                })}

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg">
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
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-primary-900">{warehouse.name}</h3>
                        {warehouse.entityType && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            warehouse.entityType === 'warehouse' ? 'bg-blue-100 text-blue-700' :
                            warehouse.entityType === 'community' ? 'bg-green-100 text-green-700' :
                            warehouse.entityType === 'seller' ? 'bg-purple-100 text-purple-700' :
                            warehouse.entityType === 'team' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {warehouse.entityType === 'warehouse' ? 'Lager' :
                             warehouse.entityType === 'community' ? 'Förening' :
                             warehouse.entityType === 'seller' ? 'Säljare' :
                             warehouse.entityType === 'team' ? 'Lag' :
                             warehouse.entityType}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{warehouse.city}, {warehouse.country}</p>
                      {warehouse.communityName && (
                        <p className="text-xs text-green-600 font-semibold">{warehouse.communityName}</p>
                      )}
                      {warehouse.teamName && (
                        <p className="text-xs text-orange-600 font-semibold">{warehouse.teamName}</p>
                      )}
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
                    {warehouse.earnings && (
                      <div className="flex justify-between bg-green-50 px-2 py-1 rounded">
                        <span className="text-green-700 font-semibold">Intäkter:</span>
                        <span className="font-bold text-green-900">{warehouse.earnings.total.toLocaleString()} kr</span>
                      </div>
                    )}
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-primary-900">{selectedWarehouse.name}</h2>
              {selectedWarehouse.entityType && (
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                  selectedWarehouse.entityType === 'warehouse' ? 'bg-blue-100 text-blue-700' :
                  selectedWarehouse.entityType === 'community' ? 'bg-green-100 text-green-700' :
                  selectedWarehouse.entityType === 'seller' ? 'bg-purple-100 text-purple-700' :
                  selectedWarehouse.entityType === 'team' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedWarehouse.entityType === 'warehouse' ? '📦 Lager' :
                   selectedWarehouse.entityType === 'community' ? '🤝 Förening' :
                   selectedWarehouse.entityType === 'seller' ? '👤 Säljare' :
                   selectedWarehouse.entityType === 'team' ? '🏆 Lag' :
                   selectedWarehouse.entityType}
                </span>
              )}
            </div>
            
            {selectedWarehouse.communityName && (
              <p className="text-green-600 font-semibold mb-4">🤝 {selectedWarehouse.communityName}</p>
            )}
            {selectedWarehouse.teamName && (
              <p className="text-orange-600 font-semibold mb-4">🏆 {selectedWarehouse.teamName}</p>
            )}

            <div className="grid md:grid-cols-3 gap-6 mb-6">
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

            {selectedWarehouse.earnings && (
              <div className="bg-green-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-green-900 mb-4">💰 Intäkter</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-green-700 mb-1">Lagring</div>
                    <div className="text-xl font-bold text-green-900">
                      {selectedWarehouse.earnings.storage.toLocaleString()} kr
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-green-700 mb-1">Hantering</div>
                    <div className="text-xl font-bold text-green-900">
                      {selectedWarehouse.earnings.handling.toLocaleString()} kr
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-green-700 mb-1">Frakt</div>
                    <div className="text-xl font-bold text-green-900">
                      {selectedWarehouse.earnings.shipping.toLocaleString()} kr
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-green-700 mb-1">Totalt</div>
                    <div className="text-2xl font-bold text-green-900">
                      {selectedWarehouse.earnings.total.toLocaleString()} kr
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
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
