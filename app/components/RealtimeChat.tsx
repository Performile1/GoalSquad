'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import { MessageIcon } from '@/app/components/BrandIcons';
import AttachmentPreview from '@/app/components/AttachmentPreview';
import AudioPlayer from '@/app/components/AudioPlayer';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
  attachment_size?: number;
  audio_url?: string;
  audio_duration?: number;
  sender?: {
    full_name: string;
    avatar_url: string;
  };
  pending?: boolean; // For optimistic UI
}

interface TypingIndicator {
  user_id: string;
  is_typing: boolean;
  updated_at: string;
}

interface RealtimeChatProps {
  conversationId: string;
  currentUserId: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RealtimeChat({ conversationId, currentUserId }: RealtimeChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load initial messages
  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  // Setup Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('New message received:', payload.new);
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
          scrollToBottom();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('Typing indicator update:', payload);
          const indicator = payload.new as TypingIndicator;
          
          if (indicator.user_id === currentUserId) return; // Ignore own typing status

          setTypingUsers((prev) => {
            const next = new Set(prev);
            if (indicator.is_typing) {
              next.add(indicator.user_id);
            } else {
              next.delete(indicator.user_id);
            }
            return next;
          });

          // Auto-clear typing indicator after 10 seconds
          if (indicator.is_typing) {
            setTimeout(() => {
              setTypingUsers((prev) => {
                const next = new Set(prev);
                next.delete(indicator.user_id);
                return next;
              });
            }, 10000);
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversationId, currentUserId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update typing status when user types
  useEffect(() => {
    if (!input.trim()) {
      // Clear typing status when input is empty
      updateTypingStatus(false);
      return;
    }

    // Set typing status when user starts typing
    updateTypingStatus(true);

    // Clear typing status after 3 seconds of no typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(false);
    }, 3000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [input]);

  const updateTypingStatus = async (isTyping: boolean) => {
    try {
      await fetch(`/api/messages/${conversationId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTyping }),
      });
    } catch (error) {
      console.error('Failed to update typing status:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/messages/upload-attachment', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setAttachmentUrl(data.url);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = () => {
    setAttachmentUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
        
        // Upload audio
        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('duration', audioDuration.toString());

        setUploading(true);
        try {
          const response = await fetch('/api/messages/upload-audio', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          if (data.success) {
            setAudioUrl(data.url);
            setAudioDuration(data.duration);
          }
        } catch (error) {
          console.error('Failed to upload audio:', error);
        } finally {
          setUploading(false);
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);

      // Track duration
      const startTime = Date.now();
      const durationInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setAudioDuration(elapsed);
        if (elapsed >= 60) {
          stopRecording();
          clearInterval(durationInterval);
        }
      }, 1000);

      const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
          setRecording(false);
          clearInterval(durationInterval);
        }
      };

      // Store stopRecording function for later use
      (window as any).stopRecording = stopRecording;
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const removeAudio = () => {
    setAudioUrl(null);
    setAudioDuration(0);
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if ((!input.trim() && !attachmentUrl && !audioUrl) || sending) return;

    const content = input.trim();
    setInput('');
    setAttachmentUrl(null);
    setAudioUrl(null);
    setSending(true);

    // Optimistic UI: Add message immediately with pending status
    const optimisticMessage: Message = {
      id: `pending-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content || (audioUrl ? '[Röstmeddelande]' : '[Bifogad fil]'),
      message_type: audioUrl ? 'audio' : (attachmentUrl ? 'image' : 'text'),
      created_at: new Date().toISOString(),
      pending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: content || (audioUrl ? '[Röstmeddelande]' : '[Bifogad fil]'),
          message_type: audioUrl ? 'audio' : (attachmentUrl ? 'image' : 'text'),
          attachment_url: attachmentUrl || null,
          audio_url: audioUrl || null,
          audio_duration: audioDuration || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with real message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMessage.id ? data : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
      setInput(content); // Restore input
      setAttachmentUrl(attachmentUrl); // Restore attachment
      setAudioUrl(audioUrl); // Restore audio
      setAudioDuration(audioDuration); // Restore duration
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        <AnimatePresence>
          {messages.map((msg) => {
            const isOwn = msg.sender_id === currentUserId;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${isOwn ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isOwn
                        ? 'bg-primary-900 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                    } ${msg.pending ? 'opacity-60' : ''}`}
                  >
                    {msg.content}
                  </div>
                  
                  {/* Attachment Preview */}
                  {msg.attachment_url && (
                    <AttachmentPreview
                      url={msg.attachment_url}
                      type={msg.attachment_type}
                      name={msg.attachment_name}
                      size={msg.attachment_size}
                    />
                  )}
                  
                  {/* Audio Player */}
                  {msg.audio_url && (
                    <AudioPlayer url={msg.audio_url} duration={msg.audio_duration} />
                  )}
                  
                  <span className="text-xs text-gray-400 mt-1">
                    {msg.pending ? 'Skickar...' : formatTime(msg.created_at)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-500">
                  {typingUsers.size === 1 ? 'Någon skriver...' : `${typingUsers.size} personer skriver...`}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white flex gap-2 flex-shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.pdf"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || recording}
          className="w-9 h-9 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition disabled:opacity-40 flex items-center justify-center flex-shrink-0"
          aria-label="Ladda upp fil"
        >
          {uploading ? (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="24" strokeDashoffset="12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2V10M8 10L5 7M8 10L11 7M2 13H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={uploading || sending}
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
            recording 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40'
          }`}
          aria-label={recording ? 'Stoppa inspelning' : 'Spela in röstmeddelande'}
        >
          {recording ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="4" y="4" width="8" height="8" fill="currentColor" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2C9.1 2 10 2.9 10 4V8C10 9.1 9.1 10 8 10C6.9 10 6 9.1 6 8V4C6 2.9 6.9 2 8 2Z" fill="currentColor"/>
              <path d="M4 8C4 10.2 5.8 12 8 12C10.2 12 12 10.2 12 8H14C14 11.3 11.3 14 8 14C4.7 14 2 11.3 2 8H4Z" fill="currentColor"/>
            </svg>
          )}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Skriv ett meddelande..."
          disabled={sending || recording}
          className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none disabled:opacity-50"
        />
        
        <button
          onClick={sendMessage}
          disabled={!input.trim() && !attachmentUrl && !audioUrl || sending || recording}
          className="w-9 h-9 bg-primary-900 text-white rounded-xl hover:bg-primary-700 transition disabled:opacity-40 flex items-center justify-center flex-shrink-0"
          aria-label="Skicka"
        >
          {sending ? (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" strokeDasharray="24" strokeDashoffset="12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 8L14 1L10 8L14 15L1 8Z" fill="white" />
            </svg>
          )}
        </button>
      </div>

      {/* Recording Indicator */}
      {recording && (
        <div className="px-4 py-2 border-t border-gray-100 bg-red-50 flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-red-600 font-medium">Inspelar... {Math.floor(audioDuration)}s</span>
        </div>
      )}

      {/* Attachment Preview */}
      {attachmentUrl && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4V12C2 13.1 2.9 14 4 14H12C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2H4C2.9 2 2 2.9 2 4Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs text-gray-600 truncate">Bifogad fil</span>
          </div>
          <button
            onClick={removeAttachment}
            className="w-6 h-6 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition flex items-center justify-center"
            aria-label="Ta bort"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Audio Preview */}
      {audioUrl && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2C9.1 2 10 2.9 10 4V8C10 9.1 9.1 10 8 10C6.9 10 6 9.1 6 8V4C6 2.9 6.9 2 8 2Z" fill="currentColor"/>
              <path d="M4 8C4 10.2 5.8 12 8 12C10.2 12 12 10.2 12 8H14C14 11.3 11.3 14 8 14C4.7 14 2 11.3 2 8H4Z" fill="currentColor"/>
            </svg>
            <span className="text-xs text-gray-600">Röstmeddelande ({audioDuration}s)</span>
          </div>
          <button
            onClick={removeAudio}
            className="w-6 h-6 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition flex items-center justify-center"
            aria-label="Ta bort"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
