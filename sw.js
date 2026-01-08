
// Service Worker for Salatk
const CACHE_NAME = 'salatk-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/js/app.js',
    '/js/db.js',
    '/js/i18n.js',
    '/js/date-utils.js',
    '/js/supabaseClient.js',
    '/js/auth-manager.js',
    '/js/prayer-manager.js',
    '/js/notification-manager.js',
    '/js/sync-manager.js',
    '/js/ui-helpers.js',
    '/js/services/settings-service.js',
    '/js/services/prayer-service.js',
    '/js/services/habit-service.js',
    '/js/services/points-service.js',
    '/js/pages/daily-prayers.js',
    '/js/pages/qada-prayers.js',
    '/js/pages/habits.js',
    '/js/pages/statistics.js',
    '/js/pages/challenge.js',
    '/js/pages/settings.js',
    '/js/pages/leaderboard.js',
    '/js/pages/store.js',
    '/js/pages/auth.js',
    '/components/toast.js',
    '/components/modal.js',
    '/components/prayer-card.js',
    '/components/habit-card.js',
    '/components/points-display.js',
    '/components/charts.js',
    '/assets/images/logo.png',
    'https://cdn.jsdelivr.net/npm/adhan@4.4.3/lib/bundles/adhan.umd.min.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&family=Cairo:wght@300;400;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests regarding Supabase API or other APIs differently if needed
    // But for CDN scripts (adhan, supabase-js), we can cache them!

    // Strategy: Stale-While-Revalidate for most things
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Check if we received a valid response
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                    return networkResponse;
                }

                // Clone the response
                const responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    // Don't cache API POST calls etc, only GET
                    if (event.request.method === 'GET') {
                        cache.put(event.request, responseToCache);
                    }
                });

                return networkResponse;
            }).catch(() => {
                // Network failed
                // If we have cached response, good. If not, maybe return a fallback?
            });

            // Return cached response immediately if available, otherwise wait for network
            return cachedResponse || fetchPromise;
        })
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
