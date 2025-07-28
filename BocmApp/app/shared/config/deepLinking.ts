import { LinkingOptions } from '@react-navigation/native';
import { DEEP_LINKING_CONFIG } from './routeMapping';

export const linking: LinkingOptions<any> = {
  prefixes: DEEP_LINKING_CONFIG.prefixes,
  
  config: {
    screens: {
      // Auth screens
      Login: 'login',
      SignUp: 'register',
      EmailConfirmation: 'confirm',
      Terms: 'terms',
      
      // Main app screens
      MainTabs: {
        screens: {
          Browse: 'browse',
          Calendar: 'calendar',
          Cuts: 'reels',
          Profile: 'profile',
          Settings: 'settings',
        },
      },
      
      // Individual screens
      Home: '',
      ProfilePortfolio: 'profile',
      BarberOnboarding: 'barber/onboarding',
      BookingCalendar: 'book/:barberId?',
      BookingSuccess: 'booking/success',
      
      // Admin routes
      SuperAdmin: 'super-admin',
    },
  },
  
  // Custom function to handle deep links
  async getInitialURL() {
    // Handle initial URL when app is opened from a deep link
    return null;
  },
  
  // Custom function to subscribe to URL changes
  subscribe(listener) {
    // Handle URL changes while app is running
    return () => {
      // Cleanup subscription
    };
  },
};

// Deep link URL patterns aligned with Next.js routes
export const deepLinkPatterns = {
  // Auth patterns
  login: 'bocm://login',
  register: 'bocm://register',
  confirm: 'bocm://confirm',
  terms: 'bocm://terms',
  
  // Main app patterns
  browse: 'bocm://browse',
  calendar: 'bocm://calendar',
  reels: 'bocm://reels',
  profile: 'bocm://profile',
  settings: 'bocm://settings',
  
  // Booking patterns
  book: (barberId?: string) => barberId ? `bocm://book/${barberId}` : 'bocm://book',
  bookingSuccess: 'bocm://booking/success',
  
  // Barber patterns
  barberOnboarding: 'bocm://barber/onboarding',
  
  // Admin patterns
  superAdmin: 'bocm://super-admin',
  
  // Web app equivalent patterns (for cross-platform linking)
  webBrowse: 'https://bocm.app/browse',
  webCalendar: 'https://bocm.app/calendar',
  webReels: 'https://bocm.app/reels',
  webProfile: 'https://bocm.app/profile',
  webSettings: 'https://bocm.app/settings',
  webBook: (barberId?: string) => barberId ? `https://bocm.app/book/${barberId}` : 'https://bocm.app/book',
  webBarberOnboarding: 'https://bocm.app/barber/onboarding',
  webSuperAdmin: 'https://bocm.app/super-admin',
};

// Function to generate deep link URLs
export function generateDeepLink(route: string, params?: Record<string, string>): string {
  const baseUrl = deepLinkPatterns[route as keyof typeof deepLinkPatterns];
  
  if (typeof baseUrl === 'function') {
    return baseUrl(params?.barberId);
  }
  
  if (baseUrl) {
    return baseUrl;
  }
  
  // Fallback to generic pattern
  const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
  return `bocm://${route}${queryString}`;
}

// Function to handle incoming deep links
export function handleDeepLink(url: string) {
  console.log('🔗 Handling deep link:', url);
  
  // Parse the URL and extract route and parameters
  const urlObj = new URL(url);
  const path = urlObj.pathname;
  const params = Object.fromEntries(urlObj.searchParams.entries());
  
  // Map web app routes to mobile app routes (aligned with Next.js)
  const routeMapping: Record<string, string> = {
    '/': 'Home',
    '/login': 'Login',
    '/register': 'SignUp',
    '/confirm': 'EmailConfirmation',
    '/terms': 'Terms',
    '/browse': 'Browse',
    '/calendar': 'Calendar',
    '/reels': 'Cuts',
    '/profile': 'Profile',
    '/settings': 'Settings',
    '/book': 'BookingCalendar',
    '/booking/success': 'BookingSuccess',
    '/barber/onboarding': 'BarberOnboarding',
    '/super-admin': 'SuperAdmin',
  };
  
  // Extract route from path
  const route = routeMapping[path] || path.replace('/', '');
  
  return {
    route,
    params,
    url,
  };
}

// Function to share deep links
export function shareDeepLink(route: string, params?: Record<string, string>) {
  const deepLink = generateDeepLink(route, params);
  
  // In a real implementation, you would use a sharing library
  // For now, we'll just log the deep link
  console.log('📤 Sharing deep link:', deepLink);
  
  return deepLink;
} 