'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { XPIcon, LevelIcon, AvatarIcon, QuestIcon, LootBoxIcon, FireModeIcon, StreakIcon, BadgeIcon, EquipmentSlotIcon, SkinIcon, GoldenHoodieIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface SellerXP {
  current_xp: number;
  current_level: number;
  total_xp_earned: number;
  multiplier_active: boolean;
  multiplier_value: number;
  multiplier_expires_at: string | null;
  daily_streak: number;
  longest_streak: number;
  total_sales: number;
  total_orders: number;
  unique_customers: number;
}

interface AvatarEquipment {
  head_item_id: string | null;
  body_item_id: string | null;
  accessory_item_id: string | null;
  background_item_id: string | null;
  unlocked_items: string[];
  current_skin: string | null;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  quest_type: string;
  category: string;
  target_value: number;
  xp_reward: number;
  is_active: boolean;
}

interface QuestProgress {
  current_value: number;
  is_completed: boolean;
  completed_at: string | null;
}

interface LootBox {
  id: string;
  name: string;
  description: string;
  box_type: string;
  rarity: string;
  is_opened: boolean;
  received_items: string[];
}

export default function SellerGamificationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'avatar' | 'quests' | 'loot'>('overview');
  const [sellerXP, setSellerXP] = useState<SellerXP | null>(null);
  const [avatarEquipment, setAvatarEquipment] = useState<AvatarEquipment | null>(null);
  const [quests, setQuests] = useState<(Quest & { progress?: QuestProgress })[]>([]);
  const [lootBoxes, setLootBoxes] = useState<LootBox[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, loading]);

  const fetchData = async () => {
    try {
      // Fetch seller XP
      const xpRes = await apiFetch('/api/sellers/xp');
      if (xpRes.ok) {
        const xpData = await xpRes.json();
        setSellerXP(xpData);
      }

      // Fetch avatar equipment
      const avatarRes = await apiFetch('/api/sellers/avatar');
      if (avatarRes.ok) {
        const avatarData = await avatarRes.json();
        setAvatarEquipment(avatarData);
      }

      // Fetch quests
      const questsRes = await apiFetch('/api/sellers/quests');
      if (questsRes.ok) {
        const questsData = await questsRes.json();
        setQuests(questsData);
      }

      // Fetch loot boxes
      const lootRes = await apiFetch('/api/sellers/loot-boxes');
      if (lootRes.ok) {
        const lootData = await lootRes.json();
        setLootBoxes(lootData);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setFetching(false);
    }
  };

  const getXPForLevel = (level: number): number => {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  };

  const getXPProgress = (): number => {
    if (!sellerXP) return 0;
    const currentLevelXP = getXPForLevel(sellerXP.current_level);
    return (sellerXP.current_xp / currentLevelXP) * 100;
  };

  const getRarityColor = (rarity: string): string => {
    const colors: Record<string, string> = {
      common: 'bg-gray-100 text-gray-700',
      rare: 'bg-blue-100 text-blue-700',
      epic: 'bg-purple-100 text-purple-700',
      legendary: 'bg-yellow-100 text-yellow-700',
    };
    return colors[rarity] || 'bg-gray-100 text-gray-700';
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center animate-pulse"><XPIcon size={52} /></div>
          <p className="text-gray-500">Laddar gamification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Säljar-Gamification</h1>
          <p className="text-gray-600">Följ din resa, lås upp avatar-items och slå nya rekord!</p>
        </div>

        {/* XP Overview */}
        {sellerXP && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <LevelIcon size={24} />
                </div>
                <span className="text-sm text-gray-500">Level</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{sellerXP.current_level}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <XPIcon size={24} />
                </div>
                <span className="text-sm text-gray-500">Current XP</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{sellerXP.current_xp.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <StreakIcon size={24} />
                </div>
                <span className="text-sm text-gray-500">Daily Streak</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{sellerXP.daily_streak}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <BadgeIcon size={24} />
                </div>
                <span className="text-sm text-gray-500">Total Sales</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{sellerXP.total_sales}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <AvatarIcon size={24} />
                </div>
                <span className="text-sm text-gray-500">Customers</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{sellerXP.unique_customers}</p>
            </div>
          </div>
        )}

        {/* XP Progress Bar */}
        {sellerXP && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">Level {sellerXP.current_level} Progress</span>
              <span className="text-sm text-gray-500">
                {sellerXP.current_xp} / {getXPForLevel(sellerXP.current_level)} XP
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-primary-900 h-4 rounded-full transition-all duration-500"
                style={{ width: `${getXPProgress()}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {getXPForLevel(sellerXP.current_level + 1) - sellerXP.current_xp} XP to Level {sellerXP.current_level + 1}
            </p>
          </div>
        )}

        {/* Fire Mode */}
        {sellerXP && sellerXP.multiplier_active && (
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl shadow-sm p-6 mb-8 text-white">
            <div className="flex items-center gap-4">
              <FireModeIcon size={48} />
              <div>
                <h3 className="text-2xl font-bold mb-1">🔥 FIRE MODE AKTIVERAT!</h3>
                <p className="text-white/90">All XP fördubblas tills {sellerXP.multiplier_expires_at ? new Date(sellerXP.multiplier_expires_at).toLocaleTimeString('sv-SE') : 'snart'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'overview'
                ? 'bg-primary-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Översikt
          </button>
          <button
            onClick={() => setActiveTab('avatar')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'avatar'
                ? 'bg-primary-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Avatar
          </button>
          <button
            onClick={() => setActiveTab('quests')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'quests'
                ? 'bg-primary-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Quests
          </button>
          <button
            onClick={() => setActiveTab('loot')}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === 'loot'
                ? 'bg-primary-900 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Loot Boxes ({lootBoxes.filter(lb => !lb.is_opened).length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Statistik</h2>
              {sellerXP && (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Totalt intjänad XP</span>
                    <span className="font-bold text-gray-900">{sellerXP.total_xp_earned.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Totala ordrar</span>
                    <span className="font-bold text-gray-900">{sellerXP.total_orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Längsta streak</span>
                    <span className="font-bold text-gray-900">{sellerXP.longest_streak} dagar</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Aktiva Quests</h2>
              {quests.filter(q => q.progress && !q.progress.is_completed).length === 0 ? (
                <p className="text-gray-500 text-center py-8">Inga aktiva quests</p>
              ) : (
                <div className="space-y-3">
                  {quests.filter(q => q.progress && !q.progress.is_completed).slice(0, 3).map((quest) => (
                    <div key={quest.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-900">{quest.title}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRarityColor(quest.quest_type)}`}>
                          {quest.quest_type}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-900 h-2 rounded-full"
                          style={{ width: `${(quest.progress!.current_value / quest.target_value) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {quest.progress!.current_value} / {quest.target_value} · +{quest.xp_reward} XP
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'avatar' && avatarEquipment && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Avatar</h2>
            
            {/* Avatar Preview */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <AvatarIcon size={128} />
                {avatarEquipment.current_skin === 'golden_hoodie' && (
                  <div className="absolute -top-4 -right-4">
                    <GoldenHoodieIcon size={48} />
                  </div>
                )}
              </div>
            </div>

            {/* Equipment Slots */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <EquipmentSlotIcon size={48} />
                <p className="text-sm font-semibold text-gray-700 mt-2">Huvud</p>
                {avatarEquipment.head_item_id && <p className="text-xs text-gray-500">Equipped</p>}
              </div>
              <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <EquipmentSlotIcon size={48} />
                <p className="text-sm font-semibold text-gray-700 mt-2">Kropp</p>
                {avatarEquipment.body_item_id && <p className="text-xs text-gray-500">Equipped</p>}
              </div>
              <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <EquipmentSlotIcon size={48} />
                <p className="text-sm font-semibold text-gray-700 mt-2">Tillbehör</p>
                {avatarEquipment.accessory_item_id && <p className="text-xs text-gray-500">Equipped</p>}
              </div>
              <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <EquipmentSlotIcon size={48} />
                <p className="text-sm font-semibold text-gray-700 mt-2">Bakgrund</p>
                {avatarEquipment.background_item_id && <p className="text-xs text-gray-500">Equipped</p>}
              </div>
            </div>

            {/* Current Skin */}
            <div className="p-4 bg-primary-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Aktuell Skin</h3>
              <p className="text-gray-600">
                {avatarEquipment.current_skin === 'golden_hoodie' ? 'Golden Hoodie 🏆' : 'Standard Skin'}
              </p>
            </div>

            {/* Unlocked Items */}
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Upplåsta Items ({avatarEquipment.unlocked_items.length})</h3>
              {avatarEquipment.unlocked_items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Inga upplåsta items än</p>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {avatarEquipment.unlocked_items.map((itemId) => (
                    <div key={itemId} className="text-center p-2 bg-gray-50 rounded">
                      <SkinIcon size={32} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'quests' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quests</h2>
            
            <div className="space-y-4">
              {quests.map((quest) => (
                <div key={quest.id} className="p-6 border border-gray-200 rounded-lg hover:border-primary-300 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{quest.title}</h3>
                      <p className="text-sm text-gray-600">{quest.description}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRarityColor(quest.quest_type)}`}>
                        {quest.quest_type}
                      </span>
                      <p className="text-sm font-bold text-primary-900 mt-1">+{quest.xp_reward} XP</p>
                    </div>
                  </div>

                  {quest.progress && (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            quest.progress.is_completed ? 'bg-green-600' : 'bg-primary-900'
                          }`}
                          style={{ width: `${Math.min((quest.progress.current_value / quest.target_value) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{quest.progress.current_value} / {quest.target_value}</span>
                        {quest.progress.is_completed && (
                          <span className="text-green-600 font-semibold">✓ Slutförd!</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'loot' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Loot Boxes</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lootBoxes.map((lootBox) => (
                <div
                  key={lootBox.id}
                  className={`p-6 border-2 rounded-lg ${
                    lootBox.is_opened ? 'border-gray-200 opacity-60' : 'border-primary-300 hover:border-primary-500 cursor-pointer'
                  }`}
                >
                  <div className="flex justify-center mb-4">
                    <LootBoxIcon size={64} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-center mb-2">{lootBox.name}</h3>
                  <p className="text-sm text-gray-600 text-center mb-4">{lootBox.description}</p>
                  <div className="flex justify-center mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRarityColor(lootBox.rarity)}`}>
                      {lootBox.rarity}
                    </span>
                  </div>
                  {lootBox.is_opened ? (
                    <p className="text-center text-sm text-gray-500">Öppnad</p>
                  ) : (
                    <button className="w-full py-2 bg-primary-900 text-white rounded-lg font-semibold hover:bg-primary-600 transition">
                      Öppna 🎁
                    </button>
                  )}
                </div>
              ))}
            </div>

            {lootBoxes.length === 0 && (
              <div className="text-center py-16">
                <div className="mb-4 flex justify-center"><LootBoxIcon size={72} className="opacity-40" /></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Inga loot boxes</h2>
                <p className="text-gray-500">
                  Få loot boxes när du når nya nivåer!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
