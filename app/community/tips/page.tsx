'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SearchIcon, FilterIcon, HeartIcon, CommentIcon, ShareIcon, DashboardIcon } from '@/app/components/BrandIcons';

interface SalesTip {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  category: string;
  tags: string[];
  likes: number;
  comments: number;
  createdAt: string;
  isLiked: boolean;
}

export default function CommunityTipsPage() {
  const [tips, setTips] = useState<SalesTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    try {
      const response = await fetch('/api/community/tips');
      const data = await response.json();
      setTips(data.tips || []);
    } catch (error) {
      console.error('Failed to fetch tips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (tipId: string) => {
    try {
      await fetch(`/api/community/tips/${tipId}/like`, { method: 'POST' });
      setTips(tips.map(tip => 
        tip.id === tipId 
          ? { ...tip, isLiked: !tip.isLiked, likes: tip.isLiked ? tip.likes - 1 : tip.likes + 1 }
          : tip
      ));
    } catch (error) {
      console.error('Failed to like tip:', error);
    }
  };

  const filteredTips = tips
    .filter(tip => {
      const matchesSearch = tip.title.toLowerCase().includes(search.toLowerCase()) ||
        tip.content.toLowerCase().includes(search.toLowerCase()) ||
        tip.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || tip.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'popular') {
        return b.likes - a.likes;
      } else if (sortBy === 'comments') {
        return b.comments - a.comments;
      }
      return 0;
    });

  const categories = [...new Set(tips.map(t => t.category))];

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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Säljtips</h1>
          <p className="text-gray-600">Dela och lär dig av andra säljare i communityt</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Sök efter tips, taggar eller kategori..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
            >
              <option value="all">Alla kategorier</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
            >
              <option value="recent">Senaste</option>
              <option value="popular">Mest populära</option>
              <option value="comments">Flest kommentarer</option>
            </select>
            <button className="bg-primary-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition">
              + Dela tips
            </button>
          </div>
        </motion.div>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {filteredTips.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="lg:col-span-3 bg-white rounded-2xl shadow-lg p-12 text-center"
            >
              <DashboardIcon size={64} className="text-gray-300 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900 mb-2">Inga tips hittades</p>
              <p className="text-gray-600">Var den första att dela dina säljtips med communityt!</p>
            </motion.div>
          ) : (
            filteredTips.map((tip, index) => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-900 font-bold">
                        {tip.author.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{tip.author.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(tip.createdAt).toLocaleDateString('sv-SE')}
                      </p>
                    </div>
                  </div>
                  <span className="bg-primary-100 text-primary-900 px-3 py-1 rounded-full text-xs font-semibold">
                    {tip.category}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{tip.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{tip.content}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {tip.tags.map((tag, i) => (
                    <span key={i} className="bg-gray-100 px-2 py-1 rounded-lg text-xs text-gray-600">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(tip.id)}
                      className={`flex items-center gap-2 transition ${
                        tip.isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                      }`}
                    >
                      <HeartIcon size={20} className={tip.isLiked ? 'fill-current' : ''} />
                      <span>{tip.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition">
                      <CommentIcon size={20} />
                      <span>{tip.comments}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition">
                      <ShareIcon size={20} />
                    </button>
                  </div>
                  <button className="text-primary-900 font-semibold hover:text-primary-600 transition">
                    Läs mer
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
