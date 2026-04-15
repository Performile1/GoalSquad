'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Community {
  id: string;
  name: string;
  logoUrl: string;
  city: string;
  country: string;
  totalMembers: number;
  totalSales: number;
}

export default function CommunityBanner() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedCommunities();
  }, []);

  const fetchFeaturedCommunities = async () => {
    try {
      const response = await fetch('/api/communities/featured');
      const data = await response.json();
      setCommunities(data.communities || []);
    } catch (error) {
      console.error('Failed to fetch featured communities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 py-8">
        <div className="container mx-auto px-4">
          <p className="text-white text-center">Laddar föreningar...</p>
        </div>
      </div>
    );
  }

  if (communities.length === 0) {
    return null;
  }

  // Duplicate communities for seamless loop
  const duplicatedCommunities = [...communities, ...communities];

  return (
    <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 py-12 overflow-hidden">
      <div className="container mx-auto px-4 mb-6">
        <h2 className="text-3xl font-bold text-white text-center mb-2">
          Stöd Lokala Föreningar 🏆
        </h2>
        <p className="text-blue-100 text-center">
          Över {communities.length} skolor och klubbar använder GoalSquad
        </p>
      </div>

      {/* Scrolling Logo Banner */}
      <div className="relative">
        <div className="flex overflow-hidden">
          <motion.div
            className="flex gap-8 px-4"
            animate={{
              x: [0, -50 * communities.length + '%'],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: 'loop',
                duration: communities.length * 3, // 3 seconds per logo
                ease: 'linear',
              },
            }}
          >
            {duplicatedCommunities.map((community, index) => (
              <div
                key={`${community.id}-${index}`}
                className="flex-shrink-0 w-48 bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => window.location.href = `/communities/${community.id}`}
              >
                {/* Logo */}
                <div className="h-24 flex items-center justify-center mb-4">
                  {community.logoUrl ? (
                    <img
                      src={community.logoUrl}
                      alt={community.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-3xl font-bold">
                      {community.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="text-center">
                  <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">
                    {community.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {community.city}, {community.country}
                  </p>
                  <div className="flex justify-center gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-blue-600">
                        {community.totalMembers}
                      </span>
                      <span className="text-gray-500 ml-1">medlemmar</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Gradient Overlays */}
        <div className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-blue-600 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-blue-600 to-transparent pointer-events-none" />
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="text-center text-white">
            <div className="text-4xl font-bold mb-2">
              {communities.reduce((sum, c) => sum + c.totalMembers, 0).toLocaleString()}
            </div>
            <div className="text-blue-100">Aktiva Säljare</div>
          </div>
          <div className="text-center text-white">
            <div className="text-4xl font-bold mb-2">
              {communities.length}+
            </div>
            <div className="text-blue-100">Föreningar</div>
          </div>
          <div className="text-center text-white">
            <div className="text-4xl font-bold mb-2">
              {(communities.reduce((sum, c) => sum + c.totalSales, 0) / 1000).toFixed(0)}k kr
            </div>
            <div className="text-blue-100">Insamlat Totalt</div>
          </div>
        </div>
      </div>
    </div>
  );
}
