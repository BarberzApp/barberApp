export const PWA_CONFIG = {
  CACHE_NAME: 'bocm-v1',
  urlsToCache: [
    '/',
    '/manifest.json',
    '/icon.png',
    '/apple-icon.png',
  ],
  manifest: {
    name: 'BOCM',
    short_name: 'BOCM',
    description: 'Book and manage barber appointments',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
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