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
import { useAuth } from '../hooks/useAuth';
import { theme } from '../lib/theme';
import { Scissors, User } from 'lucide-react-native';

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
                            ? 'Welcome to BOCM! Please complete your business profile setup.'
                            : 'Welcome to BOCM!',
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
        navigation.navigate('Terms');
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
                                        <Input
                                            label="Full Name"
                                            placeholder="John Doe"
                                            value={fullName}
                                            onChangeText={setFullName}
                                            autoCapitalize="words"
                                            autoCorrect={false}
                                            editable={!isLoading}
                                            inputStyle={tw`h-12`}
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
                                                inputStyle={tw`h-12`}
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
                                            inputStyle={tw`h-12`}
                                        />
                                        
                                        <Input
                                            label="Password"
                                            placeholder="Enter your password"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            editable={!isLoading}
                                            inputStyle={tw`h-12`}
                                        />
                                        
                                        <Input
                                            label="Confirm Password"
                                            placeholder="Re-enter your password"
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry
                                            autoCorrect={false}
                                            autoCapitalize="none"
                                            editable={!isLoading}
                                            inputStyle={tw`h-12`}
                                        />
                                    </View>
                                    
                                    <TouchableOpacity
                                        style={tw`flex-row items-center mt-4 mb-2`}
                                        onPress={() => setAgreeToTerms(!agreeToTerms)}
                                        disabled={isLoading}
                                    >
                                        <View style={[
                                            tw`w-5 h-5 rounded border mr-3 items-center justify-center`,
                                            { borderColor: 'rgba(255,255,255,0.40)' },
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