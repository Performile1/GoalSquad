'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';

interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  salesGoal: number;
  unitsGoal: number;
  totalSales: number;
  totalUnitsSold: number;
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-blue-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Campaign Management
            </h1>
            <p className="text-gray-600">Create and manage sales campaigns for your community</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition"
          >
            + New Campaign
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
            const unitsProgress = campaign.unitsGoal > 0 
              ? (campaign.totalUnitsSold / campaign.unitsGoal) * 100 
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
                    <p className="text-gray-600 mt-1">{campaign.description}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>📅 {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</span>
                      <span>💰 Community: {campaign.communityCommissionPercent}%</span>
                      <span>👤 Seller: {campaign.sellerCommissionPercent}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-4 py-2 rounded-xl font-semibold ${
                      campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                      campaign.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                      campaign.status === 'completed' ? 'bg-blue-100 text-blue-700' :
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
                  {/* Sales Goal */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Sales Goal</span>
                      <span className="font-semibold">
                        {campaign.totalSales.toLocaleString()} / {campaign.salesGoal.toLocaleString()} NOK
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

                  {/* Units Goal */}
                  {campaign.unitsGoal > 0 && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Units Goal</span>
                        <span className="font-semibold">
                          {campaign.totalUnitsSold} / {campaign.unitsGoal} units
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${Math.min(unitsProgress, 100)}%` }}
                        >
                          {unitsProgress >= 10 && (
                            <span className="text-xs font-bold text-white">
                              {Math.round(unitsProgress)}%
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
                No campaigns yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first campaign to start selling!
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition"
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
    description: '',
    startDate: '',
    endDate: '',
    salesGoal: '',
    unitsGoal: '',
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
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Create New Campaign</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              placeholder="Spring Fundraiser 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="Describe your campaign..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sales Goal (NOK)
              </label>
              <input
                type="number"
                value={formData.salesGoal}
                onChange={(e) => setFormData({ ...formData, salesGoal: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                placeholder="10000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Units Goal
              </label>
              <input
                type="number"
                value={formData.unitsGoal}
                onChange={(e) => setFormData({ ...formData, unitsGoal: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                placeholder="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Community Commission (%)
              </label>
              <input
                type="number"
                value={formData.communityCommissionPercent}
                onChange={(e) => setFormData({ ...formData, communityCommissionPercent: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                placeholder="20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Seller Commission (%)
              </label>
              <input
                type="number"
                value={formData.sellerCommissionPercent}
                onChange={(e) => setFormData({ ...formData, sellerCommissionPercent: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
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
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
            >
              Create Campaign
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
