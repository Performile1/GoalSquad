'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { EditIcon, TrashIcon, PlusIcon, SearchIcon, TrophyIcon, EyeIcon } from '@/app/components/BrandIcons';

interface Campaign {
  id: string;
  title: string;
  slug: string;
  description?: string;
  campaign_type: 'campaign' | 'blog' | 'landing_page' | 'promotion';
  status: 'draft' | 'published' | 'archived' | 'deleted';
  featured_image_url?: string;
  published_at?: string;
  view_count: number;
  click_count: number;
  created_at: string;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/admin/campaigns');
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!campaignToDelete) return;
    
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setCampaigns(campaigns.filter(c => c.id !== campaignToDelete.id));
        setShowDeleteModal(false);
        setCampaignToDelete(null);
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesType = typeFilter === 'all' || campaign.campaign_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    published: 'bg-green-100 text-green-700',
    archived: 'bg-yellow-100 text-yellow-700',
    deleted: 'bg-red-100 text-red-700',
  };

  const typeLabels = {
    campaign: 'Kampanj',
    blog: 'Blogginlägg',
    landing_page: 'Landningssida',
    promotion: 'Kampanjerbjudande',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Kampanjer & Innehåll</h1>
              <p className="text-primary-100">Hantera kampanjsidor, blogginlägg och landningssidor</p>
            </div>
            <Link
              href="/admin/campaigns/new"
              className="inline-flex items-center gap-2 bg-white text-primary-900 px-6 py-3 rounded-xl font-bold hover:bg-primary-50 transition"
            >
              <PlusIcon size={20} />
              Ny kampanj
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <SearchIcon size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Sök kampanjer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
            >
              <option value="all">Alla status</option>
              <option value="draft">Utkast</option>
              <option value="published">Publicerade</option>
              <option value="archived">Arkiverade</option>
              <option value="deleted">Raderade</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
            >
              <option value="all">Alla typer</option>
              <option value="campaign">Kampanj</option>
              <option value="blog">Blogginlägg</option>
              <option value="landing_page">Landningssida</option>
              <option value="promotion">Kampanjerbjudande</option>
            </select>
          </div>
        </div>

        {/* Campaigns List */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-bounce text-primary-900 mx-auto mb-4">
              <TrophyIcon size={64} />
            </div>
            <p className="text-xl text-primary-900 font-semibold">Laddar kampanjer...</p>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <TrophyIcon size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-bold text-gray-900 mb-2">
              {campaigns.length === 0 ? 'Inga kampanjer än' : 'Inga matchande kampanjer'}
            </p>
            <p className="text-gray-500 mb-8">
              {campaigns.length === 0
                ? 'Skapa din första kampanj för att komma igång!'
                : 'Prova ett annat sökord eller filter'}
            </p>
            {campaigns.length === 0 && (
              <Link
                href="/admin/campaigns/new"
                className="inline-block px-6 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-700 transition"
              >
                Skapa kampanj →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCampaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden"
              >
                <div className="flex items-center gap-6 p-6">
                  {/* Featured Image */}
                  {campaign.featured_image_url ? (
                    <img
                      src={campaign.featured_image_url}
                      alt={campaign.title}
                      className="w-32 h-32 object-cover rounded-xl flex-shrink-0"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <TrophyIcon size={48} className="text-primary-300" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[campaign.status]}`}>
                        {campaign.status === 'published' ? 'Publicerad' : campaign.status === 'draft' ? 'Utkast' : campaign.status === 'archived' ? 'Arkiverad' : 'Raderad'}
                      </span>
                      <span className="bg-primary-50 text-primary-900 px-3 py-1 rounded-full text-xs font-semibold">
                        {typeLabels[campaign.campaign_type]}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">{campaign.title}</h3>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-1">{campaign.description || 'Ingen beskrivning'}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <EyeIcon size={16} />
                        {campaign.view_count} visningar
                      </span>
                      <span className="flex items-center gap-1">
                        <TrophyIcon size={16} />
                        {campaign.click_count} klick
                      </span>
                      {campaign.published_at && (
                        <span>Publicerad: {new Date(campaign.published_at).toLocaleDateString('sv-SE')}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {campaign.status === 'published' && (
                      <a
                        href={`/c/${campaign.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-primary-900 transition"
                        title="Visa sida"
                      >
                        <EyeIcon size={20} />
                      </a>
                    )}
                    <Link
                      href={`/admin/campaigns/${campaign.id}`}
                      className="p-2 text-gray-400 hover:text-primary-900 transition"
                      title="Redigera"
                    >
                      <EditIcon size={20} />
                    </Link>
                    <button
                      onClick={() => {
                        setCampaignToDelete(campaign);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 transition"
                      title="Radera"
                    >
                      <TrashIcon size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && campaignToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Radera kampanj?</h2>
            <p className="text-gray-600 mb-6">
              Är du säker på att du vill radera "{campaignToDelete.title}"? Åtgärden kan inte ångras.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCampaignToDelete(null);
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                Avbryt
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
              >
                Radera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
