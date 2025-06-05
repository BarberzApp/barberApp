export const PWA_CONFIG = {
  CACHE_NAME: 'barber-app-v1',
  urlsToCache: [
    '/',
    '/offline',
    '/globals.css',
  ],
  manifest: {
    name: 'BarberHub',
    short_name: 'BarberHub',
    description: 'Book and manage barber appointments',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6366f1',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }
} as const; 