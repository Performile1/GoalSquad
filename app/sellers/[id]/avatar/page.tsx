'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';

interface AvatarItem {
  itemId: string;
  name: string;
  description: string;
  itemType: string;
  rarity: string;
  imageUrl: string;
  isLocked: boolean;
  unlockRequirement?: string;
}

interface AvatarData {
  base: string;
  gear: string[];
  background: string;
  unlockedItems: string[];
}

export default function AvatarCustomizer() {
  const params = useParams();
  const sellerId = params.id as string;
  
  const [avatarData, setAvatarData] = useState<AvatarData | null>(null);
  const [availableItems, setAvailableItems] = useState<AvatarItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('hat');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvatarData();
  }, [sellerId]);

  const fetchAvatarData = async () => {
    try {
      const response = await apiFetch(`/api/sellers/${sellerId}/avatar`);
      const data = await response.json();
      setAvatarData(data.avatarData);
      setAvailableItems(data.availableItems);
    } catch (error) {
      console.error('Failed to fetch avatar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const equipItem = async (itemId: string, itemType: string) => {
    if (!avatarData) return;

    const newAvatarData = { ...avatarData };
    
    if (itemType === 'background') {
      newAvatarData.background = itemId;
    } else {
      // Remove existing item of same type
      newAvatarData.gear = newAvatarData.gear.filter(
        (id) => !availableItems.find((item) => item.itemId === id && item.itemType === itemType)
      );
      // Add new item
      newAvatarData.gear.push(itemId);
    }

    try {
      await apiFetch(`/api/sellers/${sellerId}/avatar`, {
        method: 'PUT',
                body: JSON.stringify({ avatarData: newAvatarData }),
      });
      setAvatarData(newAvatarData);
    } catch (error) {
      console.error('Failed to update avatar:', error);
    }
  };

  const categories = [
    { id: 'hat', name: 'Hats', emoji: '' },
    { id: 'shirt', name: 'Shirts', emoji: '' },
    { id: 'pants', name: 'Pants', emoji: '' },
    { id: 'shoes', name: 'Shoes', emoji: '' },
    { id: 'accessory', name: 'Accessories', emoji: '' },
    { id: 'background', name: 'Backgrounds', emoji: '' },
  ];

  const filteredItems = availableItems.filter((item) => item.itemType === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-primary-900">Loading...</div>
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
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Customize Your Avatar
          </h1>
          <p className="text-xl text-gray-600">
            Express yourself! Unlock items by leveling up and completing achievements.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar Preview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Preview</h3>
              <div 
                className="relative w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden"
                style={{
                  background: avatarData?.background === 'bg_stars' 
                    ? 'linear-gradient(to bottom right, #1e3a8a, #7c3aed)'
                    : 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)'
                }}
              >
                {/* Base Avatar */}
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl font-bold">?</div>
                
                {/* Equipped Gear (simplified visualization) */}
                {avatarData?.gear.map((itemId) => {
                  const item = availableItems.find((i) => i.itemId === itemId);
                  if (!item) return null;
                  
                  return (
                    <div
                      key={itemId}
                      className="absolute text-6xl"
                      style={{
                        top: item.itemType === 'hat' ? '10%' : 
                             item.itemType === 'accessory' ? '50%' : '70%',
                      }}
                    >
                      {item.imageUrl || ''}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 text-center">
                <button className="w-full bg-gradient-to-r from-primary-900 to-primary-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition">
                  Save Avatar
                </button>
              </div>
            </div>
          </motion.div>

          {/* Item Selection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {/* Category Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-primary-900 to-primary-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.emoji} {category.name}
                  </button>
                ))}
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredItems.map((item) => {
                  const isEquipped = selectedCategory === 'background'
                    ? avatarData?.background === item.itemId
                    : avatarData?.gear.includes(item.itemId);

                  return (
                    <motion.div
                      key={item.itemId}
                      whileHover={{ scale: item.isLocked ? 1 : 1.05 }}
                      className={`relative p-4 rounded-xl border-2 transition ${
                        item.isLocked
                          ? 'border-gray-300 bg-gray-100 opacity-60'
                          : isEquipped
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 bg-white hover:border-primary-300 cursor-pointer'
                      }`}
                      onClick={() => !item.isLocked && equipItem(item.itemId, item.itemType)}
                    >
                      {/* Lock Icon */}
                      {item.isLocked && (
                        <div className="absolute top-2 right-2 text-xs font-bold bg-gray-800 text-white px-2 py-1 rounded">Låst</div>
                      )}

                      {/* Equipped Badge */}
                      {isEquipped && !item.isLocked && (
                        <div className="absolute top-2 right-2 bg-primary-900 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          Equipped
                        </div>
                      )}

                      {/* Item Preview */}
                      <div className="text-6xl mb-2 text-center">
                        {item.imageUrl || ''}
                      </div>

                      {/* Item Info */}
                      <h4 className="font-bold text-sm mb-1">{item.name}</h4>
                      <p className="text-xs text-gray-600 mb-2">{item.description}</p>

                      {/* Rarity Badge */}
                      <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        item.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-700' :
                        item.rarity === 'epic' ? 'bg-primary-50 text-primary-900' :
                        item.rarity === 'rare' ? 'bg-primary-100 text-primary-900' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.rarity}
                      </div>

                      {/* Unlock Requirement */}
                      {item.isLocked && item.unlockRequirement && (
                        <div className="mt-2 text-xs text-gray-500">
                          {item.unlockRequirement}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <div className="mb-4 text-4xl font-bold text-gray-300">#</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    No items in this category yet
                  </h3>
                  <p className="text-gray-600">
                    Keep leveling up to unlock more items!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
