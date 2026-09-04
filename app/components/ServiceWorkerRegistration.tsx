'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      // Supabase-backed auth and data must use the network directly. Remove
      // legacy workers so stale offline responses cannot intercept login.
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.filter((key) => key.startsWith('goalsquad-')).forEach((key) => caches.delete(key));
        });
      }
    }
  }, []);

  return null;
}
