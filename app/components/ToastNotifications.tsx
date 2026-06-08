'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckIcon, XPIcon, BoxIcon, TrophyIcon } from '@/app/components/BrandIcons';

export interface Toast {
  id: string;
  type: 'sale' | 'pickup' | 'levelup' | 'info';
  title: string;
  message: string;
  createdAt: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id' | 'createdAt'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id, createdAt: Date.now() }]);
    // Auto remove after 6s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

export function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-80">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            className={`rounded-xl shadow-lg p-4 flex items-start gap-3 border-2 ${
              toast.type === 'sale'
                ? 'bg-green-50 border-green-200'
                : toast.type === 'pickup'
                ? 'bg-blue-50 border-blue-200'
                : toast.type === 'levelup'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              toast.type === 'sale'
                ? 'bg-green-100 text-green-600'
                : toast.type === 'pickup'
                ? 'bg-blue-100 text-blue-600'
                : toast.type === 'levelup'
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {toast.type === 'sale' && <CheckIcon size={20} />}
              {toast.type === 'pickup' && <BoxIcon size={20} />}
              {toast.type === 'levelup' && <TrophyIcon size={20} />}
              {toast.type === 'info' && <XPIcon size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">{toast.title}</p>
              <p className="text-xs text-gray-600 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <span className="text-lg leading-none">&times;</span>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
