'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api-client';
import { MessageIcon, SendIcon } from '@/app/components/BrandIcons';
import RealtimeChat from '@/app/components/RealtimeChat';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatarUrl?: string;
  conversationType: 'direct' | 'community' | 'broadcast';
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await apiFetch('/api/messages/conversations');
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MessageIcon size={28} className="text-primary-900" />
            <h1 className="text-2xl font-bold text-gray-900">Meddelanden</h1>
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Laddar...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Inga konversationer än
            </div>
          ) : (
            conversations.map((conv) => (
              <motion.div
                key={conv.id}
                whileHover={{ backgroundColor: '#f9fafb' }}
                onClick={() => setSelectedConversation(conv.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer ${
                  selectedConversation === conv.id ? 'bg-primary-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {conv.avatarUrl ? (
                      <img src={conv.avatarUrl} alt="" className="w-full h-full rounded-full" />
                    ) : (
                      conv.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conv.name}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conv.lastMessage}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {conv.unreadCount > 0 && (
                    <div className="bg-primary-900 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConv && currentUserId ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-white font-bold">
                  {selectedConv.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{selectedConv.name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedConv.conversationType === 'community' ? 'Community Chat' : 'Direct Message'}
                  </p>
                </div>
              </div>
            </div>

            {/* Realtime Chat Component */}
            <div className="flex-1 p-4">
              <RealtimeChat 
                conversationId={selectedConversation!} 
                currentUserId={currentUserId} 
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="mb-4 flex justify-center text-gray-300"><MessageIcon size={64} /></div>
              <p className="text-xl">Välj en konversation för att börja läsa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
