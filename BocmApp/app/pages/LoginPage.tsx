import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import Button from '../components/Button';
import { RootStackParamList } from '../types/types';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginPage() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, user, userProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && userProfile) {
      checkOnboardingStatus();
    }
  }, [user, userProfile, navigation]);

  const checkOnboardingStatus = async () => {
    if (userProfile?.role === 'barber') {
      try {
        const { data: barber } = await supabase
          .from('barbers')
          .select('business_name, bio')
          .eq('user_id', user.id)
          .single();

        const { data: services } = await supabase
          .from('services')
          .select('id')
          .eq('barber_id', barber?.id || '')
          .limit(1);

        const isOnboardingComplete = barber?.business_name && barber?.bio && services && services.length > 0;

        if (!isOnboardingComplete) {
          navigation.navigate('BarberOnboarding');
        } else {
          navigation.navigate('Settings' as any);
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
        navigation.navigate('BarberOnboarding');
      }
    } else {
      navigation.navigate('FindBarber');
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        Alert.alert('Login Failed', 'Invalid email or password');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleForgotPassword = () => {
    Alert.alert('Info', 'Forgot password functionality coming soon!');
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-900`}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <View style={tw`flex-1 justify-center items-center px-6`}>
          <View style={tw`w-full max-w-md bg-gray-800 rounded-2xl p-8`}>
            <View style={tw`mb-2`}>
              <Text style={tw`text-white text-3xl font-bold text-center`}>
                Welcome Back
              </Text>
              <Text style={tw`text-gray-400 text-center mt-2`}>
                Sign in to your account
              </Text>
            </View>

            <View style={tw`mt-2`}>
              <View style={tw`mb-6`}>
                <Text style={tw`text-gray-300 text-sm mb-2`}>Email</Text>
                <TextInput
                  style={tw`bg-gray-900 text-white px-4 py-3 rounded-lg`}
                  placeholder="name@example.com"
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>

              <View style={tw`mb-2`}>
                <View style={tw`flex-row justify-between items-center mb-2`}>
                  <Text style={tw`text-gray-300 text-sm`}>Password</Text>
                  <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
                    <Text style={tw`text-purple-400 text-sm`}>
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={tw`bg-gray-900 text-white px-4 py-3 rounded-lg`}
                  placeholder="Enter your password"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              <View style={tw`mt-8`}>
                {isLoading ? (
                  <View style={tw`bg-purple-600 py-4 rounded-lg`}>
                    <ActivityIndicator color="white" />
                  </View>
                ) : (
                  <Button 
                    onPress={handleSignIn} 
                    size="lg"
                    style={tw`w-full`}
                    disabled={isLoading}
                  >
                    Sign in
                  </Button>
                )}
              </View>

              <View style={tw`mt-6 flex-row justify-center gap-2`}>
                <Text style={tw`text-gray-400`}>
                  Don't have an account?
                </Text>
                <TouchableOpacity onPress={handleSignUp} disabled={isLoading}>
                  <Text style={tw`text-purple-400`}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}