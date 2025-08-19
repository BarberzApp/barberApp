import { ANIMATION_TIMING, SPRING_CONFIG } from '../constants/animations';

export const theme = {
  colors: {
    // Core colors - 4 Main Colors Theme
    background: '#272a2f', // Dark grey background
    foreground: '#fff', // White text
    card: '#fff',
    cardForeground: '#272a2f',
    popover: '#fff',
    popoverForeground: '#272a2f',
    primary: '#272a2f', // Dark grey primary
    primaryForeground: '#fff',
    secondary: '#c78e3f', // Saffron brown (vibrant) - for buttons
    secondaryForeground: '#fff',
    muted: '#f5f5f5', // Light grey muted
    mutedForeground: '#b0b0b0', // Medium grey text
    accent: '#8d7250', // Coffee brown accent
    accentForeground: '#fff',
    destructive: '#ff4d4f', // Red for errors
    destructiveForeground: '#fff',
    border: '#e5e7eb', // Light grey border
    input: '#e5e7eb',
    ring: '#c78e3f', // Saffron brown ring
    radius: '0.5rem', // 8px equivalent
    
    // 4 Main Brand Colors
    grey: '#272a2f', // Dark grey
    saffronBrown: '#c78e3f', // Vibrant saffron brown (for buttons)
    coffeeBrown: '#8d7250', // Coffee brown
    beige: '#f5f5f5', // Beige/light grey
    
    // Additional colors
    darkGrey: '#2d2a26', // Darker grey
    lightGrey: '#f5f5f5', // Light grey
    
    // Social Media Colors
    bookingHighlight: '#ff3b30',
    socialInstagram: '#e1306c',
    socialTwitter: '#1da1f2',
    socialTiktok: '#000000',
    socialFacebook: '#1877f3',

    // Enhanced colors for new design
    success: '#10b981',
    warning: '#f59e0b',
    premium: '#ffd700',
    glass: 'rgba(255, 255, 255, 0.1)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Enhanced gradient definitions
  gradients: {
    primary: ['#c78e3f', '#8d7250'],
    background: ['#272a2f', '#2d2a26'],
    glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
    logo: ['#c78e3f', '#8d7250'],
    text: ['#c78e3f', '#8d7250'],
    button: ['#c78e3f', '#8d7250'],
    glow: ['rgba(199, 142, 63, 0.3)', 'rgba(199, 142, 63, 0.1)'],
  },

  // Animation configuration
  animations: {
    timing: ANIMATION_TIMING,
    spring: SPRING_CONFIG,
  },

  spacing: {
    // Tailwind default spacing scale
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
    36: 144,
    40: 160,
    44: 176,
    48: 192,
    52: 208,
    56: 224,
    60: 240,
    64: 256,
    72: 288,
    80: 320,
    96: 384,
  },
  borderRadius: {
    // Matches web app Tailwind config
    none: 0,
    sm: 2, // calc(var(--radius) - 4px)
    md: 6, // calc(var(--radius) - 2px)
    lg: 8, // var(--radius) = 0.5rem = 8px
    xl: 12,
    '2xl': 16,
    '3xl': 24,
    full: 9999,
  },
  typography: {
    fontSizes: {
      // Tailwind default font sizes
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
      '7xl': 72,
      '8xl': 96,
      '9xl': 128,
    },
    fontWeights: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    fontFamily: {
      sans: ['SF Pro Display', 'Inter', 'sans-serif'],
      bebas: ['BebasNeue-Regular', 'Bebas Neue', 'cursive', 'sans-serif'],
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
} as const;

export type Theme = typeof theme; 