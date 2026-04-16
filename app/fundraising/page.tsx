'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrophyIcon, CommunityIcon, UserIcon, SearchIcon, JerseyIcon, HandmadeIcon, EquipmentIcon, FoodIcon, DashboardIcon } from '@/app/components/BrandIcons';

interface Fundraiser {
  id: string;
  name: string;
  type: 'community' | 'class' | 'club';
  goal: number;
  current: number;
  deadline: string;
  image: string;
  location: string;
  description: string;
}

export default function FundraisingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'community' | 'class' | 'club'>('all');
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);

  useEffect(() => {
    // Mock data - replace with API call
    const mockFundraisers: Fundraiser[] = [
      {
        id: '1',
        name: 'IFK Göteborg Fotboll',
        type: 'community',
        goal: 50000,
        current: 32500,
        deadline: '2025-06-30',
        image: '/images/placeholder-team.jpg',
        location: 'Göteborg',
        description: 'Insamling för ny utrustning och resor till säsongen 2025/2026'
      },
      {
        id: '2',
        name: 'Klass 9B Lundaskolan',
        type: 'class',
        goal: 15000,
        current: 8750,
        deadline: '2025-05-15',
        image: '/images/placeholder-class.jpg',
        location: 'Lund',
        description: 'Avslutningsfest och åretsklassresor'
      },
      {
        id: '3',
        name: 'Stockholm Hockey Club',
        type: 'club',
        goal: 75000,
        current: 42000,
        deadline: '2025-08-01',
        image: '/images/placeholder-hockey.jpg',
        location: 'Stockholm',
        description: 'Ny ishall och utrustning för juniorlaget'
      }
    ];
    setFundraisers(mockFundraisers);
  }, []);

  const filteredFundraisers = fundraisers.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || f.type === filter;
    return matchesSearch && matchesFilter;
  });

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-600';
    if (percentage >= 75) return 'bg-primary-600';
    if (percentage >= 50) return 'bg-primary-700';
    return 'bg-primary-900';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'community': return TrophyIcon;
      case 'class': return CommunityIcon;
      case 'club': return UserIcon;
      default: return DashboardIcon;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'community': return 'Förening';
      case 'class': return 'Klass';
      case 'club': return 'Klubb';
      default: return 'Annat';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-extrabold mb-4">Insamlingskampanjer</h1>
          <p className="text-white/80 text-lg">
            Stötta klasser, föreningar och klubbar i deras fundraising-mål
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Sök på namn eller ort..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-3 rounded-xl font-semibold transition ${
                  filter === 'all'
                    ? 'bg-primary-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Alla
              </button>
              <button
                onClick={() => setFilter('community')}
                className={`px-6 py-3 rounded-xl font-semibold transition ${
                  filter === 'community'
                    ? 'bg-primary-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Föreningar
              </button>
              <button
                onClick={() => setFilter('class')}
                className={`px-6 py-3 rounded-xl font-semibold transition ${
                  filter === 'class'
                    ? 'bg-primary-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Klasser
              </button>
              <button
                onClick={() => setFilter('club')}
                className={`px-6 py-3 rounded-xl font-semibold transition ${
                  filter === 'club'
                    ? 'bg-primary-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Klubbar
              </button>
            </div>
          </div>
        </div>

        {/* Fundraisers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFundraisers.map((fundraiser, index) => {
            const percentage = Math.min(100, (fundraiser.current / fundraiser.goal) * 100);
            const remaining = fundraiser.goal - fundraiser.current;
            const TypeIcon = getTypeIcon(fundraiser.type);

            return (
              <motion.div
                key={fundraiser.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:border-primary-300 transition"
              >
                {/* Image */}
                <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TypeIcon size={64} className="text-primary-300" />
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-semibold text-primary-900">
                      {getTypeLabel(fundraiser.type)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-primary-900 mb-2">{fundraiser.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{fundraiser.description}</p>
                  <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                    <DashboardIcon size={16} />
                    {fundraiser.location}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-primary-900">
                        {fundraiser.current.toLocaleString()} kr
                      </span>
                      <span className="text-gray-600">
                        {fundraiser.goal.toLocaleString()} kr
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={`h-full ${getProgressColor(percentage)}`}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {percentage.toFixed(0)}% uppnått • {remaining.toLocaleString()} kr kvar
                    </p>
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">
                      Slutdatum: {new Date(fundraiser.deadline).toLocaleDateString('sv-SE')}
                    </span>
                    <Link
                      href={`/fundraising/${fundraiser.id}`}
                      className="px-4 py-2 bg-primary-900 text-white rounded-lg font-semibold text-sm hover:bg-primary-700 transition"
                    >
                      Se mer
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredFundraisers.length === 0 && (
          <div className="text-center py-16">
            <SearchIcon size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Inga insamlingar matchade din sökning</p>
          </div>
        )}
      </div>
    </div>
  );
}
