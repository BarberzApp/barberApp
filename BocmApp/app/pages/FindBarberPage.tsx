// screens/FindBarberPage.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import { RootStackParamList } from '../types/types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import Icon from 'react-native-vector-icons/Feather';

type FindBarberNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FindBarber'>;

// Types matching the database structure
type BarberFromDB = {
    id: string;
    user_id: string;
    business_name?: string;
    specialties: string[];
    price_range?: string;
    stripe_account_status?: string;
}

type ProfileFromDB = {
    id: string;
    name: string;
    location?: string;
    bio?: string;
    avatar_url?: string;
    is_public?: boolean;
}

// Type for the transformed data used in the UI
type Barber = {
    id: string; // This is barber.id from barbers table
    userId: string; // This is user_id (profile id)
    name: string;
    businessName?: string;
    location?: string;
    specialties: string[];
    bio?: string;
    priceRange?: string;
    avatarUrl?: string;
    isPublic?: boolean;
    isStripeReady?: boolean;
}

export default function FindBarberPage() {
    const navigation = useNavigation<FindBarberNavigationProp>();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [filteredBarbers, setFilteredBarbers] = useState<Barber[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchBarbers();
    }, []);

    useEffect(() => {
        // Filter barbers based on search query
        const filtered = barbers.filter(barber => {
            if (!barber.isPublic) return false; // Only show public profiles
            
            const query = searchQuery.toLowerCase();
            return (
                barber.name.toLowerCase().includes(query) ||
                barber.businessName?.toLowerCase().includes(query) ||
                barber.location?.toLowerCase().includes(query) ||
                barber.specialties.some(specialty => 
                    specialty.toLowerCase().includes(query)
                ) ||
                barber.bio?.toLowerCase().includes(query)
            );
        });
        setFilteredBarbers(filtered);
    }, [barbers, searchQuery]);

    const fetchBarbers = async () => {
        try {
            setError(null);

            // Step 1: Fetch all barbers
            const { data: barbersData, error: barbersError } = await supabase
                .from('barbers')
                .select('id, user_id, business_name, specialties, price_range, stripe_account_status');

            if (barbersError) {
                console.error('Supabase error:', barbersError);
                throw barbersError;
            }

            if (!barbersData || barbersData.length === 0) {
                setBarbers([]);
                return;
            }

            // Step 2: Fetch all profiles for these barbers
            const userIds = barbersData.map((b: BarberFromDB) => b.user_id);
            
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, name, location, bio, avatar_url, is_public')
                .in('id', userIds);

            if (profilesError) {
                console.error('Supabase error (profiles):', profilesError);
                throw profilesError;
            }

            // Step 3: Merge barbers and profiles
            const profileMap: Record<string, ProfileFromDB> = {};
            for (const profile of profilesData || []) {
                profileMap[profile.id] = profile;
            }

            const formattedBarbers: Barber[] = (barbersData as BarberFromDB[]).map(barber => {
                const profile = profileMap[barber.user_id];
                return {
                    id: barber.id, // Use barber.id instead of profile.id
                    userId: barber.user_id, // Keep user_id for reference
                    name: profile?.name || 'Unknown Barber',
                    businessName: barber.business_name,
                    location: profile?.location,
                    specialties: barber.specialties || [],
                    bio: profile?.bio,
                    priceRange: barber.price_range,
                    avatarUrl: profile?.avatar_url,
                    isPublic: profile?.is_public || false,
                    isStripeReady: barber.stripe_account_status === 'active'
                };
            }).filter(barber => barber.isPublic);

            setBarbers(formattedBarbers);
        } catch (error) {
            console.error('Error fetching barbers:', error);
            setError('Failed to load barbers. Please try again.');
            Alert.alert('Error', 'Failed to load barbers. Please refresh to try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchBarbers();
    };

    const handleBookAppointment = (barberId: string, barberName: string) => {
        navigation.navigate('BookingCalendar', { barberId, barberName });
    };

    const clearSearch = () => {
        setSearchQuery('');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (loading) {
        return (
            <SafeAreaView style={tw`flex-1 bg-gray-900`}>
                <View style={tw`flex-1 items-center justify-center`}>
                    <ActivityIndicator size="large" color="#9333ea" />
                    <Text style={tw`text-gray-400 mt-4`}>Loading barbers...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={tw`flex-1 bg-gray-900`}>
            <View style={tw`flex-1`}>
                {/* Header */}
                <View style={tw`px-5 pt-4 pb-2`}>
                    <Text style={tw`text-white text-2xl font-bold`}>
                        Find a Barber
                    </Text>
                    <Text style={tw`text-gray-400 text-sm mt-1`}>
                        Discover skilled barbers in your area
                    </Text>
                </View>

                {/* Search Bar */}
                <View style={tw`px-5 pb-3`}>
                    <View style={tw`bg-gray-800 rounded-full flex-row items-center px-4 py-2`}>
                        <Text style={tw`text-gray-500 text-sm mr-2`}>🔍</Text>
                        <TextInput
                            style={tw`flex-1 text-white text-base`}
                            placeholder="Search by name, location, or specialty..."
                            placeholderTextColor="#6B7280"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={clearSearch}>
                                <Text style={tw`text-gray-400 text-lg ml-2`}>×</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Results Summary */}
                <View style={tw`px-5 pb-3`}>
                    <Text style={tw`text-gray-400 text-sm`}>
                        {filteredBarbers.length} barber{filteredBarbers.length !== 1 ? 's' : ''} found
                    </Text>
                </View>

                {/* Error Message */}
                {error && (
                    <View style={tw`px-5 mb-3`}>
                        <View style={tw`bg-red-900/20 border border-red-500/50 rounded-lg p-3`}>
                            <Text style={tw`text-red-400 text-sm`}>{error}</Text>
                        </View>
                    </View>
                )}

                {/* Barbers List */}
                <ScrollView
                    style={tw`flex-1`}
                    contentContainerStyle={tw`px-5 pb-6`}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#9333ea"
                        />
                    }
                >
                    {filteredBarbers.length === 0 ? (
                        <View style={tw`items-center justify-center py-20`}>
                            <Text style={tw`text-gray-500 text-base text-center`}>
                                {searchQuery 
                                    ? "No barbers found matching your search.\nTry adjusting your search terms."
                                    : "No barbers are currently available.\nPlease check back later."
                                }
                            </Text>
                            {searchQuery && (
                                <TouchableOpacity
                                    style={tw`mt-4 px-4 py-2 bg-gray-800 rounded-lg`}
                                    onPress={clearSearch}
                                >
                                    <Text style={tw`text-white`}>Clear search</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        filteredBarbers.map((barber) => (
                            <View
                                key={barber.id}
                                style={tw`bg-gray-800 rounded-2xl p-4 mb-3 ${!barber.isStripeReady ? 'opacity-60' : ''}`}
                            >
                                <View style={tw`flex-row items-start`}>
                                    {/* Barber Avatar */}
                                    <View style={tw`relative`}>
                                        <View style={tw`w-16 h-16 bg-purple-600 rounded-full items-center justify-center`}>
                                            <Text style={tw`text-xl text-white font-semibold`}>
                                                {getInitials(barber.name)}
                                            </Text>
                                        </View>
                                        {barber.isStripeReady && (
                                            <View style={tw`absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1`}>
                                                <Text style={tw`text-white text-xs`}>✓</Text>
                                            </View>
                                        )}
                                    </View>
                                    {/* Barber Info */}
                                    <View style={tw`flex-1 ml-4`}>
                                        <Text style={tw`text-white text-lg font-semibold`}>
                                            {barber.businessName || barber.name}
                                        </Text>
                                        {barber.businessName && barber.name !== barber.businessName && (
                                            <Text style={tw`text-gray-400 text-sm`}>
                                                {barber.name}
                                            </Text>
                                        )}
                                        {barber.location && (
                                            <Text style={tw`text-gray-500 text-sm mt-1`}>
                                                📍 {barber.location}
                                            </Text>
                                        )}
                                        {/* Specialties */}
                                        {barber.specialties.length > 0 && (
                                            <View style={tw`flex-row flex-wrap mt-2`}>
                                                {barber.specialties.slice(0, 3).map((specialty, index) => (
                                                    <View
                                                        key={index}
                                                        style={tw`bg-purple-600/20 px-2 py-1 rounded-full mr-2 mb-2`}
                                                    >
                                                        <Text style={tw`text-purple-400 text-xs`}>
                                                            {specialty}
                                                        </Text>
                                                    </View>
                                                ))}
                                                {barber.specialties.length > 3 && (
                                                    <Text style={tw`text-gray-500 text-xs mt-1`}>
                                                        +{barber.specialties.length - 3} more
                                                    </Text>
                                                )}
                                            </View>
                                        )}
                                        {/* Bio */}
                                        {barber.bio && (
                                            <Text style={tw`text-gray-400 text-sm mt-2`} numberOfLines={2}>
                                                {barber.bio}
                                            </Text>
                                        )}
                                        {/* Price Range */}
                                        {barber.priceRange && (
                                            <Text style={tw`text-purple-400 font-medium mt-2`}>
                                                {barber.priceRange}
                                            </Text>
                                        )}
                                        {/* Status */}
                                        <View style={tw`mt-3`}>
                                            {barber.isStripeReady ? (
                                                <Text style={tw`text-green-400 text-sm font-medium`}>
                                                    Available for booking
                                                </Text>
                                            ) : (
                                                <Text style={tw`text-gray-500 text-sm`}>
                                                    Coming soon
                                                </Text>
                                            )}
                                        </View>
                                        {/* Book Now Button */}
                                        {barber.isStripeReady && (
                                            <TouchableOpacity
                                                onPress={() => handleBookAppointment(barber.id, barber.name)}
                                                style={tw`mt-4 bg-yellow-300 rounded-full flex-row items-center justify-center py-3`}
                                                activeOpacity={0.8}
                                            >
                                                <Icon name="calendar" size={18} color="#fff" style={tw`mr-2`} />
                                                <Text style={tw`text-white text-base font-semibold`}>Book Now</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}