'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { DashboardIcon, SearchIcon, FilterIcon, SendIcon, UserIcon } from '@/app/components/BrandIcons';

interface Conversation {
  id: string;
  name: string;
  conversation_type: 'direct' | 'community';
  last_message: string;
  last_message_at: string;
  unread_count: number;
  participants: {
    id: string;
    name: string;
    avatar?: string;
  }[];
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
  is_from_me: boolean;
}

export default function CommunityMessages() {
  const params = useParams();
  const communityId = params.id as string;
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchConversations();
  }, [communityId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/conversations`);
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      setNewMessage('');
      fetchMessages(selectedConversation.id);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.name.toLowerCase().includes(search.toLowerCase()) ||
      conv.participants.some(p => p.name.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'all' || conv.conversation_type === filter;
    return matchesSearch && matchesFilter;
  });

  const getConversationTypeLabel = (type: string) => {
    switch (type) {
      case 'direct':
        return 'Direkt';
      case 'community':
        return 'Community';
      default:
        return type;
    }
  };

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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Meddelanden</h1>
          <p className="text-gray-600">Kommunicera med andra säljare i föreningen</p>
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
                placeholder="Sök efter konversation eller person..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
            >
              <option value="all">Alla typer</option>
              <option value="direct">Direktmeddelanden</option>
              <option value="community">Community-chatt</option>
            </select>
            <button className="bg-primary-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition">
              + Ny konversation
            </button>
          </div>
        </motion.div>

        {/* Conversations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-4"
          >
            {filteredConversations.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <DashboardIcon size={64} className="text-gray-300 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-900 mb-2">Inga konversationer</p>
                <p className="text-gray-600">Börja kommunicera med andra säljare</p>
              </div>
            ) : (
              filteredConversations.map((conv, index) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedConversation(conv)}
                  className={`bg-white rounded-2xl shadow-lg p-4 cursor-pointer border-2 transition ${
                    selectedConversation?.id === conv.id
                      ? 'border-primary-600'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{conv.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{getConversationTypeLabel(conv.conversation_type)}</p>
                      <p className="text-sm text-gray-500 line-clamp-2">{conv.last_message}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <div className="bg-primary-900 text-white text-xs font-bold px-2 py-1 rounded-full ml-2">
                        {conv.unread_count}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {conv.participants.slice(0, 3).map((participant, i) => (
                      <div key={i} className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-900 text-xs font-bold">
                          {participant.name.charAt(0)}
                        </span>
                      </div>
                    ))}
                    {conv.participants.length > 3 && (
                      <span className="text-xs text-gray-500">+{conv.participants.length - 3}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(conv.last_message_at).toLocaleString('sv-SE')}
                  </p>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Messages View */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            {selectedConversation ? (
              <div className="bg-white rounded-2xl shadow-lg h-[600px] flex flex-col">
                {/* Conversation Header */}
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">{selectedConversation.name}</h2>
                  <p className="text-sm text-gray-600">{getConversationTypeLabel(selectedConversation.conversation_type)}</p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Inga meddelanden än
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex ${message.is_from_me ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] rounded-2xl p-4 ${
                          message.is_from_me
                            ? 'bg-primary-900 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm mb-1">{message.sender_name}</p>
                          <p>{message.content}</p>
                          <p className={`text-xs mt-2 ${
                            message.is_from_me ? 'text-primary-200' : 'text-gray-500'
                          }`}>
                            {new Date(message.created_at).toLocaleString('sv-SE')}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="Skriv ett meddelande..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none transition"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-primary-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <SendIcon size={20} />
                      Skicka
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center h-[600px] flex items-center justify-center">
                <DashboardIcon size={64} className="text-gray-300 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-900 mb-2">Välj en konversation</p>
                <p className="text-gray-600">Klicka på en konversation i listan för att visa meddelanden</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
