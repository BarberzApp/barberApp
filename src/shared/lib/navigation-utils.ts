import { useRouter } from 'next/navigation';

// Enhanced navigation with fallback
export const useEnhancedRouter = () => {
  const router = useRouter();

  const safePush = (url: string, fallback?: () => void) => {
    try {
      console.log('🔄 Navigating to:', url);
      router.push(url);
      
      // Fallback if navigation doesn't work after 2 seconds
      setTimeout(() => {
        if (window.location.pathname !== url) {
          console.warn('⚠️ Router.push failed, using fallback');
          if (fallback) {
            fallback();
          } else {
            window.location.href = url;
          }
        }
      }, 2000);
    } catch (error) {
      console.error('❌ Navigation error:', error);
      if (fallback) {
        fallback();
      } else {
        window.location.href = url;
      }
    }
  };

  const safeReplace = (url: string, fallback?: () => void) => {
    try {
      console.log('🔄 Replacing with:', url);
      router.replace(url);
      
      // Fallback if navigation doesn't work after 2 seconds
      setTimeout(() => {
        if (window.location.pathname !== url) {
          console.warn('⚠️ Router.replace failed, using fallback');
          if (fallback) {
            fallback();
          } else {
            window.location.replace(url);
          }
        }
      }, 2000);
    } catch (error) {
      console.error('❌ Navigation error:', error);
      if (fallback) {
        fallback();
      } else {
        window.location.replace(url);
      }
    }
  };

  return {
    ...router,
    push: safePush,
    replace: safeReplace,
  };
};

// Navigation state management
export class NavigationState {
  private static instance: NavigationState;
  private isNavigating = false;
  private navigationQueue: Array<() => void> = [];

  static getInstance(): NavigationState {
    if (!NavigationState.instance) {
      NavigationState.instance = new NavigationState();
    }
    return NavigationState.instance;
  }

  startNavigation() {
    this.isNavigating = true;
    console.log('🚀 Navigation started');
  }

  endNavigation() {
    this.isNavigating = false;
    console.log('✅ Navigation ended');
    
    // Process queued navigations
    while (this.navigationQueue.length > 0) {
      const nextNavigation = this.navigationQueue.shift();
      if (nextNavigation) {
        setTimeout(nextNavigation, 100);
      }
    }
  }

  queueNavigation(navigation: () => void) {
    if (this.isNavigating) {
      this.navigationQueue.push(navigation);
      console.log('⏳ Navigation queued');
    } else {
      navigation();
    }
  }

  isCurrentlyNavigating() {
    return this.isNavigating;
  }
}

// Utility to check if navigation is working
export const checkNavigationHealth = () => {
  const currentPath = window.location.pathname;
  const router = useRouter();
  
  return {
    currentPath,
    routerAvailable: !!router,
    canNavigate: typeof router.push === 'function',
  };
};

// Debounced navigation to prevent rapid clicks
export const createDebouncedNavigation = (delay = 300) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (url: string, router: any) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      router.push(url);
    }, delay);
  };
}; 