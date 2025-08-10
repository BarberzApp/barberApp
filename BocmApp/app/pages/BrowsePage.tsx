import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import { theme } from '../shared/lib/theme';
import { supabase } from '../shared/lib/supabase';
import { useAuth } from '../shared/hooks/useAuth';
import {
  Search,
  MapPin,
  Filter,
  X,
  Grid3X3,
} from 'lucide-react-native';
import { Avatar } from '../shared/components/ui';
import { RootStackParamList } from '../shared/types';
import StaircaseGrid from '../shared/components/StaircaseGrid';
import BookingForm from '../shared/components/BookingForm';

const { width } = Dimensions.get('window');

type BrowseNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Browse'>;

// Types matching the database structure
type BarberFromDB = {
  id: string;
  user_id: string;
  business_name?: string;
  specialties: string[];
  price_range?: string;
  stripe_account_status?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  facebook?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
}

type ProfileFromDB = {
  id: string;
  name: string;
  username?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  is_public?: boolean;
}

// Type for the transformed data used in the UI
type Barber = {
  id: string;
  userId: string;
  name: string;
  username?: string;
  businessName?: string;
  location?: string;
  specialties: string[];
  bio?: string;
  priceRange?: string;
  avatarUrl?: string;
  isPublic?: boolean;
  isStripeReady?: boolean;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  facebook?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  distance?: number;
}

type SortOption = 'name' | 'rating' | 'location' | 'price' | 'distance';
type SortOrder = 'asc' | 'desc';

export default function BrowsePage() {
  const navigation = useNavigation<BrowseNavigationProp>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [allSpecialties, setAllSpecialties] = useState<string[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<any>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      
      // Fetch cuts (videos) and portfolio images
      const { data: cutsData, error: cutsError } = await supabase
        .from('cuts')
        .select(`
          id,
          barber_id,
          title,
          url,
          thumbnail,
          views,
          likes,
          duration,
          created_at
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (cutsError) {
        console.error('Error fetching cuts:', cutsError);
        return;
      }

      // Fetch barber info for cuts
      const barberIds = cutsData?.map(cut => cut.barber_id) || [];
      const { data: barbersData } = await supabase
        .from('barbers')
        .select('id, user_id')
        .in('id', barberIds);

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', barbersData?.map(b => b.user_id) || []);

      // Transform cuts to posts
      const videoPosts = (cutsData || []).map(cut => {
        const barber = barbersData?.find(b => b.id === cut.barber_id);
        const profile = profilesData?.find(p => p.id === barber?.user_id);
        
        return {
          id: cut.id,
          type: 'video' as const,
          url: cut.url,
          thumbnail: cut.thumbnail,
          title: cut.title,
          barberName: profile?.name || 'Unknown',
          barberAvatar: profile?.avatar_url,
          barberId: barber?.user_id, // Add barber ID for navigation
          likes: cut.likes || 0,
          views: cut.views || 0,
          duration: cut.duration,
          aspectRatio: 9 / 16, // Default video aspect ratio
        };
      });

      // Only use real video posts from the database
      setPosts(videoPosts);
      setFilteredPosts(videoPosts);
      
      // Set real beauty/barber professions
      const specialties = [
        'Barber',
        'Braider',
        'Stylist',
        'Nails',
        'Lash',
        'Brow',
        'Tattoo',
        'Piercings',
        'Dyeing'
      ];
      setAllSpecialties(specialties);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  // Filter posts based on selected criteria
  useEffect(() => {
    let filtered = posts;

    // Filter by search query (using debounced value)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(post => {
        // Search in post title, barber name, and other relevant fields
        return (
          (post.title && post.title.toLowerCase().includes(query)) ||
          (post.barberName && post.barberName.toLowerCase().includes(query)) ||
          (post.barberId && post.barberId.toLowerCase().includes(query))
        );
      });
    }

    // Filter by specialty
    if (selectedSpecialties.length > 0) {
      // For now, we'll filter by barber specialties
      // In a real implementation, you'd need to fetch barber specialties
      filtered = filtered.filter(post => {
        // This is a placeholder - you'd need to match against actual barber specialties
        return true; // For now, show all posts
      });
    }

    setFilteredPosts(filtered);
  }, [posts, selectedSpecialties, debouncedSearchQuery]);

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  const clearFilters = () => {
    setSelectedSpecialties([]);
    setSearchQuery('');
  };

  // Navigation handlers
  const handleVideoPress = (post: any) => {
    // Navigate to CutsPage with the specific video
    // Store the selected cut ID in a global way that CutsPage can access
    (global as any).selectedCutId = post.id;
    // Use the tab navigation to switch to the Cuts tab
    navigation.navigate('Cuts' as never);
  };

  const handleImagePress = (post: any) => {
    // Navigate to ProfilePreview with the barber's profile
    if (post.barberId) {
      navigation.navigate('ProfilePreview', { barberId: post.barberId });
    }
  };

  const handleBookBarber = (post: any) => {
    if (post.barberId) {
      setSelectedBarber(post);
      setShowBookingForm(true);
    }
  };




  

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={tw`px-4 pt-4 pb-2`}>
        <Text style={[tw`text-2xl font-bold mb-4`, { color: theme.colors.foreground }]}>
          Browse
        </Text>
        
        {/* Search Bar */}
        <View style={tw`flex-row items-center mb-4`}>
          <View style={[tw`flex-1 flex-row items-center rounded-xl px-3 py-2`, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Search size={20} color={theme.colors.mutedForeground} style={tw`mr-2`} />
            <TextInput
              style={[tw`flex-1 text-base`, { color: theme.colors.foreground }]}
              placeholder="Search styles..."
              placeholderTextColor={theme.colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color={theme.colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[tw`ml-3 p-2 rounded-xl`, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} color={theme.colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={[tw`mb-4 p-4 rounded-xl`, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
            {/* Specialty Filter */}
            <View style={tw`mb-4`}>
              <Text style={[tw`text-sm font-medium mb-2`, { color: theme.colors.foreground }]}>
                Specialties
              </Text>
              <View style={tw`flex-row flex-wrap gap-2`}>
                {allSpecialties.map(specialty => (
                  <TouchableOpacity
                    key={specialty}
                    style={[
                      tw`px-3 py-1 rounded-full`,
                      selectedSpecialties.includes(specialty)
                        ? { backgroundColor: theme.colors.secondary }
                        : { backgroundColor: 'rgba(255,255,255,0.1)' }
                    ]}
                    onPress={() => toggleSpecialty(specialty)}
                  >
                    <Text style={[
                      tw`text-xs`,
                      selectedSpecialties.includes(specialty)
                        ? { color: theme.colors.primary }
                        : { color: theme.colors.foreground }
                    ]}>
                      {specialty}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>



            {/* Clear Filters */}
            <TouchableOpacity
              style={[tw`mt-2 p-2 rounded-lg items-center`, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
              onPress={clearFilters}
            >
              <Text style={[tw`text-sm font-medium`, { color: theme.colors.foreground }]}>
                Clear All Filters
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </View>

      {/* Grid View */}
      <View style={tw`flex-1`}>
        {postsLoading ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color={theme.colors.secondary} />
            <Text style={[tw`mt-4 text-lg`, { color: theme.colors.foreground }]}>
              Loading posts...
            </Text>
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={tw`flex-1 justify-center items-center py-8`}>
            <Grid3X3 size={48} style={[tw`mb-4`, { color: theme.colors.mutedForeground }]} />
            <Text style={[tw`text-lg font-bold text-center mb-2`, { color: theme.colors.foreground }]}>
              No posts found
            </Text>
            <Text style={[tw`text-sm text-center`, { color: theme.colors.mutedForeground }]}>
              {posts.length === 0 ? 'Check back later for new content' : 'Try adjusting your filters'}
            </Text>
          </View>
                       ) : (
                 <StaircaseGrid 
                   posts={filteredPosts} 
                   onVideoPress={handleVideoPress}
                   onImagePress={handleImagePress}
                   onBookPress={handleBookBarber}
                 />
               )}
      </View>

      {/* Booking Form Modal */}
      {selectedBarber && (
        <BookingForm
          isVisible={showBookingForm}
          onClose={() => {
            setShowBookingForm(false);
            setSelectedBarber(null);
          }}
          barberId={selectedBarber.barberId}
          barberName={selectedBarber.barberName || selectedBarber.name}
          onBookingCreated={(booking) => {
            setShowBookingForm(false);
            setSelectedBarber(null);
            Alert.alert(
              'Booking Created!',
              'Your appointment has been scheduled successfully.',
              [{ text: 'OK' }]
            );
          }}
        />
      )}
    </SafeAreaView>
  );
} 