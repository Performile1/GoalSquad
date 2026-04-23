'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageIcon, PlusIcon, SendIcon, PackageIcon } from '@/app/components/BrandIcons';
import { apiFetch } from '@/lib/api-client';

interface CoordinationMessage {
  id: string;
  sender_id: string;
  message_type: string;
  title: string;
  message: string;
  product_id: string | null;
  quantity_needed: number | null;
  location_area: string | null;
  status: string;
  created_at: string;
  sender?: {
    full_name: string;
    email: string;
  };
  product?: {
    name: string;
  };
}

interface InterClubMessagingProps {
  entityType?: 'community' | 'seller';
}

export default function InterClubMessaging({ entityType }: InterClubMessagingProps) {
  const [messages, setMessages] = useState<CoordinationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMessage, setNewMessage] = useState({
    message_type: 'request_help',
    title: '',
    message: '',
    product_id: '',
    quantity_needed: 0,
    location_area: '',
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await apiFetch('/api/coordination?status=open');
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMessage = async () => {
    try {
      const response = await apiFetch('/api/coordination', {
        method: 'POST',
        body: JSON.stringify(newMessage),
      });
      const data = await response.json();
      if (data.message) {
        setMessages([data.message, ...messages]);
        setShowCreateModal(false);
        setNewMessage({
          message_type: 'request_help',
          title: '',
          message: '',
          product_id: '',
          quantity_needed: 0,
          location_area: '',
        });
      }
    } catch (error) {
      console.error('Failed to create message:', error);
    }
  };

  const handleUpdateStatus = async (messageId: string, status: string) => {
    try {
      await apiFetch('/api/coordination', {
        method: 'PATCH',
        body: JSON.stringify({ messageId, status }),
      });
      fetchMessages();
    } catch (error) {
      console.error('Failed to update message:', error);
    }
  };

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'request_help':
        return 'Hjälpbehov';
      case 'offer_help':
        return 'Hjälp erbjuds';
      case 'share_stock':
        return 'Del av lager';
      case 'coordination':
        return 'Koordinering';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
        <div className="text-center text-gray-500">Laddar...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Mellan-klubb Meddelanden</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
        >
          <PlusIcon size={20} />
          Nytt Meddelande
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Inga öppna meddelanden. Skapa ett för att samarbeta med andra klubbar!
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-50 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 bg-primary-100 text-primary-900 rounded-full text-xs font-semibold">
                      {getMessageTypeLabel(msg.message_type)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(msg.status)}`}>
                      {msg.status === 'open' ? 'Öppen' : msg.status === 'in_progress' ? 'Pågår' : msg.status === 'completed' ? 'Klar' : msg.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{msg.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{msg.message}</p>
                  {msg.sender && (
                    <p className="text-xs text-gray-500">
                      Från: {msg.sender.full_name} ({msg.sender.email})
                    </p>
                  )}
                </div>
              </div>

              {(msg.product_id || msg.quantity_needed || msg.location_area) && (
                <div className="flex flex-wrap gap-3 mb-3 text-sm">
                  {msg.product_id && msg.product && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <PackageIcon size={16} />
                      {msg.product.name}
                    </div>
                  )}
                  {msg.quantity_needed && (
                    <div className="text-gray-600">
                      Antal: {msg.quantity_needed}
                    </div>
                  )}
                  {msg.location_area && (
                    <div className="text-gray-600">
                      Område: {msg.location_area}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {new Date(msg.created_at).toLocaleString('sv-SE')}
                </p>
                {msg.status === 'open' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(msg.id, 'in_progress')}
                      className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-semibold hover:bg-yellow-200 transition"
                    >
                      Pågår
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(msg.id, 'completed')}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition"
                    >
                      Klar
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Skapa Meddelande</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Meddelandetyp
                  </label>
                  <select
                    value={newMessage.message_type}
                    onChange={(e) => setNewMessage({ ...newMessage, message_type: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                  >
                    <option value="request_help">Hjälpbehov</option>
                    <option value="offer_help">Hjälp erbjuds</option>
                    <option value="share_stock">Del av lager</option>
                    <option value="coordination">Koordinering</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Titel
                  </label>
                  <input
                    type="text"
                    value={newMessage.title}
                    onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                    placeholder="T.ex. Behöver hjälp med chipspåsar"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Meddelande
                  </label>
                  <textarea
                    value={newMessage.message}
                    onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                    placeholder="Beskriv ditt hjälpbehov eller erbjudande..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none resize-none"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Produkt ID (valfritt)
                    </label>
                    <input
                      type="text"
                      value={newMessage.product_id}
                      onChange={(e) => setNewMessage({ ...newMessage, product_id: e.target.value })}
                      placeholder="Produkt-ID"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Antal (valfritt)
                    </label>
                    <input
                      type="number"
                      value={newMessage.quantity_needed}
                      onChange={(e) => setNewMessage({ ...newMessage, quantity_needed: parseFloat(e.target.value) || 0 })}
                      placeholder="100"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Område (valfritt)
                  </label>
                  <input
                    type="text"
                    value={newMessage.location_area}
                    onChange={(e) => setNewMessage({ ...newMessage, location_area: e.target.value })}
                    placeholder="T.ex. Stockholm, Göteborg"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={handleCreateMessage}
                    disabled={!newMessage.title || !newMessage.message}
                    className="flex-1 px-6 py-3 bg-primary-900 text-white rounded-lg font-semibold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Skicka
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
