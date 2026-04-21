'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { DashboardIcon, CheckIcon, XIcon, EyeIcon, AlertIcon, MoneyIcon, CalendarIcon, ClickIcon, ViewIcon } from '@/app/components/BrandIcons';

interface Ad {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  advertiser_id: string;
  advertiser_name?: string;
  advertiser_email?: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled';
  purchase_type: 'days' | 'views' | 'clicks';
  purchased_quantity: number;
  price_paid: number;
  placement_name: string;
  placement_page: string;
  placement_position: string;
  start_date: string;
  end_date?: string;
  max_views?: number;
  max_clicks?: number;
  created_at: string;
  rejection_reason?: string;
  total_views?: number;
  total_clicks?: number;
  company_name?: string;
  company_description?: string;
  company_website?: string;
  backlink_url?: string;
  backlink_verified?: boolean;
  content_flagged?: boolean;
  flag_reason?: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
  payment_type?: 'daily' | 'advance';
  payment_status?: 'pending' | 'paid' | 'refunded';
}

interface AdStats {
  total: number;
  pending: number;
  approved: number;
  active: number;
  rejected: number;
  completed: number;
}

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [stats, setStats] = useState<AdStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'active' | 'completed'>('all');
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchAds();
  }, [filter]);

  const fetchAds = async () => {
    try {
      const response = await fetch(`/api/admin/ads?filter=${filter}`);
      const data = await response.json();
      setAds(data.ads || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (adId: string) => {
    try {
      const response = await fetch(`/api/admin/ads/${adId}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchAds();
        setSelectedAd(null);
      }
    } catch (error) {
      console.error('Failed to approve ad:', error);
    }
  };

  const handleReject = async (adId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/ads/${adId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (response.ok) {
        fetchAds();
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedAd(null);
      }
    } catch (error) {
      console.error('Failed to reject ad:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Väntar',
      approved: 'Godkänd',
      active: 'Aktiv',
      completed: 'Slutförd',
      rejected: 'Avvisad',
      cancelled: 'Avbruten',
    };
    return labels[status] || status;
  };

  const getPurchaseTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      days: 'Dagar',
      views: 'Visningar',
      clicks: 'Klick',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary-900 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-primary-900 font-semibold">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/admin/dashboard" className="text-primary-900 hover:text-primary-600 font-semibold mb-2 inline-block">
            ← Tillbaka till Admin Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Annonsadministration</h1>
          <p className="text-gray-600">Godkänn eller avvisa annonsförfrågningar</p>
        </motion.div>

        {/* Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
          >
            {[
              { label: 'Totalt', value: stats.total, icon: DashboardIcon, color: 'gray' },
              { label: 'Väntande', value: stats.pending, icon: AlertIcon, color: 'yellow' },
              { label: 'Godkända', value: stats.approved, icon: CheckIcon, color: 'blue' },
              { label: 'Aktiva', value: stats.active, icon: EyeIcon, color: 'green' },
              { label: 'Slutförda', value: stats.completed, icon: CheckIcon, color: 'gray' },
              { label: 'Avvisade', value: stats.rejected, icon: XIcon, color: 'red' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-xl shadow-md p-4 border-2 ${
                  stat.color === 'yellow' ? 'border-yellow-200' :
                  stat.color === 'blue' ? 'border-blue-200' :
                  stat.color === 'green' ? 'border-green-200' :
                  stat.color === 'red' ? 'border-red-200' :
                  'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-600">{stat.label}</h3>
                  <stat.icon size={20} className="text-gray-700" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-md p-4 mb-6"
        >
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Alla' },
              { value: 'pending', label: 'Väntande' },
              { value: 'approved', label: 'Godkända' },
              { value: 'active', label: 'Aktiva' },
              { value: 'completed', label: 'Slutförda' },
              { value: 'rejected', label: 'Avvisade' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as any)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filter === f.value
                    ? 'bg-primary-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Ads List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          {ads.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Inga annonser hittades
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {ads.map((ad, index) => (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition"
                >
                  <div className="flex gap-6">
                    {/* Ad Image */}
                    <div className="w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                      <img
                        src={ad.image_url}
                        alt={ad.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Ad Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{ad.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{ad.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(ad.status)}`}>
                          {getStatusLabel(ad.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Annonsör</p>
                          <p className="text-sm font-semibold text-gray-900">{ad.advertiser_name || 'Okänd'}</p>
                          <p className="text-xs text-gray-600">{ad.advertiser_email || ''}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Företag</p>
                          <p className="text-sm font-semibold text-gray-900">{ad.company_name || 'Ej angivet'}</p>
                          {ad.company_website && (
                            <a
                              href={ad.company_website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-900 hover:underline"
                            >
                              Webbplats
                            </a>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Placering</p>
                          <p className="text-sm font-semibold text-gray-900">{ad.placement_name}</p>
                          <p className="text-xs text-gray-600">{ad.placement_page} - {ad.placement_position}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Köp</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {ad.purchased_quantity} {getPurchaseTypeLabel(ad.purchase_type)}
                          </p>
                          <p className="text-xs text-gray-600">{ad.price_paid} kr ({ad.payment_type || 'daily'})</p>
                        </div>
                      </div>

                      {/* Company Description */}
                      {ad.company_description && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Företagsbeskrivning</p>
                          <p className="text-sm text-gray-700">{ad.company_description}</p>
                        </div>
                      )}

                      {/* Backlink Info */}
                      {ad.backlink_url && (
                        <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs text-green-700 font-semibold">Backlink</p>
                            {ad.backlink_verified ? (
                              <CheckIcon size={16} className="text-green-600" />
                            ) : (
                              <AlertIcon size={16} className="text-yellow-600" />
                            )}
                          </div>
                          <a
                            href={ad.backlink_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-700 hover:underline break-all"
                          >
                            {ad.backlink_url}
                          </a>
                        </div>
                      )}

                      {/* Flagged Content Warning */}
                      {ad.content_flagged && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertIcon size={16} className="text-red-600" />
                            <p className="text-xs text-red-700 font-semibold">Flaggat innehåll</p>
                          </div>
                          <p className="text-sm text-red-700">{ad.flag_reason || 'Prohibited content detected'}</p>
                        </div>
                      )}

                      {/* Stats for active/completed ads */}
                      {(ad.status === 'active' || ad.status === 'completed') && (
                        <div className="flex gap-4 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <ViewIcon size={16} className="text-gray-600" />
                            <span className="text-gray-700">{ad.total_views || 0} visningar</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <ClickIcon size={16} className="text-gray-600" />
                            <span className="text-gray-700">{ad.total_clicks || 0} klick</span>
                          </div>
                          {ad.max_views && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-500">Max: {ad.max_views}</span>
                            </div>
                          )}
                          {ad.max_clicks && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-500">Max: {ad.max_clicks}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Rejection reason */}
                      {ad.status === 'rejected' && ad.rejection_reason && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700">
                            <strong>Orsak till avvisande:</strong> {ad.rejection_reason}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedAd(ad)}
                          className="px-4 py-2 bg-primary-900 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
                        >
                          Visa detaljer
                        </button>
                        {ad.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(ad.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                            >
                              <CheckIcon size={16} className="inline mr-1" />
                              Godkänn
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAd(ad);
                                setShowRejectModal(true);
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                            >
                              <XIcon size={16} className="inline mr-1" />
                              Avvisa
                            </button>
                          </>
                        )}
                        <a
                          href={ad.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                        >
                          Öppna länk
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Ad Detail Modal */}
        {selectedAd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Annonsdetaljer</h2>
                  <button
                    onClick={() => setSelectedAd(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <XIcon size={24} className="text-gray-600" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <img
                      src={selectedAd.image_url}
                      alt={selectedAd.title}
                      className="w-full rounded-lg shadow-md"
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Titel</h3>
                      <p className="text-gray-700">{selectedAd.title}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Beskrivning</h3>
                      <p className="text-gray-700">{selectedAd.description}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Länk</h3>
                      <a
                        href={selectedAd.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-900 hover:underline break-all"
                      >
                        {selectedAd.link_url}
                      </a>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Annonsör</h3>
                      <p className="text-gray-700">{selectedAd.advertiser_name || 'Okänd'}</p>
                      <p className="text-sm text-gray-600">{selectedAd.advertiser_email || ''}</p>
                    </div>
                    {selectedAd.company_name && (
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">Företag</h3>
                        <p className="text-gray-700">{selectedAd.company_name}</p>
                        {selectedAd.company_website && (
                          <a href={selectedAd.company_website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-900 hover:underline">
                            {selectedAd.company_website}
                          </a>
                        )}
                      </div>
                    )}
                    {selectedAd.company_description && (
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">Företagsbeskrivning</h3>
                        <p className="text-sm text-gray-700">{selectedAd.company_description}</p>
                      </div>
                    )}
                    {selectedAd.backlink_url && (
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">Backlink</h3>
                        <div className="flex items-center gap-2">
                          {selectedAd.backlink_verified ? <CheckIcon size={16} className="text-green-600" /> : <AlertIcon size={16} className="text-yellow-600" />}
                          <a href={selectedAd.backlink_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-900 hover:underline break-all">
                            {selectedAd.backlink_url}
                          </a>
                        </div>
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Status</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedAd.status)}`}>
                        {getStatusLabel(selectedAd.status)}
                      </span>
                      {selectedAd.approval_status && (
                        <span className="ml-2 text-xs text-gray-600">({selectedAd.approval_status})</span>
                      )}
                    </div>
                    {selectedAd.content_flagged && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h3 className="font-bold text-red-900 mb-1">Flaggat innehåll</h3>
                        <p className="text-sm text-red-700">{selectedAd.flag_reason || 'Prohibited content detected'}</p>
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Betalning</h3>
                      <p className="text-gray-700">{selectedAd.payment_type || 'daily'} - {selectedAd.payment_status || 'pending'}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Placering</h3>
                      <p className="text-gray-700">{selectedAd.placement_name}</p>
                      <p className="text-sm text-gray-600">{selectedAd.placement_page} - {selectedAd.placement_position}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Köp</h3>
                      <p className="text-gray-700">
                        {selectedAd.purchased_quantity} {getPurchaseTypeLabel(selectedAd.purchase_type)}
                      </p>
                      <p className="text-sm text-gray-600">{selectedAd.price_paid} kr</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Period</h3>
                      <p className="text-gray-700">
                        {new Date(selectedAd.start_date).toLocaleDateString('sv-SE')}
                        {selectedAd.end_date && ` - ${new Date(selectedAd.end_date).toLocaleDateString('sv-SE')}`}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Skapad</h3>
                      <p className="text-gray-700">
                        {new Date(selectedAd.created_at).toLocaleString('sv-SE')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedAd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Avvisa annons</h2>
                <p className="text-gray-600 mb-4">
                  Varför vill du avvisa annonsen "{selectedAd.title}"?
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ange orsak till avvisande..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none resize-none"
                  rows={4}
                />
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason('');
                    }}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={() => handleReject(selectedAd.id, rejectionReason)}
                    disabled={!rejectionReason.trim()}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Avvisa annons
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
