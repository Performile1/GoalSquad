'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationPermissionRequest() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we need to request permission
    if ('Notification' in window && Notification.permission === 'default') {
      // Show after a delay to not interrupt onboarding
      const timer = setTimeout(() => {
        setShow(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const requestPermission = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Subscribe to push notifications
        await subscribeToPush();
        setShow(false);
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  };

  const dismiss = () => {
    setShow(false);
    // Store that user dismissed so we don't ask again soon
    localStorage.setItem('notificationDismissed', Date.now().toString());
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2C6.7 2 4 4.7 4 8V11L2 13V14H18V13L16 11V8C16 4.7 13.3 2 10 2Z" fill="currentColor"/>
                <path d="M10 17C11.1 17 12 16.1 12 15H8C8 16.1 8.9 17 10 17Z" fill="currentColor"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Aktivera notiser</h3>
              <p className="text-sm text-gray-600 mb-3">
                Få notiser om nya meddelanden, beställningar och campaign uppdateringar i realtid.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={requestPermission}
                  disabled={loading}
                  className="flex-1 bg-primary-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-800 transition disabled:opacity-50"
                >
                  {loading ? 'Aktiverar...' : 'Aktivera'}
                </button>
                <button
                  onClick={dismiss}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
                >
                  Inte nu
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
