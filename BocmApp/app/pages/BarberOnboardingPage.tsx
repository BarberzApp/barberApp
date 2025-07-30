import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import { RootStackParamList } from '../shared/types';
import { supabase } from '../shared/lib/supabase';
import { useAuth } from '../shared/hooks/useAuth';
import { theme } from '../shared/lib/theme';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../shared/components/ui';
import { 
    CheckCircle, 
    AlertCircle, 
    Loader2, 
    CreditCard, 
    Building, 
    Scissors, 
    X, 
    Instagram, 
    Twitter, 
    Music, 
    Facebook,
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2
} from 'lucide-react-native';
import { SpecialtyAutocomplete } from '../shared/components/ui/SpecialtyAutocomplete';
import { SocialMediaLinks } from '../shared/components/ui/SocialMediaLinks';
import { LocationInput } from '../shared/components/ui/LocationInput';
import { BARBER_SPECIALTIES } from '../shared/utils/settings.utils';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "";

type BarberOnboardingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BarberOnboarding'>;

const steps = [
    {
        id: 'business',
        title: 'Business Information',
        description: 'Tell us about your business',
        icon: Building,
        required: ['businessName', 'phone', 'address', 'city', 'state', 'zipCode', 'bio']
    },
    {
        id: 'services',
        title: 'Services & Pricing',
        description: 'Set up your services and pricing',
        icon: Scissors,
        required: ['services']
    },
    {
        id: 'stripe',
        title: 'Payment Setup',
        description: 'Connect your Stripe account to receive payments',
        icon: CreditCard,
        required: ['stripeConnected']
    },
];

interface FormData {
    businessName: string;
    phone: string;
    location: string;
    bio: string;
    specialties: string[];
    services: Array<{ name: string; price: number; duration: number }>;
    stripeConnected: boolean;
    socialMedia: {
        instagram: string;
        twitter: string;
        tiktok: string;
        facebook: string;
    };
}

interface ValidationErrors {
    [key: string]: string;
}

export default function BarberOnboardingPage() {
    const navigation = useNavigation<BarberOnboardingNavigationProp>();
    const { user, userProfile } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [stripeStatus, setStripeStatus] = useState<string | null>(null);
    const [onboardingComplete, setOnboardingComplete] = useState(false);
    const [showCompleteBanner, setShowCompleteBanner] = useState(true);
    const [showStripeWebView, setShowStripeWebView] = useState(false);
    const [stripeUrl, setStripeUrl] = useState('');

    const [formData, setFormData] = useState<FormData>({
        businessName: '',
        phone: '',
        location: '',
        bio: '',
        specialties: [],
        services: [
            { name: 'Haircut', price: 30, duration: 30 },
            { name: 'Beard Trim', price: 20, duration: 20 },
        ],
        stripeConnected: false,
        socialMedia: {
            instagram: '',
            twitter: '',
            tiktok: '',
            facebook: '',
        }
    });

    // Prefill form with existing data
    useEffect(() => {
        const fetchProfileData = async () => {
            if (!user) return;
            
            try {
                console.log('Fetching profile data for user:', user.id);
                
                // Fetch barber profile data
                const { data: barberData, error: barberError } = await supabase
                    .from('barbers')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                console.log('Barber data fetched:', barberData, 'Error:', barberError);

                if (barberData) {
                    console.log('Setting barber data in form');
                    setFormData(prev => ({
                        ...prev,
                        businessName: barberData.business_name || '',
                        bio: barberData.bio || '',
                        specialties: barberData.specialties || [],
                        socialMedia: {
                            instagram: barberData.instagram || '',
                            twitter: barberData.twitter || '',
                            tiktok: barberData.tiktok || '',
                            facebook: barberData.facebook || '',
                        }
                    }));
                }

                // Fetch profile data
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('phone, location')
                    .eq('id', user.id)
                    .single();

                if (profileError && profileError.code !== 'PGRST116') {
                    console.error('Error fetching profile data:', profileError);
                }

                // Fetch services
                let services: Array<{ name: string; price: number; duration: number }> = [];
                if (barberData?.id) {
                    const { data: existingServices, error: servicesError } = await supabase
                        .from('services')
                        .select('name, price, duration')
                        .eq('barber_id', barberData.id);

                    if (servicesError) {
                        console.error('Error fetching services:', servicesError);
                    } else if (Array.isArray(existingServices)) {
                        services = existingServices.map(s => ({
                            name: s.name || '',
                            price: typeof s.price === 'number' ? s.price : 0,
                            duration: typeof s.duration === 'number' ? s.duration : 30,
                        }));
                    }
                }

                setFormData(prev => ({
                    ...prev,
                    phone: profile?.phone || '',
                    location: profile?.location || '',
                    services,
                    stripeConnected: barberData?.stripe_account_status === 'active'
                }));

                if (barberData?.stripe_account_id) {
                    setStripeStatus(barberData?.stripe_account_status || null);
                } else {
                    setStripeStatus(null);
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };

        if (user) {
            fetchProfileData();
        }
    }, [user]);

    // Check if user is a barber
    useEffect(() => {
        if (user && userProfile?.role !== 'barber') {
            console.log('User is not a barber, redirecting to home');
            navigation.navigate('Home');
        }
    }, [user, userProfile, navigation]);

    const validateStep = async (stepIndex: number): Promise<boolean> => {
        const errors: ValidationErrors = {};
        const step = steps[stepIndex];

        if (step.id === 'business') {
            if (!formData.businessName.trim()) {
                errors.businessName = 'Business name is required';
            }
            if (!formData.phone.trim()) {
                errors.phone = 'Phone number is required';
            }
            if (!formData.location.trim()) {
                errors.location = 'Location is required';
            }
            if (!formData.bio.trim()) {
                errors.bio = 'Bio is required';
            }
            if (formData.specialties.length === 0) {
                errors.specialties = 'At least one specialty is required';
            }
        } else if (step.id === 'services') {
            if (formData.services.length === 0) {
                errors.services = 'At least one service is required';
            } else {
                formData.services.forEach((service, index) => {
                    if (!service.name.trim()) {
                        errors[`services.${index}.name`] = 'Service name is required';
                    }
                    if (service.price <= 0) {
                        errors[`services.${index}.price`] = 'Price must be greater than 0';
                    }
                    if (service.duration <= 0) {
                        errors[`services.${index}.duration`] = 'Duration must be greater than 0';
                    }
                });
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (field: string, value: string | string[] | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSpecialtiesChange = (specialties: string[]) => {
        handleChange('specialties', specialties);
    };

    const handleServiceChange = (index: number, field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            services: prev.services.map((service, i) => 
                i === index ? { ...service, [field]: value } : service
            )
        }));
    };

    const addService = () => {
        setFormData(prev => ({
            ...prev,
            services: [...prev.services, { name: '', price: 0, duration: 30 }]
        }));
    };

    const removeService = (index: number) => {
        setFormData(prev => ({
            ...prev,
            services: prev.services.filter((_, i) => i !== index)
        }));
    };

    const handleSocialMediaUpdate = (socialData: {
        instagram: string;
        twitter: string;
        tiktok: string;
        facebook: string;
    }) => {
        setFormData(prev => ({
            ...prev,
            socialMedia: socialData
        }));
    };

    const handleSubmit = async () => {
        if (loading) return;

        const isValid = await validateStep(currentStep);
        if (!isValid) {
            Alert.alert('Validation Error', 'Please fix the errors before continuing.');
            return;
        }

        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
            return;
        }

        // Final submission
        setLoading(true);
        try {
            console.log('Submitting onboarding data:', formData);

            // Update profile with contact information
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    phone: formData.phone,
                    location: formData.location,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user?.id);

            if (profileError) {
                console.error('Error updating profile:', profileError);
                throw new Error('Failed to update profile');
            }

            // Get or create barber record
            let barberId: string;
            const { data: existingBarber, error: barberCheckError } = await supabase
                    .from('barbers')
                    .select('id')
                .eq('user_id', user?.id)
                    .single();
                
            if (existingBarber) {
                barberId = existingBarber.id;
            } else {
                const { data: newBarber, error: createError } = await supabase
                    .from('barbers')
                    .insert({
                        user_id: user?.id,
                        business_name: formData.businessName,
                        bio: formData.bio,
                        specialties: formData.specialties,
                        instagram: formData.socialMedia.instagram,
                        twitter: formData.socialMedia.twitter,
                        tiktok: formData.socialMedia.tiktok,
                        facebook: formData.socialMedia.facebook,
                        created_at: new Date().toISOString()
                    })
                    .select('id')
                    .single();

                if (createError) {
                    console.error('Error creating barber:', createError);
                    throw new Error('Failed to create barber profile');
                }
                barberId = newBarber.id;
            }

            // Update barber record
            const { error: barberUpdateError } = await supabase
                .from('barbers')
                .update({
                    business_name: formData.businessName,
                    bio: formData.bio,
                    specialties: formData.specialties,
                    instagram: formData.socialMedia.instagram,
                    twitter: formData.socialMedia.twitter,
                    tiktok: formData.socialMedia.tiktok,
                    facebook: formData.socialMedia.facebook,
                    updated_at: new Date().toISOString()
                })
                .eq('id', barberId);

            if (barberUpdateError) {
                console.error('Error updating barber:', barberUpdateError);
                throw new Error('Failed to update barber profile');
            }

            // Handle services
            if (formData.services.length > 0) {
                // Delete existing services
                await supabase
                        .from('services')
                    .delete()
                    .eq('barber_id', barberId);

                // Insert new services
                const servicesToInsert = formData.services.map(service => ({
                    barber_id: barberId,
                                name: service.name,
                                price: service.price,
                    duration: service.duration
                }));

                const { error: servicesError } = await supabase
                    .from('services')
                    .insert(servicesToInsert);

                if (servicesError) {
                    console.error('Error updating services:', servicesError);
                    throw new Error('Failed to update services');
                }
            }

            console.log('Onboarding completed successfully');
            setOnboardingComplete(true);
            
            // Navigate to main app
            navigation.navigate('MainTabs' as any);
            
        } catch (error) {
            console.error('Error during onboarding submission:', error);
            Alert.alert('Error', 'Failed to save your information. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStripeConnect = async () => {
        if (loading) return;
        
        setLoading(true);
        try {
            console.log('Starting Stripe Connect process for user:', user?.id);
            
            const response = await fetch(`${API_BASE_URL}/api/connect/create-account`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    userId: user?.id,
                    businessName: formData.businessName,
                    email: user?.email
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Stripe Connect response:', data);

            if (data.accountLink) {
                setStripeUrl(data.accountLink);
                setShowStripeWebView(true);
            } else {
                throw new Error('No account link received');
            }
        } catch (error) {
            console.error('Error creating Stripe account:', error);
            Alert.alert('Error', 'Failed to connect Stripe account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        Alert.alert(
            'Skip Payment Setup?',
            'You can always set up payments later in your settings. Are you sure you want to skip this step?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Skip',
                    style: 'destructive',
                    onPress: () => {
                        setFormData(prev => ({ ...prev, stripeConnected: false }));
                        handleSubmit();
                    }
                }
            ]
        );
    };

    const getProgressPercentage = () => {
        return ((currentStep + 1) / steps.length) * 100;
    };

    const renderStep = () => {
        const step = steps[currentStep];
        const Icon = step.icon;

        switch (step.id) {
            case 'business':
                return (
                    <View style={tw`space-y-8`}>
                        <View style={tw`space-y-4`}>
                            <Text style={[tw`text-base font-semibold`, { color: theme.colors.foreground }]}>
                                Business Name *
                            </Text>
                            <TextInput
                                style={[
                                    tw`h-14 p-4 rounded-xl border text-base`,
                                    { 
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        borderColor: validationErrors.businessName ? theme.colors.destructive : 'rgba(255,255,255,0.2)',
                                        color: theme.colors.foreground
                                    }
                                ]}
                                placeholder="Enter your business name"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={formData.businessName}
                                onChangeText={(text) => handleChange('businessName', text)}
                            />
                            {validationErrors.businessName && (
                                <Text style={[tw`text-sm mt-2`, { color: theme.colors.destructive }]}>
                                    {validationErrors.businessName}
                                </Text>
                            )}
                        </View>

                        <View style={tw`space-y-4`}>
                            <Text style={[tw`text-base font-semibold`, { color: theme.colors.foreground }]}>
                                Phone Number *
                            </Text>
                            <TextInput
                                style={[
                                    tw`h-14 p-4 rounded-xl border text-base`,
                                    { 
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        borderColor: validationErrors.phone ? theme.colors.destructive : 'rgba(255,255,255,0.2)',
                                        color: theme.colors.foreground
                                    }
                                ]}
                                placeholder="(555) 123-4567"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={formData.phone}
                                onChangeText={(text) => handleChange('phone', text)}
                                keyboardType="phone-pad"
                            />
                            {validationErrors.phone && (
                                <Text style={[tw`text-sm mt-2`, { color: theme.colors.destructive }]}>
                                    {validationErrors.phone}
                                </Text>
                            )}
                        </View>

                        <View style={tw`space-y-4`}>
                            <Text style={[tw`text-base font-semibold`, { color: theme.colors.foreground }]}>
                                Location *
                            </Text>
                            <LocationInput
                                value={formData.location}
                                onChange={(text) => handleChange('location', text)}
                                placeholder="Start typing your address..."
                                error={validationErrors.location}
                            />
                        </View>
                        
                        <View style={tw`space-y-4`}>
                            <Text style={[tw`text-base font-semibold`, { color: theme.colors.foreground }]}>
                                Bio *
                            </Text>
                            <TextInput
                                style={[
                                    tw`p-4 rounded-xl border min-h-[140px] text-base`,
                                    { 
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        borderColor: validationErrors.bio ? theme.colors.destructive : 'rgba(255,255,255,0.2)',
                                        color: theme.colors.foreground
                                    }
                                ]}
                                placeholder="Tell us about your business, experience, and what makes you unique..."
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={formData.bio}
                                onChangeText={(text) => handleChange('bio', text)}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                            />
                            {validationErrors.bio && (
                                <Text style={[tw`text-sm mt-2`, { color: theme.colors.destructive }]}>
                                    {validationErrors.bio}
                                </Text>
                            )}
                        </View>
                        
                        <View style={tw`space-y-4`}>
                            <Text style={[tw`text-base font-semibold`, { color: theme.colors.foreground }]}>
                                Specialties
                            </Text>
                            <SpecialtyAutocomplete
                                value={formData.specialties}
                                onChange={handleSpecialtiesChange}
                                placeholder="Select your specialties..."
                                maxSelections={15}
                            />
                            <View style={tw`space-y-2`}>
                                <Text style={[tw`text-sm`, { color: 'rgba(255,255,255,0.6)' }]}>
                                    List your specialties to help clients find you
                                </Text>
                            </View>
                        </View>
                        
                        {/* Social Media Section */}
                        <View style={tw`space-y-6`}>
                            <View>
                                <Text style={[tw`text-xl font-semibold`, { color: theme.colors.foreground }]}>
                                    Social Media (Optional)
                                </Text>
                                <Text style={[tw`text-base mt-2`, { color: 'rgba(255,255,255,0.6)' }]}>
                                    Add your social media handles to help clients connect with you
                                </Text>
                            </View>
                            
                            {/* Social Media Input Fields */}
                            <View style={tw`space-y-6`}>
                                {/* Grid Layout for Social Media */}
                                <View style={tw`flex-row flex-wrap -mx-3`}>
                                    {/* Instagram */}
                                    <View style={tw`w-1/2 px-3 mb-6`}>
                                        <View style={tw`space-y-3`}>
                                            <View style={tw`flex-row items-center`}>
                                                <Instagram size={18} color="#E1306C" style={tw`mr-2`} />
                                                <Text style={[tw`font-semibold text-base`, { color: theme.colors.foreground }]}>
                                                    Instagram
                                                </Text>
                                            </View>
                                            <TextInput
                                                style={[
                                                    tw`p-4 rounded-xl border text-base`,
                                                    { 
                                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                                        borderColor: 'rgba(255,255,255,0.2)',
                                                        color: theme.colors.foreground
                                                    }
                                                ]}
                                                placeholder="@yourusername"
                                                placeholderTextColor="rgba(255,255,255,0.4)"
                                                value={formData.socialMedia.instagram}
                                                onChangeText={(text) => handleSocialMediaUpdate({
                                                    ...formData.socialMedia,
                                                    instagram: text
                                                })}
                                            />
                                            <Text style={[tw`text-xs`, { color: 'rgba(255,255,255,0.6)' }]}>
                                                Only your handle (e.g., @yourusername)
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Twitter/X */}
                                    <View style={tw`w-1/2 px-3 mb-6`}>
                                        <View style={tw`space-y-3`}>
                                            <View style={tw`flex-row items-center`}>
                                                <Twitter size={18} color="#1DA1F2" style={tw`mr-2`} />
                                                <Text style={[tw`font-semibold text-base`, { color: theme.colors.foreground }]}>
                                                    Twitter/X
                                                </Text>
                                            </View>
                                            <TextInput
                                                style={[
                                                    tw`p-4 rounded-xl border text-base`,
                                                    { 
                                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                                        borderColor: 'rgba(255,255,255,0.2)',
                                                        color: theme.colors.foreground
                                                    }
                                                ]}
                                                placeholder="@yourusername"
                                                placeholderTextColor="rgba(255,255,255,0.4)"
                                                value={formData.socialMedia.twitter}
                                                onChangeText={(text) => handleSocialMediaUpdate({
                                                    ...formData.socialMedia,
                                                    twitter: text
                                                })}
                                            />
                                            <Text style={[tw`text-xs`, { color: 'rgba(255,255,255,0.6)' }]}>
                                                Only your handle (e.g., @yourusername)
                                            </Text>
                                        </View>
                                    </View>

                                    {/* TikTok */}
                                    <View style={tw`w-1/2 px-3 mb-6`}>
                                        <View style={tw`space-y-3`}>
                                            <View style={tw`flex-row items-center`}>
                                                <View style={tw`w-5 h-5 rounded items-center justify-center mr-2 bg-black`}>
                                                    <Text style={tw`text-xs font-bold text-white`}>TT</Text>
                                                </View>
                                                <Text style={[tw`font-semibold text-base`, { color: theme.colors.foreground }]}>
                                                    TikTok
                                                </Text>
                                            </View>
                                            <TextInput
                                                style={[
                                                    tw`p-4 rounded-xl border text-base`,
                                                    { 
                                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                                        borderColor: 'rgba(255,255,255,0.2)',
                                                        color: theme.colors.foreground
                                                    }
                                                ]}
                                                placeholder="@yourusername"
                                                placeholderTextColor="rgba(255,255,255,0.4)"
                                                value={formData.socialMedia.tiktok}
                                                onChangeText={(text) => handleSocialMediaUpdate({
                                                    ...formData.socialMedia,
                                                    tiktok: text
                                                })}
                                            />
                                            <Text style={[tw`text-xs`, { color: 'rgba(255,255,255,0.6)' }]}>
                                                Only your handle (e.g., @yourusername)
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Facebook */}
                                    <View style={tw`w-1/2 px-3 mb-6`}>
                                        <View style={tw`space-y-3`}>
                                            <View style={tw`flex-row items-center`}>
                                                <Facebook size={18} color="#1877F3" style={tw`mr-2`} />
                                                <Text style={[tw`font-semibold text-base`, { color: theme.colors.foreground }]}>
                                                    Facebook
                                                </Text>
                                            </View>
                                            <TextInput
                                                style={[
                                                    tw`p-4 rounded-xl border text-base`,
                                                    { 
                                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                                        borderColor: 'rgba(255,255,255,0.2)',
                                                        color: theme.colors.foreground
                                                    }
                                                ]}
                                                placeholder="yourpagename"
                                                placeholderTextColor="rgba(255,255,255,0.4)"
                                                value={formData.socialMedia.facebook}
                                                onChangeText={(text) => handleSocialMediaUpdate({
                                                    ...formData.socialMedia,
                                                    facebook: text
                                                })}
                                            />
                                            <Text style={[tw`text-xs`, { color: 'rgba(255,255,255,0.6)' }]}>
                                                Only your page name (e.g., yourpagename)
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                );

            case 'services':
                return (
                    <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                        <View style={tw`p-6 space-y-8`}>
                            {/* Services */}
                            <View style={[
                                tw`p-6 rounded-2xl`,
                                { backgroundColor: 'rgba(255,255,255,0.05)' }
                            ]}>
                                <View style={tw`mb-6`}>
                                    <View style={[
                                        tw`w-12 h-12 rounded-xl items-center justify-center mb-4`,
                                        { backgroundColor: 'rgba(255,255,255,0.1)' }
                                    ]}>
                                        <Scissors size={24} color={theme.colors.secondary} />
                                    </View>
                                    <Text style={[tw`text-2xl font-bold mb-2`, { color: theme.colors.foreground }]}>
                                        Services & Pricing
                                    </Text>
                                    <Text style={[tw`text-base`, { color: theme.colors.mutedForeground }]}>
                                        Set up your services and pricing to start accepting bookings
                                    </Text>
                                </View>
                                
                                <View style={tw`space-y-6`}>
                                    {formData.services.map((service, index) => (
                                        <View key={index} style={[
                                            tw`p-6 rounded-2xl`,
                                            { backgroundColor: 'rgba(255,255,255,0.05)' }
                                        ]}>
                                            <View style={tw`flex-row items-center justify-between mb-6`}>
                                                <View style={tw`flex-row items-center`}>
                                                    <View style={[
                                                        tw`w-8 h-8 rounded-lg items-center justify-center mr-3`,
                                                        { backgroundColor: 'rgba(255,255,255,0.1)' }
                                                    ]}>
                                                        <Text style={[tw`text-sm font-bold`, { color: theme.colors.secondary }]}>
                                                            {index + 1}
                                                        </Text>
                                                    </View>
                                                    <Text style={[tw`text-lg font-semibold`, { color: theme.colors.foreground }]}>
                                                        Service {index + 1}
                                                    </Text>
                                                </View>
                                                {formData.services.length > 1 && (
                            <TouchableOpacity
                                                        onPress={() => removeService(index)}
                                                        style={[
                                                            tw`p-2 rounded-lg`,
                                                            { backgroundColor: 'rgba(239, 68, 68, 0.2)' }
                                                        ]}
                                                    >
                                                        <Trash2 size={16} color={theme.colors.destructive} />
                            </TouchableOpacity>
                                                )}
                                            </View>

                                            {/* Service Name */}
                                            <View style={tw`mb-6`}>
                                                <Text style={[tw`text-base font-semibold mb-3`, { color: theme.colors.foreground }]}>
                                                    Service Name *
                                                </Text>
                                    <TextInput
                                                    style={[
                                                        tw`p-4 rounded-xl border text-base`,
                                                        { 
                                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                                            borderColor: validationErrors[`services.${index}.name`] ? theme.colors.destructive : 'rgba(255,255,255,0.2)',
                                                            color: theme.colors.foreground
                                                        }
                                                    ]}
                                                    placeholder="e.g., Haircut, Beard Trim, Fade"
                                                    placeholderTextColor="rgba(255,255,255,0.6)"
                                        value={service.name}
                                                    onChangeText={(text) => handleServiceChange(index, 'name', text)}
                                                />
                                                {validationErrors[`services.${index}.name`] && (
                                                    <Text style={[tw`text-sm mt-2`, { color: theme.colors.destructive }]}>
                                                        {validationErrors[`services.${index}.name`]}
                                                    </Text>
                                                )}
                                            </View>

                                            {/* Price and Duration */}
                                            <View style={tw`flex-row space-x-4`}>
                                                <View style={tw`flex-1`}>
                                                    <Text style={[tw`text-base font-semibold mb-3`, { color: theme.colors.foreground }]}>
                                                        Price ($) *
                                                    </Text>
                                                    <View style={tw`relative`}>
                                                        <Text style={[
                                                            tw`absolute left-4 top-4 text-base`,
                                                            { color: 'rgba(255,255,255,0.6)' }
                                                        ]}>
                                                            $
                                                        </Text>
                                            <TextInput
                                                            style={[
                                                                tw`p-4 rounded-xl border text-base pl-8`,
                                                                { 
                                                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                                                    borderColor: validationErrors[`services.${index}.price`] ? theme.colors.destructive : 'rgba(255,255,255,0.2)',
                                                                    color: theme.colors.foreground
                                                                }
                                                            ]}
                                                            placeholder="30"
                                                            placeholderTextColor="rgba(255,255,255,0.6)"
                                                value={service.price.toString()}
                                                            onChangeText={(text) => handleServiceChange(index, 'price', parseFloat(text) || 0)}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                                    {validationErrors[`services.${index}.price`] && (
                                                        <Text style={[tw`text-sm mt-2`, { color: theme.colors.destructive }]}>
                                                            {validationErrors[`services.${index}.price`]}
                                                        </Text>
                                                    )}
                                                </View>
                                                <View style={tw`flex-1`}>
                                                    <Text style={[tw`text-base font-semibold mb-3`, { color: theme.colors.foreground }]}>
                                                        Duration (min) *
                                                    </Text>
                                            <TextInput
                                                        style={[
                                                            tw`p-4 rounded-xl border text-base`,
                                                            { 
                                                                backgroundColor: 'rgba(255,255,255,0.05)',
                                                                borderColor: validationErrors[`services.${index}.duration`] ? theme.colors.destructive : 'rgba(255,255,255,0.2)',
                                                                color: theme.colors.foreground
                                                            }
                                                        ]}
                                                        placeholder="30"
                                                        placeholderTextColor="rgba(255,255,255,0.6)"
                                                value={service.duration.toString()}
                                                        onChangeText={(text) => handleServiceChange(index, 'duration', parseInt(text) || 0)}
                                                keyboardType="numeric"
                                                    />
                                                    {validationErrors[`services.${index}.duration`] && (
                                                        <Text style={[tw`text-sm mt-2`, { color: theme.colors.destructive }]}>
                                                            {validationErrors[`services.${index}.duration`]}
                                                        </Text>
                                                    )}
                                        </View>
                                            </View>
                                        </View>
                                    ))}
                                        
                                        <TouchableOpacity
                                        onPress={addService}
                                        style={[
                                            tw`flex-row items-center justify-center p-6 rounded-2xl border-2 border-dashed`,
                                            { borderColor: 'rgba(255,255,255,0.3)' }
                                        ]}
                                    >
                                        <View style={[
                                            tw`w-8 h-8 rounded-lg items-center justify-center mr-3`,
                                            { backgroundColor: 'rgba(255,255,255,0.1)' }
                                        ]}>
                                            <Plus size={16} color={theme.colors.secondary} />
                                        </View>
                                        <Text style={[tw`font-semibold text-base`, { color: theme.colors.secondary }]}>
                                            Add Another Service
                                        </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                        </View>
                    </ScrollView>
                );

            case 'stripe':
                return (
                    <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                        <View style={tw`p-6 space-y-8`}>
                            {/* Payment Setup */}
                            <View style={[
                                tw`p-6 rounded-2xl`,
                                { backgroundColor: 'rgba(255,255,255,0.03)' }
                            ]}>
                                <View style={tw`mb-6`}>
                                    <View style={[
                                        tw`w-12 h-12 rounded-xl items-center justify-center mb-4`,
                                        { backgroundColor: 'rgba(255,255,255,0.1)' }
                                    ]}>
                                        <CreditCard size={24} color={theme.colors.secondary} />
                                    </View>
                                    <Text style={[tw`text-2xl font-bold mb-2`, { color: theme.colors.foreground }]}>
                                        Payment Setup
                                    </Text>
                                    <Text style={[tw`text-base`, { color: theme.colors.mutedForeground }]}>
                                        Connect your Stripe account to start accepting payments
                                    </Text>
                                </View>
                                
                                <View style={tw`space-y-6`}>
                                    <View style={[
                                        tw`p-6 rounded-2xl`,
                                        { backgroundColor: 'rgba(255,255,255,0.05)' }
                                    ]}>
                                        <View style={tw`flex-row items-center mb-6`}>
                                            <View style={[
                                                tw`w-12 h-12 rounded-xl items-center justify-center mr-4`,
                                                { backgroundColor: 'rgba(255,255,255,0.1)' }
                                            ]}>
                                                <CreditCard size={24} color={theme.colors.secondary} />
                            </View>
                                            <View style={tw`flex-1`}>
                                                <Text style={[tw`text-xl font-bold`, { color: theme.colors.foreground }]}>
                                                    Stripe Connect
                                    </Text>
                                                <Text style={[tw`text-base`, { color: theme.colors.mutedForeground }]}>
                                                    Secure payment processing
                                    </Text>
                                </View>
                            </View>
                                        
                                        <View style={tw`space-y-4 mb-6`}>
                                            <View style={tw`flex-row items-start`}>
                                                <View style={[
                                                    tw`w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5`,
                                                    { backgroundColor: 'rgba(34, 197, 94, 0.2)' }
                                                ]}>
                                                    <Text style={[tw`text-xs font-bold`, { color: '#22c55e' }]}>✓</Text>
                                                </View>
                                                <Text style={[tw`text-base flex-1`, { color: theme.colors.foreground }]}>
                                                    Accept credit card and digital wallet payments
                                    </Text>
                                            </View>
                                            
                                            <View style={tw`flex-row items-start`}>
                                                <View style={[
                                                    tw`w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5`,
                                                    { backgroundColor: 'rgba(34, 197, 94, 0.2)' }
                                                ]}>
                                                    <Text style={[tw`text-xs font-bold`, { color: '#22c55e' }]}>✓</Text>
                                        </View>
                                                <Text style={[tw`text-base flex-1`, { color: theme.colors.foreground }]}>
                                                    Automatic payouts to your bank account
                                                </Text>
                                        </View>
                                            
                                            <View style={tw`flex-row items-start`}>
                                                <View style={[
                                                    tw`w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5`,
                                                    { backgroundColor: 'rgba(34, 197, 94, 0.2)' }
                                                ]}>
                                                    <Text style={[tw`text-xs font-bold`, { color: '#22c55e' }]}>✓</Text>
                                                </View>
                                                <Text style={[tw`text-base flex-1`, { color: theme.colors.foreground }]}>
                                                    Industry-leading security and fraud protection
                                                </Text>
                                        </View>
                                    </View>
                                    
                                    <TouchableOpacity
                                        onPress={handleStripeConnect}
                                        disabled={loading}
                                            style={[
                                                tw`flex-row items-center justify-center py-4 px-6 rounded-xl`,
                                                { backgroundColor: theme.colors.secondary }
                                            ]}
                                    >
                                        {loading ? (
                                                <ActivityIndicator color={theme.colors.primaryForeground} />
                                            ) : (
                                                <>
                                                    <CreditCard size={20} color={theme.colors.primaryForeground} style={tw`mr-3`} />
                                                    <Text style={[tw`font-semibold text-base`, { color: theme.colors.primaryForeground }]}>
                                                        Connect Stripe Account
                                            </Text>
                                                </>
                                        )}
                                    </TouchableOpacity>
                                        </View>
                                        
                                    {/* Skip Option */}
                                    <View style={[
                                        tw`p-4 rounded-xl`,
                                        { backgroundColor: 'rgba(255,255,255,0.03)' }
                                    ]}>
                                        <Text style={[tw`text-sm text-center`, { color: theme.colors.mutedForeground }]}>
                                            You can always set up payments later in your settings
                                        </Text>
                                    </View>
                                </View>
                            </View>
                    </View>
                    </ScrollView>
                );

            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle="light-content" />
            
            {/* Main Header */}
            <View style={tw`w-full max-w-2xl mx-auto pt-12 pb-6 px-4`}>
                <Text style={[tw`text-4xl font-bold text-center`, { color: theme.colors.foreground }]}>
                    {steps[currentStep].title}
                </Text>
            </View>

            {/* Progress Bar & Step Indicator */}
            <View style={tw`w-full max-w-2xl mx-auto px-4 mb-10`}>
                <View style={tw`flex-row items-center justify-between mb-6`}>
                    {steps.map((step, idx) => {
                        const Icon = step.icon;
                        const isActive = currentStep === idx;
                        const isCompleted = currentStep > idx;
                        
                        return (
                            <View key={step.id} style={tw`flex-1 flex-col items-center`}>
                                <View style={[
                                    tw`rounded-full border-2 w-14 h-14 items-center justify-center mb-3`,
                                    isActive ? 
                                        { borderColor: theme.colors.secondary, backgroundColor: 'rgba(255,255,255,0.2)' } :
                                    isCompleted ?
                                        { borderColor: theme.colors.secondary, backgroundColor: theme.colors.secondary } :
                                        { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)' }
                                ]}>
                                    {isCompleted ? (
                                        <CheckCircle size={24} color={theme.colors.primaryForeground} />
                                    ) : (
                                        <Icon 
                                            size={24} 
                                            color={isActive ? theme.colors.secondary : 'rgba(255,255,255,0.6)'} 
                                        />
                                    )}
                                </View>
                                <Text style={[
                                    tw`text-xs font-semibold text-center`,
                                    { color: isActive || isCompleted ? theme.colors.secondary : 'rgba(255,255,255,0.6)' }
                                ]}>
                                    {step.title}
                                </Text>
                            </View>
                        );
                    })}
                </View>
                
                {/* Progress Bar */}
                <View style={tw`h-3 bg-white/10 rounded-full overflow-hidden`}>
                    <View 
                        style={[
                            tw`h-full rounded-full`,
                            { 
                                backgroundColor: theme.colors.secondary,
                                width: `${getProgressPercentage()}%`
                            }
                        ]} 
                    />
                </View>
            </View>

            {/* Main Content */}
            <ScrollView 
                style={tw`flex-1`} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`pb-32`}
            >
                <View style={tw`px-4`}>
                    <View style={tw`w-full max-w-2xl mx-auto`}>
                        {/* Onboarding Complete Banner */}
                        {onboardingComplete && showCompleteBanner && (
                            <View style={tw`justify-center mb-10`}>
                                <View style={[
                                    tw`bg-white/10 border border-white/20 rounded-3xl max-w-lg w-full relative`,
                                    { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }
                                ]}>
                                    <TouchableOpacity
                                        style={tw`absolute top-4 right-4 rounded-full p-1`}
                                        onPress={() => setShowCompleteBanner(false)}
                                    >
                                        <X size={20} color="#22c55e" />
                                    </TouchableOpacity>
                                    
                                                                <View style={tw`bg-transparent rounded-t-3xl flex-col items-center p-8`}>
                                <View style={tw`items-center justify-center mb-4`}>
                                    <CheckCircle size={40} color={theme.colors.secondary} />
                                </View>
                                <Text style={[tw`text-2xl font-bold text-center`, { color: theme.colors.foreground }]}>
                                    Onboarding Complete!
                                </Text>
                                <Text style={[tw`text-center mt-3 font-medium`, { color: theme.colors.foreground }]}>
                                            Your profile is ready. You can now receive bookings and payments.{'\n'}
                                            Welcome to the platform!
                                        </Text>
                                    </View>
                                    
                                    <View style={tw`flex-col items-center pb-8 pt-2`}>
                                        <TouchableOpacity
                                            style={[
                                                tw`bg-secondary rounded-xl px-8 py-3 mt-4`,
                                                { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 }
                                            ]}
                                            onPress={() => navigation.navigate('MainTabs' as any)}
                                        >
                                            <Text style={[tw`text-lg font-bold`, { color: theme.colors.primaryForeground }]}>
                                                Go to Profile
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Step Card */}
                        <View style={[
                            tw`bg-white/5 border border-white/10 rounded-3xl`,
                            { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 }
                        ]}>
                            {/* Card Header */}
                            <View style={tw`bg-white/5 border-b border-white/10 rounded-t-3xl p-8`}>
                                <View style={tw`flex-row items-center gap-3 mb-4`}>
                                    {React.createElement(steps[currentStep].icon, { 
                                        size: 32, 
                                        color: theme.colors.secondary 
                                    })}
                                    <Text style={[tw`text-3xl font-bold`, { color: theme.colors.foreground }]}>
                                        {steps[currentStep].title}
                                    </Text>
                                </View>
                                <Text style={[tw`text-lg`, { color: 'rgba(255,255,255,0.7)' }]}>
                                    {steps[currentStep].description}
                                </Text>
                            </View>
                            
                            {/* Card Content */}
                            <View style={tw`p-8`}>
                                {renderStep()}
                            </View>
                        </View>

                        {/* Navigation Buttons */}
                        <View style={tw`flex-row justify-between items-center mt-10 gap-6`}>
                            <TouchableOpacity
                                style={[
                                    tw`border border-secondary rounded-xl px-8 py-4`,
                                    { opacity: currentStep === 0 ? 0.5 : 1 }
                                ]}
                                onPress={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                                disabled={currentStep === 0}
                            >
                                <Text style={[tw`font-bold text-base`, { color: theme.colors.secondary }]}>
                                    Back
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[
                                    tw`bg-secondary rounded-xl px-10 py-4`,
                                    { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 }
                                ]}
                                onPress={async () => {
                                    if (await validateStep(currentStep)) {
                                        if (currentStep < steps.length - 1) {
                                            setCurrentStep((prev) => prev + 1)
                                        } else {
                                            handleSubmit()
                                        }
                                    } else {
                                        Alert.alert('Validation Error', 'Please fix the errors before continuing.');
                                    }
                                }}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={theme.colors.primaryForeground} />
                                ) : (
                                    <Text style={[tw`text-lg font-bold`, { color: theme.colors.primaryForeground }]}>
                                        {currentStep < steps.length - 1 ? 'Next' : 'Finish'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}