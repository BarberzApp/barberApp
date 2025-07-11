import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Switch,
    TextInput,
    Share,
    Clipboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import { RootStackParamList } from '../types/types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../lib/theme';
import Icon from 'react-native-vector-icons/Feather';

type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

interface Service {
    id: string;
    name: string;
    price: number;
    duration: number;
}

interface ProfileData {
    name: string;
    email: string;
    phone: string;
    bio: string;
    location: string;
    businessName: string;
    specialties: string[];
    isPublic: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
}

export default function SettingsPage() {
    const navigation = useNavigation<SettingsNavigationProp>();
    const { user, userProfile, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'services' | 'share'>('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [barberId, setBarberId] = useState<string | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [profileData, setProfileData] = useState<ProfileData>({
        name: '',
        email: '',
        phone: '',
        bio: '',
        location: '',
        businessName: '',
        specialties: [],
        isPublic: true,
        emailNotifications: true,
        smsNotifications: true,
    });
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [newService, setNewService] = useState({ name: '', price: 0, duration: 30 });
    const [profileComplete, setProfileComplete] = useState(false);

    useEffect(() => {
        if (userProfile?.role !== 'barber') {
            navigation.goBack();
            return;
        }
        loadData();
    }, [userProfile]);

    const loadData = async () => {
        if (!user) return;
        
        try {
            setLoading(true);

            // Load profile data
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            // Load barber data
            const { data: barber } = await supabase
                .from('barbers')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (barber) {
                setBarberId(barber.id);
                
                // Load services
                const { data: servicesData } = await supabase
                    .from('services')
                    .select('*')
                    .eq('barber_id', barber.id)
                    .order('name');

                if (servicesData) {
                    setServices(servicesData);
                }

                // Check profile completion
                const hasBasicInfo = profile?.name && profile?.phone && profile?.location;
                const hasBarberInfo = barber?.business_name && barber?.bio;
                const hasServices = servicesData && servicesData.length > 0;
                setProfileComplete(!!(hasBasicInfo && hasBarberInfo && hasServices));
            }

            // Set profile data
            if (profile && barber) {
                setProfileData({
                    name: profile.name || '',
                    email: profile.email || '',
                    phone: profile.phone || '',
                    bio: barber.bio || '',
                    location: profile.location || '',
                    businessName: barber.business_name || '',
                    specialties: barber.specialties || [],
                    isPublic: profile.is_public ?? true,
                    emailNotifications: profile.email_notifications ?? true,
                    smsNotifications: profile.sms_notifications ?? true,
                });
            }
        } catch (error) {
            console.error('Error loading data:', error);
            Alert.alert('Error', 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            // Update profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    name: profileData.name,
                    email: profileData.email,
                    phone: profileData.phone,
                    location: profileData.location,
                    is_public: profileData.isPublic,
                    email_notifications: profileData.emailNotifications,
                    sms_notifications: profileData.smsNotifications,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user?.id);

            if (profileError) throw profileError;

            // Update barber data
            const { error: barberError } = await supabase
                .from('barbers')
                .update({
                    business_name: profileData.businessName,
                    bio: profileData.bio,
                    specialties: profileData.specialties,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user?.id);

            if (barberError) throw barberError;

            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const addOrUpdateService = async () => {
        if (!barberId) return;
        
        if (!newService.name || newService.price <= 0 || newService.duration < 15) {
            Alert.alert('Invalid Service', 'Please fill all fields correctly');
            return;
        }

        setSaving(true);
        try {
            if (editingService) {
                const { error } = await supabase
                    .from('services')
                    .update({
                        name: newService.name,
                        price: newService.price,
                        duration: newService.duration,
                    })
                    .eq('id', editingService.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('services')
                    .insert({
                        barber_id: barberId,
                        name: newService.name,
                        price: newService.price,
                        duration: newService.duration,
                    });

                if (error) throw error;
            }

            await loadData();
            setNewService({ name: '', price: 0, duration: 30 });
            setEditingService(null);
            Alert.alert('Success', editingService ? 'Service updated' : 'Service added');
        } catch (error) {
            console.error('Error saving service:', error);
            Alert.alert('Error', 'Failed to save service');
        } finally {
            setSaving(false);
        }
    };

    const deleteService = async (serviceId: string) => {
        Alert.alert(
            'Delete Service',
            'Are you sure you want to delete this service?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('services')
                                .delete()
                                .eq('id', serviceId);

                            if (error) throw error;
                            await loadData();
                            Alert.alert('Success', 'Service deleted');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete service');
                        }
                    },
                },
            ]
        );
    };

    const shareBookingLink = async () => {
        if (!barberId) return;
        
        const bookingLink = `https://barber-app-five.vercel.app/book/${barberId}`;
        
        try {
            await Share.share({
                message: `Book an appointment with ${profileData.businessName || profileData.name}: ${bookingLink}`,
                url: bookingLink,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const copyBookingLink = () => {
        if (!barberId) return;
        
        const bookingLink = `https://barber-app-five.vercel.app/book/${barberId}`;
        Clipboard.setString(bookingLink);
        Alert.alert('Copied!', 'Booking link copied to clipboard');
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        navigation.navigate('Login');
                    },
                },
            ]
        );
    };

    const renderProfileTab = () => (
        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-24`}>
            <View style={tw`p-4`}>
                <Text style={[tw`text-lg font-semibold mb-4`, { color: theme.colors.foreground }]}>Profile Information</Text>
                
                <View style={tw`mb-4`}>
                    <Text style={[tw`text-sm mb-1`, { color: theme.colors.mutedForeground }]}>Business Name</Text>
                    <TextInput
                        style={[
                            tw`px-4 py-3.5 rounded-xl text-base`, 
                            { 
                                backgroundColor: 'rgba(255,255,255,0.05)', 
                                color: theme.colors.foreground,
                                lineHeight: 20,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)'
                            }
                        ]}
                        value={profileData.businessName}
                        onChangeText={(text) => setProfileData(prev => ({ ...prev, businessName: text }))}
                        placeholder="Your business name"
                        placeholderTextColor={theme.colors.mutedForeground}
                    />
                </View>

                <View style={tw`mb-4`}>
                    <Text style={[tw`text-sm mb-1`, { color: theme.colors.mutedForeground }]}>Name</Text>
                    <TextInput
                        style={[
                            tw`px-4 py-3.5 rounded-xl text-base`, 
                            { 
                                backgroundColor: 'rgba(255,255,255,0.05)', 
                                color: theme.colors.foreground,
                                lineHeight: 20,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)'
                            }
                        ]}
                        value={profileData.name}
                        onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
                        placeholder="Your name"
                        placeholderTextColor={theme.colors.mutedForeground}
                    />
                </View>

                <View style={tw`mb-4`}>
                    <Text style={[tw`text-sm mb-1`, { color: theme.colors.mutedForeground }]}>Email</Text>
                    <TextInput
                        style={[
                            tw`px-4 py-3.5 rounded-xl text-base`, 
                            { 
                                backgroundColor: 'rgba(255,255,255,0.05)', 
                                color: theme.colors.foreground,
                                lineHeight: 20,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)'
                            }
                        ]}
                        value={profileData.email}
                        onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
                        placeholder="Email"
                        placeholderTextColor={theme.colors.mutedForeground}
                        keyboardType="email-address"
                    />
                </View>

                <View style={tw`mb-4`}>
                    <Text style={[tw`text-sm mb-1`, { color: theme.colors.mutedForeground }]}>Phone</Text>
                    <TextInput
                        style={[
                            tw`px-4 py-3.5 rounded-xl text-base`, 
                            { 
                                backgroundColor: 'rgba(255,255,255,0.05)', 
                                color: theme.colors.foreground,
                                lineHeight: 20,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)'
                            }
                        ]}
                        value={profileData.phone}
                        onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
                        placeholder="Phone number"
                        placeholderTextColor={theme.colors.mutedForeground}
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={tw`mb-4`}>
                    <Text style={[tw`text-sm mb-1`, { color: theme.colors.mutedForeground }]}>Location</Text>
                    <TextInput
                        style={[
                            tw`px-4 py-3.5 rounded-xl text-base`, 
                            { 
                                backgroundColor: 'rgba(255,255,255,0.05)', 
                                color: theme.colors.foreground,
                                lineHeight: 20,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)'
                            }
                        ]}
                        value={profileData.location}
                        onChangeText={(text) => setProfileData(prev => ({ ...prev, location: text }))}
                        placeholder="City, State"
                        placeholderTextColor={theme.colors.mutedForeground}
                    />
                </View>

                <View style={tw`mb-4`}>
                    <Text style={[tw`text-sm mb-1`, { color: theme.colors.mutedForeground }]}>Bio</Text>
                    <TextInput
                        style={[
                            tw`px-4 py-3.5 rounded-xl text-base h-28`, 
                            { 
                                backgroundColor: 'rgba(255,255,255,0.05)', 
                                color: theme.colors.foreground,
                                lineHeight: 20,
                                textAlignVertical: 'top',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)'
                            }
                        ]}
                        value={profileData.bio}
                        onChangeText={(text) => setProfileData(prev => ({ ...prev, bio: text }))}
                        placeholder="Tell clients about yourself..."
                        placeholderTextColor={theme.colors.mutedForeground}
                        multiline
                    />
                </View>

                <View style={tw`mb-6`}>
                    <Text style={[tw`text-sm mb-1`, { color: theme.colors.mutedForeground }]}>Specialties</Text>
                    <TextInput
                        style={[
                            tw`px-4 py-3.5 rounded-xl text-base`, 
                            { 
                                backgroundColor: 'rgba(255,255,255,0.05)', 
                                color: theme.colors.foreground,
                                lineHeight: 20,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)'
                            }
                        ]}
                        value={profileData.specialties.join(', ')}
                        onChangeText={(text) => setProfileData(prev => ({ 
                            ...prev, 
                            specialties: text.split(',').map(s => s.trim()).filter(s => s)
                        }))}
                        placeholder="Fades, Beard Trims, etc."
                        placeholderTextColor={theme.colors.mutedForeground}
                    />
                </View>

                <Text style={[tw`text-lg font-semibold mb-4`, { color: theme.colors.foreground }]}>Privacy & Notifications</Text>

                <View style={[tw`rounded-lg p-4 mb-4`, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    <View style={tw`flex-row justify-between items-center mb-4`}>
                        <View style={tw`flex-1 mr-4`}>
                            <Text style={[tw`font-medium`, { color: theme.colors.foreground }]}>Public Profile</Text>
                            <Text style={[tw`text-sm`, { color: theme.colors.mutedForeground }]}>Allow clients to find you</Text>
                        </View>
                        <Switch
                            value={profileData.isPublic}
                            onValueChange={(value) => setProfileData(prev => ({ ...prev, isPublic: value }))}
                            trackColor={{ false: '#374151', true: theme.colors.secondary }}
                            thumbColor={theme.colors.foreground}
                        />
                    </View>

                    <View style={tw`flex-row justify-between items-center mb-4`}>
                        <View style={tw`flex-1 mr-4`}>
                            <Text style={[tw`font-medium`, { color: theme.colors.foreground }]}>Email Notifications</Text>
                            <Text style={[tw`text-sm`, { color: theme.colors.mutedForeground }]}>Receive booking notifications</Text>
                        </View>
                        <Switch
                            value={profileData.emailNotifications}
                            onValueChange={(value) => setProfileData(prev => ({ ...prev, emailNotifications: value }))}
                            trackColor={{ false: '#374151', true: theme.colors.secondary }}
                            thumbColor={theme.colors.foreground}
                        />
                    </View>

                    <View style={tw`flex-row justify-between items-center`}>
                        <View style={tw`flex-1 mr-4`}>
                            <Text style={[tw`font-medium`, { color: theme.colors.foreground }]}>SMS Notifications</Text>
                            <Text style={[tw`text-sm`, { color: theme.colors.mutedForeground }]}>Get text alerts</Text>
                        </View>
                        <Switch
                            value={profileData.smsNotifications}
                            onValueChange={(value) => setProfileData(prev => ({ ...prev, smsNotifications: value }))}
                            trackColor={{ false: '#374151', true: theme.colors.secondary }}
                            thumbColor={theme.colors.foreground}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    style={[tw`py-4 rounded-xl mb-6`, { backgroundColor: theme.colors.secondary }]}
                    onPress={saveProfile}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color={theme.colors.primaryForeground} />
                    ) : (
                        <Text style={[tw`text-center font-semibold`, { color: theme.colors.primaryForeground }]}>Save Changes</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderServicesTab = () => (
        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-24`}>
            <View style={tw`p-4`}>
                <Text style={[tw`text-lg font-semibold mb-4`, { color: theme.colors.foreground }]}>Services & Pricing</Text>
                
                <View style={[tw`rounded-lg p-4 mb-4`, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    <Text style={[tw`font-medium mb-3`, { color: theme.colors.foreground }]}>
                        {editingService ? 'Edit Service' : 'Add New Service'}
                    </Text>
                    
                    <TextInput
                        style={[
                            tw`px-3 py-2 rounded-lg mb-3 text-base font-medium`, 
                            { 
                                backgroundColor: 'rgba(0,0,0,0.3)', 
                                color: theme.colors.foreground,
                                lineHeight: 20 
                            }
                        ]}
                        value={newService.name}
                        onChangeText={(text) => setNewService(prev => ({ ...prev, name: text }))}
                        placeholder="Service name"
                        placeholderTextColor={theme.colors.mutedForeground}
                    />
                    
                    <View style={tw`flex-row gap-3 mb-3`}>
                        <View style={tw`flex-1`}>
                            <Text style={[tw`text-xs mb-1`, { color: theme.colors.mutedForeground }]}>Price ($)</Text>
                            <TextInput
                                style={[
                                    tw`text-base w-16 px-2 py-1.5 rounded text-center`, 
                                    { 
                                        backgroundColor: 'rgba(0,0,0,0.3)', 
                                        color: theme.colors.foreground,
                                        lineHeight: 20
                                    }
                                ]}
                                value={newService.price.toString()}
                                onChangeText={(text) => setNewService(prev => ({ 
                                    ...prev, 
                                    price: parseInt(text) || 0 
                                }))}
                                placeholder="0"
                                placeholderTextColor={theme.colors.mutedForeground}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={[tw`text-xs mb-1`, { color: theme.colors.mutedForeground }]}>Duration (min)</Text>
                            <TextInput
                                style={[
                                    tw`text-base w-12 px-2 py-1.5 rounded text-center`, 
                                    { 
                                        backgroundColor: 'rgba(0,0,0,0.3)', 
                                        color: theme.colors.foreground,
                                        lineHeight: 20
                                    }
                                ]}
                                value={newService.duration.toString()}
                                onChangeText={(text) => setNewService(prev => ({ 
                                    ...prev, 
                                    duration: parseInt(text) || 30 
                                }))}
                                placeholder="30"
                                placeholderTextColor={theme.colors.mutedForeground}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                    
                    <View style={tw`flex-row gap-2`}>
                        <TouchableOpacity
                            style={[tw`flex-1 py-2 rounded-lg`, { backgroundColor: theme.colors.secondary }]}
                            onPress={addOrUpdateService}
                            disabled={saving}
                        >
                            <Text style={[tw`text-center font-medium`, { color: theme.colors.primaryForeground }]}>
                                {editingService ? 'Update' : 'Add'} Service
                            </Text>
                        </TouchableOpacity>
                        {editingService && (
                            <TouchableOpacity
                                style={[tw`px-4 py-2 rounded-lg`, { borderWidth: 1, borderColor: theme.colors.mutedForeground }]}
                                onPress={() => {
                                    setEditingService(null);
                                    setNewService({ name: '', price: 0, duration: 30 });
                                }}
                            >
                                <Text style={{ color: theme.colors.foreground }}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <Text style={[tw`font-medium mb-3`, { color: theme.colors.foreground }]}>Your Services</Text>
                {services.length === 0 ? (
                    <View style={[tw`rounded-lg p-4`, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                        <Text style={[tw`text-center`, { color: theme.colors.mutedForeground }]}>
                            No services added yet
                        </Text>
                    </View>
                ) : (
                    services.map((service) => (
                        <View key={service.id} style={[tw`rounded-lg p-4 mb-2`, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                            <View style={tw`flex-row justify-between items-center`}>
                                <View style={tw`flex-1`}>
                                    <Text style={[tw`font-medium`, { color: theme.colors.foreground }]}>{service.name}</Text>
                                    <Text style={[tw`text-sm`, { color: theme.colors.mutedForeground }]}>
                                        ${service.price} • {service.duration} minutes
                                    </Text>
                                </View>
                                <View style={tw`flex-row gap-2`}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setEditingService(service);
                                            setNewService({
                                                name: service.name,
                                                price: service.price,
                                                duration: service.duration,
                                            });
                                        }}
                                    >
                                        <Icon name="edit" size={20} color={theme.colors.secondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => deleteService(service.id)}
                                    >
                                        <Icon name="trash-2" size={20} color={theme.colors.destructive} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );

    const renderShareTab = () => (
        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-24`}>
            <View style={tw`p-4`}>
                <Text style={[tw`text-lg font-semibold mb-4`, { color: theme.colors.foreground }]}>Share Your Profile</Text>
                
                {!profileData.isPublic && (
                    <View style={[tw`rounded-lg p-4 mb-4`, { backgroundColor: 'rgba(255,193,7,0.1)', borderWidth: 1, borderColor: 'rgba(255,193,7,0.3)' }]}>
                        <View style={tw`flex-row items-center`}>
                            <Icon name="alert-circle" size={20} color="#ffc107" />
                            <Text style={[tw`ml-2 flex-1`, { color: '#ffc107' }]}>
                                Your profile is private. Make it public to allow bookings.
                            </Text>
                        </View>
                    </View>
                )}

                <View style={[tw`rounded-lg p-4 mb-4`, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    <Text style={[tw`font-medium mb-2`, { color: theme.colors.foreground }]}>Your Booking Link</Text>
                    <Text style={[tw`text-sm mb-3`, { color: theme.colors.mutedForeground }]}>
                        Share this link with clients so they can book appointments
                    </Text>
                    
                    <View style={[tw`p-3 rounded-lg mb-3`, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                        <Text style={[tw`text-sm`, { color: theme.colors.secondary }]} numberOfLines={1}>
                            {barberId ? `https://barber-app-five.vercel.app/book/${barberId}` : 'Loading...'}
                        </Text>
                    </View>
                    
                    <View style={tw`flex-row gap-2`}>
                        <TouchableOpacity
                            style={[tw`flex-1 py-3 rounded-lg flex-row justify-center items-center`, { backgroundColor: theme.colors.secondary }]}
                            onPress={shareBookingLink}
                            disabled={!barberId}
                        >
                            <Icon name="share-2" size={20} color={theme.colors.primaryForeground} />
                            <Text style={[tw`font-medium ml-2`, { color: theme.colors.primaryForeground }]}>Share Link</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[tw`px-4 py-3 rounded-lg`, { borderWidth: 1, borderColor: theme.colors.mutedForeground }]}
                            onPress={copyBookingLink}
                            disabled={!barberId}
                        >
                            <Icon name="copy" size={20} color={theme.colors.foreground} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[tw`rounded-lg p-4`, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    <Text style={[tw`font-medium mb-3`, { color: theme.colors.foreground }]}>How to Share</Text>
                    <View style={tw`space-y-2`}>
                        <View style={tw`flex-row`}>
                            <Text style={[tw`mr-2`, { color: theme.colors.secondary }]}>1.</Text>
                            <Text style={[tw`flex-1`, { color: theme.colors.mutedForeground }]}>
                                Copy or share the link above
                            </Text>
                        </View>
                        <View style={tw`flex-row`}>
                            <Text style={[tw`mr-2`, { color: theme.colors.secondary }]}>2.</Text>
                            <Text style={[tw`flex-1`, { color: theme.colors.mutedForeground }]}>
                                Send it via text, email, or social media
                            </Text>
                        </View>
                        <View style={tw`flex-row`}>
                            <Text style={[tw`mr-2`, { color: theme.colors.secondary }]}>3.</Text>
                            <Text style={[tw`flex-1`, { color: theme.colors.mutedForeground }]}>
                                Clients can book directly from the link
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    if (loading) {
        return (
            <SafeAreaView style={[tw`flex-1 justify-center items-center`, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.secondary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
            <View style={tw`flex-1`}>
                <View style={[tw`px-6 py-4`, { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
                    <Text style={[tw`text-2xl font-bold`, { color: theme.colors.foreground }]}>Settings</Text>
                    <Text style={[tw`text-sm mt-1`, { color: theme.colors.mutedForeground }]}>
                        Manage your profile and preferences
                    </Text>
                    
                    {!profileComplete && (
                        <TouchableOpacity
                            style={[tw`rounded-lg p-3 mt-3`, { backgroundColor: 'rgba(255,193,7,0.1)', borderWidth: 1, borderColor: 'rgba(255,193,7,0.3)' }]}
                            onPress={() => navigation.navigate('BarberOnboarding')}
                        >
                            <View style={tw`flex-row items-center justify-between`}>
                                <View style={tw`flex-row items-center flex-1`}>
                                    <Icon name="alert-circle" size={16} color="#ffc107" />
                                    <Text style={[tw`ml-2`, { color: '#ffc107' }]}>
                                        Complete your profile
                                    </Text>
                                </View>
                                <Icon name="chevron-right" size={20} color="#ffc107" />
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={[tw`flex-row`, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    {['profile', 'services', 'share'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[
                                tw`flex-1 py-4`,
                                activeTab === tab && { borderBottomWidth: 2, borderBottomColor: theme.colors.secondary }
                            ]}
                            onPress={() => setActiveTab(tab as any)}
                        >
                            <View style={tw`flex-row justify-center items-center`}>
                                <Icon 
                                    name={tab === 'profile' ? 'user' : tab === 'services' ? 'scissors' : 'share-2'} 
                                    size={20} 
                                    color={activeTab === tab ? theme.colors.secondary : theme.colors.mutedForeground}
                                />
                                <Text style={[
                                    tw`ml-2 font-medium`,
                                    { color: activeTab === tab ? theme.colors.secondary : theme.colors.mutedForeground }
                                ]}>
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {activeTab === 'profile' && renderProfileTab()}
                {activeTab === 'services' && renderServicesTab()}
                {activeTab === 'share' && renderShareTab()}

                <TouchableOpacity
                    style={[tw`mx-6 mb-12 mt-3 py-3 rounded-lg`, { borderWidth: 1, borderColor: theme.colors.destructive }]}
                    onPress={handleLogout}
                >
                    <Text style={[tw`text-center font-medium`, { color: theme.colors.destructive }]}>Logout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}