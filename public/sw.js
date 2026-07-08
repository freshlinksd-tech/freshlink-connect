/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_NAME = 'freshlink-static-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.png',
  '/logo.png',
  '/logo.svg',
  '/manifest.json',
  '/robots.txt'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching app shell...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing legacy cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Caching strategy: 
// 1. Stale-While-Revalidate for Profile Pictures & Static Assets (CSS, JS, Fonts)
// 2. Network-First for user's Feed Content (Posts, Feed lists, Media images)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass non-GET requests and Firestore control planes
  if (
    event.request.method !== 'GET' ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('firebaseinstallations.googleapis.com')
  ) {
    return;
  }

  // Determine categories of requests
  const isStaticAsset = 
    ASSETS_TO_CACHE.includes(url.pathname) ||
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    event.request.destination === 'font' ||
    url.pathname.includes('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.ico') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  const isProfilePicture = 
    url.pathname.includes('/avatar') ||
    url.pathname.includes('/profile-images') ||
    url.pathname.includes('/profiles/') ||
    url.hostname.includes('lh3.googleusercontent.com') || // Google user avatars
    (url.hostname.includes('images.unsplash.com') && url.search.includes('avatar'));

  const isFeedContent = 
    url.hostname.includes('firestore.googleapis.com') || // Firestore data endpoints
    url.pathname.includes('/api/feed') ||
    url.pathname.includes('/api/posts') ||
    (url.hostname.includes('images.unsplash.com') && !url.search.includes('avatar')); // Post illustrations/media

  // Strategy A: Stale-While-Revalidate for profile pictures and static assets
  if (isProfilePicture || isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Silently swallow network fetch errors for background refresh
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Strategy B: Network-First for user's feed content
  if (isFeedContent) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network fails (offline), fall back to cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If offline & no cache, serve navigate fallback or appropriate error responses
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            return new Response('Offline content unavailable.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({ 'Content-Type': 'text/plain' })
            });
          });
        })
    );
    return;
  }

  // Default Strategy: Cache-first fallback to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

// PWA Background Sync Feature
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-interactions') {
    console.log('[Service Worker] Background sync event triggered for sync-interactions');
    event.waitUntil(notifyClientsToSync());
  }
});

async function notifyClientsToSync() {
  const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clientsList) {
    client.postMessage({ type: 'SYNC_PENDING_INTERACTIONS' });
  }
}

// Push notification listeners
self.addEventListener('push', (event) => {
  let title = 'FreshLinkConnect notification';
  let body = 'You have a new update!';
  let icon = '/favicon.png';

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      body = data.body || body;
      icon = data.icon || icon;
    } catch (e) {
      body = event.data.text() || body;
    }
  }

  const options = {
    body: body,
    icon: icon,
    badge: '/favicon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
