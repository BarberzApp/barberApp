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

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginPage() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { user, userProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      setCheckingSession(true);
      try {
        console.log('🔐 Checking existing session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('✅ Session found for user:', session.user.id);
          await handleRedirect(session.user.id);
        } else {
          console.log('❌ No existing session found');
          setCheckingSession(false);
        }
      } catch (e) {
        console.error('❌ Session check error:', e);
        setCheckingSession(false);
      }
    };
    checkSession();
  }, []);

  const handleRedirect = async (userId: string) => {
    try {
      console.log('🎯 Starting redirect process for user:', userId);
      
      // Fetch profile with retry
      let profile = null;
      let retries = 3;
      
      while (retries > 0) {
        console.log(`📋 Fetching profile - Attempt ${4 - retries}/3...`);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (data) {
          profile = data;
          console.log('✅ Profile fetched successfully');
          break;
        }
        
        console.log('❌ Profile fetch attempt failed:', error);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!profile) {
        console.log('❌ Could not fetch profile after retries');
        setCheckingSession(false);
        return;
      }

      // Check if profile needs completion
      if (!profile.role || !profile.username) {
        console.log('⚠️ Profile incomplete, redirecting to completion');
        navigation.replace('ProfileComplete' as any);
        return;
      }

      // Ensure barber row exists
      if (profile.role === 'barber') {
        console.log('💈 Checking for barber row...');
        const { data: existingBarber } = await supabase
          .from('barbers')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!existingBarber) {
          console.log('💈 Creating barber row...');
          const { error: insertError } = await supabase
            .from('barbers')
            .insert({
              user_id: userId,
              business_name: profile.business_name || '',
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error('❌ Failed to create barber row:', insertError);
          } else {
            console.log('✅ Barber row created successfully');
          }
        }
      }

      // Determine redirect path
      let redirectPath = 'MainTabs';
      
      if (profile.email === 'primbocm@gmail.com') {
        redirectPath = 'SuperAdmin' as any;
      } else if (profile.role === 'barber') {
        redirectPath = 'BarberOnboarding';
      } else if (profile.location) {
        redirectPath = 'MainTabs';
      } else {
        redirectPath = 'ClientOnboarding' as any;
      }

      console.log('🎯 Redirecting to:', redirectPath);
      navigation.replace(redirectPath as any);
      
    } catch (error) {
      console.error('❌ Redirect error:', error);
      setCheckingSession(false);
    }
  };

  const handleSignIn = async () => {
    setError(null);
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    console.log('🔐 Starting login process for:', email);
    
    try {
      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('❌ Authentication error:', authError);
        
        if (authError.message?.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else if (authError.message?.includes('Email not confirmed')) {
          setError('Please check your email to confirm your account');
        } else {
          setError(authError.message || 'An error occurred during login');
        }
        return;
      }

      if (!authData.user) {
        console.error('❌ No user data returned');
        setError('Login failed. Please try again.');
        return;
      }

      console.log('✅ Authentication successful for user:', authData.user.id);

      // Fetch profile with retry
      let profile = null;
      let retries = 3;
      
      while (retries > 0) {
        console.log(`📋 Fetching profile - Attempt ${4 - retries}/3...`);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();
        
        if (data) {
          profile = data;
          console.log('✅ Profile fetched successfully');
          break;
        }
        
        console.log('❌ Profile fetch attempt failed:', error);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!profile) {
        console.error('❌ Could not fetch profile after retries');
        setError('Could not load profile. Please try again.');
        return;
      }

      // Check if profile is complete
      if (!profile.role || !profile.username) {
        console.log('⚠️ Profile incomplete, user needs to complete registration');
        navigation.replace('ProfileComplete' as any);
        return;
      }

      // Ensure barber row exists for barber users
      if (profile.role === 'barber') {
        console.log('💈 Checking for barber row...');
        const { data: existingBarber } = await supabase
          .from('barbers')
          .select('id')
          .eq('user_id', authData.user.id)
          .maybeSingle();

        if (!existingBarber) {
          console.log('💈 Creating barber row...');
          const { error: insertError } = await supabase
            .from('barbers')
            .insert({
              user_id: authData.user.id,
              business_name: profile.business_name || '',
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error('❌ Failed to create barber row:', insertError);
          } else {
            console.log('✅ Barber row created successfully');
          }
        }
      }

      console.log('✅ Login successful, redirecting...');
      await handleRedirect(authData.user.id);
      
    } catch (error) {
      console.error('❌ Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Enter Email', 'Please enter your email address first');
      return;
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Check Your Email',
          'We\'ve sent you a password reset link. Please check your email.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Note: Google OAuth in React Native requires additional setup with expo-auth-session
      // This is a placeholder - you'll need to implement the actual OAuth flow
      Alert.alert('Coming Soon', 'Google Sign-In will be available soon!');
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  if (checkingSession) {
    return (
      <View style={[tw`flex-1 items-center justify-center`, { backgroundColor: theme.colors.primary }]}>
        <LoadingSpinner color={theme.colors.saffron} />
        <Text style={[tw`text-xl font-semibold mt-4`, { color: theme.colors.saffron }]}>Checking session...</Text>
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
              <Text style={[tw`text-2xl font-bold text-white text-center mb-1`]}>WELCOME BACK</Text>
              <Text style={tw`text-base text-white/80 text-center`}>Sign in to your account</Text>
            </CardHeader>

            <CardContent style={tw`px-6`}>
              {/* Error Display */}
              {error && (
                <View style={[
                  tw`p-3 mb-4 rounded-lg`,
                  { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 1 }
                ]}>
                  <Text style={{ color: '#ef4444', textAlign: 'center' }}>{error}</Text>
                </View>
              )}
              
              <View style={tw`gap-4`}>
                <Input
                  label="Email"
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError(null);
                  }}
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
                    onChangeText={(text) => {
                      setPassword(text);
                      setError(null);
                    }}
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

                {/* Divider */}
                <View style={tw`flex-row items-center my-4`}>
                  <View style={[tw`flex-1 h-px`, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                  <Text style={tw`mx-4 text-white/60`}>or</Text>
                  <View style={[tw`flex-1 h-px`, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                </View>

                {/* Google Sign In */}
                <TouchableOpacity
                  onPress={handleGoogleSignIn}
                  disabled={isLoading}
                  style={[
                    tw`w-full flex-row items-center justify-center py-3 rounded-lg`,
                    { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1 }
                  ]}
                >
                  <Text style={tw`text-white font-medium`}>Continue with Google</Text>
                </TouchableOpacity>
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