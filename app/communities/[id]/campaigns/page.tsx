'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';

interface Campaign {
  id: string;
  name: string;
  Beskrivning: string;
  startDate: string;
  endDate: string;
  salesGoal: number;
  enheterGoal: number;
  totalSales: number;
  totalenheterSold: number;
  status: string;
  communityCommissionPercent: number;
  sellerCommissionPercent: number;
}

export default function CampaignManagement() {
  const params = useParams();
  const communityId = params.id as string;
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, [communityId]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/campaigns`);
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (formData: any) => {
    try {
      const response = await fetch(`/api/communities/${communityId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setShowCreateForm(false);
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const updateCampaignStatus = async (campaignId: string, status: string) => {
    try {
      await fetch(`/api/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Failed to update campaign status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br bg-gray-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-primary-900">Laddar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Kampanjhantering
            </h1>
            <p className="text-gray-600">Skapa och hantera f\u00f6rs\u00e4ljningskampanjer f\u00f6r din f\u00f6rening</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-primary-900 to-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition"
          >
            + Ny kampanj
          </button>
        </div>

        {/* Create Campaign Modal */}
        {showCreateForm && (
          <CreateCampaignForm
            onSubmit={createCampaign}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 gap-6">
          {campaigns.map((campaign, index) => {
            const salesProgress = campaign.salesGoal > 0 
              ? (campaign.totalSales / campaign.salesGoal) * 100 
              : 0;
            const enheterProgress = campaign.enheterGoal > 0 
              ? (campaign.totalenheterSold / campaign.enheterGoal) * 100 
              : 0;

            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                {/* Campaign Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{campaign.name}</h3>
                    <p className="text-gray-600 mt-1">{campaign.Beskrivning}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>📅 {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</span>
                      <span>💰 F\u00f6rening: {campaign.communityCommissionPercent}%</span>
                      <span>👤 S\u00e4ljare: {campaign.sellerCommissionPercent}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-4 py-2 rounded-xl font-semibold ${
                      campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                      campaign.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                      campaign.status === 'completed' ? 'bg-primary-100 text-primary-900' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {campaign.status}
                    </span>
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => updateCampaignStatus(campaign.id, 'active')}
                        className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-700 transition"
                      >
                        Start
                      </button>
                    )}
                    {campaign.status === 'active' && (
                      <button
                        onClick={() => updateCampaignStatus(campaign.id, 'paused')}
                        className="bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-orange-700 transition"
                      >
                        Pause
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="space-y-4">
                  {/* F\u00f6rs\u00e4ljningsm\u00e5l */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">F\u00f6rs\u00e4ljningsm\u00e5l</span>
                      <span className="font-semibold">
                        {campaign.totalSales.toLocaleString()} / {campaign.salesGoal.toLocaleString()} kr
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${Math.min(salesProgress, 100)}%` }}
                      >
                        {salesProgress >= 10 && (
                          <span className="text-xs font-bold text-white">
                            {Math.round(salesProgress)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Enhetsm\u00e5l */}
                  {campaign.enheterGoal > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Enhetsm\u00e5l</span>
                        <span className="font-semibold">
                          {campaign.totalenheterSold} / {campaign.enheterGoal} enheter
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-gradient-to-r from-primary-700 to-primary-500 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${Math.min(enheterProgress, 100)}%` }}
                        >
                          {enheterProgress >= 10 && (
                            <span className="text-xs font-bold text-white">
                              {Math.round(enheterProgress)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {campaigns.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Inga kampanjer \u00e4n
              </h3>
              <p className="text-gray-600 mb-6">
                Skapa din f\u00f6rsta kampanj f\u00f6r att b\u00f6rja s\u00e4lja!
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-primary-900 to-primary-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition"
              >
                Create Campaign
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateCampaignForm({ onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: '',
    Beskrivning: '',
    startDate: '',
    endDate: '',
    salesGoal: '',
    enheterGoal: '',
    communityCommissionPercent: '20',
    sellerCommissionPercent: '10',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Skapa ny kampanj</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kampanjnamn \*
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary-600 focus:outline-none"
              placeholder="Spring Fundraiser 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Beskrivning
            </label>
            <textarea
              value={formData.Beskrivning}
              onChange={(e) => setFormData({ ...formData, Beskrivning: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary-600 focus:outline-none"
              rows={3}
              placeholder="Describe your campaign..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Startdatum \*
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Slutdatum \*
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                F\u00f6rs\u00e4ljningsm\u00e5l \(kr\)
              </label>
              <input
                type="number"
                value={formData.salesGoal}
                onChange={(e) => setFormData({ ...formData, salesGoal: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary-600 focus:outline-none"
                placeholder="10000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Enhetsm\u00e5l
              </label>
              <input
                type="number"
                value={formData.enheterGoal}
                onChange={(e) => setFormData({ ...formData, enheterGoal: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary-600 focus:outline-none"
                placeholder="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                F\u00f6reningens provision \(%\)
              </label>
              <input
                type="number"
                value={formData.communityCommissionPercent}
                onChange={(e) => setFormData({ ...formData, communityCommissionPercent: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary-600 focus:outline-none"
                placeholder="20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                S\u00e4ljarens provision \(%\)
              </label>
              <input
                type="number"
                value={formData.sellerCommissionPercent}
                onChange={(e) => setFormData({ ...formData, sellerCommissionPercent: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary-600 focus:outline-none"
                placeholder="10"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-primary-900 to-primary-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
            >
              Create Campaign
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
