import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardFooter, LoadingSpinner } from '../components';
import { RootStackParamList } from '../types/types';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { theme } from '../lib/theme';
import { Scissors } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const BocmLogo = () => (
  <Text style={[tw`text-2xl font-bold`, { color: theme.colors.saffron, fontFamily: 'BebasNeue' }]}>BOCM</Text>
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
    // Simulate session check for parity with web
    const checkSession = async () => {
      setCheckingSession(true);
      // Simulate async session check (replace with real logic if needed)
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
          navigation.navigate('Settings' as any);
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
        {/* Header */}
        <View style={tw`w-full pt-10 pb-6 px-6`}> {/* More top padding for mobile */}
          <View style={tw`max-w-3xl mx-auto flex-row items-center`}> {/* Left align logo */}
            <BocmLogo />
          </View>
        </View>
        {/* Main Content */}
        <View style={tw`flex-1 justify-center items-center px-4`}> 
          <View style={{ width: '100%', maxWidth: 600, alignSelf: 'center' }}> {/* Wider card for less skinny fields */}
            <Card style={[
              { backgroundColor: '#2d2342', borderColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderRadius: 24, paddingHorizontal: 32, paddingVertical: 40, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 5, width: '100%', alignSelf: 'center' },
            ]}>
              <CardHeader style={{ alignItems: 'center', paddingTop: 0, paddingBottom: 0 }}>
                <Scissors size={40} color="#FFD180" style={tw`mb-2`} />
                <Text style={{ fontFamily: 'BebasNeue', fontWeight: '900', fontSize: 30, color: '#fff', textTransform: 'uppercase', textAlign: 'center', letterSpacing: 1, marginBottom: 2 }}>WELCOME BACK</Text>
                <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 2, marginBottom: 16 }}>Sign in to your account</Text>
              </CardHeader>
              <CardContent>
                <View style={{ gap: 20 }}>
                  <Input
                    label="Email"
                    placeholder="name@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    inputStyle={[{ height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.20)', color: '#fff', fontSize: 16, paddingHorizontal: 16, borderWidth: 1, width: '100%' }]}
                    placeholderTextColor="rgba(255,255,255,0.40)"
                  />
                  <View style={{ alignItems: 'flex-end', marginBottom: -4 }}>
                    <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading}>
                      <Text style={{ fontSize: 14, color: '#FFD180', textAlign: 'right' }}>Forgot password?</Text>
                    </TouchableOpacity>
                  </View>
                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!isLoading}
                    inputStyle={[{ height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.20)', color: '#fff', fontSize: 16, paddingHorizontal: 16, borderWidth: 1, width: '100%' }]}
                    placeholderTextColor="rgba(255,255,255,0.40)"
                  />
                  <Button 
                    onPress={handleSignIn} 
                    size="lg"
                    variant="default"
                    style={[
                      { height: 44, borderRadius: 9999, backgroundColor: '#FFD180', width: '100%', marginTop: 12 },
                    ]}
                    textStyle={{ fontFamily: 'BebasNeue', fontWeight: 'bold', fontSize: 18, color: '#262b2e', textAlign: 'center', textTransform: 'none' }}
                    disabled={isLoading}
                  >
                    {isLoading ? <LoadingSpinner color="#fff" /> : 'Sign in'}
                  </Button>
                </View>
              </CardContent>
              <CardFooter style={{ borderTopWidth: 0, marginTop: 0, paddingTop: 16, paddingBottom: 8 }}>
                <View style={tw`w-full items-center mt-0`}>
                  <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>Don't have an account?{' '}
                    <Text onPress={handleSignUp} style={{ color: '#FFD180', textDecorationLine: 'underline', fontWeight: 'bold' }}>Sign up</Text>
                  </Text>
                </View>
              </CardFooter>
            </Card>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}