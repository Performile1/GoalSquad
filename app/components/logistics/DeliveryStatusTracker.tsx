'use client';

import React, { useEffect, useState } from 'react';

type UserRole = 'class_leader' | 'seller' | 'consumer';

export default function DeliveryStatusTracker({ campaignId, role }: { campaignId: string, role: UserRole }) {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(`/api/delivery/status/${campaignId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setStep(data.current_step);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [campaignId]);

  if (loading) return <div className="p-6 text-center text-slate-500 font-medium">Laddar leveransstatus...</div>;

  const getContextText = () => {
    if (role === 'class_leader') {
      if (step === 3) return 'Vyn för utlastning aktiveras så fort pallen har landat.';
      if (step === 4) return 'Bilen har anlänt! Starta utdelningen och sortera efter barnens listor.';
      return 'Varorna förberedas centralt på huvudlagret.';
    }
    if (role === 'seller') {
      if (step === 4) return 'Dina varor har kommit! Gör dig redo att leverera till dina kunder.';
      return 'Dina sålda produkter är på väg till vårt lokala lager.';
    }
    if (step === 4) return 'Dina varor har landat hos laget. Din lokala säljare kommer snart förbi!';
    return 'Kampanjen är säkrad. Varorna är på väg från fabriken/lagret.';
  };

  const steps = [
    { id: 1, name: 'Sorteras', desc: 'Merchants packar' },
    { id: 2, name: 'Bulktransport', desc: 'Mellan lagerhubbar' },
    { id: 3, name: 'Lokal Hub', desc: 'Sorteras för ditt närområde' },
    { id: 4, name: 'Framme', desc: 'Klar för utdeling!' }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm max-w-md mx-auto font-sans">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logistikstatus</span>
          <h3 className="text-sm font-bold text-slate-900 mt-0.5">Följ lagets beställning</h3>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
          step === 4 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-150'
        }`}>
          {step === 4 ? 'Ankommen ✓' : 'I Transit 🚛'}
        </span>
      </div>

      <div className="relative flex justify-between items-start mb-6">
        <div className="absolute left-3 top-4 right-3 h-0.5 bg-slate-100 -z-10" />
        <div 
          className="absolute left-3 top-4 h-0.5 bg-emerald-500 -z-10 transition-all duration-500 ease-out" 
          style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((s) => {
          const isDone = step >= s.id;
          const isCurrent = step === s.id;

          return (
            <div key={s.id} className="flex flex-col items-center flex-1 text-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold border-2 transition-all ${
                isDone 
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-400'
              } ${isCurrent ? 'ring-4 ring-emerald-100 border-emerald-500 text-emerald-600 scale-105' : ''}`}>
                {isDone && !isCurrent ? '✓' : s.id}
              </div>
              <span className={`text-[10px] font-bold mt-2 block ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                {s.name}
              </span>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-50 border border-slate-150 rounded-lg p-3.5">
        <div className="flex gap-2 items-start">
          <span className="text-sm">💡</span>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Info till dig</span>
            <p className="text-xs text-slate-700 mt-0.5 leading-relaxed font-medium">
              {getContextText()}
            </p>
          </div>
        </div>
      </div>

      {step === 4 && role === 'class_leader' && (
        <button 
          onClick={() => window.location.href = `/dashboard/distribution`}
          className="w-full mt-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition active:scale-[0.99]"
        >
          Öppna Utdelningsverktyget ➔
        </button>
      )}
    </div>
  );
}
