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
import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardFooter, LoadingSpinner } from '../components';
import { RootStackParamList } from '../types/types';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../lib/theme';
import { Scissors, User } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

const BocmLogo = () => (
  <Text style={[tw`text-2xl font-bold`, { color: theme.colors.saffron, fontFamily: 'BebasNeue' }]}>BOCM</Text>
);

type SignUpScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignUp'>;

type UserType = 'client' | 'barber';

export default function SignUpPage() {
    const navigation = useNavigation<SignUpScreenNavigationProp>();
    const { register, user } = useAuth();
    const [userType, setUserType] = useState<UserType>('client');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        if (userType === 'barber' && !businessName) {
            Alert.alert('Error', 'Please enter your business name');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        if (!agreeToTerms) {
            Alert.alert('Error', 'Please agree to terms and conditions');
            return;
        }
        setIsLoading(true);
        try {
            const success = await register(
                fullName, 
                email, 
                password, 
                userType,
                userType === 'barber' ? businessName : undefined
            );
            if (success) {
                const needsEmailConfirmation = !user;
                if (needsEmailConfirmation) {
                    Alert.alert(
                        'Check Your Email',
                        'We\'ve sent you a confirmation email. Please verify your email address to complete registration.',
                        [
                            {
                                text: 'OK',
                                onPress: () => navigation.navigate('Login')
                            }
                        ]
                    );
                } else {
                    Alert.alert(
                        'Registration Successful',
                        userType === 'barber' 
                            ? 'Welcome to BarberHub! Please complete your business profile setup.'
                            : 'Welcome to BarberHub!',
                        [
                            {
                                text: 'OK',
                                onPress: () => {
                                    if (userType === 'barber') {
                                        navigation.navigate('BarberOnboarding' as any);
                                    } else {
                                        navigation.navigate('FindBarber');
                                    }
                                }
                            }
                        ]
                    );
                }
            } else {
                Alert.alert('Registration Failed', 'An error occurred during registration. Please try again.');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignIn = () => {
        navigation.navigate('Login');
    };

    const handleTermsPress = () => {
        Alert.alert('Info', 'Terms and conditions page coming soon!');
    };

    return (
        <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.primary }]}> 
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={tw`flex-1`}
            >
                <ScrollView
                    contentContainerStyle={tw`flex-grow justify-center`}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={tw`w-full pt-10 pb-6 px-6`}> {/* More top padding for mobile */}
                        <View style={tw`max-w-3xl mx-auto flex-row items-center`}> {/* Left align logo */}
                            <BocmLogo />
                        </View>
                    </View>
                    {/* Main Content */}
                    <View style={tw`flex-1 justify-center items-center px-4`}> 
                        <View style={tw`w-full max-w-md space-y-8`}> 
                            <View style={tw`items-center`}> 
                                <Scissors size={48} color={theme.colors.saffron} style={tw`mb-2`} />
                                <Text style={[tw`mt-6 text-3xl`, { color: '#fff', fontFamily: 'BebasNeue', letterSpacing: 1 }]}>Create your account</Text>
                                <Text style={[tw`mt-2 text-sm`, { color: 'rgba(255,255,255,0.8)' }]}>Join BOCM and start your journey</Text>
                            </View>
                            <BlurView intensity={30} tint="dark" style={[tw`w-full rounded-3xl`, { overflow: 'hidden' }]}> 
                                <Card style={[tw`border shadow-2xl rounded-3xl`, {
                                    backgroundColor: 'rgba(45,35,66,0.7)', // glassy deep purple
                                    borderColor: 'rgba(255,255,255,0.10)',
                                    shadowColor: '#000',
                                    shadowOpacity: 0.15,
                                    shadowRadius: 8,
                                    elevation: 5,
                                }]}> 
                                    <CardContent style={tw`pt-6`}> 
                                        <View style={[tw`flex-row mb-6 rounded-xl overflow-hidden`, { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.20)' }]}> 
                                            <TouchableOpacity
                                                style={[tw`flex-1 py-3 flex-row items-center justify-center`, userType === 'client' ? { backgroundColor: '#FFD180' } : {}, { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }]}
                                                onPress={() => setUserType('client')}
                                                disabled={isLoading}
                                            >
                                                <User size={18} color={userType === 'client' ? '#2d2342' : '#fff'} style={tw`mr-2`} />
                                                <Text style={[userType === 'client' ? { color: '#2d2342', fontWeight: '600' } : { color: '#fff' }]}>Client</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[tw`flex-1 py-3 flex-row items-center justify-center`, userType === 'barber' ? { backgroundColor: '#FFD180' } : {}, { borderTopRightRadius: 12, borderBottomRightRadius: 12 }]}
                                                onPress={() => setUserType('barber')}
                                                disabled={isLoading}
                                            >
                                                <Scissors size={18} color={userType === 'barber' ? '#2d2342' : '#fff'} style={tw`mr-2`} />
                                                <Text style={[userType === 'barber' ? { color: '#2d2342', fontWeight: '600' } : { color: '#fff' }]}>Barber</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <Input
                                            label="Full Name"
                                            placeholder="John Doe"
                                            value={fullName}
                                            onChangeText={setFullName}
                                            autoCapitalize="words"
                                            autoCorrect={false}
                                            editable={!isLoading}
                                            style={[
                                                tw`h-11 rounded-md px-3 text-base mb-4`,
                                                {
                                                    backgroundColor: '#3a2d4d',
                                                    borderColor: '#FFD180',
                                                    color: '#fff',
                                                },
                                            ]}
                                            placeholderTextColor="rgba(255,255,255,0.40)"
                                        />
                                        {userType === 'barber' && (
                                            <Input
                                                label="Business Name"
                                                placeholder="Your Barbershop Name"
                                                value={businessName}
                                                onChangeText={setBusinessName}
                                                autoCapitalize="words"
                                                autoCorrect={false}
                                                editable={!isLoading}
                                                style={[
                                                    tw`h-11 rounded-md px-3 text-base mb-4`,
                                                    {
                                                        backgroundColor: '#3a2d4d',
                                                        borderColor: '#FFD180',
                                                        color: '#fff',
                                                    },
                                                ]}
                                                placeholderTextColor="rgba(255,255,255,0.40)"
                                            />
                                        )}
                                        <Input
                                            label="Email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            editable={!isLoading}
                                            style={[
                                                tw`h-11 rounded-md px-3 text-base mb-4`,
                                                {
                                                    backgroundColor: '#3a2d4d',
                                                    borderColor: '#FFD180',
                                                    color: '#fff',
                                                },
                                            ]}
                                            placeholderTextColor="rgba(255,255,255,0.40)"
                                        />
                                        <Input
                                            label="Password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                            autoCapitalize="none"
                                            editable={!isLoading}
                                            style={[
                                                tw`h-11 rounded-md px-3 text-base mb-4`,
                                                {
                                                    backgroundColor: '#3a2d4d',
                                                    borderColor: '#FFD180',
                                                    color: '#fff',
                                                },
                                            ]}
                                            placeholderTextColor="rgba(255,255,255,0.40)"
                                        />
                                        <Input
                                            label="Confirm Password"
                                            placeholder="Re-enter your password"
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry
                                            autoCapitalize="none"
                                            editable={!isLoading}
                                            style={[
                                                tw`h-11 rounded-md px-3 text-base mb-6`,
                                                {
                                                    backgroundColor: '#3a2d4d',
                                                    borderColor: '#FFD180',
                                                    color: '#fff',
                                                },
                                            ]}
                                            placeholderTextColor="rgba(255,255,255,0.40)"
                                        />
                                        <TouchableOpacity
                                            style={tw`flex-row items-center mb-4`}
                                            onPress={() => setAgreeToTerms(!agreeToTerms)}
                                            disabled={isLoading}
                                        >
                                            <View style={[tw`w-5 h-5 rounded border border-white/20 mr-2 items-center justify-center`, agreeToTerms ? { backgroundColor: theme.colors.saffron } : { backgroundColor: 'transparent' }]}> 
                                                {agreeToTerms && <View style={tw`w-3 h-3 rounded bg-primary`} />}
                                            </View>
                                            <Text style={tw`text-sm text-white`}>I agree to the </Text>
                                            <Text
                                                onPress={() => navigation.navigate('Terms')}
                                                style={[
                                                    tw`text-sm`,
                                                    {
                                                        color: theme.colors.saffron,
                                                        textDecorationLine: 'underline',
                                                        fontWeight: 'bold',
                                                        paddingHorizontal: 2,
                                                    },
                                                ]}
                                            >
                                                terms and conditions
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={tw`my-2`}
                                            onPress={() => navigation.navigate('Terms')}
                                        >
                                            <Text style={{ color: theme.colors.saffron, textDecorationLine: 'underline', textAlign: 'center', fontSize: 14 }}>
                                                View Terms & Conditions
                                            </Text>
                                        </TouchableOpacity>
                                        <Button
                                            onPress={handleSignUp}
                                            size="lg"
                                            variant="default"
                                            style={tw`w-full h-11 bg-[#c98f42] rounded-full`}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <LoadingSpinner color="#fff" /> : 'Create account'}
                                        </Button>
                                    </CardContent>
                                    <CardFooter>
                                        <View style={tw`w-full items-center mt-4`}>
                                            <Text style={tw`text-sm text-white/80`}>Already have an account?{' '}
                                                <Text onPress={handleSignIn} style={[tw`font-semibold`, { color: theme.colors.saffron }]}>Sign in</Text>
                                            </Text>
                                        </View>
                                    </CardFooter>
                                </Card>
                            </BlurView>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}