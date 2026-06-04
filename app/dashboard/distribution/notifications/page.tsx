'use client';

import React, { useState } from 'react';

interface Recipient {
  id: string;
  name: string;
  contactInfo: string;
}

export default function NotificationCenter() {
  const [campaignId] = useState('camp-9b-vair');
  const [isSending, setIsSending] = useState(false);
  const [dispatchSummary, setDispatchSummary] = useState<any[] | null>(null);

  const [recipients] = useState<Recipient[]>([
    { id: 'seller-scarlett-01', name: 'Scarlett Wigrund (Rickard)', contactInfo: '070-123 45 67' },
    { id: 'seller-william-02', name: 'William Wigrund (Rickard)', contactInfo: '070-123 45 67' },
    { id: 'seller-andersson-03', name: 'Lucas Andersson (Mia)', contactInfo: '073-987 65 43' }
  ]);

  const triggerArrivalNotifications = async () => {
    if (isSending) return;
    setIsSending(true);
    setDispatchSummary(null);

    try {
      const res = await fetch('/api/admin/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          recipients,
          notificationType: 'arrival_sms',
          channel: 'sms'
        })
      });

      const data = await res.json();
      if (data.success) {
        setDispatchSummary(data.processed);
      } else {
        alert('Ett fel uppstod vid sändningen.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 max-w-xl mx-auto">
      
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm mb-4">
        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Fas 3.2 // Kommunikationsmotor</span>
        <h1 className="text-xl font-black text-slate-950 mt-1">Avisera Ankomst till Hubben</h1>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          När du trycker på knappen nedan skickas ett automatiskt SMS till alla föräldrar med instruktioner om att varorna finns redo för avhämtning i ditt distributionsgarage.
        </p>

        <button
          onClick={triggerArrivalNotifications}
          disabled={isSending}
          className={`w-full mt-5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            isSending 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-[0.99]'
          }`}
        >
          {isSending ? 'Säkerställer nätverkslås & skickar...' : '⚡ Skicka Ankomst-SMS till hela gruppen'}
        </button>
      </div>

      {dispatchSummary && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm animate-fadeIn">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Sändningsrapport (Realtid)</h3>
          <div className="space-y-2 font-mono text-[11px]">
            {dispatchSummary.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-150">
                <span className="text-slate-700 font-medium">
                  {recipients.find(r => r.id === item.recipientId)?.name || item.recipientId}
                </span>
                
                {item.status === 'SENT' && (
                  <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">SKICKAT</span>
                )}
                {item.status === 'SKIPPED_DUPLICATE' && (
                  <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold" title={item.message}>BLOCKED (DUBBLETT)</span>
                )}
                {item.status === 'FAILED' && (
                  <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-bold">MISSLYCKADES</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
