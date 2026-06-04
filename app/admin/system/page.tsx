'use client';

import React, { useState, useEffect } from 'react';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  message: string;
}

interface BackupLog {
  id: string;
  backup_name: string;
  size_mb: number;
  status: 'success' | 'failed';
  created_at: string;
}

export default function SystemHealthPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [backups, setBackups] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningBackup, setRunningBackup] = useState(false);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const healthRes = await fetch('/api/admin/system/health');
      const healthData = await healthRes.json();
      if (healthData.success) setServices(healthData.services);

      const backupRes = await fetch('/api/admin/system/backups');
      const backupData = await backupRes.json();
      setBackups(backupData.backups || []);
    } catch (err) {
      console.error('Kunde inte läsa systemdata', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  const triggerBackup = async () => {
    try {
      setRunningBackup(true);
      const res = await fetch('/api/admin/system/backup', { method: 'POST' });
      if (res.ok) {
        fetchSystemData();
      }
    } catch (err) {
      console.error('Backupmisslyckande', err);
    } finally {
      setRunningBackup(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Systemstatus & Driftsäkerhet</h1>
            <p className="text-sm text-slate-500 mt-1">Övervaka API-latenser, databashälsa och administrera säkra systembackups.</p>
          </div>
          <button
            onClick={fetchSystemData}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 transition flex items-center gap-1.5"
          >
            Uppdatera Status
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400 bg-white border border-slate-200 rounded-lg">Läser in systemmetriker...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Komponentövervakning</h2>
                </div>
                
                <div className="divide-y divide-slate-100">
                  {services.map((service, idx) => (
                    <div key={idx} className="p-4 flex items-start justify-between hover:bg-slate-50/40 transition">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-800">{service.name}</h3>
                        <p className="text-xs text-slate-500">{service.message}</p>
                        <span className="inline-block font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/40">
                          Svarstid: {service.latency} ms
                        </span>
                      </div>

                      <div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide border ${
                          service.status === 'healthy' ? 'bg-green-50 text-green-700 border-green-200' :
                          service.status === 'degraded' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            service.status === 'healthy' ? 'bg-green-600' :
                            service.status === 'degraded' ? 'bg-amber-500' :
                            'bg-red-600'
                          }`} />
                          {service.status === 'healthy' ? 'Normal drift' : service.status === 'degraded' ? 'Hög belastning' : 'Avbrott'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Säkerhetskopiering</h3>
                  <p className="text-xs text-slate-500 mt-1">Skapa en omedelbar dump av produktionsdatabasen. Filerna krypteras och lagras i en isolerad miljö.</p>
                </div>

                <button
                  disabled={runningBackup}
                  onClick={triggerBackup}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold tracking-wide transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {runningBackup && (
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                  )}
                  {runningBackup ? 'Exporterar databas...' : 'Kör Manuell Backup'}
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200">
                  <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Backuplogg</h4>
                </div>
                <div className="divide-y divide-slate-100 font-mono text-[11px] text-slate-600">
                  {backups.length === 0 ? (
                    <div className="p-4 text-center font-sans text-xs text-slate-400">Inga registrerade backuphändelser.</div>
                  ) : (
                    backups.map((b) => (
                      <div key={b.id} className="p-3 hover:bg-slate-50/60 transition flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800 truncate max-w-[150px]" title={b.backup_name}>{b.backup_name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{b.size_mb} MB</p>
                        </div>
                        <span className={`text-[10px] font-sans px-1.5 py-0.5 font-semibold rounded uppercase ${
                          b.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {b.status === 'success' ? 'Klar' : 'Fel'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
