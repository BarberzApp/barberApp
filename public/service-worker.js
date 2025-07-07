const CACHE_NAME = 'bocm-v2';
const urlsToCache = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache only static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets only');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - network first for dynamic content, cache only for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip caching for API routes, auth routes, and dynamic content
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/auth/') ||
      url.pathname.includes('supabase') ||
      url.pathname.includes('stripe') ||
      request.method !== 'GET' ||
      request.headers.get('cache-control') === 'no-cache') {
    console.log('Service Worker: Skipping cache for:', request.url);
    return;
  }
  
  // Only cache static assets (images, icons, manifest)
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot|json)$/)) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            console.log('Service Worker: Serving static asset from cache:', request.url);
            return response;
          }
          
          return fetch(request).then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                console.log('Service Worker: Caching static asset:', request.url);
                cache.put(request, responseToCache);
              });
            
            return response;
          });
        })
    );
  } else {
    // For all other requests, use network first
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Only fallback to cache for HTML pages
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/offline');
          }
          return new Response('Network error', { status: 408 });
        })
    );
  }
}); 