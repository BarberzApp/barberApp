import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import Button from '../components/Button';
import { RootStackParamList } from '../types/types';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { theme } from '../lib/theme';

type EmailConfirmationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EmailConfirmation'
>;

type EmailConfirmationScreenRouteProp = RouteProp<
  RootStackParamList,
  'EmailConfirmation'
>;

export default function EmailConfirmationScreen() {
  const navigation = useNavigation<EmailConfirmationScreenNavigationProp>();
  const route = useRoute<EmailConfirmationScreenRouteProp>();
  const { user, userProfile } = useAuth();
  const [checking, setChecking] = useState(false);
  
  const { email, userType } = route.params || {};

  useEffect(() => {
    const checkInterval = setInterval(async () => {
      if (user && userProfile) {
        clearInterval(checkInterval);
        handleConfirmed();
      }
    }, 2000);

    return () => clearInterval(checkInterval);
  }, [user, userProfile]);

  const handleConfirmed = () => {
    if (userType === 'barber') {
      navigation.replace('BarberOnboarding' as any);
    } else {
      navigation.replace('FindBarber' as any);
    }
  };

  const checkEmailConfirmation = async () => {
    setChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        Alert.alert(
          'Email Confirmed!',
          'Your email has been verified. Redirecting...',
          [
            {
              text: 'OK',
              onPress: handleConfirmed,
            },
          ]
        );
      } else {
        Alert.alert(
          'Not Confirmed Yet',
          'Please check your email and click the confirmation link first.',
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check confirmation status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const resendConfirmationEmail = async () => {
    if (!email) return;
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      Alert.alert(
        'Email Sent',
        'We\'ve sent another confirmation email. Please check your inbox.',
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to resend confirmation email. Please try again.');
    }
  };

  const goToLogin = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
      <View style={tw`flex-1 justify-center items-center px-6`}>
        <View style={[tw`w-full max-w-md rounded-2xl p-8`, { backgroundColor: 'rgba(45,35,66,0.9)' }]}>
          <View style={tw`items-center mb-8`}>
            <View style={[tw`w-20 h-20 rounded-full items-center justify-center mb-4`, { backgroundColor: theme.colors.secondary }]}>
              <Text style={[tw`text-3xl`, { color: theme.colors.foreground }]}>✉️</Text>
            </View>
            <Text style={[tw`text-2xl font-bold text-center mb-2`, { color: theme.colors.foreground }]}>
              Check Your Email
            </Text>
            <Text style={[tw`text-center`, { color: theme.colors.mutedForeground }]}>
              We've sent a confirmation link to
            </Text>
            <Text style={[tw`text-center font-semibold`, { color: theme.colors.secondary }]}>
              {email}
            </Text>
          </View>

          <Text style={[tw`text-center mb-8`, { color: theme.colors.mutedForeground }]}>
            Please click the link in the email to verify your account. This screen will automatically redirect once confirmed.
          </Text>

          <View style={tw`gap-4`}>
            {checking ? (
              <View style={[tw`py-4 rounded-lg`, { backgroundColor: theme.colors.secondary }]}>
                <ActivityIndicator color={theme.colors.foreground} />
              </View>
            ) : (
              <Button
                onPress={checkEmailConfirmation}
                size="lg"
                style={[tw`w-full`, { backgroundColor: theme.colors.secondary }]}
              >
                I've Confirmed My Email
              </Button>
            )}

            <TouchableOpacity
              onPress={resendConfirmationEmail}
              style={tw`py-3`}
            >
              <Text style={[tw`text-center`, { color: theme.colors.secondary }]}>
                Didn't receive an email? Resend
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goToLogin}
              style={tw`py-3`}
            >
              <Text style={[tw`text-center`, { color: theme.colors.mutedForeground }]}>
                Already confirmed? Go to login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}