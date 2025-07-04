import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import Button from '../components/Button';
import { RootStackParamList } from '../types/types';
import { useAuth } from '../hooks/useAuth';

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
                // Check if email confirmation is required
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
        <SafeAreaView style={tw`flex-1 bg-gray-900`}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={tw`flex-1`}
            >
                <ScrollView
                    contentContainerStyle={tw`flex-grow justify-center`}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={tw`flex-1 justify-center items-center px-6 py-8`}>
                        <View style={tw`mb-6`}>
                            <Text style={tw`text-white text-3xl font-bold text-center`}>
                                Create your account
                            </Text>
                            <Text style={tw`text-gray-400 text-center mt-2`}>
                                Join BarberHub and start your journey
                            </Text>
                        </View>

                        <View style={tw`w-full max-w-md bg-gray-800 rounded-2xl p-8`}>
                            <View style={tw`flex-row mb-6`}>
                                <TouchableOpacity
                                    style={tw`flex-1 py-3 rounded-l-lg ${
                                        userType === 'client' ? 'bg-purple-600' : 'bg-gray-900'
                                    }`}
                                    onPress={() => setUserType('client')}
                                    disabled={isLoading}
                                >
                                    <Text style={tw`text-center ${
                                        userType === 'client' ? 'text-white font-semibold' : 'text-gray-400'
                                    }`}>
                                        Client
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={tw`flex-1 py-3 rounded-r-lg ${
                                        userType === 'barber' ? 'bg-purple-600' : 'bg-gray-900'
                                    }`}
                                    onPress={() => setUserType('barber')}
                                    disabled={isLoading}
                                >
                                    <Text style={tw`text-center ${
                                        userType === 'barber' ? 'text-white font-semibold' : 'text-gray-400'
                                    }`}>
                                        Barber
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View>
                                <View style={tw`mb-4`}>
                                    <Text style={tw`text-gray-300 text-sm mb-2`}>Full Name</Text>
                                    <TextInput
                                        style={tw`bg-gray-900 text-white px-4 py-3 rounded-lg`}
                                        placeholder="John Doe"
                                        placeholderTextColor="#6B7280"
                                        value={fullName}
                                        onChangeText={setFullName}
                                        autoCapitalize="words"
                                        autoCorrect={false}
                                        editable={!isLoading}
                                    />
                                </View>

                                {userType === 'barber' && (
                                    <View style={tw`mb-4`}>
                                        <Text style={tw`text-gray-300 text-sm mb-2`}>Business Name</Text>
                                        <TextInput
                                            style={tw`bg-gray-900 text-white px-4 py-3 rounded-lg`}
                                            placeholder="Your Barbershop Name"
                                            placeholderTextColor="#6B7280"
                                            value={businessName}
                                            onChangeText={setBusinessName}
                                            autoCapitalize="words"
                                            autoCorrect={false}
                                            editable={!isLoading}
                                        />
                                    </View>
                                )}

                                <View style={tw`mb-4`}>
                                    <Text style={tw`text-gray-300 text-sm mb-2`}>Email</Text>
                                    <TextInput
                                        style={tw`bg-gray-900 text-white px-4 py-3 rounded-lg`}
                                        placeholder="you@example.com"
                                        placeholderTextColor="#6B7280"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        editable={!isLoading}
                                    />
                                </View>

                                <View style={tw`mb-4`}>
                                    <Text style={tw`text-gray-300 text-sm mb-2`}>Password</Text>
                                    <TextInput
                                        style={tw`bg-gray-900 text-white px-4 py-3 rounded-lg`}
                                        placeholder="••••••••"
                                        placeholderTextColor="#6B7280"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        autoComplete="off"
                                        textContentType="none"
                                        editable={!isLoading}
                                    />
                                </View>

                                <View style={tw`mb-6`}>
                                    <Text style={tw`text-gray-300 text-sm mb-2`}>Confirm Password</Text>
                                    <TextInput
                                        style={tw`bg-gray-900 text-white px-4 py-3 rounded-lg`}
                                        placeholder="••••••••"
                                        placeholderTextColor="#6B7280"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        autoComplete="off"
                                        textContentType="none"
                                        editable={!isLoading}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={tw`flex-row items-center mb-6`}
                                    onPress={() => setAgreeToTerms(!agreeToTerms)}
                                    disabled={isLoading}
                                >
                                    <View style={tw`w-5 h-5 border-2 border-gray-400 rounded mr-3 ${
                                        agreeToTerms ? 'bg-purple-600 border-purple-600' : ''
                                    }`}>
                                        {agreeToTerms && (
                                            <Text style={tw`text-white text-xs text-center`}>✓</Text>
                                        )}
                                    </View>
                                    <Text style={tw`text-gray-300`}>
                                        I agree to the{' '}
                                        <Text
                                            style={tw`text-purple-400`}
                                            onPress={handleTermsPress}
                                        >
                                            terms and conditions
                                        </Text>
                                    </Text>
                                </TouchableOpacity>

                                {isLoading ? (
                                    <View style={tw`bg-purple-600 py-4 rounded-lg`}>
                                        <ActivityIndicator color="white" />
                                    </View>
                                ) : (
                                    <Button
                                        onPress={handleSignUp}
                                        size="lg"
                                        style={tw`w-full`}
                                        disabled={isLoading}
                                    >
                                        Create account
                                    </Button>
                                )}

                                <View style={tw`mt-6 flex-row justify-center`}>
                                    <Text style={tw`text-gray-400`}>
                                        Already have an account?{' '}
                                        <Text
                                            style={tw`text-purple-400`}
                                            onPress={handleSignIn}
                                        >
                                            Sign in
                                        </Text>
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}