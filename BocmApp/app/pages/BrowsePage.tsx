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
  Alert,
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
import { useReviews } from '../shared/hooks/useReviews';
import { ReviewCard } from '../shared/components/ReviewCard';
import { ReviewForm } from '../shared/components/ReviewForm';

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

type SortOption = 'name' | 'location' | 'price' | 'distance';
type SortOrder = 'asc' | 'desc';

// ReviewsList Component
function ReviewsList({ barberId }: { barberId: string }) {
  const { reviews, loading } = useReviews(barberId);

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
        <Text style={[tw`mt-4 text-lg`, { color: theme.colors.foreground }]}>
          Loading reviews...
        </Text>
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={tw`flex-1 justify-center items-center py-8`}>
        <Text style={[tw`text-lg font-bold text-center mb-2`, { color: theme.colors.foreground }]}>
          No reviews yet
        </Text>
        <Text style={[tw`text-sm text-center`, { color: theme.colors.mutedForeground }]}>
          Be the first to review this stylist!
        </Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1`}>
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          showActions={false}
        />
      ))}
    </View>
  );
}

export default function BrowsePage() {
  const navigation = useNavigation<BrowseNavigationProp>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  
  // Barber list state
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [barbersLoading, setBarbersLoading] = useState(false);
  const [filteredBarbers, setFilteredBarbers] = useState<Barber[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [allSpecialties, setAllSpecialties] = useState<string[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'explore' | 'cosmetologists'>('explore');
  
  // Review system state
  const [selectedBarberForReviews, setSelectedBarberForReviews] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewFormData, setReviewFormData] = useState<{
    barberId: string;
    bookingId: string;
    isEditing?: boolean;
    reviewId?: string;
    initialRating?: number;
    initialComment?: string;
  } | null>(null);

  useEffect(() => {
    fetchPosts();
    fetchBarbers();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchBarbers = async () => {
    try {
      setBarbersLoading(true);
      
      // Fetch barbers with their profiles and ratings
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select(`
          id,
          user_id,
          bio,
          specialties,
          price_range,
          stripe_account_status,
          business_name,
          instagram,
          twitter,
          tiktok,
          facebook,
          latitude,
          longitude,
          city,
          state,
          created_at,
          updated_at
        `);

      if (barbersError) {
        console.error('Error fetching barbers:', barbersError);
        return;
      }

      // Fetch profiles for barbers (only public profiles)
      const userIds = barbersData?.map(barber => barber.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          username,
          location,
          bio,
          avatar_url,
          is_public
        `)
        .in('id', userIds)
        .eq('is_public', true);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Transform barbers data (only include barbers with public profiles)
      const transformedBarbers: Barber[] = [];
      
      (barbersData || []).forEach(barber => {
        const profile = profilesData?.find(p => p.id === barber.user_id);
        
        // Only include barbers that have a public profile
        if (profile) {
          transformedBarbers.push({
            id: barber.id,
            userId: barber.user_id,
            name: profile.name || 'Unknown',
            username: profile.username || 'username',
            businessName: barber.business_name || profile.name,
            location: profile.location || barber.city || 'Location',
            specialties: barber.specialties || [],
            bio: barber.bio || profile.bio,
            priceRange: barber.price_range,
            avatarUrl: profile.avatar_url,
            isPublic: profile.is_public ?? true,
            isStripeReady: barber.stripe_account_status === 'active',
            instagram: barber.instagram,
            twitter: barber.twitter,
            tiktok: barber.tiktok,
            facebook: barber.facebook,
            latitude: barber.latitude,
            longitude: barber.longitude,
            city: barber.city,
            state: barber.state,
          });
        }
      });

      setBarbers(transformedBarbers);
      setFilteredBarbers(transformedBarbers);
    } catch (error) {
      console.error('Error fetching barbers:', error);
    } finally {
      setBarbersLoading(false);
    }
  };

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
        .in('id', barbersData?.map(b => b.user_id) || [])
        .eq('is_public', true);

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

  // Filter barbers based on search query and selected specialties
  useEffect(() => {
    let filtered = barbers;

    // Filter by search query
    if (debouncedSearchQuery) {
      filtered = filtered.filter(barber =>
        barber.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        barber.username?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        barber.businessName?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        barber.location?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        barber.specialties?.some(specialty => 
          specialty.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        )
      );
    }

    // Filter by selected specialties
    if (selectedSpecialties.length > 0) {
      filtered = filtered.filter(barber =>
        barber.specialties?.some(specialty => 
          selectedSpecialties.includes(specialty)
        )
      );
    }

    setFilteredBarbers(filtered);
  }, [barbers, debouncedSearchQuery, selectedSpecialties]);

  // Update specialties when barbers are loaded
  useEffect(() => {
    const allSpecialtiesSet = new Set([
      'Barber',
      'Braider',
      'Stylist',
      'Nails',
      'Lash',
      'Brow',
      'Tattoo',
      'Piercings',
      'Dyeing'
    ]);
    
    // Add specialties from barbers
    barbers.forEach(barber => {
      barber.specialties?.forEach(specialty => allSpecialtiesSet.add(specialty));
    });
    
    setAllSpecialties(Array.from(allSpecialtiesSet).sort());
  }, [barbers]);

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
    setFilteredBarbers(barbers);
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
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <Text style={[tw`text-2xl font-bold`, { color: theme.colors.foreground }]}>
            Browse
          </Text>
          
          {/* View Toggle Buttons */}
          <View style={tw`flex-row bg-white/10 rounded-lg p-1`}>
            <TouchableOpacity
              style={[
                tw`px-4 py-2 rounded-md`,
                viewMode === 'explore' 
                  ? { backgroundColor: theme.colors.background }
                  : { backgroundColor: 'transparent' }
              ]}
              onPress={() => setViewMode('explore')}
            >
              <Text style={[
                tw`font-medium text-sm`,
                viewMode === 'explore'
                  ? { color: theme.colors.foreground }
                  : { color: theme.colors.mutedForeground }
              ]}>
                Explore
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                tw`px-4 py-2 rounded-md`,
                viewMode === 'cosmetologists' 
                  ? { backgroundColor: theme.colors.background }
                  : { backgroundColor: 'transparent' }
              ]}
              onPress={() => setViewMode('cosmetologists')}
            >
              <Text style={[
                tw`font-medium text-sm`,
                viewMode === 'cosmetologists'
                  ? { color: theme.colors.foreground }
                  : { color: theme.colors.mutedForeground }
              ]}>
                Cosmetologists
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={tw`flex-row items-center mb-4`}>
          <View style={[tw`flex-1 flex-row items-center rounded-xl px-3 py-2`, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Search size={20} color={theme.colors.mutedForeground} style={tw`mr-2`} />
            <TextInput
              style={[tw`flex-1 text-base`, { color: theme.colors.foreground }]}
              placeholder={viewMode === 'explore' ? "Search styles..." : "Search stylists..."}
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

      {/* Main Content Area */}
      <View style={tw`flex-1`}>
        {viewMode === 'explore' ? (
          // Explore View - Grid of videos/pictures
          <>
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
          </>
        ) : (
          // Cosmetologists View - List of barbers
          <>
            {barbersLoading ? (
              <View style={tw`flex-1 justify-center items-center`}>
                <ActivityIndicator size="large" color={theme.colors.secondary} />
                <Text style={[tw`mt-4 text-lg`, { color: theme.colors.foreground }]}>
                  Loading stylists...
                </Text>
              </View>
            ) : filteredBarbers.length === 0 ? (
              <View style={tw`flex-1 justify-center items-center py-8`}>
                <Text style={[tw`text-lg font-bold text-center mb-2`, { color: theme.colors.foreground }]}>
                  No stylists found
                </Text>
                <Text style={[tw`text-sm text-center`, { color: theme.colors.mutedForeground }]}>
                  Try adjusting your search or filters
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {filteredBarbers.map((barber) => (
                  <View key={barber.id} style={tw`mb-4 mx-4`}>
                    {/* Barber Card */}
                    <View style={[tw`bg-white/5 border border-white/10 rounded-lg p-4`, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                      <View style={tw`flex-row items-start`}>
                        <View style={tw`mr-3`}>
                          <Avatar
                            src={barber.avatarUrl}
                            size="lg"
                          />
                        </View>
                        <View style={tw`flex-1`}>
                          <View style={tw`flex-row items-center justify-between`}>
                            <View style={tw`flex-1`}>
                              <Text style={[tw`text-lg font-bold`, { color: theme.colors.foreground }]}>
                                {barber.name}
                              </Text>
                              <Text style={[tw`text-sm`, { color: theme.colors.mutedForeground }]}>
                                @{barber.username}
                              </Text>
                            </View>
                            {/* <TouchableOpacity
                              style={tw`bg-blue-500/20 px-3 py-1 rounded-full`}
                              onPress={() => {
                                setSelectedBarberForReviews(barber.id);
                                setShowReviews(true);
                              }}
                            >
                              <Text style={tw`text-blue-400 text-xs font-medium`}>Reviews</Text>
                            </TouchableOpacity> */}
                          </View>
                          

                          
                          {/* Location */}
                          <View style={tw`flex-row items-center mt-1`}>
                            <MapPin size={14} color={theme.colors.mutedForeground} />
                            <Text style={[tw`text-sm ml-1`, { color: theme.colors.mutedForeground }]}>
                              {barber.location}
                            </Text>
                          </View>
                          
                          {/* Specialties */}
                          {barber.specialties && barber.specialties.length > 0 && (
                            <View style={tw`flex-row flex-wrap mt-2`}>
                              {barber.specialties.slice(0, 3).map((specialty, index) => (
                                <View
                                  key={index}
                                  style={[tw`px-2 py-1 rounded-full mr-2 mb-1`, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                                >
                                  <Text style={[tw`text-xs`, { color: theme.colors.foreground }]}>
                                    {specialty}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}
                          
                          {/* Book Now Button */}
                          <TouchableOpacity
                            style={[tw`mt-3 bg-blue-500 rounded-lg p-3 items-center`, { backgroundColor: theme.colors.secondary }]}
                            onPress={() => {
                              setSelectedBarber({
                                barberId: barber.id,  // Use barber.id (barber ID) instead of barber.userId (profile ID)
                                barberName: barber.name,
                                name: barber.name
                              });
                              setShowBookingForm(true);
                            }}
                          >
                            <Text style={[tw`font-semibold text-base`, { color: theme.colors.primary }]}>
                              Book Now
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </>
        )}
      </View>



      {/* Reviews Modal */}
      {selectedBarberForReviews && (
        <View style={tw`absolute inset-0 bg-black/90`}>
          <View style={tw`flex-1 pt-12`}>
            <View style={tw`flex-row items-center justify-between px-4 mb-4`}>
              <Text style={[tw`text-xl font-bold`, { color: theme.colors.foreground }]}>
                Reviews
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowReviews(false);
                  setSelectedBarberForReviews(null);
                }}
                style={tw`p-2`}
              >
                <X size={24} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={tw`flex-1 px-4`}>
              <ReviewsList barberId={selectedBarberForReviews} />
            </ScrollView>
          </View>
        </View>
      )}

      {/* Review Form Modal */}
      {reviewFormData && (
        <ReviewForm
          barberId={reviewFormData.barberId}
          bookingId={reviewFormData.bookingId}
          onClose={() => setReviewFormData(null)}
          onSuccess={() => {
            setReviewFormData(null);
            // Refresh reviews if needed
          }}
          isEditing={reviewFormData.isEditing}
          reviewId={reviewFormData.reviewId}
          initialRating={reviewFormData.initialRating}
          initialComment={reviewFormData.initialComment}
        />
      )}

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