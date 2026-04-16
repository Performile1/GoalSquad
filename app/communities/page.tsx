'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Community {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  city?: string;
  country?: string;
  totalMembers: number;
  communityType?: string;
  brandColors?: any;
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const res = await fetch('/api/communities/featured');
      const data = await res.json();
      setCommunities(data.communities || []);
    } catch (err) {
      console.error('Failed to fetch communities:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-900 to-primary-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">👥 Communities</h1>
          <p className="text-xl text-primary-100 mb-8">
            Föreningar och grupper som säljer via GoalSquad
          </p>
          <div className="max-w-lg mx-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök community eller stad..."
              className="w-full px-5 py-4 rounded-xl text-gray-900 text-lg focus:outline-none shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 animate-pulse">👥</div>
            <p className="text-gray-500 text-xl">Laddar communities...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-2xl font-bold text-gray-900 mb-2">Inga communities hittades</p>
            <p className="text-gray-500">Försök med ett annat sökord</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((community, index) => (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Link
                  href={`/communities/${community.id}/dashboard`}
                  className="block bg-white rounded-2xl shadow-sm hover:shadow-lg transition overflow-hidden group"
                >
                  {/* Logo / banner area */}
                  <div className="h-32 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                    {community.logoUrl ? (
                      <img
                        src={community.logoUrl}
                        alt={community.name}
                        className="h-20 w-20 object-contain rounded-xl"
                      />
                    ) : (
                      <span className="text-5xl">⚽</span>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-primary-900 transition truncate">
                      {community.name}
                    </h3>
                    {community.city && (
                      <p className="text-sm text-gray-500 mb-3">
                        📍 {community.city}{community.country ? `, ${community.country}` : ''}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        👥 {community.totalMembers} medlemmar
                      </span>
                      {community.communityType && (
                        <span className="text-xs bg-primary-50 text-primary-900 px-2 py-1 rounded-full font-medium capitalize">
                          {community.communityType}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
