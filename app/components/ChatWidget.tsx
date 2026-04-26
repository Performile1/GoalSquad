'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageIcon } from '@/app/components/BrandIcons';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

const QUICK_REPLIES = [
  'Hur registrerar jag en förening?',
  'Hur fungerar utbetalningar?',
  'Kan mitt företag bli leverantör?',
  'Hur lång är leveranstiden?',
];

const BOT_ANSWERS: Record<string, string> = {
  'Hur registrerar jag en förening?':
    'Det är enkelt! Klicka på "Registrera förening" i menyn eller gå till /join/community. Det tar bara några minuter och är helt gratis.',
  'Hur fungerar utbetalningar?':
    'Intäkter från försäljning betalas ut månadsvis till föreningens bankkonto. Du ser varje försäljning i realtid i din dashboard.',
  'Kan mitt företag bli leverantör?':
    'Absolut! Gå till /merchants/onboard för att registrera ditt företag. Vi granskar ansökan och återkommer inom 2 arbetsdagar.',
  'Hur lång är leveranstiden?':
    'Leveranstiden är normalt 2–5 arbetsdagar beroende på leverantör och region. Kunden får en spårningslänk via e-post.',
};

function getBotResponse(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('förening') || lower.includes('registrera') || lower.includes('klubb'))
    return 'För att registrera en förening, gå till /join/community. Det är gratis och tar bara några minuter!';
  if (lower.includes('betalning') || lower.includes('utbetalning') || lower.includes('pengar'))
    return 'Utbetalningar sker månadsvis till ert bankkonto. Ni ser alla transaktioner i realtid i er dashboard.';
  if (lower.includes('företag') || lower.includes('leverantör') || lower.includes('merchant'))
    return 'Företag kan registrera sig som leverantör på /merchants/onboard. Vi hanterar logistik och betalning åt er.';
  if (lower.includes('leverans') || lower.includes('frakt') || lower.includes('leveranstid'))
    return 'Leveranstiden är 2–5 arbetsdagar. Kunden får automatisk spårningsinformation via e-post.';
  if (lower.includes('hej') || lower.includes('hallå') || lower.includes('hi'))
    return 'Hej! Hur kan jag hjälpa dig idag? Fråga gärna om föreningar, leverantörer eller hur plattformen fungerar.';
  return 'Tack för din fråga! För mer detaljerad hjälp, kontakta oss på support@goalsquad.se eller besök vår kontaktsida.';
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'bot', text: 'Hej! Välkommen till GoalSquad. Hur kan jag hjälpa dig?' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const reply = BOT_ANSWERS[text] ?? getBotResponse(text);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', text: reply }]);
      setTyping(false);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-primary-100 overflow-hidden flex flex-col"
            style={{ maxHeight: '520px' }}
          >
            {/* Header */}
            <div className="bg-primary-900 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageIcon size={16} />
                </div>
                <div>
                  <p className="font-bold text-sm">GoalSquad Support</p>
                  <p className="text-white/60 text-xs">Svarar direkt</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white/80 hover:text-white text-lg leading-none"
                aria-label="Stäng"
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary-900 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center">
                      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            {messages.length <= 2 && (
              <div className="px-4 pt-2 pb-1 flex flex-wrap gap-2 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs px-3 py-1.5 bg-primary-50 text-primary-900 border border-primary-200 rounded-full hover:bg-primary-100 transition font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white flex gap-2 flex-shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                placeholder="Skriv ett meddelande..."
                className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:border-primary-600 focus:outline-none"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className="w-9 h-9 bg-primary-900 text-white rounded-xl hover:bg-primary-700 transition disabled:opacity-40 flex items-center justify-center flex-shrink-0"
                aria-label="Skicka"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M1 8L14 1L10 8L14 15L1 8Z" fill="white" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-primary-900 text-white shadow-xl hover:bg-primary-700 transition flex items-center justify-center relative"
        aria-label={open ? 'Stäng chat' : 'Öppna chat'}
        style={{ boxShadow: '0 4px 24px rgba(0,59,61,0.4)' }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} className="text-2xl leading-none">×</motion.span>
          ) : (
            <motion.svg key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white" />
              <circle cx="8" cy="11" r="1.5" fill="#003B3D" />
              <circle cx="12" cy="11" r="1.5" fill="#003B3D" />
              <circle cx="16" cy="11" r="1.5" fill="#003B3D" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
