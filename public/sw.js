// GoalSquad Service Worker for PWA Offline Support

const CACHE_NAME = 'goalsquad-v3';
const STATIC_CACHE = 'goalsquad-static-v3';
const urlsToCache = [
  '/',
  '/marketplace',
  '/products',
  '/cart',
  '/leaderboard',
  '/sellers/dashboard',
  '/manifest.json',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Fetch event - network-first for APIs, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
    return;
  }

  // Let document navigations reach the app directly. An offline fallback
  // should never turn a normal login/page load into a synthetic 503 response.
  if (request.mode === 'navigate' || request.destination === 'document') {
    return;
  }

  // API calls: network-first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        })
    );
    return;
  }

  // Static assets: cache-first, network fallback
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) return response;
      return fetch(request).then((res) => {
        if (res.status === 200) {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return res;
      }).catch(() => new Response('Offline', { status: 503, statusText: 'Offline' }));
    })
  );
});

// Background sync for offline cart actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCartData());
  }
});

async function syncCartData() {
  try {
    const db = await openIndexedDB('goalsquad-offline', 1);
    const tx = db.transaction('cart-actions', 'readonly');
    const store = tx.objectStore('cart-actions');
    const actions = await store.getAll();
    // Replay actions when back online
    for (const action of actions) {
      try {
        await fetch(action.url, { method: action.method, body: JSON.stringify(action.body) });
      } catch (e) {
        console.error('Failed to replay cart action:', e);
      }
    }
    // Clear replayed actions
    const clearTx = db.transaction('cart-actions', 'readwrite');
    clearTx.objectStore('cart-actions').clear();
  } catch (e) {
    console.error('Sync failed:', e);
  }
}

function openIndexedDB(name, version) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('cart-actions')) {
        db.createObjectStore('cart-actions', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Push notification event
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Du har ett nytt meddelande från GoalSquad',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Visa',
        icon: '/icons/icon-96x96.png',
      },
      {
        action: 'close',
        title: 'Stäng',
        icon: '/icons/icon-96x96.png',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('GoalSquad', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('https://goalsquad.shop/messages')
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
