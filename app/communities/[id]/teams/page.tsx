'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PlusIcon, TrophyIcon, ShopIcon } from '@/app/components/BrandIcons';

interface Team {
  id: string;
  name: string;
  team_type: string;
  age_group?: string;
  gender?: string;
  is_warehouse_partner: boolean;
  warehouse_config: {
    storageCostPerUnit: number;
    handlingCostPerUnit: number;
    shippingCostType: string;
    shippingCostPerUnit: number;
  };
  storage_capacity?: number;
  packages_per_day?: number;
  total_earnings: number;
  status: string;
}

export default function CommunityTeamsPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    team_type: 'sports_team',
    age_group: '',
    gender: 'mixed',
  });

  useEffect(() => {
    fetchTeams();
  }, [communityId]);

  const fetchTeams = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/teams`);
      const data = await response.json();
      setTeams(data.teams || []);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam),
      });

      if (response.ok) {
        setNewTeam({ name: '', team_type: 'sports_team', age_group: '', gender: 'mixed' });
        setShowAddTeam(false);
        fetchTeams();
      }
    } catch (error) {
      console.error('Failed to add team:', error);
    }
  };

  const toggleWarehousePartner = async (teamId: string, isPartner: boolean) => {
    try {
      const response = await fetch(`/api/communities/${communityId}/teams/${teamId}/warehouse`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_warehouse_partner: isPartner }),
      });

      if (response.ok) {
        fetchTeams();
      }
    } catch (error) {
      console.error('Failed to update warehouse partner status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <TrophyIcon size={64} className="animate-bounce text-primary-900 mx-auto mb-4" />
          <p className="text-xl text-primary-900 font-semibold">Laddar lag...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Laghantering</h1>
              <p className="text-primary-100">Hantera era lag och deras lagerpartnerskap</p>
            </div>
            <button
              onClick={() => setShowAddTeam(!showAddTeam)}
              className="inline-flex items-center gap-2 bg-white text-primary-900 px-6 py-3 rounded-xl font-bold hover:bg-primary-50 transition"
            >
              <PlusIcon size={20} />
              Nytt lag
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Add Team Form */}
        {showAddTeam && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Lägg till nytt lag</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lagets namn *
                </label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="t.ex. Mölnlycke IF - P14"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Typ av lag *
                </label>
                <select
                  value={newTeam.team_type}
                  onChange={(e) => setNewTeam({ ...newTeam, team_type: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                >
                  <option value="sports_team">Sportlag</option>
                  <option value="class">Klass</option>
                  <option value="group">Grupp</option>
                  <option value="other">Annat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Åldersgrupp
                </label>
                <input
                  type="text"
                  value={newTeam.age_group}
                  onChange={(e) => setNewTeam({ ...newTeam, age_group: e.target.value })}
                  placeholder="t.ex. P14, P16, F12"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kön
                </label>
                <select
                  value={newTeam.gender}
                  onChange={(e) => setNewTeam({ ...newTeam, gender: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
                >
                  <option value="mixed">Mixad</option>
                  <option value="male">Pojkar</option>
                  <option value="female">Flickor</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAddTeam}
                className="bg-primary-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-600 transition"
              >
                Lägg till lag
              </button>
              <button
                onClick={() => setShowAddTeam(false)}
                className="border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-primary-300 transition"
              >
                Avbryt
              </button>
            </div>
          </motion.div>
        )}

        {/* Teams List */}
        {teams.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <TrophyIcon size={64} className="text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-bold text-gray-900 mb-2">Inga lag än</p>
            <p className="text-gray-500 mb-8">Skapa ert första lag för att komma igång</p>
            <button
              onClick={() => setShowAddTeam(true)}
              className="inline-block px-6 py-3 bg-primary-900 text-white rounded-xl font-bold hover:bg-primary-700 transition"
            >
              Skapa lag →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team, index) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                        {team.is_warehouse_partner && (
                          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <ShopIcon size={12} />
                            Lagerpartner
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{team.team_type === 'sports_team' ? '🏆 Sportlag' : team.team_type === 'class' ? '📚 Klass' : team.team_type === 'group' ? '👥 Grupp' : 'Annat'}</span>
                        {team.age_group && <span>{team.age_group}</span>}
                        {team.gender && <span>{team.gender === 'male' ? 'Pojkar' : team.gender === 'female' ? 'Flickor' : 'Mixad'}</span>}
                      </div>
                    </div>
                  </div>

                  {team.is_warehouse_partner && (
                    <div className="bg-orange-50 rounded-xl p-4 mb-4">
                      <h4 className="font-bold text-orange-900 mb-3">📦 Lagerpartner-inställningar</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-orange-700">Lagring:</span>
                          <span className="font-bold text-orange-900 ml-2">{team.warehouse_config.storageCostPerUnit} kr/enhet</span>
                        </div>
                        <div>
                          <span className="text-orange-700">Hantering:</span>
                          <span className="font-bold text-orange-900 ml-2">{team.warehouse_config.handlingCostPerUnit} kr/enhet</span>
                        </div>
                        <div>
                          <span className="text-orange-700">Frakt:</span>
                          <span className="font-bold text-orange-900 ml-2">{team.warehouse_config.shippingCostType}</span>
                        </div>
                        <div>
                          <span className="text-orange-700">Intäkter:</span>
                          <span className="font-bold text-orange-900 ml-2">{team.total_earnings.toLocaleString()} kr</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={team.is_warehouse_partner}
                          onChange={(e) => toggleWarehousePartner(team.id, e.target.checked)}
                          className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                        />
                        <span className="text-sm font-semibold text-gray-700">Aktivera som lagerpartner</span>
                      </label>
                    </div>
                    <button
                      onClick={() => router.push(`/communities/${communityId}/teams/${team.id}`)}
                      className="text-primary-900 hover:text-primary-600 font-semibold text-sm"
                    >
                      Hantera →
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
