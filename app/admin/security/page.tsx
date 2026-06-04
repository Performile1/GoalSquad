'use client';

import React, { useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  updated_at: string;
}

interface AuditLogItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  changes: {
    before: any;
    after: any;
  };
  profiles?: {
    email: string;
  };
}

export default function AdminSecurityDashboard() {
  const [activeTab, setActiveTab] = useState<'rbac' | 'audit'>('rbac');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'rbac') {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        const res = await fetch('/api/admin/audit-logs');
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Kunde inte läsa administratörsdata', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    setUpdatingUserId(targetUserId);
    try {
      const response = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, newRole }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Misslyckades med att ändra behörighet');
      
      setUsers(users.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header-sektion */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Säkerhet & Användarrättigheter</h1>
            <p className="text-sm text-slate-500 mt-1">Övervaka systemförändringar och justera rollbaserad åtkomstkontroll (RBAC).</p>
          </div>
          
          {/* Flikar */}
          <div className="inline-flex p-1 bg-slate-100 rounded-md">
            <button
              onClick={() => setActiveTab('rbac')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition duration-150 ${activeTab === 'rbac' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Användarrättigheter
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition duration-150 ${activeTab === 'audit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Säkerhetslogg (Audit Trail)
            </button>
          </div>
        </div>

        {/* Sökfält */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder={activeTab === 'rbac' ? "Sök på användarens e-post..." : "Sök på händelse eller entitet..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-md bg-white outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        {/* Huvudinnehåll */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-400 font-medium">Läser in systemdata...</div>
          ) : activeTab === 'rbac' ? (
            
            /* TAB: RBAC HANTERING */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Användare</th>
                    <th className="py-3 px-4">ID (UUID)</th>
                    <th className="py-3 px-4">Nuvarande roll</th>
                    <th className="py-3 px-4 text-right">Ändra rättigheter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase())).map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-4 font-medium text-slate-900">{user.email}</td>
                      <td className="py-4 px-4 font-mono text-xs text-slate-400">{user.id}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${
                          user.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          user.role === 'merchant' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          user.role === 'warehouse_staff' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <select
                          value={user.role}
                          disabled={updatingUserId === user.id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="user">User (Standard)</option>
                          <option value="warehouse_staff">Warehouse Staff</option>
                          <option value="merchant">Merchant</option>
                          <option value="admin">Global Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            
            /* TAB: SECURITY AUDIT TRAIL */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Tidsstämpel (UTC)</th>
                    <th className="py-3 px-4">Händelse</th>
                    <th className="py-3 px-4">Entitet (ID)</th>
                    <th className="py-3 px-4">Utförd av</th>
                    <th className="py-3 px-4 text-right">Förändringsdata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-mono text-slate-600">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(log.created_at).toISOString().replace('T', ' ').substring(0, 19)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{log.action}</td>
                      <td className="py-3 px-4">
                        <span className="text-slate-500">{log.entity_type}</span>
                        <span className="text-slate-400 block text-[10px]">{log.entity_id}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{log.profiles?.email || 'System / Server'}</td>
                      <td className="py-3 px-4 text-right font-sans">
                        <details className="text-left inline-block">
                          <summary className="text-[11px] font-medium text-blue-600 hover:text-blue-800 cursor-pointer list-none outline-none">
                            Visa JSON
                          </summary>
                          <pre className="absolute right-8 mt-2 p-3 bg-slate-900 text-slate-100 rounded-md border border-slate-800 text-[10px] font-mono shadow-xl max-w-md overflow-x-auto z-10">
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
