// Debug script to check for service worker interference
// Run this in the browser console to diagnose issues

console.log('🔍 Service Worker Debug Script');

// Check if service worker is registered
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('📋 Service Worker Registrations:', registrations);
    
    if (registrations.length > 0) {
      registrations.forEach((registration, index) => {
        console.log(`SW ${index + 1}:`, {
          scope: registration.scope,
          active: registration.active,
          installing: registration.installing,
          waiting: registration.waiting,
          updateViaCache: registration.updateViaCache
        });
      });
    } else {
      console.log('❌ No service workers registered');
    }
  });
} else {
  console.log('❌ Service Worker not supported');
}

// Check cache storage
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    console.log('🗄️ Cache Storage:', cacheNames);
    
    cacheNames.forEach(cacheName => {
      caches.open(cacheName).then(cache => {
        cache.keys().then(requests => {
          console.log(`📦 Cache "${cacheName}" contains ${requests.length} items:`, 
            requests.map(req => req.url));
        });
      });
    });
  });
}

// Monitor network requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  console.log('🌐 Fetch request:', url);
  
  return originalFetch.apply(this, args).then(response => {
    console.log('✅ Fetch response:', url, response.status);
    return response;
  }).catch(error => {
    console.error('❌ Fetch error:', url, error);
    throw error;
  });
};

// Monitor for service worker messages
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    console.log('📨 SW Message:', event.data);
  });
}

// Check if we're in PWA mode
const isPWA = window.navigator.standalone || 
  window.matchMedia('(display-mode: standalone)').matches;
console.log('📱 PWA Mode:', isPWA);

// Check online status
console.log('🌐 Online Status:', navigator.onLine);

// Monitor for online/offline events
window.addEventListener('online', () => console.log('🟢 Went online'));
window.addEventListener('offline', () => console.log('🔴 Went offline'));

console.log('✅ Debug script loaded. Check console for service worker info.'); 