'use client'

import React from 'react'

export function ServiceWorkerRegister() {
  React.useEffect(() => {
    console.log('ServiceWorkerRegister: Starting registration check...');
    
    if ('serviceWorker' in navigator) {
      console.log('ServiceWorkerRegister: Service Worker is supported');
      
      // Register immediately instead of waiting for load event
      navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      })
      .then((registration) => {
        console.log('ServiceWorkerRegister: Registration successful', {
          scope: registration.scope,
          state: registration.active ? 'active' : 'installing'
        });

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('ServiceWorkerRegister: New worker state:', newWorker.state);
            });
          }
        });
      })
      .catch((err) => {
        console.error('ServiceWorkerRegister: Registration failed', err);
      });

      // Handle updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('ServiceWorkerRegister: New service worker activated');
      });
    } else {
      console.log('ServiceWorkerRegister: Service Worker is not supported');
    }
  }, []);

  return null;
} 