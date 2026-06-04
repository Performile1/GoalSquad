'use client';

import React, { useState, useEffect } from 'react';

interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
}

interface UserPermissionsModalProps {
  userId: string;
  userEmail: string;
  onClose: () => void;
}

export default function UserPermissionsModal({ userId, userEmail, onClose }: UserPermissionsModalProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchPermissionsData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/admin/permissions?userId=${userId}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Kunde inte hämta behörighetsdata');

        setPermissions(data.allPermissions || []);
        setAssignedIds(data.assignedPermissionIds || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchPermissionsData();
    }
  }, [userId]);

  const handleCheckboxChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setAssignedIds([...assignedIds, permissionId]);
    } else {
      setAssignedIds(assignedIds.filter((id) => id !== permissionId));
    }
    setSuccess(false);
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/admin/permissions/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: userId,
          permissionIds: assignedIds,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Misslyckades med att spara rättigheter');

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Granulära Rättigheter</h2>
            <p className="text-xs text-slate-500 mt-0.5">Hantera explicita systemåtkomster för {userEmail}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-50 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-xs text-red-700 flex items-center gap-2">
              <svg className="h-4 w-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border-l-4 border-green-500 text-xs text-green-700 flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Rättigheterna har synkroniserats och loggats i Audit Trail.</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-xs font-medium text-slate-400 flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Läser in rättighetsmatris...
            </div>
          ) : (
            <div className="border border-slate-100 rounded-lg divide-y divide-slate-100 bg-slate-50/50">
              {permissions.map((perm) => {
                const isChecked = assignedIds.includes(perm.id);

                return (
                  <div key={perm.id} className="p-4 flex items-start gap-4 hover:bg-white transition duration-150">
                    <div className="flex items-center h-5 pt-0.5">
                      <input
                        id={`perm-${perm.id}`}
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleCheckboxChange(perm.id, e.target.checked)}
                        disabled={saving}
                        className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-offset-0 bg-white transition cursor-pointer disabled:opacity-50"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label htmlFor={`perm-${perm.id}`} className="block text-xs font-bold text-slate-800 uppercase tracking-wide cursor-pointer">
                        {perm.name}
                      </label>
                      <p className="text-sm text-slate-600 mt-0.5">{perm.description}</p>
                      <span className="inline-block mt-2 font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/60">
                        {perm.code}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/70 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded-md text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50"
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={saving || loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving && (
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            Spara inställningar
          </button>
        </div>

      </div>
    </div>
  );
}
