'use client';

import { useState, useEffect, useRef } from 'react';
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
  utilization?: number;
  errorRate?: number;
}

interface DemandArea {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order_count: number;
  radius_km: number;
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
  const [demandAreas, setDemandAreas] = useState<DemandArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredWarehouse, setHoveredWarehouse] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses');
      const data = await response.json();
      setWarehouses(data.warehouses || []);
      setDemandAreas(data.demandAreas || []);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading || !mapRef.current || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return;

    const renderMap = () => {
      const googleMaps = (window as any).google?.maps;
      if (!googleMaps || !mapRef.current) return;
      const map = new googleMaps.Map(mapRef.current, {
        center: { lat: 62.2, lng: 15.2 }, zoom: 5, streetViewControl: false,
        mapTypeControl: false, fullscreenControl: false,
        styles: [{ elementType: 'geometry', stylers: [{ color: '#eef2f1' }] }, { elementType: 'labels.text.fill', stylers: [{ color: '#526260' }] }, { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9dedb' }] }],
      });
      const bounds = new googleMaps.LatLngBounds();
      demandAreas.forEach((area) => {
        if (!area.latitude || !area.longitude) return;
        const position = { lat: area.latitude, lng: area.longitude };
        bounds.extend(position);
        new googleMaps.Circle({ map, center: position, radius: Number(area.radius_km || 10) * 1000, fillColor: '#C2410C', fillOpacity: 0.14, strokeColor: '#C2410C', strokeOpacity: 0.45, strokeWeight: 1 });
      });
      warehouses.forEach((warehouse) => {
        if (!warehouse.latitude || !warehouse.longitude) return;
        const position = { lat: warehouse.latitude, lng: warehouse.longitude };
        bounds.extend(position);
        const isFull = Number(warehouse.utilization || 0) >= 90;
        const hasErrors = Number(warehouse.errorRate || 0) >= 5;
        const color = hasErrors ? '#C2410C' : isFull ? '#B68B2C' : warehouse.isActive ? '#003B3D' : '#94A3B8';
        const marker = new googleMaps.Marker({ map, position, title: warehouse.name, icon: { path: googleMaps.SymbolPath.CIRCLE, scale: 9, fillColor: color, fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 } });
        marker.addListener('click', () => onWarehouseSelect?.(warehouse.id));
      });
      if (warehouses.length > 1) map.fitBounds(bounds, 48);
    };

    if ((window as any).google?.maps) { renderMap(); return; }
    const existingScript = document.querySelector('script[data-google-maps]');
    if (existingScript) { existingScript.addEventListener('load', renderMap); return () => existingScript.removeEventListener('load', renderMap); }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    script.async = true; script.defer = true; script.dataset.googleMaps = 'true'; script.addEventListener('load', renderMap); document.head.appendChild(script);
    return () => script.removeEventListener('load', renderMap);
  }, [loading, warehouses, demandAreas, onWarehouseSelect]);

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-2xl h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 animate-bounce text-primary-900 text-xl font-bold">Laddar...</div>
          <p className="text-gray-600">Laddar karta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Konsolideringslager i Sverige
        </h2>
          <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary-900 rounded-full"></div>
            <span>Aktivt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span>Inaktivt</span>
          </div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#B68B2C]"></div><span>Fullbelagt</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#C2410C]"></div><span>Många fel</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-100">
            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? <div ref={mapRef} className="h-[600px] w-full" /> : <div className="flex h-[600px] items-center justify-center p-8 text-center text-sm text-slate-600">Google Maps kräver `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` i Vercel. Partnerlistan nedan är tillgänglig utan kartnyckel.</div>}
            <div className="absolute bottom-4 left-4 rounded-lg bg-white/95 p-3 text-xs shadow-lg"><div className="mb-2 font-bold">Partnerstatus</div><div className="space-y-1"><div><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#003B3D]" />Normal kapacitet</div><div><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#B68B2C]" />Fullbelagt</div><div><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#C2410C]" />Många fel</div><div><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#C2410C]/40" />Hög order-efterfrågan</div></div></div>
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
                  ? 'border-primary-600 bg-primary-50'
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
                <div>Postnr: {warehouse.postalCode}</div>
                <div>Täcker: {warehouse.postalCodeRanges.join(', ')}</div>
                <div>Radie: {warehouse.coverageRadiusKm} km</div>
                {warehouse.pendingOrders !== undefined && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="font-semibold text-primary-900">
                      {warehouse.pendingOrders} väntande order
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
    <div className="bg-primary-50 rounded-lg p-3 text-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-bold text-primary-900">Lager:</span>
        <span className="font-bold text-primary-900">{warehouse.name}</span>
      </div>
      <div className="text-primary-900">
        {warehouse.city} • {warehouse.postalCode}
      </div>
    </div>
  );
}
