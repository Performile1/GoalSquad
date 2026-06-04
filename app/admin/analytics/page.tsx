'use client';

import React, { useState, useEffect } from 'react';

interface AnalyticsData {
  total_orders_count: number;
  total_items_sold: number;
  gross_sales_amount: number;
  group_profit_amount: number;
  calculated_at: string;
}

interface ReportItem {
  id: string;
  name: string;
  report_type: string;
  status: 'processing' | 'completed' | 'failed';
  file_url: string | null;
  created_at: string;
}

export default function AdminAnalyticsDashboard() {
  const currentGroupId = "default-group-id";
  const groupTargetGoal = 25000;

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reports'>('overview');

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const res = await fetch(`/api/admin/analytics/group/${currentGroupId}`);
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error('Kunde inte läsa analysdata', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`/api/admin/reports?scopeId=${currentGroupId}`);
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error('Kunde inte läsa rapportlogg', err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchReports();
  }, []);

  const handleGenerateReport = async (type: string, label: string) => {
    try {
      setGeneratingReport(true);
      const res = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: type,
          scopeId: currentGroupId,
          name: `${label}_${new Date().toISOString().substring(0, 10)}` 
        })
      });

      if (res.ok) {
        fetchReports();
      }
    } catch (err) {
      console.error('Rapportgenerering misslyckades', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  const profitAmount = analytics?.group_profit_amount || 0;
  const progressPercentage = Math.min(100, Math.round((profitAmount / groupTargetGoal) * 100));

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Prestanda & Försäljningsanalys</h1>
            <p className="text-sm text-slate-500 mt-1">Övervaka laginsamlingar, marginaler och generera logistiska underlag.</p>
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-md self-start sm:self-center">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition duration-150 ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Ekonomisk Översikt
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition duration-150 ${activeTab === 'reports' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Export & Rapporter
            </button>
          </div>
        </div>

        {activeTab === 'overview' ? (
          <div className="space-y-6">
            {loadingAnalytics ? (
              <div className="p-12 text-center text-sm text-slate-400 bg-white border border-slate-200 rounded-lg">Läser in och aggregerar säljdata...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Insamlad Förtjänst (Lagkassa)</span>
                    <p className="text-2xl font-bold text-emerald-600 mt-1 font-mono">{profitAmount.toLocaleString('sv-SE')} kr</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Bruttoomsättning</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{(analytics?.gross_sales_amount || 0).toLocaleString('sv-SE')} kr</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Antal Betalda Ordrar</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{analytics?.total_orders_count || 0} st</p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sålda Produkter Totalt</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{analytics?.total_items_sold || 0} st</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Måluppfyllnad för gruppen</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Sparmål inställt på att nå {groupTargetGoal.toLocaleString('sv-SE')} kr för resekassan.</p>
                    </div>
                    <span className="text-sm font-mono font-bold text-blue-600">{progressPercentage}%</span>
                  </div>
                  
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/50">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-500 rounded-full" 
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 text-right">
                    Senast uppdaterad: {analytics ? new Date(analytics.calculated_at).toLocaleTimeString('sv-SE') : ''}
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm h-fit space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Skapa nya underlag</h3>
              
              <button
                disabled={generatingReport}
                onClick={() => handleGenerateReport('batch_picking', 'Samlingspacksedel_Lager')}
                className="w-full text-left px-3 py-2.5 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 rounded text-xs font-semibold text-slate-700 transition flex items-center justify-between"
              >
                <span>Generera Samlingspacksedel (Lager)</span>
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </button>

              <button
                disabled={generatingReport}
                onClick={() => handleGenerateReport('financial_settlement', 'Ekonomisk_Avstämning')}
                className="w-full text-left px-3 py-2.5 border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 rounded text-xs font-semibold text-slate-700 transition flex items-center justify-between"
              >
                <span>Skapa Ekonomiskt Slutunderlag</span>
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>

            <div className="md:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filarkiv & Exportstatus</h3>
              </div>
              
              <div className="divide-y divide-slate-100 text-sm">
                {reports.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-medium">Inga rapporter genererade för denna grupp ännu.</div>
                ) : (
                  reports.map((report) => (
                    <div key={report.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-800 font-mono">{report.name}</p>
                        <p className="text-[11px] text-slate-400">Skapad: {new Date(report.created_at).toLocaleString('sv-SE').substring(0, 16)}</p>
                      </div>

                      <div>
                        {report.status === 'processing' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <svg className="animate-spin h-3 w-3 text-amber-600" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                            Kompilerar...
                          </span>
                        )}
                        {report.status === 'failed' && (
                          <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">Misslyckades</span>
                        )}
                        {report.status === 'completed' && report.file_url && (
                          <a
                            href={report.file_url}
                            download
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 px-3 py-1 rounded transition"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Hämta CSV
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
