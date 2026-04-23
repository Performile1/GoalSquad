'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { apiFetch } from '@/lib/api-client';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  avatarUrl?: string;
  conversationType: 'direct' | 'community' | 'broadcast';
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: 'text' | 'image' | 'system';
  createdAt: string;
  isOwn: boolean;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await apiFetch(`/api/messages/${conversationId}`);
      const data = await response.json();
      setMessages(data.messages || []);
      
      // Mark as read
      await apiFetch(`/api/messages/${conversationId}/read`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await apiFetch(`/api/messages/${selectedConversation}/send`, {
        method: 'POST',
        body: JSON.stringify({ content: newMessage }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages(selectedConversation);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Meddelanden 💬</h1>
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
        {selectedConv ? (
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-md ${msg.isOwn ? 'order-2' : 'order-1'}`}>
                    {!msg.isOwn && (
                      <p className="text-xs text-gray-500 mb-1 ml-2">{msg.senderName}</p>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        msg.isOwn
                          ? 'bg-primary-900 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.isOwn ? 'text-primary-100' : 'text-gray-500'}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Skriv ett meddelande..."
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary-600 focus:outline-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-primary-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Skicka
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-xl">Välj en konversation för att börja chatta</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just nu';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
}
