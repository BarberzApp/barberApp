// screens/BarberOnboardingPage.tsx
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import { RootStackParamList, Service } from '../types/types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
    Building, 
    Scissors, 
    CreditCard, 
    CheckCircle, 
    AlertCircle, 
    Loader2 
} from 'lucide-react-native';

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
    address: string;
    city: string;
    state: string;
    zipCode: string;
    bio: string;
    specialties: string;
    services: Array<{ name: string; price: number; duration: number }>;
    stripeConnected: boolean;
}

interface ValidationErrors {
    [key: string]: string;
}

export default function BarberOnboardingPage() {
    const navigation = useNavigation<BarberOnboardingNavigationProp>();
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isRouterReady, setIsRouterReady] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [stripeStatus, setStripeStatus] = useState<string | null>(null);
    const [onboardingComplete, setOnboardingComplete] = useState(false);
    const [initialDataLoading, setInitialDataLoading] = useState(true);

    const [formData, setFormData] = useState<FormData>({
        businessName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        bio: '',
        specialties: '',
        services: [],
        stripeConnected: false
    });

    useEffect(() => {
        setIsRouterReady(true);
    }, []);

    // Prefill form with existing data
    useEffect(() => {
        const fetchProfileData = async () => {
            if (!user) return;
            
            try {
                // Fetch barber data
                const { data: barber, error: barberError } = await supabase
                    .from('barbers')
                    .select('id, business_name, bio, specialties, stripe_account_status, stripe_account_id')
                    .eq('user_id', user.id)
                    .single();

                if (barberError && barberError.code !== 'PGRST116') {
                    console.error('Error fetching barber data:', barberError);
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

                // Parse location
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

                // Fetch services for this barber
                let services: Array<{ name: string; price: number; duration: number }> = [];
                if (barber?.id) {
                    const { data: existingServices, error: servicesError } = await supabase
                        .from('services')
                        .select('name, price, duration')
                        .eq('barber_id', barber.id);

                    if (!servicesError && Array.isArray(existingServices)) {
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
                    services,
                    stripeConnected: barber?.stripe_account_status === 'active'
                }));

                if (barber?.stripe_account_id) {
                    setStripeStatus(barber?.stripe_account_status || null);
                } else {
                    setStripeStatus(null);
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setInitialDataLoading(false);
            }
        };

        if (isRouterReady && user) {
            fetchProfileData();
        }
    }, [isRouterReady, user]);

    // Check if user is a barber and onboarding is incomplete
    useEffect(() => {
        if (isRouterReady && user) {
            if (user.user_metadata?.role !== 'barber') {
                navigation.navigate('FindBarber');
                return;
            }

            // Check if onboarding is already complete
            const checkOnboarding = async () => {
                try {
                    const { data: barber } = await supabase
                        .from('barbers')
                        .select('business_name, bio, specialties')
                        .eq('user_id', user.id)
                        .single();

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('phone, location')
                        .eq('id', user.id)
                        .single();

                    const hasBusinessInfo = barber?.business_name && barber?.bio && barber?.specialties && barber.specialties.length > 0;
                    const hasContactInfo = profile?.phone && profile?.location;

                    if (hasBusinessInfo && hasContactInfo) {
                        setOnboardingComplete(true);
                    } else {
                        setOnboardingComplete(false);
                    }
                } catch (error) {
                    console.error('Error checking onboarding status:', error);
                }
            };

            checkOnboarding();
        }
    }, [isRouterReady, user, navigation]);

    const validateStep = (stepIndex: number): boolean => {
        const errors: ValidationErrors = {};

        if (stepIndex === 0) {
            // Business Information validation
            if (!formData.businessName.trim()) errors.businessName = 'Business name is required';
            if (!formData.phone.trim()) errors.phone = 'Phone number is required';
            if (!formData.address.trim()) errors.address = 'Address is required';
            if (!formData.city.trim()) errors.city = 'City is required';
            if (!formData.state.trim()) errors.state = 'State is required';
            if (!formData.zipCode.trim()) errors.zipCode = 'ZIP code is required';
            if (!formData.bio.trim()) errors.bio = 'Bio is required';
            
            // Phone validation
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
                errors.phone = 'Please enter a valid phone number';
            }

            // ZIP code validation
            const zipRegex = /^\d{5}(-\d{4})?$/;
            if (formData.zipCode && !zipRegex.test(formData.zipCode)) {
                errors.zipCode = 'Please enter a valid ZIP code';
            }
        }

        if (stepIndex === 1) {
            // Services validation
            if (formData.services.length === 0) {
                errors.services = 'At least one service is required';
            } else {
                formData.services.forEach((service, index) => {
                    if (!service.name.trim()) {
                        errors[`service-${index}-name`] = 'Service name is required';
                    }
                    if (!service.price || service.price <= 0) {
                        errors[`service-${index}-price`] = 'Valid price is required';
                    }
                    if (!service.duration || service.duration < 15) {
                        errors[`service-${index}-duration`] = 'Duration must be at least 15 minutes';
                    }
                });
            }
        }

        if (stepIndex === 2) {
            // Stripe validation
            if (!formData.stripeConnected) {
                errors.stripeConnected = 'Stripe account must be connected';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleServiceChange = (index: number, field: string, value: string | number) => {
        setFormData((prev) => ({
            ...prev,
            services: prev.services.map((service, i) =>
                i === index ? { ...service, [field]: value } : service
            ),
        }));
        
        // Clear validation error when user starts typing
        const errorKey = `service-${index}-${field}`;
        if (validationErrors[errorKey]) {
            setValidationErrors(prev => ({ ...prev, [errorKey]: '' }));
        }
    };

    const addService = () => {
        setFormData((prev) => ({
            ...prev,
            services: [...prev.services, { name: '', price: 0, duration: 30 }],
        }));
    };

    const removeService = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            services: prev.services.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async () => {
        if (!isRouterReady) {
            console.log('Router not ready, waiting...');
            return;
        }

        // Validate current step
        if (!validateStep(currentStep)) {
            Alert.alert('Validation Error', 'Please fix the errors before continuing.');
            return;
        }

        setLoading(true);
        try {
            // Update business profile
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

            // Update phone and location in profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    phone: formData.phone,
                    location: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user?.id);

            if (profileError) throw profileError;

            // Add services
            if (formData.services.length > 0 && user) {
                const { data: barberRow, error: barberIdError } = await supabase
                    .from('barbers')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();
                
                if (barberIdError || !barberRow) throw barberIdError || new Error('No barber row found');
                
                const barberId = barberRow.id;
                
                // Delete existing services
                await supabase.from('services').delete().eq('barber_id', barberId);
                
                // Insert new services
                const { error: servicesError } = await supabase
                    .from('services')
                    .insert(
                        formData.services.map(service => ({
                            barber_id: barberId,
                            name: service.name,
                            price: service.price,
                            duration: service.duration,
                        }))
                    );
                
                if (servicesError) throw servicesError;
            }

            Alert.alert('Success', 'Your business profile has been updated successfully.');

            // Move to next step or complete
            if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1);
            } else {
                navigation.navigate('Settings' as any);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStripeConnect = async () => {
        try {
            setLoading(true);
            
            const { data: barber, error: barberError } = await supabase
                .from('barbers')
                .select('id')
                .eq('user_id', user?.id)
                .single();
                
            if (barberError || !barber?.id) {
                Alert.alert('Error', 'Could not find your barber profile. Please complete your business info first.');
                return;
            }

            // In a real app, you would call your API to create Stripe account
            Alert.alert(
                'Stripe Connect',
                'This would redirect you to Stripe to complete your account setup. For now, we\'ll simulate the connection.',
                [
                    {
                        text: 'OK',
                        onPress: async () => {
                            // Simulate Stripe connection
                            setFormData(prev => ({ ...prev, stripeConnected: true }));
                            setStripeStatus('active');
                            
                            // Update in database
                            await supabase
                                .from('barbers')
                                .update({
                                    stripe_account_status: 'active',
                                    stripe_account_id: 'simulated_stripe_id',
                                })
                                .eq('user_id', user?.id);
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error creating Stripe account:', error);
            Alert.alert('Error', 'Failed to create Stripe account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <View style={tw`px-5`}>
                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-300 text-sm mb-2`}>Business Name *</Text>
                            <TextInput
                                style={tw`bg-gray-800 text-white px-4 py-3 rounded-lg ${validationErrors.businessName ? 'border-2 border-red-500' : ''}`}
                                value={formData.businessName}
                                onChangeText={(text) => {
                                    setFormData(prev => ({ ...prev, businessName: text }));
                                    if (validationErrors.businessName) {
                                        setValidationErrors(prev => ({ ...prev, businessName: '' }));
                                    }
                                }}
                                placeholder="Enter your business name"
                                placeholderTextColor="#6B7280"
                            />
                            {validationErrors.businessName && (
                                <Text style={tw`text-red-500 text-sm mt-1`}>{validationErrors.businessName}</Text>
                            )}
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-300 text-sm mb-2`}>Phone Number *</Text>
                            <TextInput
                                style={tw`bg-gray-800 text-white px-4 py-3 rounded-lg ${validationErrors.phone ? 'border-2 border-red-500' : ''}`}
                                value={formData.phone}
                                onChangeText={(text) => {
                                    setFormData(prev => ({ ...prev, phone: text }));
                                    if (validationErrors.phone) {
                                        setValidationErrors(prev => ({ ...prev, phone: '' }));
                                    }
                                }}
                                placeholder="(555) 123-4567"
                                placeholderTextColor="#6B7280"
                                keyboardType="phone-pad"
                            />
                            {validationErrors.phone && (
                                <Text style={tw`text-red-500 text-sm mt-1`}>{validationErrors.phone}</Text>
                            )}
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-300 text-sm mb-2`}>Address *</Text>
                            <TextInput
                                style={tw`bg-gray-800 text-white px-4 py-3 rounded-lg ${validationErrors.address ? 'border-2 border-red-500' : ''}`}
                                value={formData.address}
                                onChangeText={(text) => {
                                    setFormData(prev => ({ ...prev, address: text }));
                                    if (validationErrors.address) {
                                        setValidationErrors(prev => ({ ...prev, address: '' }));
                                    }
                                }}
                                placeholder="123 Main St"
                                placeholderTextColor="#6B7280"
                            />
                            {validationErrors.address && (
                                <Text style={tw`text-red-500 text-sm mt-1`}>{validationErrors.address}</Text>
                            )}
                        </View>

                        <View style={tw`flex-row gap-3 mb-4`}>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-gray-300 text-sm mb-2`}>City *</Text>
                                <TextInput
                                    style={tw`bg-gray-800 text-white px-4 py-3 rounded-lg ${validationErrors.city ? 'border-2 border-red-500' : ''}`}
                                    value={formData.city}
                                    onChangeText={(text) => {
                                        setFormData(prev => ({ ...prev, city: text }));
                                        if (validationErrors.city) {
                                            setValidationErrors(prev => ({ ...prev, city: '' }));
                                        }
                                    }}
                                    placeholder="City"
                                    placeholderTextColor="#6B7280"
                                />
                                {validationErrors.city && (
                                    <Text style={tw`text-red-500 text-sm mt-1`}>{validationErrors.city}</Text>
                                )}
                            </View>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-gray-300 text-sm mb-2`}>State *</Text>
                                <TextInput
                                    style={tw`bg-gray-800 text-white px-4 py-3 rounded-lg ${validationErrors.state ? 'border-2 border-red-500' : ''}`}
                                    value={formData.state}
                                    onChangeText={(text) => {
                                        setFormData(prev => ({ ...prev, state: text }));
                                        if (validationErrors.state) {
                                            setValidationErrors(prev => ({ ...prev, state: '' }));
                                        }
                                    }}
                                    placeholder="State"
                                    placeholderTextColor="#6B7280"
                                />
                                {validationErrors.state && (
                                    <Text style={tw`text-red-500 text-sm mt-1`}>{validationErrors.state}</Text>
                                )}
                            </View>
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-300 text-sm mb-2`}>ZIP Code *</Text>
                            <TextInput
                                style={tw`bg-gray-800 text-white px-4 py-3 rounded-lg ${validationErrors.zipCode ? 'border-2 border-red-500' : ''}`}
                                value={formData.zipCode}
                                onChangeText={(text) => {
                                    setFormData(prev => ({ ...prev, zipCode: text }));
                                    if (validationErrors.zipCode) {
                                        setValidationErrors(prev => ({ ...prev, zipCode: '' }));
                                    }
                                }}
                                placeholder="12345"
                                placeholderTextColor="#6B7280"
                                keyboardType="numeric"
                            />
                            {validationErrors.zipCode && (
                                <Text style={tw`text-red-500 text-sm mt-1`}>{validationErrors.zipCode}</Text>
                            )}
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-300 text-sm mb-2`}>Bio *</Text>
                            <TextInput
                                style={tw`bg-gray-800 text-white px-4 py-3 rounded-lg ${validationErrors.bio ? 'border-2 border-red-500' : ''}`}
                                value={formData.bio}
                                onChangeText={(text) => {
                                    setFormData(prev => ({ ...prev, bio: text }));
                                    if (validationErrors.bio) {
                                        setValidationErrors(prev => ({ ...prev, bio: '' }));
                                    }
                                }}
                                placeholder="Tell us about your business, experience, and what makes you unique..."
                                placeholderTextColor="#6B7280"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                            {validationErrors.bio && (
                                <Text style={tw`text-red-500 text-sm mt-1`}>{validationErrors.bio}</Text>
                            )}
                        </View>

                        <View style={tw`mb-4`}>
                            <Text style={tw`text-gray-300 text-sm mb-2`}>Specialties</Text>
                            <TextInput
                                style={tw`bg-gray-800 text-white px-4 py-3 rounded-lg`}
                                value={formData.specialties}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, specialties: text }))}
                                placeholder="Haircuts, Beard Trims, Fades, etc. (comma-separated)"
                                placeholderTextColor="#6B7280"
                            />
                            <Text style={tw`text-gray-500 text-sm mt-1`}>
                                List your specialties to help clients find you
                            </Text>
                        </View>
                    </View>
                );

            case 1:
                return (
                    <View style={tw`px-5`}>
                        {validationErrors.services && (
                            <View style={tw`bg-red-900/20 border border-red-500 rounded-lg p-3 mb-4 flex-row items-center`}>
                                <AlertCircle size={16} color="#ef4444" />
                                <Text style={tw`text-red-400 text-sm ml-2`}>{validationErrors.services}</Text>
                            </View>
                        )}
                        
                        {formData.services.length === 0 && (
                            <View style={tw`bg-blue-900/20 border border-blue-500 rounded-lg p-3 mb-4 flex-row items-center`}>
                                <AlertCircle size={16} color="#3b82f6" />
                                <Text style={tw`text-blue-400 text-sm ml-2`}>
                                    Add at least one service to get started. You can always add more later.
                                </Text>
                            </View>
                        )}
                        
                        {formData.services.map((service, index) => (
                            <View key={index} style={tw`bg-gray-800 rounded-lg p-4 mb-3`}>
                                <View style={tw`mb-3`}>
                                    <Text style={tw`text-gray-300 text-sm mb-2`}>Service Name *</Text>
                                    <TextInput
                                        style={tw`bg-gray-700 text-white px-4 py-3 rounded-lg ${validationErrors[`service-${index}-name`] ? 'border-2 border-red-500' : ''}`}
                                        value={service.name}
                                        onChangeText={(text) => handleServiceChange(index, 'name', text)}
                                        placeholder="e.g., Haircut"
                                        placeholderTextColor="#6B7280"
                                    />
                                    {validationErrors[`service-${index}-name`] && (
                                        <Text style={tw`text-red-500 text-sm mt-1`}>{validationErrors[`service-${index}-name`]}</Text>
                                    )}
                                </View>

                                <View style={tw`flex-row gap-3 mb-3`}>
                                    <View style={tw`flex-1`}>
                                        <Text style={tw`text-gray-300 text-sm mb-2`}>Price ($) *</Text>
                                        <TextInput
                                            style={tw`bg-gray-700 text-white px-4 py-3 rounded-lg ${validationErrors[`service-${index}-price`] ? 'border-2 border-red-500' : ''}`}
                                            value={service.price.toString()}
                                            onChangeText={(text) => {
                                                const val = text.replace(/[^0-9.]/g, '');
                                                handleServiceChange(index, 'price', val === '' ? 0 : parseFloat(val));
                                            }}
                                            placeholder="25.00"
                                            placeholderTextColor="#6B7280"
                                            keyboardType="decimal-pad"
                                        />
                                        {validationErrors[`service-${index}-price`] && (
                                            <Text style={tw`text-red-500 text-sm mt-1`}>{validationErrors[`service-${index}-price`]}</Text>
                                        )}
                                    </View>
                                    <View style={tw`flex-1`}>
                                        <Text style={tw`text-gray-300 text-sm mb-2`}>Duration (min) *</Text>
                                        <TextInput
                                            style={tw`bg-gray-700 text-white px-4 py-3 rounded-lg ${validationErrors[`service-${index}-duration`] ? 'border-2 border-red-500' : ''}`}
                                            value={service.duration.toString()}
                                            onChangeText={(text) => {
                                                const val = text.replace(/[^0-9]/g, '');
                                                handleServiceChange(index, 'duration', val === '' ? 30 : parseInt(val));
                                            }}
                                            placeholder="30"
                                            placeholderTextColor="#6B7280"
                                            keyboardType="numeric"
                                        />
                                        {validationErrors[`service-${index}-duration`] && (
                                            <Text style={tw`text-red-500 text-sm mt-1`}>{validationErrors[`service-${index}-duration`]}</Text>
                                        )}
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => removeService(index)}
                                    style={tw`bg-red-600 py-2 px-4 rounded-lg`}
                                >
                                    <Text style={tw`text-white text-center text-sm font-medium`}>Remove Service</Text>
                                </TouchableOpacity>
                            </View>
                        ))}

                        <TouchableOpacity
                            onPress={addService}
                            style={tw`border border-gray-600 py-3 px-4 rounded-lg`}
                        >
                            <Text style={tw`text-white text-center font-medium`}>Add Service</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 2:
                return (
                    <View style={tw`px-5`}>
                        {stripeStatus === 'active' && formData.stripeConnected ? (
                            <View style={tw`bg-green-900/20 border border-green-500 rounded-lg p-4 mb-6 flex-row items-center`}>
                                <CheckCircle size={20} color="#10b981" />
                                <Text style={tw`text-green-400 ml-3 flex-1`}>
                                    Your Stripe account is connected and ready to accept payments!
                                </Text>
                            </View>
                        ) : stripeStatus === 'pending' ? (
                            <View style={tw`bg-yellow-900/20 border border-yellow-500 rounded-lg p-4 mb-6 flex-row items-center`}>
                                <AlertCircle size={20} color="#f59e0b" />
                                <Text style={tw`text-yellow-400 ml-3 flex-1`}>
                                    Your Stripe account is being reviewed. This usually takes 1-2 business days.
                                </Text>
                            </View>
                        ) : (
                            <>
                                <Text style={tw`text-gray-300 mb-4`}>
                                    To receive payments, you need to connect your Stripe account. This will allow you to:
                                </Text>
                                
                                <View style={tw`mb-6`}>
                                    <Text style={tw`text-gray-300 mb-2`}>• Accept credit card payments securely</Text>
                                    <Text style={tw`text-gray-300 mb-2`}>• Receive payments directly to your bank account</Text>
                                    <Text style={tw`text-gray-300 mb-2`}>• Manage your earnings and payouts</Text>
                                    <Text style={tw`text-gray-300`}>• Get detailed payment reports</Text>
                                </View>
                                
                                {validationErrors.stripeConnected && (
                                    <View style={tw`bg-red-900/20 border border-red-500 rounded-lg p-3 mb-4 flex-row items-center`}>
                                        <AlertCircle size={16} color="#ef4444" />
                                        <Text style={tw`text-red-400 text-sm ml-2`}>{validationErrors.stripeConnected}</Text>
                                    </View>
                                )}
                                
                                <TouchableOpacity
                                    onPress={handleStripeConnect}
                                    disabled={loading}
                                    style={tw`bg-purple-600 py-4 rounded-lg mb-4`}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={tw`text-white text-center font-semibold text-base`}>
                                            Connect Stripe Account
                                        </Text>
                                    )}
                                </TouchableOpacity>
                                
                                <Text style={tw`text-gray-500 text-xs text-center`}>
                                    You'll be redirected to Stripe to complete the setup. This process is secure and takes about 5 minutes.
                                </Text>
                            </>
                        )}
                    </View>
                );

            default:
                return null;
        }
    };

    const getProgressPercentage = () => {
        return ((currentStep + 1) / steps.length) * 100;
    };

    if (!isRouterReady || initialDataLoading) {
        return (
            <SafeAreaView style={tw`flex-1 bg-gray-900`}>
                <View style={tw`flex-1 items-center justify-center`}>
                    <ActivityIndicator size="large" color="#9333ea" />
                    <Text style={tw`text-gray-400 mt-4`}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={tw`flex-1 bg-gray-900`}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={tw`flex-1`}
            >
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={tw`px-5 py-6`}>
                        {/* Header */}
                        <View style={tw`mb-6`}>
                            <Text style={tw`text-white text-3xl font-bold text-center`}>
                                Complete Your Profile
                            </Text>
                            <Text style={tw`text-gray-400 text-center mt-2`}>
                                {steps[currentStep].description}
                            </Text>
                        </View>

                        {/* Progress Bar */}
                        <View style={tw`mb-6`}>
                            <View style={tw`flex-row justify-between mb-2`}>
                                <Text style={tw`text-gray-400 text-sm`}>
                                    Step {currentStep + 1} of {steps.length}
                                </Text>
                                <Text style={tw`text-gray-400 text-sm`}>
                                    {Math.round(getProgressPercentage())}% Complete
                                </Text>
                            </View>
                            <View style={tw`h-2 bg-gray-700 rounded-full overflow-hidden`}>
                                <View 
                                    style={[
                                        tw`h-full bg-purple-600`,
                                        { width: `${getProgressPercentage()}%` }
                                    ]} 
                                />
                            </View>
                        </View>

                        {/* Step Indicators */}
                        <View style={tw`flex-row justify-between mb-8`}>
                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                return (
                                    <View
                                        key={step.id}
                                        style={tw`flex-1 items-center`}
                                    >
                                        <View
                                            style={tw`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                                                index <= currentStep ? 'bg-purple-600' : 'bg-gray-700'
                                            }`}
                                        >
                                            <Icon 
                                                size={24} 
                                                color={index <= currentStep ? '#ffffff' : '#9ca3af'} 
                                            />
                                        </View>
                                        <Text style={tw`text-xs ${
                                            index <= currentStep ? 'text-purple-400' : 'text-gray-500'
                                        } text-center`}>
                                            {step.title.split(' ')[0]}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Step Content */}
                        <View style={tw`bg-gray-800 rounded-2xl p-6 mb-6`}>
                            <View style={tw`flex-row items-center mb-4`}>
                                {(() => {
                                    const Icon = steps[currentStep].icon;
                                    return <Icon size={20} color="#9333ea" />;
                                })()}
                                <Text style={tw`text-white text-lg font-semibold ml-2`}>
                                    {steps[currentStep].title}
                                </Text>
                            </View>
                            {renderStep()}
                        </View>

                        {/* Navigation Buttons */}
                        <View style={tw`flex-row gap-3`}>
                            {currentStep > 0 && (
                                <TouchableOpacity
                                    style={tw`flex-1 border border-gray-600 py-3 rounded-lg`}
                                    onPress={() => setCurrentStep(currentStep - 1)}
                                    disabled={loading}
                                >
                                    <Text style={tw`text-white text-center font-medium`}>Previous</Text>
                                </TouchableOpacity>
                            )}
                            
                            <TouchableOpacity
                                style={tw`flex-1 bg-purple-600 py-3 rounded-lg ${
                                    loading || (currentStep === 2 && !formData.stripeConnected) ? 'opacity-50' : ''
                                }`}
                                onPress={handleSubmit}
                                disabled={loading || (currentStep === 2 && !formData.stripeConnected)}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={tw`text-white text-center font-semibold`}>
                                        {currentStep < steps.length - 1 ? 'Next' : 'Complete Setup'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Completion Card */}
                        {onboardingComplete && (
                            <View style={tw`bg-green-900/20 border border-green-500 rounded-2xl p-6 mt-6`}>
                                <View style={tw`items-center`}>
                                    <CheckCircle size={48} color="#10b981" />
                                    <Text style={tw`text-green-400 text-lg font-semibold mt-3`}>
                                        Onboarding Complete!
                                    </Text>
                                    <Text style={tw`text-green-300 text-sm text-center mt-2`}>
                                        Your profile is now complete. You can continue to settings to manage your account.
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('Settings' as any)}
                                        style={tw`bg-green-600 px-6 py-3 rounded-lg mt-4`}
                                    >
                                        <Text style={tw`text-white font-semibold`}>Go to Settings</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}