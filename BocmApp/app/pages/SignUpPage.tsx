import React, { useState } from 'react';
import {
    View,
    Text,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import { Button, Input, Card, CardContent, CardFooter, LoadingSpinner } from '../components';
import { RootStackParamList } from '../types/types';
import { supabase } from '../lib/supabase';
import { theme } from '../lib/theme';
import { Scissors, User } from 'lucide-react-native';

type SignUpScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignUp'>;

type UserType = 'client' | 'barber';

export default function SignUpPage() {
    const navigation = useNavigation<SignUpScreenNavigationProp>();
    const [userType, setUserType] = useState<UserType>('client');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                newErrors.email = 'Please enter a valid email address';
            }
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters long';
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (userType === 'barber' && !businessName.trim()) {
            newErrors.businessName = 'Business name is required for barbers';
        }

        if (!agreeToTerms) {
            newErrors.terms = 'You must agree to the terms and conditions';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignUp = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        console.log('=== Registration Process Started ===');
        console.log('Registration Data:', { name: fullName, email, role: userType, businessName });

        try {
            // Create auth user with metadata
            console.log('Creating auth user...');
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: fullName,
                        role: userType,
                        business_name: businessName,
                    },
                },
            });

            if (authError) {
                console.error('Auth Error:', authError);
                
                // Check for user already registered error
                if (authError.message?.includes('User already registered')) {
                    Alert.alert(
                        'Account Exists',
                        'An account with this email already exists. Please sign in instead.',
                        [
                            { text: 'Go to Login', onPress: () => navigation.navigate('Login') }
                        ]
                    );
                    return;
                }
                
                setErrors({ general: authError.message || 'Registration failed' });
                return;
            }

            console.log('Auth Data:', authData);

            // Check if email confirmation is required
            if (authData.user && !authData.session) {
                console.log('Email confirmation required');
                Alert.alert(
                    'Check Your Email',
                    'We\'ve sent you a confirmation email. Please verify your email address to complete registration.',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.navigate('EmailConfirmation')
                        }
                    ]
                );
                return;
            }

            if (!authData.user) {
                console.error('No user returned from signup');
                setErrors({ general: 'Registration failed. Please try again.' });
                return;
            }

            // Try to create/update profile
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: authData.user.id,
                    email: authData.user.email,
                    name: fullName,
                    username: email.split('@')[0], // Generate username from email
                    role: userType,
                    business_name: businessName,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                });

            if (profileError) {
                console.error('Profile creation error:', profileError);
                // Don't fail registration, profile will be created on first login
            }

            // For barbers, try to create business profile
            if (userType === 'barber' && businessName) {
                console.log('Creating business profile...');
                const { error: businessError } = await supabase
                    .from('barbers')
                    .insert({
                        user_id: authData.user.id,
                        business_name: businessName,
                        status: 'pending',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    });

                if (businessError) {
                    console.error('Business Profile Creation Failed:', businessError);
                    // Don't fail registration, barber row will be created on first login
                }
            }

            console.log('Registration completed successfully');
            
            // Navigate based on user type
            if (authData.session) {
                Alert.alert(
                    'Registration Successful',
                    userType === 'barber' 
                        ? 'Welcome to BOCM! Please complete your business profile setup.'
                        : 'Welcome to BOCM!',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                if (userType === 'barber') {
                                    navigation.navigate('BarberOnboarding');
                                } else {
                                    navigation.navigate('MainTabs' as any);
                                }
                            }
                        }
                    ]
                );
            }

        } catch (error) {
            console.error('Registration Process Failed:', error);
            setErrors({ general: 'An unexpected error occurred. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignIn = () => {
        navigation.navigate('Login');
    };

    const handleTermsPress = () => {
        navigation.navigate('Terms');
    };

    const handleGoogleSignUp = async () => {
        try {
            // Note: Google OAuth in React Native requires additional setup
            Alert.alert('Coming Soon', 'Google Sign-Up will be available soon!');
        } catch (error) {
            console.error('Google sign-up error:', error);
        }
    };

    return (
        <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.primary }]}> 
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={tw`flex-1`}
            >
                <ScrollView
                    contentContainerStyle={tw`flex-grow`}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Main Content */}
                    <View style={tw`flex-1 justify-center px-6 py-4`}> 
                        <View style={tw`w-full max-w-md mx-auto`}> 
                            <View style={tw`items-center mb-6`}> 
                                <Text style={[tw`text-2xl font-bold text-white text-center`]}>
                                    Create your account
                                </Text>
                                <Text style={tw`mt-2 text-sm text-white/80 text-center`}>
                                    Join BOCM and start your journey
                                </Text>
                            </View>
                            
                            <Card style={[
                                tw`w-full`,
                                {
                                    backgroundColor: 'rgba(45,35,66,0.9)',
                                    borderColor: 'rgba(255,255,255,0.10)',
                                    borderWidth: 1,
                                    borderRadius: 24,
                                    shadowColor: '#000',
                                    shadowOpacity: 0.15,
                                    shadowRadius: 8,
                                    elevation: 5,
                                }
                            ]}> 
                                <CardContent style={tw`px-6 py-6`}> 
                                    {/* Error Display */}
                                    {errors.general && (
                                        <View style={[
                                            tw`p-3 mb-4 rounded-lg`,
                                            { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 1 }
                                        ]}>
                                            <Text style={{ color: '#ef4444', textAlign: 'center' }}>{errors.general}</Text>
                                        </View>
                                    )}

                                    <View style={[
                                        tw`flex-row mb-6 rounded-xl overflow-hidden`,
                                        { backgroundColor: 'rgba(255,255,255,0.10)' }
                                    ]}> 
                                        <TouchableOpacity
                                            style={[
                                                tw`flex-1 py-3 flex-row items-center justify-center`,
                                                userType === 'client' ? { backgroundColor: '#FFD180' } : {}
                                            ]}
                                            onPress={() => setUserType('client')}
                                            disabled={isLoading}
                                        >
                                            <User size={18} color={userType === 'client' ? '#2d2342' : '#fff'} style={tw`mr-2`} />
                                            <Text style={[
                                                tw`font-semibold`,
                                                { color: userType === 'client' ? '#2d2342' : '#fff' }
                                            ]}>
                                                Client
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                tw`flex-1 py-3 flex-row items-center justify-center`,
                                                userType === 'barber' ? { backgroundColor: '#FFD180' } : {}
                                            ]}
                                            onPress={() => setUserType('barber')}
                                            disabled={isLoading}
                                        >
                                            <Scissors size={18} color={userType === 'barber' ? '#2d2342' : '#fff'} style={tw`mr-2`} />
                                            <Text style={[
                                                tw`font-semibold`,
                                                { color: userType === 'barber' ? '#2d2342' : '#fff' }
                                            ]}>
                                                Barber
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    
                                    <View style={tw`gap-4`}>
                                        <View>
                                            <Input
                                                label="Full Name"
                                                placeholder="John Doe"
                                                value={fullName}
                                                onChangeText={(text) => {
                                                    setFullName(text);
                                                    setErrors({ ...errors, fullName: '' });
                                                }}
                                                autoCapitalize="words"
                                                autoCorrect={false}
                                                editable={!isLoading}
                                                inputStyle={[tw`h-12`, errors.fullName ? { borderColor: '#ef4444' } : {}]}
                                            />
                                            {errors.fullName && (
                                                <Text style={tw`text-red-400 text-xs mt-1`}>{errors.fullName}</Text>
                                            )}
                                        </View>
                                        
                                        {userType === 'barber' && (
                                            <View>
                                                <Input
                                                    label="Business Name"
                                                    placeholder="Your Barbershop Name"
                                                    value={businessName}
                                                    onChangeText={(text) => {
                                                        setBusinessName(text);
                                                        setErrors({ ...errors, businessName: '' });
                                                    }}
                                                    autoCapitalize="words"
                                                    autoCorrect={false}
                                                    editable={!isLoading}
                                                    inputStyle={[tw`h-12`, errors.businessName ? { borderColor: '#ef4444' } : {}]}
                                                />
                                                {errors.businessName && (
                                                    <Text style={tw`text-red-400 text-xs mt-1`}>{errors.businessName}</Text>
                                                )}
                                            </View>
                                        )}
                                        
                                        <View>
                                            <Input
                                                label="Email"
                                                placeholder="you@example.com"
                                                value={email}
                                                onChangeText={(text) => {
                                                    setEmail(text);
                                                    setErrors({ ...errors, email: '' });
                                                }}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                editable={!isLoading}
                                                inputStyle={[tw`h-12`, errors.email ? { borderColor: '#ef4444' } : {}]}
                                            />
                                            {errors.email && (
                                                <Text style={tw`text-red-400 text-xs mt-1`}>{errors.email}</Text>
                                            )}
                                        </View>
                                        
                                        <View>
                                            <Input
                                                label="Password"
                                                placeholder="Enter your password"
                                                value={password}
                                                onChangeText={(text) => {
                                                    setPassword(text);
                                                    setErrors({ ...errors, password: '' });
                                                }}
                                                secureTextEntry
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                editable={!isLoading}
                                                inputStyle={[tw`h-12`, errors.password ? { borderColor: '#ef4444' } : {}]}
                                            />
                                            {errors.password && (
                                                <Text style={tw`text-red-400 text-xs mt-1`}>{errors.password}</Text>
                                            )}
                                        </View>
                                        
                                        <View>
                                            <Input
                                                label="Confirm Password"
                                                placeholder="Re-enter your password"
                                                value={confirmPassword}
                                                onChangeText={(text) => {
                                                    setConfirmPassword(text);
                                                    setErrors({ ...errors, confirmPassword: '' });
                                                }}
                                                secureTextEntry
                                                autoCorrect={false}
                                                autoCapitalize="none"
                                                editable={!isLoading}
                                                inputStyle={[tw`h-12`, errors.confirmPassword ? { borderColor: '#ef4444' } : {}]}
                                            />
                                            {errors.confirmPassword && (
                                                <Text style={tw`text-red-400 text-xs mt-1`}>{errors.confirmPassword}</Text>
                                            )}
                                        </View>
                                    </View>
                                    
                                    <TouchableOpacity
                                        style={tw`flex-row items-center mt-4 mb-2`}
                                        onPress={() => {
                                            setAgreeToTerms(!agreeToTerms);
                                            setErrors({ ...errors, terms: '' });
                                        }}
                                        disabled={isLoading}
                                    >
                                        <View style={[
                                            tw`w-5 h-5 rounded border mr-3 items-center justify-center`,
                                            { borderColor: errors.terms ? '#ef4444' : 'rgba(255,255,255,0.40)' },
                                            agreeToTerms ? { backgroundColor: theme.colors.saffron } : { backgroundColor: 'transparent' }
                                        ]}> 
                                            {agreeToTerms && (
                                                <View style={tw`w-2.5 h-2.5 rounded-sm bg-[#2d2342]`} />
                                            )}
                                        </View>
                                        <Text style={tw`text-sm text-white flex-1`}>
                                            I agree to the{' '}
                                            <Text
                                                onPress={handleTermsPress}
                                                style={tw`text-[#FFD180] underline font-bold`}
                                            >
                                                terms and conditions
                                            </Text>
                                        </Text>
                                    </TouchableOpacity>
                                    {errors.terms && (
                                        <Text style={tw`text-red-400 text-xs mb-2`}>{errors.terms}</Text>
                                    )}
                                    
                                    <TouchableOpacity
                                        style={tw`mb-6`}
                                        onPress={handleTermsPress}
                                    >
                                        <Text style={tw`text-[#FFD180] underline text-center text-sm`}>
                                            View Terms & Conditions
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    <Button
                                        onPress={handleSignUp}
                                        size="lg"
                                        style={[
                                            tw`w-full`,
                                            { backgroundColor: '#FFD180', height: 48 }
                                        ]}
                                        textStyle={{ color: '#262b2e', fontSize: 18 }}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <LoadingSpinner color="#262b2e" /> : 'Create account'}
                                    </Button>

                                    {/* Divider */}
                                    <View style={tw`flex-row items-center my-4`}>
                                        <View style={[tw`flex-1 h-px`, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                                        <Text style={tw`mx-4 text-white/60`}>or</Text>
                                        <View style={[tw`flex-1 h-px`, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                                    </View>

                                    {/* Google Sign Up */}
                                    <TouchableOpacity
                                        onPress={handleGoogleSignUp}
                                        disabled={isLoading}
                                        style={[
                                            tw`w-full flex-row items-center justify-center py-3 rounded-lg`,
                                            { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1 }
                                        ]}
                                    >
                                        <Text style={tw`text-white font-medium`}>Sign up with Google</Text>
                                    </TouchableOpacity>
                                </CardContent>
                                
                                <CardFooter style={tw`pb-6`}>
                                    <View style={tw`w-full items-center`}>
                                        <Text style={tw`text-sm text-white/80`}>
                                            Already have an account?{' '}
                                            <Text onPress={handleSignIn} style={tw`font-semibold text-[#FFD180]`}>
                                                Sign in
                                            </Text>
                                        </Text>
                                    </View>
                                </CardFooter>
                            </Card>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}