'use client';

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function SupporterCheckout() {
  const [supporterName, setSupporterName] = useState('');
  const [supporterEmail, setSupporterEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'class_pickup' | 'home_delivery'>('class_pickup');
  
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [issubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setIdempotencyKey(uuidv4());
  }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (issubmitting) return;

    setIsSubmitting(true);
    setOrderStatus(null);

    try {
      const res = await fetch('/api/checkout/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: 'camp-9b-vair',
          sellerId: 'seller-scarlett-01',
          supporterName,
          supporterEmail,
          totalAmount: 250,
          deliveryMethod,
          idempotencyKey
        })
      });

      const data = await res.json();

      if (data.success) {
        setOrderStatus({
          type: 'success',
          text: data.isDuplicate 
            ? 'Tack! Din order är redan mottagen och bearbetas.' 
            : '✓ Köp slutfört! Ett kvitto har skickats till din e-post.'
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setOrderStatus({ type: 'error', text: err.message || 'Kunde inte slutföra köpet.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50">
        
        <div className="text-center mb-6">
          <span className="text-[10px] font-black tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase">
            Du stöttar Scarlett i Klass 9B
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 mt-3 tracking-tight">Slutför din beställning</h1>
        </div>

        {orderStatus ? (
          <div className={`p-4 rounded-2xl text-center text-sm font-medium border ${
            orderStatus.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {orderStatus.text}
          </div>
        ) : (
          <form onSubmit={handlePayment} className="space-y-4">
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ditt Namn</label>
              <input
                type="text"
                required
                placeholder="För- och efternamn"
                value={supporterName}
                onChange={(e) => setSupporterName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-slate-50 outline-none focus:bg-white focus:border-slate-400 transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">E-postadress</label>
              <input
                type="email"
                required
                placeholder="namn@exempel.se"
                value={supporterEmail}
                onChange={(e) => setSupporterEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-slate-50 outline-none focus:bg-white focus:border-slate-400 transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Hur vill du ha dina varor?</label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setDeliveryMethod('class_pickup')}
                  className={`border rounded-xl p-3 text-center cursor-pointer transition ${
                    deliveryMethod === 'class_pickup'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="font-bold text-xs block">Fri frakt</span>
                  <span className="text-[10px] opacity-80 block mt-0.5">Hämtas via Scarlett</span>
                </div>

                <div
                  onClick={() => setDeliveryMethod('home_delivery')}
                  className={`border rounded-xl p-3 text-center cursor-pointer transition ${
                    deliveryMethod === 'home_delivery'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="font-bold text-xs block">Frakt tillkommer</span>
                  <span className="text-[10px] opacity-80 block mt-0.5">Skickas till din adress</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase">Totalt att betala</span>
                <span className="text-lg font-black text-slate-900">250,00 kr</span>
              </div>

              <button
                type="submit"
                disabled={issubmitting}
                className={`w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition ${
                  issubmitting 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/10 active:scale-[0.99]'
                }`}
              >
                {issubmitting ? 'Bearbetar betalning...' : 'Betala med Swish ➔'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
