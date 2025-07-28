# BOCM App Development Setup

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BocmApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your actual values
   # - EXPO_PUBLIC_SUPABASE_URL
   # - EXPO_PUBLIC_SUPABASE_ANON_KEY
   # - EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY (if using Stripe)
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser
- `npm run lint` - Run ESLint

## Project Structure

```
BocmApp/
├── app/                    # Main application code
│   ├── navigation/        # Navigation configuration
│   ├── pages/            # Screen components
│   └── shared/           # Shared components, hooks, utils
├── assets/               # Static assets (images, fonts)
├── .vscode/             # VSCode settings
├── babel.config.js      # Babel configuration
├── metro.config.js      # Metro bundler configuration
├── app.json            # Expo configuration
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Development Guidelines

1. **Code Style**: Use Prettier for formatting and ESLint for linting
2. **TypeScript**: All new code should be written in TypeScript
3. **Components**: Use functional components with hooks
4. **Styling**: Use Tailwind CSS (twrnc) for styling
5. **Navigation**: Use React Navigation for routing
6. **State Management**: Use Zustand for global state

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npx expo start --clear`
2. **iOS build issues**: Clean build folder in Xcode
3. **Android build issues**: Clean project with `cd android && ./gradlew clean`

### Environment Variables

Make sure all required environment variables are set in your `.env` file:

- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key (if using Stripe)

## Building for Production

1. **Configure app.json** with your app details
2. **Set up EAS Build** (if using Expo Application Services)
3. **Build the app**:
   ```bash
   eas build --platform ios
   eas build --platform android
   ```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting: `npm run lint`
4. Test on both iOS and Android
5. Submit a pull request 