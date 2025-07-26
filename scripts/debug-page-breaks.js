// Debug script to identify page breaking issues
console.log('🔍 Debug script loaded - monitoring for issues...');

// Monitor for React errors
window.addEventListener('error', (event) => {
  console.error('🚨 Global error caught:', event.error);
  console.error('Error details:', {
    message: event.error?.message,
    stack: event.error?.stack,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Monitor for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled promise rejection:', event.reason);
  console.error('Promise rejection details:', {
    reason: event.reason,
    promise: event.promise
  });
});

// Monitor for React component errors
const originalConsoleError = console.error;
console.error = (...args) => {
  // Check if it's a React error
  const errorString = args.join(' ');
  if (errorString.includes('React') || errorString.includes('Warning')) {
    console.error('🚨 React error detected:', ...args);
  } else {
    originalConsoleError(...args);
  }
};

// Monitor for memory leaks
let memoryUsage = [];
setInterval(() => {
  if (performance.memory) {
    memoryUsage.push({
      timestamp: Date.now(),
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit
    });
    
    // Keep only last 10 entries
    if (memoryUsage.length > 10) {
      memoryUsage.shift();
    }
    
    // Check for memory growth
    if (memoryUsage.length >= 5) {
      const first = memoryUsage[0];
      const last = memoryUsage[memoryUsage.length - 1];
      const growth = last.used - first.used;
      
      if (growth > 10 * 1024 * 1024) { // 10MB growth
        console.warn('⚠️ Potential memory leak detected:', {
          growth: `${(growth / 1024 / 1024).toFixed(2)}MB`,
          current: `${(last.used / 1024 / 1024).toFixed(2)}MB`
        });
      }
    }
  }
}, 5000);

// Monitor for excessive re-renders
let renderCount = 0;
const originalRender = ReactDOM.render;
if (typeof ReactDOM !== 'undefined') {
  ReactDOM.render = (...args) => {
    renderCount++;
    if (renderCount > 100) {
      console.warn('⚠️ High render count detected:', renderCount);
    }
    return originalRender(...args);
  };
}

// Monitor for network errors
const originalFetch = window.fetch;
window.fetch = (...args) => {
  return originalFetch(...args).catch(error => {
    console.error('🚨 Fetch error:', error);
    throw error;
  });
};

// Monitor for localStorage errors
const originalSetItem = localStorage.setItem;
localStorage.setItem = (key, value) => {
  try {
    originalSetItem.call(localStorage, key, value);
  } catch (error) {
    console.error('🚨 localStorage error:', error);
    throw error;
  }
};

console.log('✅ Debug monitoring active - check console for issues'); 