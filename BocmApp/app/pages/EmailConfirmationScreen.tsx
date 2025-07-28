import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Linking, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../shared/lib/theme';
import tw from 'twrnc';
import Button from '../shared/components/ui/Button';
import { User, Barber } from '../shared/types';
import { useAuth } from '../shared/hooks/useAuth';
import { supabase } from '../shared/lib/supabase';

type RootStackParamList = {
  EmailConfirmation: { email: string };
};

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
  const { user } = useAuth();
  const [checking, setChecking] = useState(false);
  
  const { email } = route.params || {};

  useEffect(() => {
    const checkInterval = setInterval(async () => {
      if (user) {
        clearInterval(checkInterval);
        handleConfirmed();
      }
    }, 2000);

    return () => clearInterval(checkInterval);
  }, [user]);

  const handleConfirmed = () => {
    // Default to client flow if no user profile
    navigation.replace('FindBarber' as any, {});
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
        'We&apos;ve sent another confirmation email. Please check your inbox.',
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to resend confirmation email. Please try again.');
    }
  };

  const goToLogin = () => {
    navigation.replace('Login' as any, {});
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
            <Text style={tw`text-white text-center mb-6`}>
              Didn&apos;t receive an email? Resend
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
                I&apos;ve Confirmed My Email
              </Button>
            )}

            <TouchableOpacity
              onPress={resendConfirmationEmail}
              style={tw`py-3`}
            >
              <Text style={[tw`text-center`, { color: theme.colors.secondary }]}>
                Didn&apos;t receive an email? Resend
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