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

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Ensure PWA handles all routes including booking links
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
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
})(nextConfig);