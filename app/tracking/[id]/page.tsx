'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface TrackingEvent {
  id: string;
  status: string;
  tracking_number: string | null;
  carrier: string | null;
  created_at: string;
  updated_at: string;
}

interface TrackingData {
  currentShipmentStatus: string;
  events: TrackingEvent[];
}

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tracking/${orderId}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Kunde inte hämta spårningsinformation');
      setTracking(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchTrackingData();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Hämtar spårningsinformation...
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="p-8 max-w-xl mx-auto mt-12 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-3">
        <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <span className="font-semibold">Ett fel uppstod:</span> {error || 'Ingen spårningsdata tillgänglig.'}
        </div>
      </div>
    );
  }

  // Definiera de fasta huvudstegen i leveranskedjan för den visuella indikatorn
  const steps = [
    { key: 'pending', label: 'Order lagd' },
    { key: 'processing', label: 'Bearbetas' },
    { key: 'shipped', label: 'Skickad' },
    { key: 'delivered', label: 'Levererad' }
  ];

  // Räkna ut hur långt i stegen paketet har kommit baserat på status
  const currentStatusIndex = steps.findIndex(step => step.key === tracking.currentShipmentStatus);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Huvudkort */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5 mb-6 gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Leveransspårning</span>
              <h1 className="text-xl font-bold text-slate-900 font-mono mt-0.5">Order #{orderId.substring(0, 8)}</h1>
            </div>
            <button
              onClick={fetchTrackingData}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition flex items-center gap-1.5 self-start sm:self-center"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.253 8H18" />
              </svg>
              Uppdatera status
            </button>
          </div>

          {/* Visuella Framstegssteg (Progress Tracker) */}
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 px-2 py-4">
            
            {/* Horisontell linje för desktop */}
            <div className="absolute hidden sm:block top-[26px] left-8 right-8 h-0.5 bg-slate-100 -z-0" />
            <div 
              className="absolute hidden sm:block top-[26px] left-8 h-0.5 bg-blue-600 transition-all duration-500 -z-0" 
              style={{ width: `${(Math.max(0, currentStatusIndex) / (steps.length - 1)) * 90}%` }}
            />

            {steps.map((step, index) => {
              const isCompleted = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;

              return (
                <div key={step.key} className="flex sm:flex-col items-center gap-3 sm:gap-2 z-10 w-full sm:w-auto">
                  {/* Cirkel-indikator */}
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                    isCompleted 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    {isCompleted ? (
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-[10px] font-bold">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Textetikett */}
                  <div className="text-left sm:text-center">
                    <p className={`text-xs font-semibold ${isCompleted ? 'text-slate-900' : 'text-slate-400'} ${isCurrent ? 'text-blue-600' : ''}`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Händelselogg (Tidslinje) */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4 tracking-tight">Historik och händelser</h2>
          
          <div className="relative border-l border-slate-100 pl-6 space-y-6 ml-3">
            {tracking.events.length === 0 ? (
              <div className="text-xs text-slate-400 py-2 font-medium">
                Inga specifika transportmilstolpar har registrerats ännu. Väntar på att paketet lämnar lagret.
              </div>
            ) : (
              tracking.events.map((event) => (
                <div key={event.id} className="relative">
                  {/* Tidslinjepunkt */}
                  <span className="absolute -left-[31px] top-1 bg-white border border-slate-300 rounded-full w-2.5 h-2.5 inline-block" />
                  
                  <div className="space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">{event.status}</h3>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(event.created_at).toLocaleString('sv-SE', { timeZone: 'UTC' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {event.carrier && `Transportör: ${event.carrier}`}
                      {event.tracking_number && ` | Spårningsnummer: ${event.tracking_number}`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
