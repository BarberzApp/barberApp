import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';
import * as Linking from 'expo-linking';
import { notificationService } from './app/shared/lib/notifications';
import tw from 'twrnc';
import { theme } from './app/shared/lib/theme';
import { AppNavigator } from './app/navigation/AppNavigator';
import { AuthProvider } from './app/shared/hooks/useAuth';

const App = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'BebasNeue-Regular': require('./assets/fonts/BebasNeue-Regular.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true); // Continue without custom fonts
      }
    }

    loadFonts();
  }, []);

  useEffect(() => {
    // Initialize notifications
    notificationService.initialize();
    setIsLoading(false);
  }, []);

  // Handle deep links
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log('Deep link received:', event.url);
      
      // Handle Stripe connect redirects
      if (event.url.includes('bocm://stripe-connect/')) {
        if (event.url.includes('/return')) {
          // User completed Stripe onboarding
          console.log('Stripe onboarding completed via deep link');
          
          // Extract account_id if present
          const urlParams = new URL(event.url);
          const accountId = urlParams.searchParams.get('account_id');
          console.log('Account ID from deep link:', accountId);
          
          // You can add navigation logic here to go to settings
          // For now, we'll rely on the status check in the onboarding flow
        } else if (event.url.includes('/refresh')) {
          // User needs to refresh/retry Stripe onboarding
          console.log('Stripe onboarding refresh via deep link');
          
          // Extract account_id if present
          const urlParams = new URL(event.url);
          const accountId = urlParams.searchParams.get('account_id');
          console.log('Account ID from refresh deep link:', accountId);
        }
      }
    };

    // Listen for incoming links when app is already running
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle links that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('App opened with URL:', url);
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  if (!fontsLoaded || isLoading) {
    return (
      <View style={[tw`flex-1 justify-center items-center`, { backgroundColor: theme.colors.background }]}>
        <Text style={[tw`text-xl font-bold`, { color: theme.colors.foreground }]}>BOCM</Text>
        <Text style={[tw`text-sm mt-2`, { color: theme.colors.mutedForeground }]}>Loading...</Text>
      </View>
    );
  }

    return (
        <AuthProvider>
            <AppNavigator />
        </AuthProvider>
    );
};

export default App;