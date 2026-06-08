'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BoxIcon, AlertIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface PickingTask {
  id: string;
  campaign_id: string | null;
  sku: string;
  quantity_to_pick: number;
  status: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Väntar', cls: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: 'Pågår', cls: 'bg-blue-100 text-blue-700' },
  picked: { label: 'Plockad', cls: 'bg-green-100 text-green-700' },
  completed: { label: 'Klar', cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Avbruten', cls: 'bg-gray-100 text-gray-600' },
};

export default function WarehousePicklistOverview() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params.id as string;

  const [tasks, setTasks] = useState<PickingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch(`/api/warehouses/${warehouseId}/picking-tasks`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Kunde inte hämta plockordrar');
        setTasks(data.tasks || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [warehouseId]);

  const filtered = tasks.filter((t) => statusFilter === 'all' || t.status === statusFilter);

  // Group by campaign for readability.
  const groups = filtered.reduce<Record<string, PickingTask[]>>((acc, t) => {
    const key = t.campaign_id || 'Övrigt';
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary-100"><BoxIcon size={32} className="text-primary-900" /></div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Plockordrar</h1>
              <p className="text-gray-600">Alla plockuppdrag för detta lager</p>
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
          >
            <option value="all">Alla status</option>
            <option value="pending">Väntar</option>
            <option value="in_progress">Pågår</option>
            <option value="picked">Plockad</option>
            <option value="completed">Klar</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-2 text-red-700">
            <AlertIcon size={18} /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-primary-900 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center text-gray-500">
            <BoxIcon size={56} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Inga plockordrar att visa</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groups).map(([campaignId, items]) => (
              <motion.div
                key={campaignId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-semibold text-gray-700 text-sm">
                    {campaignId === 'Övrigt' ? 'Övriga plockordrar' : `Kampanj ${campaignId.slice(0, 8)}`}
                  </span>
                  <button
                    onClick={() => router.push(`/warehouses/${warehouseId}/picklist/${campaignId}`)}
                    className="text-xs font-semibold text-primary-900 hover:underline"
                  >
                    Öppna plockterminal →
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-gray-400">
                      <th className="px-6 py-2">SKU</th>
                      <th className="px-6 py-2">Antal</th>
                      <th className="px-6 py-2">Status</th>
                      <th className="px-6 py-2">Skapad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((t) => {
                      const s = STATUS_LABELS[t.status] || { label: t.status, cls: 'bg-gray-100 text-gray-600' };
                      return (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 font-medium text-gray-900">{t.sku}</td>
                          <td className="px-6 py-3 text-gray-700">{t.quantity_to_pick} st</td>
                          <td className="px-6 py-3">
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                          </td>
                          <td className="px-6 py-3 text-gray-500">{new Date(t.created_at).toLocaleDateString('sv-SE')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
