import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import { RootStackParamList } from '../shared/types';
import { supabase } from '../shared/lib/supabase';
import { useAuth } from '../shared/hooks/useAuth';
const Icon = require('react-native-vector-icons/Feather').default;
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { WebView } from 'react-native-webview';
import { theme } from '../shared/lib/theme';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "";

type BarberOnboardingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BarberOnboarding'>;

const steps = [
    {
        id: 'business',
        title: 'Business Info',
        subtitle: 'Tell us about you',
    },
    {
        id: 'services',
        title: 'Services',
        subtitle: 'What you offer',
    },
    {
        id: 'stripe',
        title: 'Payments',
        subtitle: 'Connect Stripe',
    },
];

interface FormData {
    businessName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    bio: string;
    specialties: string;
    services: Array<{ name: string; price: number; duration: number }>;
    stripeConnected: boolean;
}

export default function BarberOnboardingPage() {
    const navigation = useNavigation<BarberOnboardingNavigationProp>();
    const { user, userProfile } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [stripeStatus, setStripeStatus] = useState<string | null>(null);
    const [initialDataLoading, setInitialDataLoading] = useState(true);
    const [showStripeWebView, setShowStripeWebView] = useState(false);
    const [stripeUrl, setStripeUrl] = useState('');

    const [formData, setFormData] = useState<FormData>({
        businessName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        bio: '',
        specialties: '',
        services: [
            { name: 'Haircut', price: 30, duration: 30 },
            { name: 'Beard Trim', price: 20, duration: 20 },
        ],
        stripeConnected: false
    });

    // Check Stripe account status
    const checkStripeStatus = async () => {
        console.log('[checkStripeStatus] Starting status check for user:', user?.id);
        try {
            const url = `${API_BASE_URL}/api/connect/refresh-account-status`;
            console.log('[checkStripeStatus] Making request to:', url);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user?.id }),
            });

            console.log('[checkStripeStatus] Response status:', response.status);
            const responseText = await response.text();
            console.log('[checkStripeStatus] Raw response:', responseText);

            if (response.ok) {
                const data = JSON.parse(responseText);
                console.log('[checkStripeStatus] Parsed data:', data);
                
                if (data.success && data.data.hasStripeAccount) {
                    const isActive = data.data.currentStatus === 'active';
                    console.log('[checkStripeStatus] Account status:', data.data.currentStatus);
                    console.log('[checkStripeStatus] Is active:', isActive);
                    
                    setFormData(prev => ({ ...prev, stripeConnected: isActive }));
                    setStripeStatus(data.data.currentStatus);
                    
                    if (isActive) {
                        console.log('[checkStripeStatus] Account is active!');
                        return true;
                    } else if (data.data.currentStatus === 'pending') {
                        console.log('[checkStripeStatus] Account is pending');
                        // Don't show alert here - let the UI handle it
                        return false;
                    }
                } else {
                    console.log('[checkStripeStatus] No Stripe account found');
                }
            } else {
                console.error('[checkStripeStatus] Request failed with status:', response.status);
            }
            return false;
        } catch (error) {
            console.error('[checkStripeStatus] Error:', error);
            return false;
        }
    };

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!user) {
                console.log('[fetchProfileData] No user found');
                return;
            }
            
            console.log('[fetchProfileData] Fetching profile for user:', user.id);
            
            try {
                const { data: barber, error: barberError } = await supabase
                    .from('barbers')
                    .select('id, business_name, bio, specialties, stripe_account_status, stripe_account_id')
                    .eq('user_id', user.id)
                    .single();

                if (barberError) {
                    console.log('[fetchProfileData] Barber fetch error:', barberError);
                } else {
                    console.log('[fetchProfileData] Barber data:', barber);
                }

                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('phone, location')
                    .eq('id', user.id)
                    .single();

                if (profileError) {
                    console.log('[fetchProfileData] Profile fetch error:', profileError);
                } else {
                    console.log('[fetchProfileData] Profile data:', profile);
                }

                let address = '', city = '', state = '', zipCode = '';
                if (profile?.location) {
                    const location = profile.location.trim();
                    const fullMatch = location.match(/^(.+?),\s*([^,]+?),\s*([A-Za-z]{2,})\s*(\d{5})?$/);
                    if (fullMatch) {
                        address = fullMatch[1].trim();
                        city = fullMatch[2].trim();
                        state = fullMatch[3].trim();
                        zipCode = fullMatch[4] || '';
                    }
                }

                let services: Array<{ name: string; price: number; duration: number }> = [];
                if (barber?.id) {
                    const { data: existingServices } = await supabase
                        .from('services')
                        .select('name, price, duration')
                        .eq('barber_id', barber.id);

                    if (existingServices && existingServices.length > 0) {
                        services = existingServices.map(s => ({
                            name: s.name || '',
                            price: typeof s.price === 'number' ? s.price : 0,
                            duration: typeof s.duration === 'number' ? s.duration : 30,
                        }));
                    }
                }

                setFormData(prev => ({
                    ...prev,
                    businessName: barber?.business_name || '',
                    bio: barber?.bio || '',
                    specialties: Array.isArray(barber?.specialties) ? barber.specialties.join(', ') : (barber?.specialties || ''),
                    phone: profile?.phone || '',
                    address,
                    city,
                    state,
                    zipCode,
                    services: services.length > 0 ? services : prev.services,
                    stripeConnected: barber?.stripe_account_status === 'active'
                }));

                // Set initial stripe status from database
                if (barber?.stripe_account_id) {
                    console.log('[fetchProfileData] Found existing Stripe account:', barber.stripe_account_id);
                    console.log('[fetchProfileData] Current status:', barber.stripe_account_status);
                    setStripeStatus(barber.stripe_account_status || null);
                    
                    // Check current status with Stripe
                    console.log('[fetchProfileData] Checking current Stripe status...');
                    const isActive = await checkStripeStatus();
                    console.log('[fetchProfileData] Stripe check result - isActive:', isActive);
                } else {
                    console.log('[fetchProfileData] No Stripe account ID found');
                    setStripeStatus(null);
                }
            } catch (error) {
                console.error('[fetchProfileData] Error:', error);
            } finally {
                setInitialDataLoading(false);
            }
        };

        if (user) {
            fetchProfileData();
        }
    }, [user]);

    // Listen for app focus to check Stripe status
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            console.log('[Focus] App focused - currentStep:', currentStep, 'stripeStatus:', stripeStatus);
            if (currentStep === 2 && user?.id && stripeStatus !== 'active') {
                console.log('[Focus] Checking Stripe status on focus...');
                checkStripeStatus();
            }
        });

        return unsubscribe;
    }, [navigation, currentStep, user, stripeStatus]);

    const validateStep = (stepIndex: number): boolean => {
        if (stepIndex === 0) {
            if (!formData.businessName.trim() || !formData.phone.trim() || 
                !formData.address.trim() || !formData.city.trim() || 
                !formData.state.trim() || !formData.zipCode.trim() || 
                !formData.bio.trim()) {
                Alert.alert('Missing Information', 'Please fill in all required fields');
                return false;
            }
            
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
                Alert.alert('Invalid Phone', 'Please enter a valid phone number');
                return false;
            }

            const zipRegex = /^\d{5}(-\d{4})?$/;
            if (!zipRegex.test(formData.zipCode)) {
                Alert.alert('Invalid ZIP', 'Please enter a valid ZIP code');
                return false;
            }
        }

        if (stepIndex === 1) {
            if (formData.services.length === 0) {
                Alert.alert('No Services', 'Please add at least one service');
                return false;
            }
            
            for (const service of formData.services) {
                if (!service.name.trim() || service.price <= 0 || service.duration < 15) {
                    Alert.alert('Invalid Service', 'Please check all services have valid information');
                    return false;
                }
            }
        }

        // Stripe step validation is optional
        return true;
    };

    const handleNext = async () => {
        if (!validateStep(currentStep)) return;

        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            await handleSubmit();
        }
    };

    const handleSubmit = async () => {
        console.log('[handleSubmit] Starting profile submission...');
        setLoading(true);
        try {
            const { error: barberError } = await supabase
                .from('barbers')
                .upsert({
                    user_id: user?.id,
                    business_name: formData.businessName,
                    bio: formData.bio,
                    specialties: formData.specialties.split(',').map(s => s.trim()).filter(s => s),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            if (barberError) throw barberError;

            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    phone: formData.phone,
                    location: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user?.id);

            if (profileError) throw profileError;

            if (formData.services.length > 0 && user) {
                const { data: barberRow } = await supabase
                    .from('barbers')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();
                
                if (barberRow) {
                    await supabase.from('services').delete().eq('barber_id', barberRow.id);
                    
                    const { error: servicesError } = await supabase
                        .from('services')
                        .insert(
                            formData.services.map(service => ({
                                barber_id: barberRow.id,
                                name: service.name,
                                price: service.price,
                                duration: service.duration,
                            }))
                        );
                    
                    if (servicesError) throw servicesError;
                }
            }

            console.log('[handleSubmit] Profile update successful');
            Alert.alert(
                'Success!',
                'Your barber profile is now complete.',
                [{
                    text: 'OK',
                    onPress: () => navigation.navigate('Settings' as any)
                }]
            );
        } catch (error) {
            console.error('[handleSubmit] Error:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStripeConnect = async () => {
        console.log('[handleStripeConnect] Starting Stripe connection...');
        console.log('[handleStripeConnect] User:', user);
        console.log('[handleStripeConnect] Current stripe status:', stripeStatus);
        
        setLoading(true);
        try {
            // Get barber ID first
            console.log('[handleStripeConnect] Fetching barber ID for user:', user?.id);
            const { data: barber, error: barberError } = await supabase
                .from('barbers')
                .select('id')
                .eq('user_id', user?.id)
                .single();
                
            if (barberError || !barber?.id) {
                console.error('[handleStripeConnect] Barber fetch error:', barberError);
                Alert.alert(
                    'Error',
                    'Could not find your barber profile. Please complete your business info first.'
                );
                return;
            }
            
            console.log('[handleStripeConnect] Found barber ID:', barber.id);

            // First, check if there's already a Stripe account and refresh its status
            console.log('[handleStripeConnect] Checking existing Stripe account status...');
            const refreshUrl = `${API_BASE_URL}/api/connect/refresh-account-status`;
            console.log('[handleStripeConnect] Refresh URL:', refreshUrl);
            
            const refreshResponse = await fetch(refreshUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user?.id }),
            });

            console.log('[handleStripeConnect] Refresh response status:', refreshResponse.status);
            
            if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                console.log('[handleStripeConnect] Refresh data:', refreshData);
                
                if (refreshData.success && refreshData.data.hasStripeAccount) {
                    setFormData(prev => ({ ...prev, stripeConnected: true }));
                    setStripeStatus(refreshData.data.currentStatus);
                    
                    if (refreshData.data.currentStatus === 'active') {
                        console.log('[handleStripeConnect] Account already active');
                        Alert.alert(
                            'Stripe Account Active',
                            'Your Stripe account is already active and ready to accept payments!'
                        );
                        return;
                    } else if (refreshData.data.currentStatus === 'pending') {
                        console.log('[handleStripeConnect] Account pending review');
                        Alert.alert(
                            'Account Pending',
                            'Your Stripe account is being reviewed. This usually takes 1-2 business days.'
                        );
                        return;
                    }
                }
            }

            // Get barber's email and name
            if (!user?.email) {
                console.error('[handleStripeConnect] No user email found');
                Alert.alert(
                    'Error',
                    'Could not fetch your profile information. Please try again.'
                );
                return;
            }

            // Create Stripe Connect account
            const createUrl = `${API_BASE_URL}/api/connect/create-account`;
            console.log('[handleStripeConnect] Create account URL:', createUrl);
            
            const requestBody = {
                barberId: barber.id,
                email: user.email,
                name: (userProfile?.name || formData.businessName),
            };
            console.log('[handleStripeConnect] Request body:', requestBody);

            const response = await fetch(createUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            console.log('[handleStripeConnect] Create response status:', response.status);
            const responseText = await response.text();
            console.log('[handleStripeConnect] Create response text:', responseText);

            if (!response.ok) {
                const errorData = JSON.parse(responseText);
                console.error('[handleStripeConnect] Error response:', errorData);
                throw new Error(errorData.error || 'Failed to create Stripe account');
            }

            const data = JSON.parse(responseText);
            console.log('[handleStripeConnect] Success response:', data);
            
            const url = data.url || data.accountLink;
            console.log('[handleStripeConnect] Stripe URL:', url);
            
            if (!url) {
                throw new Error('No Stripe URL received');
            }

            // Try to use in-app browser first
            console.log('[handleStripeConnect] Checking InAppBrowser availability...');
            const browserAvailable = await InAppBrowser.isAvailable();
            console.log('[handleStripeConnect] InAppBrowser available:', browserAvailable);

            if (browserAvailable) {
                console.log('[handleStripeConnect] Opening InAppBrowser with URL:', url);
                const result = await InAppBrowser.openAuth(url, 'bocm://stripe-return', {
                    // iOS Properties
                    ephemeralWebSession: false,
                    // Android Properties
                    showTitle: true,
                    enableUrlBarHiding: true,
                    enableDefaultShare: false,
                    forceCloseOnRedirection: true,
                });
                
                console.log('[handleStripeConnect] InAppBrowser result:', result);
                
                if (result.type === 'success') {
                    console.log('[handleStripeConnect] Success! Checking status in 2 seconds...');
                    // Wait a moment for Stripe to process
                    setTimeout(() => {
                        checkStripeStatus();
                    }, 2000);
                }
            } else {
                console.log('[handleStripeConnect] InAppBrowser not available, using WebView');
                // Fallback to WebView
                setStripeUrl(url);
                setShowStripeWebView(true);
            }
        } catch (error) {
            console.error('[handleStripeConnect] Error:', error);
            Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to connect Stripe account. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSkipStripe = () => {
        console.log('[handleSkipStripe] User choosing to skip Stripe setup');
        Alert.alert(
            'Skip Payment Setup?',
            'You can set up payments later in your settings.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Skip',
                    onPress: async () => {
                        console.log('[handleSkipStripe] Confirmed skip, submitting profile...');
                        await handleSubmit();
                    }
                }
            ]
        );
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={tw`pb-20`}>
                            <View style={tw`mb-6`}>
                                <View style={tw`flex-row items-center mb-2`}>
                                    <Icon name="briefcase" size={16} color={theme.colors.secondary} />
                                    <Text style={tw`text-gray-300 text-sm ml-2 font-medium`}>Business Name</Text>
                                </View>
                                <TextInput
                                    style={[tw`bg-gray-800 text-white px-4 py-3.5 rounded-xl text-base`, {lineHeight: 20}]}
                                    value={formData.businessName}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, businessName: text }))}
                                    placeholder="Enter your business name"
                                    placeholderTextColor="#6B7280"
                                />
                            </View>

                            <View style={tw`mb-6`}>
                                <View style={tw`flex-row items-center mb-2`}>
                                    <Icon name="phone" size={16} color={theme.colors.secondary} />
                                    <Text style={tw`text-gray-300 text-sm ml-2 font-medium`}>Phone Number</Text>
                                </View>
                                <TextInput
                                    style={[tw`bg-gray-800 text-white px-4 py-3.5 rounded-xl text-base`, {lineHeight: 20}]}
                                    value={formData.phone}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                                    placeholder="(555) 123-4567"
                                    placeholderTextColor="#6B7280"
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={tw`mb-6`}>
                                <View style={tw`flex-row items-center mb-2`}>
                                    <Icon name="map-pin" size={16} color={theme.colors.secondary} />
                                    <Text style={tw`text-gray-300 text-sm ml-2 font-medium`}>Address</Text>
                                </View>
                                <TextInput
                                    style={[tw`bg-gray-800 text-white px-4 py-3.5 rounded-xl text-base mb-3`, {lineHeight: 20}]}
                                    value={formData.address}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                                    placeholder="123 Main Street"
                                    placeholderTextColor="#6B7280"
                                />
                                
                                <View style={tw`flex-row gap-3`}>
                                    <TextInput
                                        style={[tw`bg-gray-800 text-white px-4 py-3.5 rounded-xl text-base flex-1`, {lineHeight: 20}]}
                                        value={formData.city}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                                        placeholder="City"
                                        placeholderTextColor="#6B7280"
                                    />
                                    <TextInput
                                        style={[tw`bg-gray-800 text-white px-4 py-3.5 rounded-xl text-base w-20`, {lineHeight: 20}]}
                                        value={formData.state}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
                                        placeholder="State"
                                        placeholderTextColor="#6B7280"
                                        maxLength={2}
                                        autoCapitalize="characters"
                                    />
                                    <TextInput
                                        style={[tw`bg-gray-800 text-white px-4 py-3.5 rounded-xl text-base w-24`, {lineHeight: 20}]}
                                        value={formData.zipCode}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, zipCode: text }))}
                                        placeholder="ZIP"
                                        placeholderTextColor="#6B7280"
                                        keyboardType="number-pad"
                                        maxLength={5}
                                    />
                                </View>
                            </View>

                            <View style={tw`mb-6`}>
                                <View style={tw`flex-row items-center mb-2`}>
                                    <Icon name="file-text" size={16} color={theme.colors.secondary} />
                                    <Text style={tw`text-gray-300 text-sm ml-2 font-medium`}>Bio</Text>
                                </View>
                                <TextInput
                                    style={[tw`bg-gray-800 text-white px-4 py-3.5 rounded-xl text-base h-28`, {lineHeight: 20, textAlignVertical: 'top'}]}
                                    value={formData.bio}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                                    placeholder="Tell clients about your experience..."
                                    placeholderTextColor="#6B7280"
                                    multiline
                                />
                            </View>

                            <View style={tw`mb-6`}>
                                <View style={tw`flex-row items-center mb-2`}>
                                    <Icon name="scissors" size={16} color={theme.colors.secondary} />
                                    <Text style={tw`text-gray-300 text-sm ml-2 font-medium`}>Specialties</Text>
                                </View>
                                <TextInput
                                    style={[tw`bg-gray-800 text-white px-4 py-3.5 rounded-xl text-base`, {lineHeight: 20}]}
                                    value={formData.specialties}
                                    onChangeText={(text) => setFormData(prev => ({ ...prev, specialties: text }))}
                                    placeholder="Fades, Beard Trims, Kids Cuts..."
                                    placeholderTextColor="#6B7280"
                                />
                                <Text style={tw`text-gray-500 text-xs mt-1.5 ml-1`}>
                                    Separate with commas
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                );

            case 1:
                return (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={tw`pb-20`}>
                            <TouchableOpacity
                                onPress={() => setFormData(prev => ({ 
                                    ...prev, 
                                    services: [...prev.services, { name: '', price: 0, duration: 30 }]
                                }))}
                                style={[tw`py-3 rounded-xl mb-4`, { backgroundColor: theme.colors.secondary }]}
                            >
                                <Text style={tw`text-white text-center font-medium`}>+ Add Service</Text>
                            </TouchableOpacity>

                            {formData.services.map((service, index) => (
                                <View key={index} style={tw`bg-gray-800 rounded-xl p-4 mb-3`}>
                                    <TextInput
                                        style={[tw`text-white text-base font-medium mb-3 bg-gray-900 px-3 py-2 rounded-lg`, {lineHeight: 20}]}
                                        value={service.name}
                                        onChangeText={(text) => {
                                            const newServices = [...formData.services];
                                            newServices[index].name = text;
                                            setFormData(prev => ({ ...prev, services: newServices }));
                                        }}
                                        placeholder="Service name"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                    
                                    <View style={tw`flex-row items-center justify-between`}>
                                        <View style={tw`flex-row items-center flex-1`}>
                                            <Icon name="dollar-sign" size={16} color="#9CA3AF" />
                                            <TextInput
                                                style={[tw`text-white text-base ml-1 w-16 bg-gray-900 px-2 py-1.5 rounded text-center`, {lineHeight: 20}]}
                                                value={service.price.toString()}
                                                onChangeText={(text) => {
                                                    const newServices = [...formData.services];
                                                    newServices[index].price = parseInt(text) || 0;
                                                    setFormData(prev => ({ ...prev, services: newServices }));
                                                }}
                                                keyboardType="numeric"
                                                placeholder="0"
                                                placeholderTextColor="#9CA3AF"
                                            />
                                        </View>
                                        
                                        <View style={tw`flex-row items-center flex-1`}>
                                            <Icon name="clock" size={16} color="#9CA3AF" />
                                            <TextInput
                                                style={[tw`text-white text-base ml-1 w-12 text-center bg-gray-900 px-2 py-1.5 rounded`, {lineHeight: 20}]}
                                                value={service.duration.toString()}
                                                onChangeText={(text) => {
                                                    const newServices = [...formData.services];
                                                    newServices[index].duration = parseInt(text) || 30;
                                                    setFormData(prev => ({ ...prev, services: newServices }));
                                                }}
                                                keyboardType="numeric"
                                                placeholder="30"
                                                placeholderTextColor="#9CA3AF"
                                            />
                                            <Text style={tw`text-gray-400 ml-1`}>min</Text>
                                        </View>
                                        
                                        <TouchableOpacity
                                            onPress={() => {
                                                const newServices = formData.services.filter((_, i) => i !== index);
                                                setFormData(prev => ({ ...prev, services: newServices }));
                                            }}
                                            style={tw`ml-4`}
                                        >
                                            <Text style={tw`text-red-400 text-sm`}>Remove</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                );

            case 2:
                console.log('[renderStep] Rendering Stripe step - status:', stripeStatus, 'connected:', formData.stripeConnected);
                return (
                    <View style={tw`flex-1 justify-center px-2`}>
                        {formData.stripeConnected && stripeStatus === 'active' ? (
                            <View style={tw`bg-green-900/20 border border-green-600 rounded-2xl p-6`}>
                                <View style={tw`items-center`}>
                                    <Icon name="check-circle" size={48} color="#10b981" />
                                    <Text style={tw`text-green-400 text-lg font-semibold mt-4`}>
                                        Stripe Connected!
                                    </Text>
                                    <Text style={tw`text-green-300 text-center mt-2`}>
                                        You&apos;re all set to receive payments.
                                    </Text>
                                </View>
                            </View>
                        ) : stripeStatus === 'pending' ? (
                            <View style={tw`bg-yellow-900/20 border border-yellow-600 rounded-2xl p-6`}>
                                <View style={tw`items-center`}>
                                    <Icon name="clock" size={48} color="#f59e0b" />
                                    <Text style={tw`text-yellow-400 text-lg font-semibold mt-4`}>
                                        Account Under Review
                                    </Text>
                                    <Text style={tw`text-yellow-300 text-center mt-2`}>
                                        Your Stripe account is being reviewed. This usually takes 1-2 business days.
                                    </Text>
                                    <TouchableOpacity
                                        onPress={checkStripeStatus}
                                        style={tw`mt-4 bg-yellow-600/20 px-4 py-2 rounded-lg`}
                                    >
                                        <Text style={tw`text-yellow-400`}>Check Status</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View>
                                <View style={tw`bg-gray-800 rounded-2xl p-6 mb-4`}>
                                    <Icon name="credit-card" size={40} color={theme.colors.secondary} style={tw`mb-4 self-center`} />
                                    <Text style={tw`text-white text-lg font-semibold text-center mb-2`}>
                                        Connect Stripe Account
                                    </Text>
                                    <Text style={tw`text-gray-400 text-center mb-6`}>
                                        Accept payments securely with Stripe
                                    </Text>
                                    
                                    <View style={tw`space-y-2 mb-6`}>
                                        <View style={tw`flex-row items-center`}>
                                            <Icon name="check" size={16} color="#10b981" />
                                            <Text style={tw`text-gray-300 ml-2`}>Secure payment processing</Text>
                                        </View>
                                        <View style={tw`flex-row items-center mt-2`}>
                                            <Icon name="check" size={16} color="#10b981" />
                                            <Text style={tw`text-gray-300 ml-2`}>Direct bank deposits</Text>
                                        </View>
                                        <View style={tw`flex-row items-center mt-2`}>
                                            <Icon name="check" size={16} color="#10b981" />
                                            <Text style={tw`text-gray-300 ml-2`}>Transaction reporting</Text>
                                        </View>
                                    </View>
                                    
                                    <TouchableOpacity
                                        onPress={handleStripeConnect}
                                        style={[tw`py-4 rounded-xl`, { backgroundColor: theme.colors.secondary }]}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text style={tw`text-white text-center font-semibold`}>
                                                Connect Stripe
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                    
                                    <View style={tw`mt-4`}>
                                        <View style={tw`flex-row items-center mb-3`}>
                                            <View style={tw`flex-1 h-0.5 bg-gray-700`} />
                                            <Text style={tw`text-gray-500 text-xs mx-3`}>OR</Text>
                                            <View style={tw`flex-1 h-0.5 bg-gray-700`} />
                                        </View>
                                        
                                        <TouchableOpacity
                                            onPress={handleSkipStripe}
                                            style={tw`border border-gray-600 py-4 rounded-xl`}
                                            disabled={loading}
                                        >
                                            <Text style={tw`text-gray-300 text-center font-medium`}>
                                                Skip for Now
                                            </Text>
                                        </TouchableOpacity>
                                        
                                        <Text style={tw`text-gray-500 text-xs text-center mt-2`}>
                                            You can set up payments later
                                        </Text>
                                    </View>
                                </View>
                                
                                <Text style={tw`text-gray-500 text-xs text-center`}>
                                    Setup takes about 5 minutes
                                </Text>
                            </View>
                        )}
                    </View>
                );
        }
    };

    if (initialDataLoading) {
        return (
            <SafeAreaView style={tw`flex-1 bg-gray-900 justify-center items-center`}>
                <ActivityIndicator size="large" color={theme.colors.secondary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={tw`flex-1 bg-gray-900`}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={tw`flex-1`}
            >
                <View style={tw`flex-1`}>
                    <View style={tw`px-6 pt-6`}>
                        <Text style={tw`text-white text-2xl font-bold text-center`}>
                            Complete Your Profile
                        </Text>
                        
                        <View style={tw`mt-8 mb-10`}>
                            <View style={tw`flex-row justify-center items-center`}>
                                {steps.map((step, index) => (
                                    <View key={step.id} style={tw`items-center`}>
                                        <View style={tw`flex-row items-center`}>
                                            {index > 0 && (
                                                <View style={[tw`h-0.5 w-12`, {
                                                    backgroundColor: index <= currentStep ? theme.colors.secondary : '#374151'
                                                }]} />
                                            )}
                                            <View style={[tw`w-10 h-10 rounded-full items-center justify-center`, {
                                                backgroundColor: index <= currentStep ? theme.colors.secondary : '#374151'
                                            }]}>
                                                {index < currentStep ? (
                                                    <Icon name="check" size={20} color="white" />
                                                ) : (
                                                    <Text style={tw`text-white font-bold`}>{index + 1}</Text>
                                                )}
                                            </View>
                                            {index < steps.length - 1 && (
                                                <View style={[tw`h-0.5 w-12`, {
                                                    backgroundColor: index < currentStep ? theme.colors.secondary : '#374151'
                                                }]} />
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                            <View style={tw`flex-row justify-between px-2 mt-2`}>
                                <Text style={[tw`text-xs w-20 text-center`, { color: currentStep >= 0 ? theme.colors.secondary : '#9CA3AF' }]}>
                                    Business Info
                                </Text>
                                <Text style={[tw`text-xs w-20 text-center`, { color: currentStep >= 1 ? theme.colors.secondary : '#9CA3AF' }]}>
                                    Services
                                </Text>
                                <Text style={[tw`text-xs w-20 text-center`, { color: currentStep >= 2 ? theme.colors.secondary : '#9CA3AF' }]}>
                                    Payments
                                </Text>
                            </View>
                        </View>
                        
                        <Text style={tw`text-gray-400 text-center mb-6`}>
                            {steps[currentStep].subtitle}
                        </Text>
                    </View>

                    <View style={tw`flex-1 px-6`}>
                        {renderStep()}
                    </View>

                    <View style={tw`px-6 pb-6 pt-4 bg-gray-900 border-t border-gray-800`}>
                        <View style={tw`flex-row gap-3`}>
                            {currentStep > 0 && (
                                <TouchableOpacity
                                    onPress={() => setCurrentStep(currentStep - 1)}
                                    style={tw`flex-1 py-4 rounded-xl border border-gray-700 flex-row justify-center items-center`}
                                    disabled={loading}
                                >
                                    <Icon name="chevron-left" size={20} color="white" />
                                    <Text style={tw`text-white font-medium ml-1`}>Back</Text>
                                </TouchableOpacity>
                            )}
                            
                            <TouchableOpacity
                                onPress={handleNext}
                                style={[tw`flex-1 py-4 rounded-xl flex-row justify-center items-center`, {
                                    backgroundColor: theme.colors.secondary,
                                    opacity: loading ? 0.5 : 1
                                }]}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Text style={tw`text-white font-semibold mr-1`}>
                                            {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                                        </Text>
                                        <Icon name="chevron-right" size={20} color="white" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* Stripe WebView Modal */}
            <Modal
                visible={showStripeWebView}
                animationType="slide"
                onRequestClose={() => setShowStripeWebView(false)}
            >
                <SafeAreaView style={tw`flex-1 bg-gray-900`}>
                    <View style={tw`flex-row justify-between items-center p-4 border-b border-gray-700`}>
                        <Text style={tw`text-white text-lg font-semibold`}>Connect Stripe</Text>
                        <TouchableOpacity
                            onPress={() => {
                                console.log('[WebView] Closing WebView modal');
                                setShowStripeWebView(false);
                                // Check status after closing
                                setTimeout(() => {
                                    console.log('[WebView] Checking status after close...');
                                    checkStripeStatus();
                                }, 2000);
                            }}
                        >
                            <Icon name="x" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                    <WebView
                        source={{ uri: stripeUrl }}
                        onNavigationStateChange={(navState) => {
                            console.log('[WebView] Navigation state change:', navState.url);
                            if (navState.url.includes('stripe-return')) {
                                console.log('[WebView] Detected stripe-return URL');
                                setShowStripeWebView(false);
                                setTimeout(() => {
                                    console.log('[WebView] Checking status after return...');
                                    checkStripeStatus();
                                }, 2000);
                            }
                        }}
                        onError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.error('[WebView] Error:', nativeEvent);
                        }}
                    />
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}