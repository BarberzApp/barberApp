import withPWA from 'next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'res.cloudinary.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'images.unsplash.com'
    ],
  },
  // Copy service worker to public directory during build
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

// Only enable PWA in production
const pwaConfig = process.env.NODE_ENV === 'production' ? {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false,
  // Improved runtime caching strategy
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Cache API routes
    {
      urlPattern: /^https?:\/\/.*\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'apiCache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Cache static assets
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'staticAssets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
  ],
  // Add scope to ensure PWA handles all routes
  scope: '/',
  // Ensure PWA is installed and handles external links
  buildExcludes: [/middleware-manifest\.json$/],
  // Add navigation fallback for better PWA experience
  navigateFallback: '/',
  navigateFallbackAllowlist: [/^(?!\/__).*/],
  // Add fallback for failed precaching
  fallbacks: {
    document: '/offline',
  },
  // Improve error handling
  sw: 'service-worker.js',
  // Add custom service worker options
  customWorkerDir: 'public',
  // Disable aggressive caching in development
  dynamicStartUrl: false,
} : {
  disable: true,
};

export default withPWA(pwaConfig)(nextConfig);