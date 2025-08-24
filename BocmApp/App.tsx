import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';
import * as Linking from 'expo-linking';
import { notificationService } from './app/shared/lib/notifications';
import tw from 'twrnc';
import { theme } from './app/shared/lib/theme';
import { AppNavigator } from './app/navigation/AppNavigator';
import { AuthProvider } from './app/shared/hooks/useAuth';
import { StripeProvider } from '@stripe/stripe-react-native';

const App = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Function to create booking from Stripe session
  const createBookingFromSession = async (sessionId: string) => {
    try {
      console.log('Creating booking from session:', sessionId);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-booking-after-checkout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          sessionId: sessionId
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      console.log('Booking created successfully:', data);
      
      Alert.alert(
        'Booking Confirmed!',
        'Your payment was successful and your booking has been created.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error creating booking from session:', error);
      Alert.alert(
        'Error',
        'Failed to create booking. Please contact support.',
        [{ text: 'OK' }]
      );
    }
  };

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
          
          // Show a success message immediately
          console.log('Stripe onboarding completed successfully - account ID:', accountId);
          
          // You could add a global state or navigation here to show success
          // For now, we'll rely on the focus effect in the onboarding page
        } else if (event.url.includes('/refresh')) {
          // User needs to refresh/retry Stripe onboarding
          console.log('Stripe onboarding refresh via deep link');
          
          // Extract account_id if present
          const urlParams = new URL(event.url);
          const accountId = urlParams.searchParams.get('account_id');
          console.log('Account ID from refresh deep link:', accountId);
        }
      }
      
      // Handle booking payment redirects
      if (event.url.includes('bocm://booking/')) {
        if (event.url.includes('/success')) {
          // User completed payment successfully
          console.log('Booking payment completed via deep link');
          
          // Extract session_id if present
          const urlParams = new URL(event.url);
          const sessionId = urlParams.searchParams.get('session_id');
          console.log('Session ID from deep link:', sessionId);
          
          if (sessionId) {
            // Create booking using the session ID
            createBookingFromSession(sessionId);
          }
        } else if (event.url.includes('/cancel')) {
          // User cancelled payment
          console.log('Booking payment cancelled via deep link');
          Alert.alert(
            'Payment Cancelled',
            'Your payment was not completed. Please try again.',
            [{ text: 'OK' }]
          );
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
        <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}>
            <AuthProvider>
                <AppNavigator />
            </AuthProvider>
        </StripeProvider>
    );
};

export default App;