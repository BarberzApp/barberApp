import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import { Button, Input, Card, CardHeader, CardContent, CardFooter, LoadingSpinner } from '../components';
import { RootStackParamList } from '../types/types';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { theme } from '../lib/theme';
import { Scissors } from 'lucide-react-native';

const BocmLogo = () => (
  <Text style={[tw`text-3xl font-bold`, { color: theme.colors.saffron }]}>BOCM</Text>
);

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginPage() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, user, userProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      setCheckingSession(true);
      setTimeout(() => setCheckingSession(false), 500);
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (user && userProfile) {
      checkOnboardingStatus();
    }
  }, [user, userProfile, navigation]);

  const checkOnboardingStatus = async () => {
    if (userProfile?.role === 'barber' && user) {
      try {
        const { data: barber } = await supabase
          .from('barbers')
          .select('id, business_name, bio')
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
          navigation.navigate('BarberOnboarding' as any);
        }
      } catch (error) {
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

  if (checkingSession) {
    return (
      <View style={[tw`flex-1 items-center justify-center`, { backgroundColor: theme.colors.primary }]}>
        <Text style={[tw`text-xl font-semibold`, { color: theme.colors.saffron }]}>Checking session...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.primary }]}>
      {Platform.OS === 'ios' && <StatusBar barStyle="light-content" />}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        {/* Main Content */}
        <View style={tw`flex-1 justify-center px-6`}>
          <Card style={[
            tw`w-full max-w-md mx-auto`,
            {
              backgroundColor: '#2d2342',
              borderColor: 'rgba(255,255,255,0.10)',
              borderWidth: 1,
              borderRadius: 24,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 5
            }
          ]}>
            <CardHeader style={tw`items-center pb-6`}>
              <Scissors size={40} color="#FFD180" style={tw`mb-4`} />
              <Text style={[tw`text-2xl font-bold text-white text-center mb-1`]}>
                WELCOME BACK
              </Text>
              <Text style={tw`text-base text-white/80 text-center`}>
                Sign in to your account
              </Text>
            </CardHeader>

            <CardContent style={tw`px-6`}>
              <View style={tw`gap-4`}>
                <Input
                  label="Email"
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  inputStyle={tw`h-12`}
                />

                <View>
                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!isLoading}
                    inputStyle={tw`h-12`}
                  />
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    disabled={isLoading}
                    style={tw`mt-2`}
                  >
                    <Text style={tw`text-sm text-[#FFD180] text-right`}>
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </View>

                <Button
                  onPress={handleSignIn}
                  size="lg"
                  style={[
                    tw`w-full mt-4`,
                    { backgroundColor: '#FFD180', height: 48 }
                  ]}
                  textStyle={{ color: '#262b2e', fontSize: 18 }}
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingSpinner color="#262b2e" /> : 'Sign in'}
                </Button>
              </View>
            </CardContent>

            <CardFooter style={tw`pb-6`}>
              <View style={tw`w-full items-center`}>
                <Text style={tw`text-sm text-white/80 text-center`}>
                  Don't have an account?{' '}
                  <Text onPress={handleSignUp} style={tw`text-[#FFD180] underline font-bold`}>
                    Sign up
                  </Text>
                </Text>
              </View>
            </CardFooter>
          </Card>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}