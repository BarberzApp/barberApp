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
import Icon from 'react-native-vector-icons/Feather';

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

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!user) return;
            
            try {
                const { data: barber } = await supabase
                    .from('barbers')
                    .select('id, business_name, bio, specialties, stripe_account_status, stripe_account_id')
                    .eq('user_id', user.id)
                    .single();

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('phone, location')
                    .eq('id', user.id)
                    .single();

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

                setStripeStatus(barber?.stripe_account_status || null);
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setInitialDataLoading(false);
            }
        };

        if (user) {
            fetchProfileData();
        }
    }, [user]);

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

        if (stepIndex === 2 && !formData.stripeConnected) {
            Alert.alert('Payment Setup Required', 'Please connect your Stripe account to receive payments');
            return false;
        }

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

            Alert.alert(
                'Success!',
                'Your barber profile is now complete.',
                [{
                    text: 'OK',
                    onPress: () => navigation.navigate('Settings' as any)
                }]
            );
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStripeConnect = async () => {
        setLoading(true);
        try {
            Alert.alert(
                'Connect Stripe',
                'This will redirect you to Stripe to complete your account setup.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Continue',
                        onPress: async () => {
                            setFormData(prev => ({ ...prev, stripeConnected: true }));
                            setStripeStatus('active');
                            
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
            Alert.alert('Error', 'Failed to connect Stripe account.');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={tw`pb-20`}>
                            <View style={tw`mb-6`}>
                                <View style={tw`flex-row items-center mb-2`}>
                                    <Icon name="briefcase" size={16} color="#9333ea" />
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
                                    <Icon name="phone" size={16} color="#9333ea" />
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
                                    <Icon name="map-pin" size={16} color="#9333ea" />
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
                                    <Icon name="file-text" size={16} color="#9333ea" />
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
                                    <Icon name="scissors" size={16} color="#9333ea" />
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
                                style={tw`bg-purple-600 py-3 rounded-xl mb-4`}
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
                return (
                    <View style={tw`flex-1 justify-center px-2`}>
                        {formData.stripeConnected ? (
                            <View style={tw`bg-green-900/20 border border-green-600 rounded-2xl p-6`}>
                                <View style={tw`items-center`}>
                                    <Icon name="check-circle" size={48} color="#10b981" />
                                    <Text style={tw`text-green-400 text-lg font-semibold mt-4`}>
                                        Stripe Connected!
                                    </Text>
                                    <Text style={tw`text-green-300 text-center mt-2`}>
                                        You're all set to receive payments.
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View>
                                <View style={tw`bg-gray-800 rounded-2xl p-6 mb-4`}>
                                    <Icon name="credit-card" size={40} color="#9333ea" style={tw`mb-4 self-center`} />
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
                                        style={tw`bg-purple-600 py-4 rounded-xl`}
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
                <ActivityIndicator size="large" color="#9333ea" />
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
                                                <View style={tw`h-0.5 w-12 ${
                                                    index <= currentStep ? 'bg-purple-600' : 'bg-gray-700'
                                                }`} />
                                            )}
                                            <View style={tw`w-10 h-10 rounded-full items-center justify-center ${
                                                index <= currentStep ? 'bg-purple-600' : 'bg-gray-800'
                                            }`}>
                                                {index < currentStep ? (
                                                    <Icon name="check" size={20} color="white" />
                                                ) : (
                                                    <Text style={tw`text-white font-bold`}>{index + 1}</Text>
                                                )}
                                            </View>
                                            {index < steps.length - 1 && (
                                                <View style={tw`h-0.5 w-12 ${
                                                    index < currentStep ? 'bg-purple-600' : 'bg-gray-700'
                                                }`} />
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                            <View style={tw`flex-row justify-between px-2 mt-2`}>
                                <Text style={tw`text-xs ${currentStep >= 0 ? 'text-purple-400' : 'text-gray-500'} w-20 text-center`}>
                                    Business Info
                                </Text>
                                <Text style={tw`text-xs ${currentStep >= 1 ? 'text-purple-400' : 'text-gray-500'} w-20 text-center`}>
                                    Services
                                </Text>
                                <Text style={tw`text-xs ${currentStep >= 2 ? 'text-purple-400' : 'text-gray-500'} w-20 text-center`}>
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
                                style={tw`flex-1 bg-purple-600 py-4 rounded-xl flex-row justify-center items-center ${
                                    loading ? 'opacity-50' : ''
                                }`}
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
        </SafeAreaView>
    );
}